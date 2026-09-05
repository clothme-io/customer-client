"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CartIcon,
  CompassIcon,
  InboxIcon,
  PersonIcon,
  SettingsIcon,
  ShopIcon
} from "./Icons";
import styles from "../webclient.module.css";

const PRIMARY = [
  { href: "/shop", label: "Shop", icon: ShopIcon },
  { href: "/discover", label: "Discover", icon: CompassIcon },
  { href: "/cart", label: "Cart", icon: CartIcon },
  { href: "/inbox", label: "Inbox", icon: InboxIcon },
  { href: "/account", label: "Account", icon: PersonIcon }
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  cartCount = 0,
  inboxCount = 0,
  signedIn = false
}: {
  cartCount?: number;
  inboxCount?: number;
  signedIn?: boolean;
}) {
  const pathname = usePathname() || "";

  return (
    <>
      <aside className={styles.sidebar} aria-label="Primary">
        <Link href={signedIn ? "/shop" : "/"} className={styles.brand}>
          <ShopIcon filled />
          <span>ClothME</span>
        </Link>

        <nav className={styles.nav}>
          {PRIMARY.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const count = item.href === "/cart" ? cartCount : item.href === "/inbox" ? inboxCount : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon filled={active} />
                <span>{item.label}</span>
                {count > 0 ? <span className={styles.badge}>{count > 99 ? "99+" : count}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className={styles.divider} />

        <Link
          href="/settings"
          className={`${styles.navLink} ${isActive(pathname, "/settings") ? styles.navLinkActive : ""}`}
          aria-current={isActive(pathname, "/settings") ? "page" : undefined}
        >
          <SettingsIcon />
          <span>Settings</span>
        </Link>

        <div className={styles.spacer} />

        <Link href={signedIn ? "/account" : "/login"} className={styles.profile}>
          <PersonIcon filled={isActive(pathname, "/account")} />
          <span>{signedIn ? "Account" : "Log in"}</span>
        </Link>
      </aside>

      <nav className={styles.mobileNav} aria-label="Primary mobile">
        {PRIMARY.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const count = item.href === "/cart" ? cartCount : item.href === "/inbox" ? inboxCount : 0;
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} aria-label={item.label}>
              <Icon filled={active} />
              {count > 0 ? <span className={styles.badge}>{count > 99 ? "99+" : count}</span> : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
