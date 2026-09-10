"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { shopProfileLines } from "../lib/catalog";
import type { ShopUser } from "../lib/types";
import { CheckIcon } from "./Icons";
import styles from "../shop.module.css";

export function UserAvatarList({
  avatars,
  selectedUserId
}: {
  avatars: ShopUser[];
  selectedUserId?: string;
}) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;

    scroller.scrollLeft = 0;

    const onWheel = (event: WheelEvent) => {
      const delta = event.deltaY + event.deltaX;
      if (!delta) return;
      event.preventDefault();
      scroller.scrollLeft += delta;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = scroller.scrollLeft;
      dragged = false;
      scroller.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) < 4) return;
      dragged = true;
      scroller.scrollLeft = startScroll - dx;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      if (dragged) {
        scroller.dataset.dragged = "1";
        window.setTimeout(() => {
          delete scroller.dataset.dragged;
        }, 0);
      }
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!scroller.dataset.dragged) return;
      event.preventDefault();
      event.stopPropagation();
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    scroller.addEventListener("pointerdown", onPointerDown);
    scroller.addEventListener("pointermove", onPointerMove);
    scroller.addEventListener("pointerup", onPointerUp);
    scroller.addEventListener("pointercancel", onPointerUp);
    scroller.addEventListener("click", onClickCapture, true);
    return () => {
      scroller.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("pointerdown", onPointerDown);
      scroller.removeEventListener("pointermove", onPointerMove);
      scroller.removeEventListener("pointerup", onPointerUp);
      scroller.removeEventListener("pointercancel", onPointerUp);
      scroller.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  async function selectUser(userId: string) {
    await fetch("/api/webclient/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId: userId })
    });
    router.refresh();
  }

  return (
    <div className={styles.profileRail}>
      <div ref={scrollerRef} className={styles.profileCards} role="list" aria-label="Profiles">
        {avatars.map((avatar) => {
          const selected = avatar.userId === selectedUserId;
          const lines = shopProfileLines(avatar);
          return (
            <button
              key={avatar.userId}
              type="button"
              className={`${styles.profileCard} ${selected ? styles.profileCardSelected : ""}`}
              onClick={() => selectUser(avatar.userId)}
              aria-pressed={selected}
            >
              {avatar.profileImage ? (
                <img src={avatar.profileImage} alt="" className={styles.profileCardAvatar} />
              ) : (
                <div className={styles.profileCardAvatar} />
              )}
              <div className={styles.profileCardCopy}>
                <strong className={styles.profileCardName}>{avatar.firstName || "Profile"}</strong>
                <span>{lines.category}</span>
                {lines.size ? <span>{lines.size}</span> : null}
              </div>
              {selected ? (
                <span className={styles.profileCardCheck} aria-hidden="true">
                  <CheckIcon />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
