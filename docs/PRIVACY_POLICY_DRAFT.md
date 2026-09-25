# DIAR privacy policy draft

**Publisher and contact:** [Add legal publisher name and support email before publishing.]

**Effective date:** [Add release date.]

DIAR is a free diary app. We use Supabase Auth to create and maintain an account identified by your email address. Signing in sends a one time link to that address. Supabase processes the email, authentication session, and technical request information needed to provide this service. DIAR does not sell personal data or include ads or analytics SDKs.

Your diary entries and PIN remain on your device. Entries are encrypted in app storage with a key held by the device's secure storage. We do not upload entries or the encryption key to Supabase. If you export a backup, you choose where to save or share that encrypted file; DIAR does not receive it. A backup passphrase cannot be recovered by us.

You can sign out without deleting the diary on your device. In Settings you can delete local diary data, or delete your DIAR account together with the local diary. You can also request remote account deletion at https://qtudcokmkwriylfsiqcm.supabase.co/functions/v1/delete-account after the deletion page is deployed. If you delete the account through the web page, remove DIAR from each device or delete local data in the app to remove the copies stored there.

We retain account information while the account exists and delete it when your deletion request completes, subject to any legal obligations that apply to the publisher. Backups you saved outside DIAR are controlled by the location where you saved them. Contact [support email] about privacy questions.

Before publication, review this text against the actual Supabase configuration, host it at a public HTTPS URL, and use that URL in the Play Console privacy policy field.
