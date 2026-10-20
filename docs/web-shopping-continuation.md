# Public shopping, sizing choice, and mobile continuation

The existing web layout remains in use. `/shop`, `/product/:id`, and `/brand/:id` remain public. Shopping hosts (`app`, `dv-app`, `pr-app`) redirect `/` to `/shop`; the marketing root remains unchanged. The feed continues through the existing paginated catalog API. Shoppers without saved sizes see the public catalog even after a guest session is created.

Add to cart opens a sizing choice when the selected person has no saved primary sizes. Web sizing reuses the existing policy, photo capture, size API, and results screens. Name updates use the existing customer person PATCH endpoint. Manual sizes continue to satisfy the existing gate. Checkout retains its server-side size check.

## Creator attribution

Incoming `/product/:id?c=CODE`, `/creator-link/CODE`, and `/creator-campaign/CODE` links are retained for 24 hours in an HTTP-only SameSite cookie. Codes are shape-checked locally and validated by the customer API. The original supported link type/code is retained rather than a raw URL or arbitrary query parameters. Prefetch requests do not capture referrals. Up to 12 recent links are retained.

Product and grant claims use `POST /v1/customer/creator-attribution`. Acknowledgements are scoped to the account, person, type, and code; failed claims remain retryable. Checkout submits pending claims before creating the order. The API remains responsible for product eligibility, attribution expiry, order-line snapshots, paid-order events, and refunds. Campaign codes represent installs and are only submitted by mobile, not by the web browsing flow.

A creator grant may already be bound to a buyer. Opening a grant on web and subsequently claiming it under a different mobile account is not an authorized identity transfer: the API may reject it. Use the same account/profile for an already-claimed grant. Ordinary product codes are forwarded for validation under the mobile buyer. This increment does not merge accounts or silently transfer guest credentials.

## Mobile continuation

The new web table `shopping_continuations` holds only product/color/location/quantity and referral codes. Tokens are random 256-bit identifiers, stored as hashes. No account credentials, name, measurements, or photos are returned by the public resolver. Records expire after 24 hours, are cleaned up on creation, and creation is limited to ten per owner per ten minutes using a database lock. The token grants access only to the selected content, not the originating account.

The web wraps `clothme://continue/TOKEN` in an Airbridge long link with configured iOS/Android store fallbacks and a desktop QR page. This uses the documented parameters: https://help.airbridge.io/en/guides/tracking-link-structure-and-parameters . Plain store URLs are not substituted because they would lose the continuation.

Mobile holds the link through its existing startup/onboarding gate. After onboarding it resolves the selection, claims referrals using the current mobile session, checks `/v1/size/full`, and presents the existing account sizing UI if needed. Photo generation returns to the continuation, which rechecks saved sizes before returning to the product. Available color/location selections are restored; size and stock are evaluated against fresh product data. There is no automatic cart addition or charge.

New users complete the existing mobile onboarding, including name and location. Existing users retain their selected profile. To use mobile sizes later on web, register/sign in with the same account on both devices. Anonymous guest sessions on separate devices are not automatically merged. A separate explicit device-account linking feature would be required for anonymous cross-device account continuity.

## Release configuration

1. Run the existing Payload migration workflow (`npm run cms:sync`) to apply `20261019_000001_shopping_continuations` to the intended web database. This is continuation storage only; the customer/size schemas and services are unchanged.
2. After compatible signed mobile builds pass device testing, set `WEBCLIENT_MOBILE_HANDOFF_ENABLED=true`. It defaults to disabled. Set `WEBCLIENT_PUBLIC_URL` to the canonical HTTPS shopping origin and `AIRBRIDGE_WEB_CHANNEL` to a valid Airbridge channel configured for the ClothME app. The web fails closed with a retryable message if mobile handoff is unconfigured; web sizing remains available.
3. Set `EXPO_PUBLIC_WEBCLIENT_URL` to that same origin in the corresponding mobile build environment. Web, customer API, size API, and mobile must all use the same deployment environment.
4. Verify Airbridge's configured store listings: Apple `id1658441753`, Android `io.patheos.clothme`. Verify signed device association, native SDK configuration, and the channel's deferred link behavior. Ship the mobile continuation route before enabling the web handoff. No store build or dashboard setting was changed here.
5. Set `NEXT_PUBLIC_WEBCLIENT_MOCK=0` for live web testing and use the existing customer/size API configuration. Confirm the existing customer attribution/Thesi integration is deployed, configured, and has its required migrations.

