# Web sizing uses the existing mobile APIs

The web app consumes the same existing services as `customer-client-mobile`. No new customer-api service, save endpoint, database migration, measurement persistence or matching implementation is required by these web changes.

## API contract

| Operation | Service | Endpoint |
| --- | --- | --- |
| Front/side photo validation | size_api | POST `/validate-front`, `/validate-side` |
| Validation status | size_api | GET `/validate-front-result/{taskId}`, `/validate-side-result/{taskId}` |
| Generate sizes | size_api | POST `/generate/v1/size` |
| Generation status/results | size_api | GET `/generate/v1/size/{taskId}` |
| Manual sizes | size_api | POST `/manual/add` |
| Read saved account sizes | customer-api | GET `/v1/size/full` |

Source of truth: mobile `domain/size/services/api/{addValidatePoseApi,getValidatePoseApi,getSizeDisplayApi,addManualSizeApi}.ts` and `domain/account/services/api/size/getSize.ts`.

The Next.js size route forwards these calls using the customer session and configured size API token. Validation and generation send the same demographic fields and front/side prediction IDs as mobile, plus browser image files. Manual sizes send the same `top` and `bottom` object as mobile. Persistence, size seeding and product matching remain owned by the existing services.

After generation the web reads `/v1/size/full` to confirm that saved sizes are available. That read does not prove completion of a particular generation job or matching operation; the existing API does not expose such an operation status. The web does not claim a match count or execute its own matching.

## Removed assistant additions

- Customer API fit-profile controller, service, domain logic and their tests; module registration.
- Core V36 fit-generation migration. No database rollback was executed: this task never applied the migration.
- Custom web save/import adapter and route, signed job receipts, and bridge/signing-key environment requirements.
- All assistant changes to the customer API checkout/payment files were already undone.

Some of those files had been committed outside this task before removal. Their removal therefore appears as tracked deletions; unrelated commits and files have been preserved.

## Web behavior retained

Public brand/product landing routes; camera permission handling and capture; front/side validation; generation polling; temporary browser storage and resume after receiving a job ID; saved-size purchase gating; return to the selected product. No mobile source or size_api source was changed.

Configure `CUSTOMER_API_URL`, `SIZE_API_URL`, `SIZE_API_TOKEN`, and `NEXT_PUBLIC_WEBCLIENT_MOCK=0` for real service use. Use HTTPS for browser camera access. Local mock tests cannot verify real inference, persistence, matching, or camera behavior. Run those against the existing test environment and physical browsers before advertising.
