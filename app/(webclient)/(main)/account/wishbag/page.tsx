import Link from "next/link";
import { AccountEmpty } from "../../../components/AccountEmpty";
import { AccountSignInGate } from "../../../components/AccountSignInGate";
import { AccountSubHeader } from "../../../components/AccountSubHeader";
import { fetchWishbag } from "../../../lib/commerce";
import { getSession, isRegistered } from "../../../lib/session";
import styles from "../../../shop.module.css";
import shell from "../../../webclient.module.css";

export const metadata = {
  title: "WishBag",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function WishbagPage() {
  const session = await getSession();
  if (!session || !isRegistered(session)) return <AccountSignInGate title="WishBag" />;

  try {
    const items = await fetchWishbag(session);

    return (
      <section>
        <AccountSubHeader title="WishBag" />
        {items.length === 0 ? (
          <AccountEmpty message="Your wishbag is empty." icon="gift" />
        ) : (
          items.map((item) => (
            <Link key={item.wishbagItemId} href={`/product/${item.productId}`} className={styles.listRow}>
              {item.productImage ? (
                <img src={item.productImage} alt="" className={styles.listThumbProduct} />
              ) : (
                <div className={styles.listThumbProduct} />
              )}
              <div className={styles.listBody}>
                <p className={styles.listTitle}>{item.productName}</p>
                <p className={shell.muted} style={{ margin: "2px 0 0" }}>
                  {[item.productCity, item.productState, item.productCountry].filter(Boolean).join(", ")}
                </p>
                {item.productDescription ? <p className={styles.listDesc}>{item.productDescription}</p> : null}
                <div className={styles.listFooter}>
                  <span>Count {item.count}</span>
                  <span>{`Price ${item.currency}${item.productAmount}`}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </section>
    );
  } catch (error) {
    return (
      <section>
        <AccountSubHeader title="WishBag" />
        <p className={shell.error} style={{ padding: 16 }}>
          {error instanceof Error ? error.message : "Could not load Wishbag"}
        </p>
      </section>
    );
  }
}
