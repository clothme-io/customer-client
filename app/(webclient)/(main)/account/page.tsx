import Link from "next/link";
import { getSession } from "../../lib/session";
import { fetchAccountProfile, householdMembers } from "../../lib/commerce";
import { PencilIcon, PersonAddIcon } from "../../components/Icons";
import styles from "../../webclient.module.css";
import shopStyles from "../../shop.module.css";

export const metadata = {
  title: "Account",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();

  if (!session) {
    return (
      <section className={shopStyles.signInGate}>
        <h1 className={styles.pageTitle}>Account</h1>
        <p className={styles.muted}>Sign in to manage profiles, Wishbag, Wardrobe, and orders.</p>
        <Link className={styles.button} href="/login">
          Log in
        </Link>
      </section>
    );
  }

  try {
    const profile = await fetchAccountProfile(session);
    const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Account";
    const location = [profile.city, profile.state].filter(Boolean).join(", ");
    const wishItems = profile.wishbags?.wishbagItems ?? [];
    const brands = profile.favoriteBrands ?? [];
    const people = profile.users ?? [];
    const userCount = householdMembers(profile).length;

    return (
      <section>
        <header className={shopStyles.profileHero}>
          <div className={shopStyles.profileAvatarWrap}>
            {profile.profileAvatar ? (
              <img src={profile.profileAvatar} alt="" className={shopStyles.profileAvatar} />
            ) : (
              <div className={shopStyles.profileAvatar} />
            )}
            <Link className={shopStyles.profileEdit} href="/settings" aria-label="Edit profile photo">
              <PencilIcon />
            </Link>
          </div>

          <h1 className={shopStyles.profileName}>{name}</h1>
          {location ? <p className={shopStyles.profileLocation}>{location}</p> : null}

          <div className={shopStyles.statsRow}>
            <Link className={shopStyles.statsButton} href="/account/users">
              Users
              <span className={shopStyles.statsBadge}>{userCount}</span>
            </Link>
            <Link className={shopStyles.statsButton} href="/account/users/new">
              Add User
              <PersonAddIcon />
            </Link>
          </div>

          <div className={shopStyles.quickLinks}>
            <Link className={shopStyles.chipLink} href="/account/favorites">
              Fav Brands
            </Link>
            <Link className={shopStyles.chipLink} href="/account/orders">
              Orders
            </Link>
            <Link className={shopStyles.chipLink} href="/account/wishbag">
              Wish Bag
            </Link>
          </div>
        </header>

        {people.length > 0 ? (
          <>
            <p className={shopStyles.sectionLabel} id="profiles">
              Profiles
            </p>
            <div className={shopStyles.railRow}>
              {people.map((person) =>
                person.profileAvatar ? (
                  <img
                    key={person.userId}
                    src={person.profileAvatar}
                    alt={person.firstName}
                    className={shopStyles.profileTile}
                  />
                ) : (
                  <div key={person.userId} className={shopStyles.profileTile} />
                )
              )}
            </div>
          </>
        ) : null}

        {brands.length > 0 ? (
          <>
            <p className={shopStyles.sectionLabel} id="favorite-brands">
              Favorite brands
            </p>
            <div className={shopStyles.railRow}>
              {brands.map((brand) => (
                <Link key={brand.favoriteBrandId} href={`/brand/${brand.brandId || brand.favoriteBrandId}`}>
                  {brand.brandLogo ? (
                    <img src={brand.brandLogo} alt={brand.brandName} className={shopStyles.brandTile} />
                  ) : (
                    <div className={shopStyles.brandTile} />
                  )}
                </Link>
              ))}
            </div>
          </>
        ) : null}

        {wishItems.length > 0 ? (
          <>
            <p className={shopStyles.sectionLabel} id="wishbag">
              Wishbag
            </p>
            <div className={shopStyles.railRow}>
              {wishItems.map((item) => (
                <Link key={item.wishbagItemId} href={`/product/${item.productId}`}>
                  {item.productAvatar ? (
                    <img src={item.productAvatar} alt={item.productName} className={shopStyles.productTile} />
                  ) : (
                    <div className={shopStyles.productTile} />
                  )}
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </section>
    );
  } catch (error) {
    return (
      <section className={styles.pagePad}>
        <h1 className={styles.pageTitle}>Account</h1>
        <p className={styles.error}>{error instanceof Error ? error.message : "Could not load account"}</p>
      </section>
    );
  }
}
