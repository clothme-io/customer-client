import { Analytics } from "../src/components/Analytics";
import { MetaPixel } from "../src/components/MetaPixel";
import "../src/styles.css";

export default function App({ Component, pageProps, router }) {
  const path = router.asPath.split("?")[0].replace(/\/$/, "") || "/";
  const pageClassName =
    path === "/blog" ||
    path.startsWith("/blog/") ||
    path === "/privacy-policy" ||
    path === "/terms-of-service" ||
    path.startsWith("/admin")
      ? "page-white"
      : "";

  return (
    <div className={pageClassName}>
      <Analytics />
      <MetaPixel />
      <Component {...pageProps} />
    </div>
  );
}
