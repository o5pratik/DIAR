import { createClient } from 'jsr:@supabase/supabase-js@2';

const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

function json(message: string, status: number) {
  return new Response(JSON.stringify({ message }), { status, headers });
}

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Delete your DIAR account</title><style>body{font:16px system-ui,sans-serif;background:#f7f5ef;color:#26312d;max-width:530px;margin:60px auto;padding:24px}h1{font:36px Georgia,serif}p{line-height:1.55}label{display:block;margin:24px 0 8px}input,button{box-sizing:border-box;width:100%;padding:15px;border-radius:12px;font:inherit}input{border:1px solid #b8bcb6}button{border:0;background:#536c59;color:white;font-weight:700;margin-top:16px}button:disabled{opacity:.6}#confirm-step{display:none}#message{min-height:26px}</style></head>
<body><h1>Delete your DIAR account</h1><p>Enter your account email and open the link we send you. Confirming on this page permanently deletes your DIAR account. Diary entries are stored only on your devices; delete them in the app or uninstall it on each device. Export an encrypted backup first if you want to keep your writing.</p>
<form id="email-step"><label for="email">Account email</label><input id="email" type="email" required autocomplete="email"><button type="submit">Send deletion link</button></form>
<form id="confirm-step"><button type="submit">Permanently delete account</button></form><p id="message" role="status"></p>
<script>
const emailForm=document.getElementById('email-step'),confirmForm=document.getElementById('confirm-step'),message=document.getElementById('message');
let accessToken='';
const fragment=new URLSearchParams(location.hash.slice(1));
if(fragment.has('access_token')){accessToken=fragment.get('access_token');history.replaceState(null,'',location.pathname);emailForm.style.display='none';confirmForm.style.display='block';message.textContent='Your email is verified. Confirm below to delete your account.';}
else if(fragment.has('error')){message.textContent=fragment.get('error_description')||'The link is invalid or expired.';history.replaceState(null,'',location.pathname);}
async function send(body,token){const headers={'Content-Type':'application/json'};if(token)headers.Authorization='Bearer '+token;const response=await fetch(location.pathname,{method:'POST',headers,body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(data.message||'Please try again.');return data;}
emailForm.addEventListener('submit',async event=>{event.preventDefault();const button=emailForm.querySelector('button');button.disabled=true;message.textContent='';try{await send({action:'request-link',email:document.getElementById('email').value});message.textContent='If this email has a DIAR account, a deletion link has been sent. Open it to continue.';}catch(error){message.textContent=error.message;}finally{button.disabled=false;}});
confirmForm.addEventListener('submit',async event=>{event.preventDefault();const button=confirmForm.querySelector('button');button.disabled=true;message.textContent='';try{await send({action:'delete-session'},accessToken);accessToken='';confirmForm.style.display='none';message.textContent='Your account has been deleted.';}catch(error){message.textContent=error.message;button.disabled=false;}});
</script></body></html>`;

Deno.serve(async request => {
  if (request.method === 'GET') return new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  if (request.method !== 'POST') return json('Method not allowed.', 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json('Account service is unavailable.', 503);

  let body: { action?: string; email?: string };
  try { body = await request.json(); } catch { return json('Invalid request.', 400); }

  const publicClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (body.action === 'request-link') {
    const email = body.email?.trim().toLowerCase();
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json('Enter a valid email address.', 400);
    // Supabase applies its email OTP rate limits. Do not reveal whether the account exists.
    const { error } = await publicClient.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${url}/functions/v1/delete-account` } });
    if (error && error.status === 429) return json('Please wait before requesting another code.', 429);
    return json('If this email has a DIAR account, a deletion link has been sent.', 200);
  }

  let userId: string | undefined;
  if (body.action === 'delete-session') {
    const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return json('Sign in first.', 401);
    const { data, error } = await publicClient.auth.getUser(token);
    if (error || !data.user) return json('Sign in again.', 401);
    userId = data.user.id;
  } else return json('Unknown action.', 400);

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return json('Could not delete the account. Please try again.', 500);
  return json('Account deleted.', 200);
});
