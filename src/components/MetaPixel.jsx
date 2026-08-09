import Script from "next/script";
import { useEffect } from "react";
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
  const pixelId = siteConfig.analytics.metaPixelId;

  useEffect(() => {
    if (!pixelId) return undefined;

    const onRoute = () => {
      if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("track", "PageView");
      }
    };

    router.events.on("routeChangeComplete", onRoute);
    return () => router.events.off("routeChangeComplete", onRoute);
  }, [pixelId, router.events]);

  if (!pixelId) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`${PIXEL_BOOTSTRAP}
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}
    </Script>
  );
}