The provider's deferred-install matching window is separate from our 24-hour saved-context expiry; delivery through an app store is not guaranteed merely because the context still exists.

## Verification

Automated web coverage checks referral validation/expiry, credential exclusion, Airbridge destinations, attribution retry/profile scoping, anonymous pagination, sizing regressions, and existing commerce smoke behavior. Focused mobile tests cover parsing, onboarding gating, profile-scoped continuation and saved-size readiness.

Before release, test signed iOS and Android builds: installed cold/warm launch, uninstalled store install, desktop QR, social in-app browsers, expired links, interrupted onboarding, unavailable attribution service, and profile switching. Trace a test creator purchase through checkout, payment acknowledgement/webhook, earnings delivery, and refund. Local mocks cannot establish these external behaviors.

## Rollout status — 2026-10-19

- Expo project `@clothme/ClothME`: `EXPO_PUBLIC_WEBCLIENT_URL` saved in production (`https://clothme.io`), preview and development (`https://dv-app.clothme.io`). Matching values are in the four local build profiles.
- Infrastructure PR #214 merged. Production Argo CD synchronized revision `346790c09a2db3c36106932c2ad67ac36fb82258`; the live ConfigMap has `https://clothme.io`, channel `creator`, and handoff `false`. Development configuration is applied. Infrastructure PR #215 uses a no-surge development rollout to fit existing node capacity; production strategy remains unchanged.
- Public association documents returned HTTP 200 on both `clothme.airbridge.io` and `clothme.abr.ge`: iOS `A765V39MA5.io.patheos.clothme`, Android `io.patheos.clothme`, SHA-256 `65:3E:48:2A:F7:71:E3:93:35:05:1B:FC:81:68:16:0E:CC:9D:22:71:D0:87:4E:2A:E3:E4:FD:B8:F8:54:EA:03`. This verifies published association records, not the signing certificate of a new build or deferred-install behavior.
- Development migration `20261019_000001_shopping_continuations` succeeded in Job `customer-client-web-migrate-dev-rel-40`. Release `39348304231` deployed image `sha-725b1d7`; the rollout is Healthy. Anonymous `/shop`, paginated feed, database health, and expired continuation responses passed live checks. Production migration succeeded in Job `customer-client-web-migrate-prod-rel-23`. Production preview image `sha-725b1d7` passed health, anonymous shop/feed, and expired continuation checks; pre-promotion analysis succeeded. Cutover issue #143 was approved after these checks. Image `sha-725b1d7` now serves production traffic; post-promotion analysis is Successful and the rollout is Healthy. Public curl checks passed for `/shop`, feed pages 1/2, health, and expired continuation resolution. Mobile handoff remains disabled. The user-updated `INFRA_REPO_PAT` passed the credential check and release checkout. No further token changes are authorized.
- The existing `creator` channel returned HTTP 200 for synthetic iOS and Android requests, retaining the continuation destination and including the expected store identifiers. This is an HTTP routing check, not a physical-device installation test.
- Airbridge dashboard verified: both platform schemes are `clothme://`; package, iOS app ID, signing fingerprint, and Apple/Google store destinations match. iOS App Store Connect authentication remains unset for SKAN reporting (separate from basic deep-link routing). Signed iOS/Android installed/fresh-install flows and a real creator attribution purchase/refund remain to verify. Companion mobile PR #159 is merged into `paul-dev` at `d4bf9a4`; 35 focused tests pass. Signed testflight-profile candidates were submitted with frozen existing credentials: Android `8f25d857-c631-4fff-b755-ec6450d683e2` (version code 21), iOS `cfb98d33-0d5a-4107-abbb-b86bf4735eb8` (build 39). These candidates use the existing test Stripe configuration and are for testing, not production checkout. Both initial builds failed at Sentry upload: Android lacked destination properties, and iOS lacked upload authentication. PR #160 merged non-secret destination files matching existing configuration; Android retry `84168246-9490-4f77-b373-c5e2fad4d5cb` uses version code 22. No credentials changed. Sentry upload authentication, successful builds, device verification, and compatible production store releases remain required before enabling handoff.
