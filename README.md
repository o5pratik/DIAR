# DIAR

DIAR is a free, private diary for Android and iOS, built with Expo and React Native. An email code signs the user in. Diary entries remain encrypted on the device and are never uploaded to Supabase. There are no ads, subscriptions, or purchases.

## Run locally

Requires Node.js 22.13 or newer, a Supabase project, and a phone with Expo Go or an Android/iOS simulator.

1. Copy `.env.example` to `.env.local`. Fill in the Supabase Project URL and **publishable** key. Never put a service role or secret key in the app.
2. In Supabase **Authentication → Email Templates → Magic Link**, change the message body to include `{{ .Token }}` so DIAR receives a six digit code. Keep email confirmation enabled. Configure production SMTP before public release.
3. Run `npm ci` and `npm start`. Scan the QR code with Expo Go, or use `npm run android` / `npm run ios` for a simulator. Biometric unlock needs enrolled device biometrics; Face ID requires a development or release build.
4. Deploy the account deletion Edge Function with `npx supabase functions deploy delete-account --no-verify-jwt --project-ref YOUR_PROJECT_REF`. The function authenticates each deletion request itself. The public URL `https://YOUR_PROJECT_REF.supabase.co/functions/v1/delete-account` is the web deletion link for the Play listing.

Run `npm run icons` to regenerate app icons from `scripts/generate-icons.cjs`.

## Data and account behavior

Each date has independent writing in What's Going On, Positive Things, and Manifestation. Changes are saved after a short delay and when leaving the diary. The PIN verifier and a random encryption key are stored in Expo SecureStore. Diary entries are saved as an XChaCha20-Poly1305 encrypted file in the app's private document directory, with a previous encrypted copy for recovery.

Supabase stores email identity and session information. The account ID is bound to the local diary to prevent a second account from opening it. Signing out keeps the local diary and requires the same account to sign back in. Users can export an encrypted backup, erase their diary, or delete their account and local diary from Settings. The account deletion web page can delete the remote account after an emailed code; local data on other devices must be removed on those devices.

The encrypted export uses a separate passphrase-derived key. DIAR cannot recover a forgotten passphrase. Import replaces the local diary after confirmation. Android automatic app backup is disabled. There are no analytics or ad SDKs.

## Release

See [Play release setup](docs/PLAY_RELEASE.md). Production builds use an upload signing key managed by EAS and produce an `.aab` for Play Console. The older APK artifact was a debug-signed preview and must not be submitted to Play. Release builds require the Supabase Project URL and publishable key and fail when they are missing.

## Checks

Run `npx tsc --noEmit`, `npx expo export --platform android`, and `npm run check:release` with the production environment variables. Device checks should cover email sign in, PIN setup and unlock, account switching protection, restart, date switching, autosave, biometrics, appearance, backup round trip, and deletion. The account and deletion service cannot be tested end to end until a Supabase project is connected.
