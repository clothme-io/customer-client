import Head from "next/head";
import { Analytics } from "../src/components/Analytics";
import "../src/styles.css";

export default function App({ Component, pageProps, router }) {
  const path = router.asPath.split("?")[0].replace(/\/$/, "") || "/";
  const pageClassName = path === "/blog" || path.startsWith("/blog/") || path === "/privacy-policy" || path.startsWith("/admin") ? "page-white" : "";

  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </Head>
      <div className={pageClassName}>
        <Analytics />
        <Component {...pageProps} />
      </div>
    </>
  );
}
