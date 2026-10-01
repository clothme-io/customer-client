# Web fit-profile implementation and rollout

Target: `customer-api` and its core/catalog databases. `size_api` provides photo validation and measurement generation. There is no `backend-api` integration or shared bridge authentication. The existing mobile API routes and checkout implementation are unchanged.

## Flow and mobile comparison

The mobile implementation in `customer-client-mobile/domain/onboarding/components/size/auto-size-generation-instruction.tsx` submits front and side poses independently, polls each validation task, and uses the resulting `prediction_id` values to generate sizes. Its `size-display.tsx` presents the generated recommendations. Native camera capture lives under `components/pose-capture/`; native live pose detection is not available through the browser camera API.

The web follows the same server validation/generation contracts:

1. An ad opens `/brand/{id}` or `/product/{id}` without forcing account creation. Full and intercepted storefront pages use the same content; intercepted overlays close when navigating onward.
2. Attempting to add an item creates/reuses a guest shopping session, checks the selected person's fit profile, and saves product/location/color and the return destination when sizing is needed.
3. The policy and demographic screens collect explicit height, DOB, gender and supported country. No invented demographic defaults are sent to inference.
4. Camera capture supports browser permission requests, permission/device errors, a countdown, preview and retakes. Image-library input is normalized and bounded. Server-side pose validation determines acceptance; this is not the mobile native live landmark/readiness overlay.
5. Front and side validation jobs are polled. Signed receipts bind a successful validation to the account, person, pose and demographic input. A queued task is not sufficient authorization to generate.
6. Photos are staged as Blobs in IndexedDB, scoped to the account/person, with one-hour expiry checked on access. Accepted generation deletes the staged images and retains the job receipt for resuming. Logout clears local sizing state.
7. The server fetches the generation result itself and saves it through the customer API. It does not accept generated measurements supplied by the browser.
8. The newer API writes measurements and primary regional top/bottom sizes, matches published available variants against chart dimensions, and writes fit/recommendation rows. A durable operation row reports saving, matching, complete or failed. Zero matching products is a valid completed result.
9. Only a persisted ready profile unlocks purchase. The browser returns to the saved product using a fresh navigation, shows available recommended sizes, and requires review before adding. Stock/variant selection is checked and the server also enforces the fit gate.
10. Checkout uses the existing customer API contract. Purchase completion requires confirmed paid status. Signing up can upgrade the guest; signing into a different existing account opens that account's profiles/cart and explicitly does not merge guest selections.

## Code map

Paths below are relative to their repositories.

### clothme-web-client

- `app/(webclient)/components/BrandDetailView.tsx`, brand route pages and modal catch-all: shared storefront and overlay navigation.
- `lib/purchase-intent.ts`, `components/FitProfileGate.tsx`, product/card components, `api/webclient/action/route.ts`: purchase intent, fit gate, selection and server enforcement.
- `components/SizeAgeHeightView.tsx`, `SizeCaptureView.tsx`, `SizeCameraModal.tsx`, `SizeResultsView.tsx`, `SizeManualView.tsx`: demographic, capture, validation, processing, recovery and manual paths.
- `lib/size-images.ts`, `size-profile.ts`, `size-flow.ts`: normalized images, profile scoping and resumable browser storage. A shared pending promise prevents React remounts from submitting duplicate generation jobs.
- `lib/size-contract.ts`, `size-api.ts`, `size-ticket.ts`, `save-fit-profile.ts`: actual upstream envelopes, bounded requests, signed task authorization and authenticated profile saving.
- `api/webclient/size/route.ts`, `api/webclient/fit-profile/route.ts`, `api/webclient/fit-profile/save/route.ts`: server-only credentials, upstream validation/generation, readiness and saving.
- `lib/session-client.ts`, `refresh-session.ts`, session/guest routes: refresh before replacing an expired guest; resolve the real owner profile after account sign-in; verify profile ownership before switching.
- `lib/commerce-events.ts`, `components/CommerceAnalytics.tsx`, `src/components/Analytics.jsx`: allowlisted funnel events and campaign fields; disable automatic capture and session replay in the web shopping app. Photos, measurements and DOB are not passed to these events.
- `tests/webclient/`: envelope/variant unit tests and a local mock-only HTTP smoke test.

### customer-api

- `src/modules/customer/api/fit-profile.controller.ts`: normal customer JWT authentication for `GET` and `POST /v1/customer/persons/:personId/fit-profile`. Saving uses the same account ownership rules as customer profile mutations. No shared key or import endpoint.
- `src/modules/customer/application/fit-profile.domain.ts`: input validation, regional size mapping and dimensional matching rules.
- `src/modules/customer/application/fit-profile.service.ts`: ownership checks, per-person database advisory lock, duplicate/stale-operation handling, core saves and catalog matching. Catalog failure keeps readiness false and permits retry.
- `src/modules/customer/customer.module.ts`: registers the new controller and service.
- Corresponding domain/service specs: regional mapping, scoring, readiness and ownership coverage.
- Existing commerce checkout/payment code is unchanged. The unrelated receipt-email changes have been removed, including their test modifications.

