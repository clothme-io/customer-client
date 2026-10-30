import Link from "next/link";
import { SEO } from "../../../src/components/SEO";
import { CareersLayout } from "../../../src/components/careers/CareersLayout";
import { ApplicationForm } from "../../../src/components/careers/ApplicationForm";
import { CareerMarkdown } from "../../../src/components/careers/CareerMarkdown";
import { careerBenefits, careerCompanyDescription } from "../../../src/data/careers";
import { getOpenJob, jsonJob } from "../../../src/lib/careersDb";
import { getLocalPreviewJob } from "../../../src/lib/careersPreview";
import styles from "../careers.module.css";

export async function getServerSideProps({ params }) {
  if (!/^[a-z0-9-]{1,120}$/.test(params.slug || "")) return { notFound: true };
  try {
    const job = await getOpenJob(params.slug);
    return job ? { props: { job: jsonJob(job), applicationsUnavailable: false } } : { notFound: true };
  } catch (error) {
    console.error("[careers] Could not load role", error);
    const job = getLocalPreviewJob(params.slug);
    return job ? { props: { job, applicationsUnavailable: true } } : { notFound: true };
  }
}

function Section({ title, items, children }) {
  if (!children && !items?.length) return null;
  return <section><h2>{title}</h2>{children}{items?.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : null}</section>;
}

export default function CareerJobPage({ job, applicationsUnavailable }) {
  const benefits = careerBenefits.filter(([code]) => job.benefitCodes?.includes(code));
  const jsonLd = {
    "@context": "https://schema.org", "@type": "JobPosting", title: job.title,
    description: [job.aboutRole, ...(job.responsibilities || []), ...(job.requirements || [])].join("\n"),
    datePosted: job.openedAt || job.updatedAt,
    employmentType: job.employmentType?.toUpperCase().replaceAll(" ", "_"),
    hiringOrganization: { "@type": "Organization", name: "ClothME", sameAs: "https://clothme.io" },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location } },
    directApply: !applicationsUnavailable,
  };
  return <CareersLayout>
    <SEO title={`${job.title} | Careers at ClothME`} description={job.summary} path={`/careers/${job.slug}`} jsonLd={[jsonLd]} />
    <header className={styles.detailHero}><div className={styles.breadcrumb}><Link href="/careers">Careers</Link> / {job.department}</div><p className={styles.eyebrow}>Open position</p><h1>{job.title}</h1><div className={styles.detailMeta}><span>{job.department}</span><span>{job.location}</span><span>{job.employmentType}</span><span>{job.workArrangement}</span></div>{applicationsUnavailable ? <p className={styles.previewNotice}>Local preview: applications are temporarily unavailable while the database is disconnected.</p> : <a className={styles.primaryButton} href="#apply">Apply Now <span aria-hidden="true">↗</span></a>}</header>
    <div className={styles.detailBody}><aside aria-label="On this page"><a href="#role">The role</a>{!applicationsUnavailable ? <a href="#apply">Apply now</a> : null}</aside><div id="role">
      {job.contentSource ? <CareerMarkdown source={job.contentSource} /> : <>
      <Section title="About ClothME"><p>{careerCompanyDescription}</p></Section>
      <Section title="About the Role"><p>{job.aboutRole}</p></Section>
      <Section title="What You'll Do" items={job.responsibilities}/>
      <Section title="What We're Looking For" items={job.requirements}/>
      <Section title="Nice to Have" items={job.preferred}/>
      <Section title="Technology Stack" items={job.technologyStack}/>
      <Section title="What Success Looks Like" items={job.successOutcomes}/>
      {benefits.length ? <Section title="Potential Benefits"><p>Benefits depend on eligibility, location, employment terms, and approved company policy.</p><ul>{benefits.map(([code, title, body]) => <li key={code}><strong>{title}.</strong> {body}</li>)}</ul></Section> : null}
      </>}
    </div></div>
    {!applicationsUnavailable ? <ApplicationForm job={job}/> : null}
  </CareersLayout>;
}
