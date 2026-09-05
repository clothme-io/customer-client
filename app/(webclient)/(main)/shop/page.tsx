import Link from "next/link";
import { fetchShopAvatars, fetchShopData, shopCards } from "../../lib/catalog";
import { getSession } from "../../lib/session";
import { UserAvatarList } from "../../components/UserAvatarList";
import { ShopItemCard } from "../../components/ShopItemCard";
import styles from "../../webclient.module.css";
import shopStyles from "../../shop.module.css";

export const metadata = {
  title: "Shop",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className={shopStyles.signInGate}>
        <h1 className={styles.pageTitle}>Shop</h1>
        <p className={styles.muted}>Sign in to see your personalized feed and Fit Score.</p>
        <p>
          <Link className={styles.button} href="/login">
            Log in
          </Link>
        </p>
      </section>
    );
  }

  let avatars: Awaited<ReturnType<typeof fetchShopAvatars>> = [];
  let cards: ReturnType<typeof shopCards> = [];
  let error = "";

  try {
    const [avatarData, shopData] = await Promise.all([
      fetchShopAvatars(session),
      fetchShopData(session)
    ]);
    avatars = Array.isArray(avatarData) ? avatarData : [];
    cards = shopCards(shopData);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load Shop";
  }

  return (
    <section>
      <h1 className={shopStyles.srOnly}>Shop</h1>
      {avatars.length > 0 ? (
        <UserAvatarList avatars={avatars} selectedUserId={session.personId} />
      ) : null}
      {error ? <p className={styles.error} style={{ padding: 16 }}>{error}</p> : null}
      {cards.length === 0 && !error ? (
        <p className={shopStyles.empty}>No items to show for this profile yet.</p>
      ) : (
        cards.map((item) => <ShopItemCard key={item.product.productId} item={item} />)
      )}
    </section>
  );
}
