# Google Play release notes

DIAR is free to download and use. It does not need Play Billing or user accounts.

The GitHub APK is release signed for direct installation. Keep the original signing keystore and password: updates installed from GitHub need the same certificate. For Google Play, create a signed Android App Bundle (`.aab`) with an upload key, enroll in Play App Signing, and keep the package ID `com.diar.privatejournal`. Increment `android.versionCode` for every Play update. If the Play delivered app uses a different signing certificate from the GitHub APK, users must export an encrypted backup before switching installations and import it afterward.

Create a Google Play Console developer account, then use internal testing before production. Complete the store listing, screenshots, content rating, Data safety form, and a hosted privacy policy with a real publisher contact. Test installation, PIN setup/unlock, encrypted storage, backup round trip, and deletion on a Play installed build. An `.aab` is uploaded to Play; it is not installed directly on phones.
