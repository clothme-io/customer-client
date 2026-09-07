import { fetchShopAvatars, fetchShopData, mergeShopProfiles, shopCards } from "../../lib/catalog";
import { fetchAccountProfile } from "../../lib/commerce";
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
        <p className={styles.muted}>Could not start a shopping session. Refresh to try again.</p>
      </section>
    );
  }

  let avatars: Awaited<ReturnType<typeof fetchShopAvatars>> = [];
  let cards: ReturnType<typeof shopCards> = [];
  let error = "";

  try {
    const [avatarData, shopData, profile] = await Promise.all([
      fetchShopAvatars(session),
      fetchShopData(session),
      fetchAccountProfile(session).catch(() => null)
    ]);
    avatars = mergeShopProfiles(Array.isArray(avatarData) ? avatarData : [], profile?.users);
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
