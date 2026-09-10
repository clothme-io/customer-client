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
    const node = scrollerRef.current;
    if (!node) return;
    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;

    node.scrollLeft = 0;

    function onWheel(event: WheelEvent) {
      const delta = event.deltaY + event.deltaX;
      if (!delta) return;
      event.preventDefault();
      node.scrollLeft += delta;
    }

    function onPointerDown(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = node.scrollLeft;
      dragged = false;
      node.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event: PointerEvent) {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) < 4) return;
      dragged = true;
      node.scrollLeft = startScroll - dx;
    }

    function onPointerUp(event: PointerEvent) {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      if (dragged) {
        node.dataset.dragged = "1";
        window.setTimeout(() => {
          delete node.dataset.dragged;
        }, 0);
      }
    }

    function onClickCapture(event: MouseEvent) {
      if (!node.dataset.dragged) return;
      event.preventDefault();
      event.stopPropagation();
    }

    node.addEventListener("wheel", onWheel, { passive: false });
    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("pointermove", onPointerMove);
    node.addEventListener("pointerup", onPointerUp);
    node.addEventListener("pointercancel", onPointerUp);
    node.addEventListener("click", onClickCapture, true);
    return () => {
      node.removeEventListener("wheel", onWheel);
      node.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerup", onPointerUp);
      node.removeEventListener("pointercancel", onPointerUp);
      node.removeEventListener("click", onClickCapture, true);
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
