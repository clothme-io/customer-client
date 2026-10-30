import Link from "next/link";
import { SEO } from "../../src/components/SEO";
import { CareersLayout } from "../../src/components/careers/CareersLayout";
import { JobList } from "../../src/components/careers/JobList";
import { careerBenefits, careerCompanyDescription, careerReasons, careerValues } from "../../src/data/careers";
import { getOpenJobs, jsonJob } from "../../src/lib/careersDb";
import { getLocalPreviewJobs } from "../../src/lib/careersPreview";
import styles from "./careers.module.css";

export async function getServerSideProps() {
  try {
    const jobs = await getOpenJobs();
    return { props: { jobs: jobs.map(jsonJob), unavailable: false } };
  } catch (error) {
    console.error("[careers] Could not load jobs", error);
    return { props: { jobs: getLocalPreviewJobs(), unavailable: true } };
  }
}

export default function CareersPage({ jobs, unavailable }) {
  return <CareersLayout>
    <SEO title="Careers at ClothME | Build What's Next in Fashion" description="Join ClothME to build a more personal future for fashion, fit, and commerce. Explore open roles and learn how we work." path="/careers" />
    <section className={styles.hero} aria-labelledby="careers-title">
      <div className={styles.heroCopy}><p className={styles.eyebrow}>ClothME / Careers</p><h1 id="careers-title">Build What's Next <em>in Fashion.</em></h1><p>We're building a future where shopping is more personal, finding the right fit is easier, and fashion businesses can reach the customers who need them. Join us in creating the technology that makes it possible.</p><div className={styles.heroActions}><a className={styles.primaryButton} href="#open-roles">Explore Open Roles <span aria-hidden="true">↗</span></a><Link className={styles.secondaryButton} href="/about">Discover ClothME <span aria-hidden="true">↗</span></Link></div></div>
      <div className={styles.heroArt} aria-hidden="true"><div className={styles.orbitOne}/><div className={styles.orbitTwo}/><div className={styles.artCenter}>People<br/><span>×</span><br/>possibility</div><span className={styles.artPillOne}>Fit intelligence</span><span className={styles.artPillTwo}>Fashion commerce</span><span className={styles.artPillThree}>Built together</span></div>
    </section>
    <section className={styles.intro}><p className={styles.eyebrow}>Why ClothME</p><div><h2>Build Something <em>That Matters.</em></h2><p>ClothME is bringing together technology, fashion, and commerce to make shopping better for people and help fashion businesses grow. We're a team of builders, thinkers, and problem-solvers who believe great ideas can come from anywhere.</p></div></section>
    <section className={styles.reasons}><div className={styles.sectionHead}><p className={styles.eyebrow}>The opportunity</p><h2>Make your work count.</h2></div><div className={styles.reasonGrid}>{careerReasons.map(([number, title, body]) => <article className={styles.reasonCard} key={title}><span>{number} / 04</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className={styles.culture}><div><p className={styles.eyebrow}>How we work</p><h2>Good work happens <em>together.</em></h2><p>{careerCompanyDescription}</p></div><div className={styles.valueList}>{careerValues.map(([title, body], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div></section>
    <section className={styles.benefits}><div className={styles.sectionHead}><p className={styles.eyebrow}>Support to do your best work</p><h2>Great Work Deserves <em>Great Support.</em></h2><p>These are potential benefits, subject to the position, location, eligibility, and approved company policy. The specific offer for a role will be confirmed during hiring.</p></div><div className={styles.benefitGrid}>{careerBenefits.map(([code, title, body], index) => <article key={code}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className={styles.jobs} id="open-roles"><div className={styles.sectionHead}><p className={styles.eyebrow}>Open positions</p><h2>Find Your Place <em>at ClothME.</em></h2><p>We're building our founding team. Explore opportunities to make a meaningful impact from the beginning.</p></div><JobList jobs={jobs} unavailable={unavailable} /></section>
    <section className={styles.bottomCta}><p className={styles.eyebrow}>The future we're building</p><h2>Shape a better way <em>to shop.</em></h2><Link href="/manifesto" className={styles.secondaryButton}>Read our manifesto <span aria-hidden="true">↗</span></Link></section>
  </CareersLayout>;
}
