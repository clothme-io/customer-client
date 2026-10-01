"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "../../../src/components/Analytics";
import { commerceEvent } from "../lib/commerce-events";
export function CommerceAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const query = new URLSearchParams(window.location.search);
    const campaign: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
      const value = query.get(key);
      if (value) campaign[key] = value.slice(0, 120);
    }
    if (Object.keys(campaign).length)
      sessionStorage.setItem("cm_campaign", JSON.stringify(campaign));
    let attribution = {};
    try {
      attribution = JSON.parse(sessionStorage.getItem("cm_campaign") || "{}");
    } catch {
      /* ignore invalid attribution */
    }
    const [section, id] = pathname.split("/").filter(Boolean);
    if (section === "product")
      commerceEvent("view_item", { ...attribution, productId: id });
    if (section === "brand")
      commerceEvent("view_storefront", { ...attribution, brandId: id });
  }, [pathname]);
  return <Analytics privacyMode />;
}
