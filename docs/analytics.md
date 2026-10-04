# Customer web analytics

PostHog and Mixpanel share the same explicit business events. `src/lib/track.js` preserves existing call sites and legacy GA/Plausible/Meta fanout; `src/lib/analytics/client.js` handles the two product analytics providers. PostHog maps `page_view` to its native `$pageview`; Mixpanel receives `page_view`.

## Configuration and deployment

Configure the existing Kubernetes Secret `customer-client-web-secrets` in namespace `apps`, which the rollout already imports using `envFrom`. Set `MIXPANEL_TOKEN`, `MIXPANEL_API_HOST`, `POSTHOG_KEY`, and `POSTHOG_HOST` there through your existing secret-management process. No analytics tokens or hosts are read from GitHub variables/secrets or Docker build arguments.

`GET /api/analytics-config` reads pod environment variables at request time and returns only those four public browser settings. It is dynamic and marked `no-store`; it never returns administrative API keys, Resend keys, database credentials, or other environment values. The browser loads this configuration before initializing either SDK. Legacy `NEXT_PUBLIC_MIXPANEL_*` and `NEXT_PUBLIC_POSTHOG_*` environment names are accepted at runtime for compatibility, but the unprefixed names above are preferred.

Use the ingestion endpoint corresponding to each project's region (Mixpanel US default: `https://api-js.mixpanel.com`; PostHog US default: `https://us.i.posthog.com`). These are public ingestion project tokens, not private management credentials. Kubernetes stores them, but the browser must receive them to send analytics. Environment-based Secret updates require replacement/restart of application pods through the existing GitHub/GitOps deployment process; they do not require rebuilding JavaScript.

Both providers now use the runtime configuration. Initialization requires production environment and a hostname listed in `NEXT_PUBLIC_POSTHOG_ALLOWED_HOSTS`. Local/staging validation should use isolated test projects and an explicit hostname override, not production data. A missing token leaves that provider disabled, without affecting shopping.

No deployment is required or performed outside GitHub Actions. No customer-api or mobile contract changes are included.

## Event catalogue

| Events | Meaning / permitted details |
| --- | --- |
| `page_view` / `$pageview` | Direct and client navigation in Pages/App routers; sanitized route, campaign, release. Repeated identical route notifications and hash-only changes do not create another view. |
| `navigation_clicked`, `size_tool_cta_clicked`, `cta_click` | Link/CTA intent; sanitized destination or fixed location. No link text or external URLs. |
| `view_item`, `view_storefront` | Product/storefront arrival, including intercepted routes; product/brand ID. |
| `request_started`, `request_succeeded`, `request_failed` | Customer API operation; allowlisted action, status, duration. HTTP success is not payment or generation completion. Refresh attempts are not counted as separate operations. |
| `login_succeeded`, `signup_succeeded`, `logout`, `profile_selected` | Confirmed session API operations. Identify with registered account ID; guest/family profile IDs never become analytics account identities. |
| `favorite_updated`, `wishlist_added`, `wishlist_removed` | Confirmed shopping actions. Favourite event represents a toggle, not necessarily an addition. |
| `add_to_cart`, `cart_quantity_updated`, `shipping_selected`, `address_saved` | Confirmed cart/shipping actions; no address information. Quantity zero is included in cart update operations. |
| `fit_profile_required`, `size_details_completed`, `size_photo_selected` | Fit funnel progression; never measurement values, age, gender or photo content. |
| `camera_opened`, `camera_failed` | Camera ready or denied/unavailable, with pose only. |
| `size_tool_started`, `size_validation_started`, `size_validation_succeeded`, `size_validation_failed` | Homepage/commerce size processing and validation. Homepage failures use `size_tool_failed` with stage. |
| `size_generation_started`, `size_tool_result`, `size_tool_failed` | Homepage generation lifecycle; duration and stable result event ID. |
| `size_capture_completed`, `measurement_generated`, `size_generation_failed`, `fit_profile_saved` | Commerce sizing lifecycle; generation submission additionally uses `request_started` with action `generate`; completion/save use task-based event IDs. |
| `manual_size_submitted`, `manual_size_saved`, `manual_size_failed` | Manual sizing and confirmed ready profile. |
| `begin_checkout`, `payment_attempted`, `payment_failed`, `purchase` | Checkout and payment funnel. Purchase fires after backend confirmation reports paid. |
| `download_email_requested`, `download_email_accepted`, `download_email_failed` | Email request lifecycle; accepted means the endpoint succeeded, not inbox delivery. Stable request ID prevents duplicate acceptance events in one document. |
| `waitlist_submit`, `size_tool_signup` | Successful waitlist requests; signup is no longer reported before the request succeeds. |
| `support_message_sent` | Successful support request, without message content. |
| `client_error`, `page_performance` | At most one unhandled error signal per mounted document; LCP/CLS observations emitted at first hide, not an exception stack or full Web Vitals replacement. |

