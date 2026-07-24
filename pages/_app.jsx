import Head from "next/head";
import { Analytics } from "../src/components/Analytics";
import "../src/styles.css";

export default function App({ Component, pageProps, router }) {
  const path = router.asPath.split("?")[0].replace(/\/$/, "") || "/";
  const pageClassName = path === "/blog" || path.startsWith("/blog/") || path === "/privacy-policy" || path.startsWith("/admin") ? "page-white" : "";

  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="/clothme-logo.png" />
        <link rel="apple-touch-icon" href="/clothme-logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div className={pageClassName}>
        <Analytics />
        <Component {...pageProps} />
      </div>
    </>
  );
}
