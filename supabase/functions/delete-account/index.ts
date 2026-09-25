import { createClient } from 'jsr:@supabase/supabase-js@2';

const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

function json(message: string, status: number) {
  return new Response(JSON.stringify({ message }), { status, headers });
}

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Delete your DIAR account</title><style>body{font:16px system-ui,sans-serif;background:#f7f5ef;color:#26312d;max-width:530px;margin:60px auto;padding:24px}h1{font:36px Georgia,serif}p{line-height:1.55}label{display:block;margin:24px 0 8px}input,button{box-sizing:border-box;width:100%;padding:15px;border-radius:12px;font:inherit}input{border:1px solid #b8bcb6}button{border:0;background:#536c59;color:white;font-weight:700;margin-top:16px}button:disabled{opacity:.6}#code-step{display:none}#message{min-height:26px}</style></head>
<body><h1>Delete your DIAR account</h1><p>Enter your account email to receive a six digit code. Confirming the code permanently deletes your DIAR account. Diary entries are stored only on your devices; delete them in the app or uninstall it on each device. Export an encrypted backup first if you want to keep your writing.</p>
<form id="email-step"><label for="email">Account email</label><input id="email" type="email" required autocomplete="email"><button type="submit">Send deletion code</button></form>
<form id="code-step"><label for="code">Six digit email code</label><input id="code" type="text" pattern="[0-9]{6}" inputmode="numeric" maxlength="6" required autocomplete="one-time-code"><button type="submit">Permanently delete account</button></form><p id="message" role="status"></p>
<script>
const emailForm=document.getElementById('email-step'),codeForm=document.getElementById('code-step'),message=document.getElementById('message');
async function send(body){const response=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(data.message||'Please try again.');return data;}
emailForm.addEventListener('submit',async event=>{event.preventDefault();const button=emailForm.querySelector('button');button.disabled=true;message.textContent='';try{await send({action:'request-code',email:document.getElementById('email').value});emailForm.style.display='none';codeForm.style.display='block';message.textContent='Check your email for a deletion code.';}catch(error){message.textContent=error.message;}finally{button.disabled=false;}});
codeForm.addEventListener('submit',async event=>{event.preventDefault();const button=codeForm.querySelector('button');button.disabled=true;message.textContent='';try{await send({action:'confirm-code',email:document.getElementById('email').value,code:document.getElementById('code').value});codeForm.style.display='none';message.textContent='Your account has been deleted.';}catch(error){message.textContent=error.message;}finally{button.disabled=false;}});
</script></body></html>`;

Deno.serve(async request => {
  if (request.method === 'GET') return new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  if (request.method !== 'POST') return json('Method not allowed.', 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json('Account service is unavailable.', 503);

  let body: { action?: string; email?: string; code?: string };
  try { body = await request.json(); } catch { return json('Invalid request.', 400); }

  const publicClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (body.action === 'request-code') {
    const email = body.email?.trim().toLowerCase();
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json('Enter a valid email address.', 400);
    // Supabase applies its email OTP rate limits. Do not reveal whether the account exists.
    const { error } = await publicClient.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error && error.status === 429) return json('Please wait before requesting another code.', 429);
    return json('If this email has a DIAR account, a code has been sent.', 200);
  }

  let userId: string | undefined;
  if (body.action === 'confirm-code') {
    const email = body.email?.trim().toLowerCase();
    const code = body.code?.trim();
    if (!email || !code || !/^\d{6}$/.test(code)) return json('Enter the email and six digit code.', 400);
    const { data, error } = await publicClient.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error || !data.user) return json('The code is invalid or expired.', 401);
    userId = data.user.id;
  } else if (body.action === 'delete-session') {
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
