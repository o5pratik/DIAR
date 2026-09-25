# Google Play release setup

DIAR is free to download and use. Do not configure Play Billing products for it.

## 1. Connect Supabase

1. At [Supabase Dashboard](https://supabase.com/dashboard), create or select a project.
2. Open **Connect** or **Project Settings → API Keys**. Copy the **Project URL** and **publishable key**. Do not use the service role/secret key in the app.
3. In **Authentication → Providers**, enable Email. In **Authentication → Email Templates → Magic Link**, use `{{ .Token }}` in the email body so the app's six digit code flow works. Set up production SMTP and verify a real sign in.
4. Put the two values in `.env.local` for local testing. Configure the same names in the EAS **production** environment for cloud builds: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Deploy `supabase/functions/delete-account` with JWT verification disabled as shown in the README. The function checks the user's bearer token for in-app deletion, or an emailed code for web deletion. Test both paths before submitting the app.

## 2. Make a signed Android App Bundle

1. Create an Expo account and run `npx eas-cli login` and `npx eas-cli init` in this project.
2. Set the two `EXPO_PUBLIC_` variables in the EAS **production** environment. They are client-visible values; do not use a service role key.
3. Run `npm run check:release` locally with the variables set, then `npx eas-cli build --platform android --profile production`.
4. When prompted, let EAS create and retain the Android upload keystore. Back up the upload credentials securely from the EAS credentials dashboard. Keep the package ID `com.diar.privatejournal` and increment `android.versionCode` for each later Play upload.
5. Download the resulting signed `.aab`. An AAB is for Play Console; it is not directly installed on an emulator. Use an internal testing release to install the Play-generated APKs.

## 3. Finish Play Console setup

Create a Google Play Console developer account and a **free** app. Upload the signed AAB to internal testing first. Complete the store listing, screenshots, content rating, Data safety form, and a hosted privacy policy. For account deletion, provide the deployed web deletion URL from step 1 and verify the in-app deletion path. Test sign in, account deletion, encrypted diary, backup, and restore on a Play-installed build before production rollout.

The Project URL and publishable key, Expo account, Play Console account, production SMTP, and published privacy policy are external setup that this repository cannot provide by itself. Until they are connected and tested, no build should be described as ready for public release.
