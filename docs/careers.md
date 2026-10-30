# ClothME careers implementation

## Routes

- `/careers`: careers landing page and published opening list.
- `/careers/[slug]`: full published job description and application form.
- `/careers/[slug]/success`: receipt with application reference.
- `/careers/privacy`: applicant privacy notice.
- `/admin/careers`: private recruiting console for jobs, applicants, and staff access.

The primary home page at `/` links to Careers. The former `/option1` preview URL redirects to `/`.

## Content and publishing

The first migration seeds ten founding roles as **drafts**. The second migration imports the initial Backend Engineer draft. The third adds Growth & Marketing Specialist and Merchant Success & Partnerships Specialist drafts. The fourth publishes six complete descriptions: AI Engineer, Growth & Marketing Specialist, Merchant Success & Partnerships Specialist, Creator Partnerships & Community Specialist, Customer Experience Specialist, and Product Designer. The fifth assigns every role to one of five departments and publishes Business Operations Specialist. The sixth publishes the updated Backend Engineer and Mobile Engineer descriptions supplied in `/Users/paulikhane/Documents/projects/job_description`. The seventh publishes the completed People & Administrative Operations Specialist description. Specialist titles differ from the earlier Head-level titles, so they are separate roles.

The public listing shows only `open` roles, grouped under Engineering & Product, Growth & Marketplace, Customer Experience, Business Operations, and People & Administration. Group counts follow the current filters; empty departments are hidden. When the database is disconnected in local development, `/careers` shows the ten complete role descriptions from the checked-in sources and clearly pauses applications. Production continues to use the database as the source of truth. The local preview fallback does not accept applications.

To publish a role, a recruiting admin signs in through the existing Payload CMS account, opens `/admin/careers`, finishes the full Markdown description and structured fields, checks that the source is complete and approved, and changes status to Open. A database constraint rejects an Open role without approved, complete copy and required job details. Closing a role removes it from the public listing and blocks new applications. Existing application records remain available to recruiting staff.

## Setup

1. Run the registered Payload migrations against the intended Postgres database. Review the database backup before migration; the careers migration creates new tables.
2. Configure `DATABASE_URL`, `PAYLOAD_SECRET`, `RESEND_API_KEY`, and `RECRUITING_ADMIN_EMAILS`. Set `RECRUITING_ADMIN_EMAILS` to the comma-separated email address(es) of existing Payload CMS users who should bootstrap recruiting administration. Application notices go to the user-selected `careers.admin@clothme.io` inbox by default; `RECRUITING_TO` can override it. Database TLS certificates are verified; if the database uses a private certificate authority, supply its PEM certificate in `DATABASE_CA_CERT`.
3. Sign in to the Payload CMS, then use `/admin/careers` to review seeded drafts. Add recruiters in the Staff access tab. Recruiters can view applicants and update their status; admins can also manage roles and recruiting access.
4. Review the careers benefit language and recruitment privacy notice against company policy before deployment. Ten complete descriptions are open.
5. Submit a test application to an approved role in the target environment and confirm the private résumé download, recruiting notification, applicant receipt, and status update. This cannot be fully verified against a disconnected local database.

## Application data

Applications require a valid PDF, DOC, or DOCX résumé (maximum 10 MB), contact details, motivation, any required screening answers, and explicit privacy consent. Server validation, an hourly rate limit, a honeypot, request idempotency, and the role status check run before storage. Résumés are held in a private Postgres `bytea` field and served only through the authenticated recruiting endpoint. Emails use the existing Payload/Resend transport; notification timestamps prevent normal retries from resending completed messages. Admin actions and private résumé downloads are audited.

Retention length and any deletion policy must be set by ClothME before launch. The privacy notice currently directs applicants to request access or deletion through `talk2us@clothme.io` and does not claim a specific retention period.
