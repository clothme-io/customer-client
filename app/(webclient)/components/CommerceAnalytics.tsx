"use client";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Analytics } from "../../../src/components/Analytics";
function RouteAnalytics() {
  const pathname = usePathname();
  const search = useSearchParams();
  return (
    <Analytics path={`${pathname || "/"}${search?.size ? `?${search}` : ""}`} />
  );
}
export function CommerceAnalytics() {
  return (
    <Suspense fallback={null}>
      <RouteAnalytics />
    </Suspense>
  );
}
