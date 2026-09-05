"use client";

import { useRouter } from "next/navigation";
import type { ShopUser } from "../lib/types";
import styles from "../shop.module.css";

export function UserAvatarList({
  avatars,
  selectedUserId
}: {
  avatars: ShopUser[];
  selectedUserId?: string;
}) {
  const router = useRouter();

  async function selectUser(userId: string) {
    await fetch("/api/webclient/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId: userId })
    });
    router.refresh();
  }

  return (
    <div className={styles.avatars} role="list" aria-label="Profiles">
      {avatars.map((avatar) => {
        const selected = avatar.userId === selectedUserId;
        return (
          <button
            key={avatar.userId}
            type="button"
            className={styles.avatarBtn}
            onClick={() => selectUser(avatar.userId)}
            aria-pressed={selected}
          >
            <div className={styles.avatarImgWrap}>
              {avatar.profileImage ? (
                <img
                  src={avatar.profileImage}
                  alt=""
                  className={`${styles.avatarImg} ${selected ? styles.avatarSelected : styles.avatarDim}`}
                />
              ) : (
                <div className={`${styles.avatarImg} ${selected ? styles.avatarSelected : styles.avatarDim}`} />
              )}
            </div>
            <div className={styles.avatarName}>{avatar.firstName || "Profile"}</div>
          </button>
        );
      })}
    </div>
  );
}
