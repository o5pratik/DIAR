# DIAR

DIAR is a free, private diary for Android. No account, email, subscription, purchase, or internet connection is needed. The source also supports iOS builds, but an iOS installation package is not available yet.

## Download for Android

Download **DIAR.apk** from the [latest GitHub Release](https://github.com/o5pratik/DIAR/releases/latest). Open the APK on your Android phone and allow your browser or file manager to install apps when Android asks. Open DIAR, tap **Create my private diary**, and choose a 4 or 6 digit PIN. You can then write immediately.

DIAR saves entries only on your device. Export an encrypted backup from Settings before changing phones, uninstalling, or clearing app data. Keep its passphrase: there is no account recovery or cloud copy. An older preview APK used a different signing key. Export a backup from that preview before uninstalling it, then import the backup into this release.

## Run from source

Install Node.js 22.13 or newer and an Android or iOS development environment. Run `npm ci`, then `npm run android` or `npm run ios`. Run `npm run icons` to regenerate app icons.

## Privacy and storage

Each date has separate fields for What's Going On, Positive Things, and Manifestation. Entries are encrypted with XChaCha20-Poly1305 in the app's private storage. The random encryption key and PIN verifier are held in device secure storage. Android automatic app backup is disabled. Optional biometric unlock, appearance settings, an encrypted export/import, and local data deletion are available in Settings. DIAR has no analytics or ad SDKs.

An exported backup is encrypted with a separate passphrase-derived key and saved wherever you choose. Import replaces the local diary after confirmation. Neither a forgotten PIN nor a forgotten backup passphrase can be recovered by the publisher.

## Build and release

The [Android release workflow](.github/workflows/android-apk.yml) creates a release-signed APK using private GitHub Actions signing secrets. Keep the keystore and password secure: Android updates require the same signing certificate. See [Play release notes](docs/PLAY_RELEASE.md) for a later Google Play build.

Run `npx tsc --noEmit` and `npx expo export --platform android` to check the JavaScript build. Before sharing a new APK, test PIN setup/unlock, restart, date switching, autosave, biometrics where available, backup export/import, and data deletion on a device.
