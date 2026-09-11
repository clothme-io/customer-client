import { useEffect } from "react";
import posthog from "posthog-js";
import { siteConfig } from "../data/site";

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development";
const IS_PRODUCTION = APP_ENV === "production";

export function Analytics() {
  useEffect(() => {
    const { gaId, gtmId, plausibleDomain, posthogKey, posthogHost } = siteConfig.analytics;

    if (IS_PRODUCTION && posthogKey && !posthog.__loaded) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: true,
        loaded: (client) => {
          client.register({
            app: "clothme_customer_web",
            environment: APP_ENV,
          });
        },
      });
      window.posthog = posthog;
    }

    if (IS_PRODUCTION && gaId && !document.querySelector(`script[src*="${gaId}"]`)) {
      const gtagScript = document.createElement("script");
      gtagScript.async = true;
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(gtagScript);

      const configScript = document.createElement("script");
      configScript.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(configScript);
    }

    if (IS_PRODUCTION && gtmId && !document.querySelector(`script[data-gtm-id="${gtmId}"]`)) {
      const gtmScript = document.createElement("script");
      gtmScript.dataset.gtmId = gtmId;
      gtmScript.textContent = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `;
      document.head.appendChild(gtmScript);
    }

    if (IS_PRODUCTION && plausibleDomain && !document.querySelector(`script[data-domain="${plausibleDomain}"]`)) {
      const plausibleScript = document.createElement("script");
      plausibleScript.defer = true;
      plausibleScript.dataset.domain = plausibleDomain;
      plausibleScript.src = "https://plausible.io/js/script.js";
      document.head.appendChild(plausibleScript);
    }
  }, []);

  return null;
}
