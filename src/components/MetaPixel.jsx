import Script from "next/script";
import { analyticsEnabled } from "../lib/analytics/client.js";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { siteConfig } from "../data/site";

const PIXEL_BOOTSTRAP = `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
`;

export function MetaPixel() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const pixelId = siteConfig.analytics.metaPixelId;

  useEffect(() => {
    const update = () => setEnabled(analyticsEnabled());
    update();
    window.addEventListener("clothme:analytics-consent", update);
    if (!pixelId)
      return () =>
        window.removeEventListener("clothme:analytics-consent", update);

    const onRoute = () => {
      if (
        analyticsEnabled() &&
        typeof window !== "undefined" &&
        typeof window.fbq === "function"
      ) {
        window.fbq("track", "PageView");
      }
    };

    router.events.on("routeChangeComplete", onRoute);
    return () => {
      router.events.off("routeChangeComplete", onRoute);
      window.removeEventListener("clothme:analytics-consent", update);
    };
  }, [pixelId, router.events]);

  if (!pixelId || !enabled) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`${PIXEL_BOOTSTRAP}
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}
    </Script>
  );
}
