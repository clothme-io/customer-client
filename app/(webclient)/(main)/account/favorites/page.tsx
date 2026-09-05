import Link from "next/link";
import { AccountEmpty } from "../../../components/AccountEmpty";
import { AccountSignInGate } from "../../../components/AccountSignInGate";
import { AccountSubHeader } from "../../../components/AccountSubHeader";
import { fetchFavouriteBrands } from "../../../lib/commerce";
import { getSession } from "../../../lib/session";
import styles from "../../../shop.module.css";
import shell from "../../../webclient.module.css";

export const metadata = {
  title: "Favourite Brands",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function FavouriteBrandsPage() {
  const session = await getSession();
  if (!session) return <AccountSignInGate title="Favourite Brands" />;

  try {
    const brands = await fetchFavouriteBrands(session);

    return (
      <section>
        <AccountSubHeader title="Favourite Brands" />
        {brands.length === 0 ? (
          <AccountEmpty message="No favourite brands yet." icon="heart" />
        ) : (
          brands.map((brand) => {
            const location = [brand.city, brand.stateProvince, brand.country].filter(Boolean).join(", ") || "N/A";
            return (
              <Link key={brand.id} href={`/brand/${brand.brandId || brand.id}`} className={styles.listRow}>
                {brand.brandLogoUrl ? (
                  <img src={brand.brandLogoUrl} alt="" className={styles.listThumbBrand} />
                ) : (
                  <div className={styles.listThumbBrand} />
                )}
                <div className={styles.listBody}>
                  <p className={styles.listTitle}>{brand.brandName}</p>
                  <p className={shell.muted} style={{ margin: "2px 0 0" }}>
                    {location}
                  </p>
                  {brand.brandDescription ? <p className={styles.listDesc}>{brand.brandDescription}</p> : null}
                  <div className={styles.listFooter}>
                    <span>Count {brand.userMatchCount}</span>
                    <span>Price $0.00</span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </section>
    );
  } catch (error) {
    return (
      <section>
        <AccountSubHeader title="Favourite Brands" />
        <p className={shell.error} style={{ padding: 16 }}>
          {error instanceof Error ? error.message : "Could not load favourite brands"}
        </p>
      </section>
    );
  }
}
