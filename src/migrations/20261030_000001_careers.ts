import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS career_jobs (
      id uuid PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      title text NOT NULL,
      department text NOT NULL,
      location text NOT NULL DEFAULT 'Austin, TX, USA',
      employment_type text,
      work_arrangement text,
      relocation_eligible boolean NOT NULL DEFAULT false,
      summary text NOT NULL DEFAULT '',
      about_role text NOT NULL DEFAULT '',
      content_source text NOT NULL DEFAULT '',
      content_source_complete boolean NOT NULL DEFAULT false,
      responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
      requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
      preferred jsonb NOT NULL DEFAULT '[]'::jsonb,
      technology_stack jsonb NOT NULL DEFAULT '[]'::jsonb,
      success_outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
      benefit_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
      screening_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
      status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed')),
      content_approved boolean NOT NULL DEFAULT false,
      opened_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT career_jobs_open_requires_copy CHECK (status <> 'open' OR (
        content_approved AND content_source_complete AND length(trim(content_source)) > 0 AND length(trim(summary)) > 0 AND length(trim(about_role)) > 0
        AND employment_type IS NOT NULL AND work_arrangement IS NOT NULL
        AND jsonb_array_length(responsibilities) > 0 AND jsonb_array_length(requirements) > 0
        AND jsonb_array_length(success_outcomes) > 0
      ))
    );
    CREATE INDEX IF NOT EXISTS career_jobs_public_idx ON career_jobs(status, department, location);

    CREATE TABLE IF NOT EXISTS career_applications (
      id uuid PRIMARY KEY,
      request_id uuid NOT NULL UNIQUE,
      reference text NOT NULL UNIQUE,
      job_id uuid NOT NULL REFERENCES career_jobs(id) ON DELETE RESTRICT,
      first_name text NOT NULL,
      last_name text NOT NULL,
      email text NOT NULL,
      phone text NOT NULL,
      location text NOT NULL,
      linkedin_url text,
      portfolio_url text,
      github_url text,
      motivation text NOT NULL,
      cover_letter text,
      additional_info text,
      screening_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
      resume_filename text NOT NULL,
      resume_mime text NOT NULL,
      resume_bytes bytea NOT NULL,
      resume_sha256 text NOT NULL,
      status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','under_review','interview','offer','hired','rejected','withdrawn')),
      recruiting_notified_at timestamptz,
      applicant_notified_at timestamptz,
      submitted_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS career_applications_job_idx ON career_applications(job_id, submitted_at DESC);
    CREATE INDEX IF NOT EXISTS career_applications_status_idx ON career_applications(status, submitted_at DESC);
    CREATE INDEX IF NOT EXISTS career_applications_email_idx ON career_applications(lower(email));

    CREATE TABLE IF NOT EXISTS career_audit (
      id bigserial PRIMARY KEY,
      actor text NOT NULL,
      action text NOT NULL,
      job_id uuid,
      application_id uuid,
      detail jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS career_audit_created_idx ON career_audit(created_at DESC);
    CREATE TABLE IF NOT EXISTS career_rate_limits (
      key_hash text NOT NULL,
      window_start timestamptz NOT NULL,
      hits integer NOT NULL DEFAULT 1,
      PRIMARY KEY (key_hash, window_start)
    );
    CREATE TABLE IF NOT EXISTS career_staff_roles (
      email text PRIMARY KEY,
      role text NOT NULL CHECK (role IN ('admin','recruiter')),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    INSERT INTO career_jobs (id, slug, title, department) VALUES
    ('a128d353-a2c6-490e-8d4d-d21f78e5a101','founding-senior-backend-engineer','Founding Senior Backend Engineer','Engineering'),
    ('a128d353-a2c6-490e-8d4d-d21f78e5a102','founding-senior-mobile-engineer','Founding Senior Mobile Engineer','Engineering'),
    ('a128d353-a2c6-490e-8d4d-d21f78e5a103','founding-ai-engineer','Founding AI Engineer','AI & Engineering'),
    ('a128d353-a2c6-490e-8d4d-d21f78e5a104','founding-head-of-growth-marketing','Founding Head of Growth & Marketing','Growth'),
    ('a128d353-a2c6-490e-8d4d-d21f78e5a105','founding-chief-operating-officer','Founding Chief Operating Officer','Operations'),
    ('a128d353-a2c6-490e-8d4d-d21f78e5a106','founding-head-of-merchant-success-partnerships','Founding Head of Merchant Success & Partnerships','Marketplace'),
    ('a128d353-a2c6-490e-8d4d-d21f78e5a107','founding-head-of-creator-partnerships-community','Founding Head of Creator Partnerships & Community','Creator Community'),
    ('a128d353-a2c6-490e-8d4d-d21f78e5a108','founding-head-of-customer-experience','Founding Head of Customer Experience','Customer Experience'),
    ('a128d353-a2c6-490e-8d4d-d21f78e5a109','executive-business-partner-founder-ceo','Executive Business Partner to the Founder & CEO','Executive Office'),
    ('a128d353-a2c6-490e-8d4d-d21f78e5a110','founding-product-designer','Founding Product Designer','Product & Design')
    ON CONFLICT (slug) DO NOTHING;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS career_staff_roles; DROP TABLE IF EXISTS career_rate_limits; DROP TABLE IF EXISTS career_audit; DROP TABLE IF EXISTS career_applications; DROP TABLE IF EXISTS career_jobs;`);
}
