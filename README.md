# DIAR

DIAR is a private, local-first diary for Android and iOS, built with Expo and React Native.

## Run

Requires Node.js 22.13 or newer and a phone with Expo Go or an Android/iOS simulator.

```sh
npm install
npm start
```

Scan the QR code with Expo Go, or use `npm run android` / `npm run ios` for a simulator. Biometric unlock needs enrolled device biometrics. Face ID needs a development or release build rather than Expo Go.

Run `npm run icons` to regenerate the app icons from `scripts/generate-icons.cjs`.

## What is stored

Each date has independent writing in What's Going On, Positive Things, and Manifestation. The app creates an empty dated entry when a day is opened. Changes are held in memory immediately, saved after a short delay, and flushed on navigation or when the app leaves the foreground.

The PIN is never stored as text. A random salt and PBKDF2-SHA-256 verifier are stored in Expo SecureStore, which uses Android Keystore backed storage and iOS Keychain. A separate random 256-bit key is stored there for encryption. Diary entries are saved as an XChaCha20-Poly1305 encrypted file in the app's private document directory; a previous encrypted copy is kept for recovery. The PIN is an app lock. Device storage protection and the device passcode remain important because the encryption key is accessible to the app through secure storage.

The encrypted export uses a separate passphrase-derived key. Keep your passphrase: DIAR cannot recover it. Import replaces the local diary only after a confirmation. Android automatic app backup is disabled. There are no accounts, analytics, ads, or backend requests.

## Structure

- `App.tsx`: session state, save scheduling, app lifecycle, import/export.
- `src/screens`: welcome, PIN, diary, and settings screens.
- `src/components`: tabs, calendar, writing editor, gratitude points, keypad.
- `src/storage`: secure settings, encryption, encrypted file persistence.
- `src/models` and `src/utils`: diary shape and date helpers.

## Testing and limitations

Run `npx tsc --noEmit` and `npx expo export --platform android` to verify the TypeScript and bundle. Device checks should cover setup, incorrect PIN, restart, date switching, autosave, biometrics, appearance, and backup round trip. Cloud sync and attachments are intentionally out of scope for this local-first version.
