import Link from "next/link";
import styles from "../../../pages/careers/careers.module.css";

export function CareersLayout({ children }) {
  return <div className={styles.page}>
    <a href="#main" className={styles.skip}>Skip to content</a>
    <header className={styles.header}>
      <div className={styles.headerBrand}>
        <Link href="/" className={styles.wordmark} aria-label="ClothME home">Cloth<span>ME</span><b>.</b></Link>
        <img className={styles.headerLogo} src="/clothme-app-icon.png" alt="" width="40" height="40" />
      </div>
      <nav aria-label="Careers navigation"><Link href="/careers">Careers</Link><Link href="/about">About us</Link><Link href="/manifesto">Manifesto</Link></nav>
      <Link href="/careers#open-roles" className={styles.headerCta}>Open roles <span aria-hidden="true">↗</span></Link>
    </header>
    <main id="main">{children}</main>
    <footer className={styles.footer}>
      <Link href="/" className={styles.wordmark}>Cloth<span>ME</span><b>.</b></Link>
      <p>Build what comes next.</p>
      <nav aria-label="Footer"><Link href="/about">About</Link><Link href="/careers">Careers</Link><Link href="/manifesto">Manifesto</Link><Link href="/careers/privacy">Applicant privacy</Link><Link href="/privacy-policy">Privacy</Link><Link href="/terms-of-service">Terms</Link></nav>
      <small>© {new Date().getFullYear()} ClothME</small>
    </footer>
  </div>;
}
