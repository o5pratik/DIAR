const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function isPublicKey(value) {
  if (!value || value.includes('YOUR_PUBLISHABLE_KEY') || value.startsWith('sb_secret_')) return false;
  if (value.startsWith('sb_publishable_')) return true;
  try {
    const payload = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString('utf8'));
    return payload.role === 'anon';
  } catch { return false; }
}

if (!url || !/^https:\/\/[^/]+/.test(url) || url.includes('YOUR_PROJECT_REF')) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL to your Supabase Project URL before making a release build.');
  process.exitCode = 1;
}
if (!isPublicKey(key)) {
  console.error('Set EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the publishable key, never the service role key.');
  process.exitCode = 1;
}
if (!process.exitCode) console.log('Release account configuration is present.');
