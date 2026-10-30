# Website size to app account handoff

The account-saving result modal is enabled on `/option1`. The default homepage keeps its current email waitlist result flow.

## Flow

1. The browser creates a guest account, validates two photos, and polls the size job.
2. The web size proxy saves the returned `sizing` and `measurements` to the customer's `sizing-profile` endpoint. That endpoint commits the profile and refreshes catalog fit matches before returning.
3. The modal displays the size, then collects first name, city, region, two-letter country code, email, and password. The signup endpoint upgrades the same guest account and records `registration_source=website_size_tool`. The web endpoint updates the person's name, gender, and primary address, then confirms the saved profile is still present.
4. A saved-size app download email tells the user to log in. No credential or guest session is placed in the link.
5. The mobile account entry route reads server onboarding status. A website-origin account with a saved size and incomplete product preferences enters the product-preference screen; completion is recorded on the person before the shop opens.

## Release order

1. Apply core database migration `V42__account_registration_source.sql`.
2. Deploy the customer API with registration source and onboarding status/completion endpoints.
3. Release the mobile app build with account entry routing and immediate login access from welcome. Verify fresh installs on iOS and Android.
4. Deploy the web client. Configure `APP_DOWNLOAD_EMAIL_ENABLED`, `RESEND_API_KEY`, and `APP_DOWNLOAD_URL` with a real HTTPS app download link. The website reports email delivery failure without undoing a saved account.

Keep `/option1` as the preview until the new homepage is approved. The production size API and catalog matcher must be reachable from the web and customer API environments.

Local `next dev` uses mock customer data by default. The modal can be reviewed there, but account creation and email delivery require live services (`NEXT_PUBLIC_WEBCLIENT_MOCK=0`) after the database and API changes are deployed. No download email is sent unless the email settings above are configured.

## Verification cases

- New web guest: size result, durable profile, account upgrade with unchanged account/person IDs, location, source, app email, fresh mobile login, fit counts, preference completion, shop.
- Interrupted account save: retry using the registered web session without creating another account or address.
- Interrupted mobile preference selection: saved selections reload, then completion is recorded only after continuing.
- Existing mobile account: its prior local onboarding route remains intact.
- Failed matching or email: no false claim that the size or email was delivered.

The size API also writes legacy size tables in a background job. The website handoff uses the customer-owned sizing profile, which is the source used by the current measurement matcher and mobile sizing editor.
