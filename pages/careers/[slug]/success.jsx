import Link from "next/link";
import { SEO } from "../../../src/components/SEO";
import { CareersLayout } from "../../../src/components/careers/CareersLayout";
import styles from "../careers.module.css";

export default function ApplicationSuccess() {
  return <CareersLayout><SEO title="Application Received | ClothME Careers" description="Thank you for your interest in joining ClothME." path="/careers" robots="noindex,follow"/><section className={styles.success}><p className={styles.eyebrow}>Thank you</p><h1>Application Received!</h1><p>Thank you for your interest in joining ClothME. We've received your application, and our team will review it. If your experience aligns with what we're looking for, we'll contact you about next steps.</p><div className={styles.successActions}><Link href="/careers" className={styles.primaryButton}>Back to Careers ↗</Link><Link href="/" className={styles.secondaryButton}>Explore ClothME ↗</Link></div></section></CareersLayout>;
}
