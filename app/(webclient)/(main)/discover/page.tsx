import Link from "next/link";
import { fetchDiscoverBrands } from "../../lib/catalog";
import { getSession } from "../../lib/session";
import styles from "../../webclient.module.css";
import shopStyles from "../../shop.module.css";

export const metadata = {
  title: "Discover",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className={shopStyles.signInGate}>
        <h1 className={styles.pageTitle}>Discover</h1>
        <p className={styles.muted}>Could not start a shopping session. Refresh to try again.</p>
      </section>
    );
  }

  let brands: Awaited<ReturnType<typeof fetchDiscoverBrands>> = [];
  let error = "";
  try {
    brands = await fetchDiscoverBrands(session);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load Discover";
  }

  return (
    <section>
      <h1 className={styles.pageTitle} style={{ padding: "16px 16px 8px" }}>
        Discover
      </h1>
      {error ? <p className={styles.error} style={{ padding: 16 }}>{error}</p> : null}
      {brands.length === 0 && !error ? (
        <p className={shopStyles.empty}>No brands found.</p>
      ) : (
        brands.map((brand) => (
          <Link key={brand.id} href={`/brand/${brand.id}`} className={shopStyles.brandCard}>
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt="" width={58} height={58} style={{ borderRadius: 15, objectFit: "contain" }} />
            ) : (
              <div style={{ width: 58, height: 58, borderRadius: 15, background: "var(--wc-secondary)" }} />
            )}
            <div>
              <strong>{brand.name}</strong>
              <p className={styles.muted} style={{ margin: "2px 0 8px" }}>
                {[brand.city, brand.country].filter(Boolean).join(", ")}
              </p>
              {brand.description ? (
                <p className={styles.muted} style={{ margin: "0 0 10px" }}>
                  {brand.description}
                </p>
              ) : null}
              <p>
                Average Price {brand.averageAmount > 0 ? `${brand.currency}${brand.averageAmount}` : ""}
              </p>
              <div className={shopStyles.fitRow}>
                <span className={shopStyles.fitChip} style={{ background: "#F59E0B" }}>
                  Slim{brand.fitProductCount > 0 ? ` ${brand.fitProductCount}` : ""}
                </span>
                <span className={shopStyles.fitChip} style={{ background: "#0EA5E9" }}>
                  Regular{brand.fitProductCount > 0 ? ` ${brand.fitProductCount}` : ""}
                </span>
                <span className={shopStyles.fitChip} style={{ background: "#F87171" }}>
                  Loose{brand.fitProductCount > 0 ? ` ${brand.fitProductCount}` : ""}
                </span>
              </div>
            </div>
          </Link>
        ))
      )}
    </section>
  );
}
