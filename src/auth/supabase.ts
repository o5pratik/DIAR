import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const accountConfigured = Boolean(url && /^https:\/\//.test(url) && key && !key.startsWith('sb_secret_'));
export const authRedirectUrl = 'com.diar.privatejournal://auth/callback';

export const supabase = accountConfigured
  ? createClient(url!, key!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

if (supabase) {
  AppState.addEventListener('change', state => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export async function completeEmailLink(link: string): Promise<boolean> {
  if (!supabase || !link.startsWith(authRedirectUrl)) return false;
  const fragment = link.split('#', 2)[1] ?? '';
  const params = new URLSearchParams(fragment || link.split('?', 2)[1] || '');
  const error = params.get('error_description') ?? params.get('error');
  if (error) throw new Error(error.replace(/\+/g, ' '));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) throw new Error('This email link is invalid or expired. Request a new link.');
  const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (sessionError) throw sessionError;
  return true;
}