### clothme-db

- `databases/core/sql/V36__fit_generation.sql`: durable sizing operation state, person/account ownership, timestamps and match count. No migration has been applied by this work.

## Deployment sequence

1. Review the changes in all three repositories. Preserve unrelated local work, including the existing catalog V41 migration. Verify migration numbering against the deployment branch before merging.
2. Apply the core V36 migration with the normal migration runner to staging first. Confirm API credentials can access core profile tables and catalog chart/variant/recommendation tables.
3. Deploy customer API with the new fit-profile endpoint before the web client. The web uses the customer JWT for saving. Set `SIZE_JOB_SIGNING_KEY` (at least 32 random characters) on the web server only to protect browser sizing task receipts. It is not shared with customer API and is not an API credential.
4. Configure web `CUSTOMER_API_URL`, `SIZE_API_URL`, `SIZE_API_TOKEN` and `NEXT_PUBLIC_WEBCLIENT_MOCK=0`. Production deliberately has no implicit development API fallback. HTTPS is required for deployed browser camera access.
5. Confirm the size engine accepts the customer access token and returns the expected rich result. Run the complete flow against the current deployed services; local mocks cannot establish their behavior.
6. Seed staging through the normal catalog pipeline with published products, country-matching brand locations, stocked variants and size charts. The fit-profile service saves customer sizes/recommendations; it does not invent missing catalog charts or inventory.
7. Exercise a real staging scan through the web, inspect core measurements/sizes and catalog fit/recommendation rows, and verify the exact saved operation reaches complete. Also test zero matches, malformed results, catalog failure followed by retry, duplicate save, stale job completion, account switch and expired sessions.
8. Test the existing Stripe flow in test mode, including failed/declined payment, redirect/3DS, return-page refresh and paid confirmation. Do not infer payment correctness from mock checkout.
9. Run the device/browser matrix below. Then release to a small campaign before broad ad spend.

## Remaining release gates and limitations

- No live database migration, real inference job, production deployment or real payment was executed. Database-backed integration/concurrency tests are still required; unit mocks cannot prove the SQL against the deployed schema/data.
- Test Safari on a physical iPhone, Chrome on Android, desktop Chrome/Safari/Edge, and Instagram/Facebook in-app browsers. Cover denial/retry, missing camera, front/rear cameras, portrait rotation, large library images, storage denial, backgrounding, reload during processing and reopening the deep link. Embedded browsers may require opening the system browser; verify that experience before buying traffic.
- Native mobile live pose readiness/landmarks were not ported. The browser uses preview/countdown plus authoritative server validation. If live guided capture is a release requirement, add and evaluate a browser pose model separately.
- Initial inference submission has no durable upstream idempotency key. If the network drops after submission but before the task ID arrives, the UI stops automatic resubmission and asks for recovery. A production job registry/idempotency contract is needed for fully automatic recovery across devices or cleared browser storage.
- Session refresh coalescing is process-local. Multiple web replicas/tabs can still race refresh-token rotation; coordinate refresh in the backend or shared store before treating this as resilient at scale.
- Matching currently runs synchronously during saving, supports regional top/bottom charts, and uses a 70% dimensional threshold with 1.5 cm tolerance. Validate this against real catalog conventions and fit expectations. Large catalogs should move matching to a durable worker with bounded batches. Country names and chart coverage must agree with the selected supported country.
- Existing profiles with primary saved sizes and no saved operation remain eligible. These can be profiles created by the existing mobile app. Their existing sizes remain usable.
- Automatic resumption starts from the results route once a job is accepted. Partially captured single photos are not restored, and expiry cleanup happens on later access rather than while the browser is closed. Confirm upstream image retention and deletion independently; browser cleanup does not delete server photos.
- Funnel events are client-side diagnostics, not complete ad attribution. Configure provider IDs/allowed hosts and verify event delivery. Meta Pixel integration for this App Router flow, value/currency purchase payloads, cross-session/server-side conversion deduplication and attribution reconciliation remain work before claiming reliable paid-ad ROAS reporting.
- The fit gate is enforced in this web API. Direct callers of the existing customer cart/checkout API retain their existing behavior; a platform-wide gate would require enforcement in that service too.
- This work does not add guest-account merging, complete the app's unrelated account/support features, or establish native universal/app-link domain association. Campaign URLs should target the explicit web brand/product routes above.

## Verification performed

- Web unit suite: 8 tests passed.
- Customer API targeted suites: 15 tests passed across the direct fit-profile controller, fit domain, fit service and unchanged checkout initialization contract.
- Web TypeScript and customer API production-source TypeScript checks passed. The backend's broader test-source typecheck has pre-existing unrelated failures; it was not represented as passing.
- Next production build passed after allowing its configured Google Fonts download.
- Local mock-only HTTP smoke: fit gate → signed pose validation → generation → save → purchase; tampered receipt rejected. Mock results do not exercise real database SQL or measurement accuracy.
- Browser inspection exercised storefront/product browsing and the fit-policy redirect. Physical camera and payment-provider flows remain unverified.
