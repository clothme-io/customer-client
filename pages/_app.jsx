import { Analytics } from "../src/components/Analytics";
import "../src/styles.css";

export default function App({ Component, pageProps, router }) {
  const path = router.asPath.split("?")[0].replace(/\/$/, "") || "/";
  const pageClassName = path === "/blog" || path.startsWith("/blog/") || path === "/privacy-policy" || path.startsWith("/admin") ? "page-white" : "";

  return (
    <div className={pageClassName}>
      <Analytics />
      <Component {...pageProps} />
    </div>
  );
}