Search/filter events are not invented for screens with no search/filter controls. Add explicit events when those features are implemented. Creator applications and contact requests emit `_started`, `_succeeded`, and `_failed` events without any form values; product selection emits `product_selection_changed` with the selection stage only.

## Reliability and privacy

The dispatcher buffers up to 100 early events for each provider's initialization and isolates synchronous/asynchronous provider failures. This is a bounded in-memory buffer, not a durable delivery guarantee. Closing the browser, blocking scripts, or opting out can prevent collection.

Only allowlisted properties reach product analytics. Autocapture and replay are off across all screens, including the homepage size tool. Raw URLs/referrers and nested initial URL person properties are stripped; route IDs are normalized. Do not add email, photos, physical measurements, birth dates, passwords, payment data, free text or API error messages to event properties.

Admin and preview routes are excluded. DNT/GPC and the visible usage-analytics opt-out disable product analytics. Opt-out clears pending application events and resets identities; choices sync across tabs. Existing external GTM tag configuration needs a separate account-level check: repository code cannot prove what a remotely configured tag sends.

Provider IDs: Mixpanel receives `$insert_id`; PostHog receives a deterministic valid UUID for business events with eventId. In-document repeats are suppressed. PostHog's storage deduplication is eventual, not an immediate exactly-once guarantee; Mixpanel deduplication also depends on its ingestion rules. Revenue dashboards must count distinct order IDs, not raw purchase events.

Purchase is still browser-confirmed and does not yet carry authoritative revenue/currency. Complete financial reporting requires a separately approved backend payment-webhook/outbox integration. Do not present this as accounting data. Download acceptance is browser-observed; durable email delivery requires Resend webhooks, separately scoped. No server analytics worker/outbox was added.

## Dashboard recipes (create in both projects after access is available)

1. Acquisition: unique visitors by day/week/month, route, campaign, browser/device. Separate anonymous visitors from registered IDs; exclude staff/test cohorts.
2. Shopping funnel: storefront/product view → fit required → sizing completion → add to cart → begin checkout → distinct paid order ID.
3. Sizing: start → validation → result → ready profile. Break failure counts and durations down by stage, device and browser; keep homepage and commerce event paths separate.
4. Retention: weekly cohorts returning to shop/product pages, separately for identified accounts and anonymous visitors.
5. Reliability: request failures by action/status, camera failures, sizing failures, payment failures, LCP/CLS observations.
6. Download email: requests → accepted/failed. Do not label accepted as delivered or clicked as installed.

## Acceptance checks

Run `npm run test:analytics`, `npm run test:webclient`, `npm run test:size-tool`, `npm run test:email`, `npm run typecheck`, and `npm run build`. CI includes the new analytics suite; the email database test needs EMAIL_TEST_DATABASE_URL.

In isolated provider projects, verify direct entry, SPA/back/forward/modal navigation, signup/login/logout and switching accounts, validation failures, payment rejection, purchase revisit/two tabs, download-email success/failure, blocked provider, slow initialization, opt-out/reload/other tab, and DNT/GPC. Inspect raw payloads for sensitive data, confirm actual receipt in both dashboards, and compare business definitions rather than expecting native session totals to match.

Live ingestion, dashboards, Kubernetes analytics secret values, provider project region, and remote GTM configuration remain unverified until project configuration/access is supplied. A successful local build alone does not establish that events arrived in either service.
