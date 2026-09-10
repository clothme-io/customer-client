import Link from "next/link";
import { AccountEmpty } from "../../../components/AccountEmpty";
import { AccountSignInGate } from "../../../components/AccountSignInGate";
import { AccountSubHeader } from "../../../components/AccountSubHeader";
import { ChevronForwardIcon, PersonAddIcon } from "../../../components/Icons";
import { fetchAccountProfile, householdMembers, personDisplayName } from "../../../lib/commerce";
import { getSession, isRegistered } from "../../../lib/session";
import styles from "../../../shop.module.css";
import shell from "../../../webclient.module.css";

export const metadata = {
  title: "Profiles",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function AccountUsersPage() {
  const session = await getSession();
  if (!session || !isRegistered(session)) return <AccountSignInGate title="Profiles" />;

  try {
    const profile = await fetchAccountProfile(session);
    const people = householdMembers(profile);

    return (
      <section>
        <AccountSubHeader
          title="Profiles"
          action={
            <Link href="/account/users/new" aria-label="Add user">
              <PersonAddIcon />
            </Link>
          }
        />
        {people.length === 0 ? (
          <AccountEmpty message="No profiles added yet." icon="people" />
        ) : (
          people.map((person) => (
            <article key={person.userId} className={`${styles.listRow} ${styles.listRowCircle}`}>
              {person.profileAvatar ? (
                <img src={person.profileAvatar} alt="" className={styles.listThumbCircle} />
              ) : (
                <div className={styles.listThumbCircle} />
              )}
              <div className={styles.listBody}>
                <p className={styles.listTitle}>{personDisplayName(person)}</p>
                {person.relationship ? <p className={styles.listMeta}>{person.relationship}</p> : null}
                {person.city ? <p className={shell.muted} style={{ margin: "4px 0 0", fontSize: 13 }}>{person.city}</p> : null}
              </div>
              <span className={styles.listChevron}>
                <ChevronForwardIcon />
              </span>
            </article>
          ))
        )}
      </section>
    );
  } catch (error) {
    return (
      <section>
        <AccountSubHeader title="Profiles" />
        <p className={shell.error} style={{ padding: 16 }}>
          {error instanceof Error ? error.message : "Could not load profiles"}
        </p>
      </section>
    );
  }
}
