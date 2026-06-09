import { useEffect } from "react";
import { siteConfig } from "../data/site";

export function Analytics() {
  useEffect(() => {
    const { gaId, gtmId, plausibleDomain } = siteConfig.analytics;

    if (gaId && !document.querySelector(`script[src*="${gaId}"]`)) {
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

    if (gtmId && !document.querySelector(`script[data-gtm-id="${gtmId}"]`)) {
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

    if (plausibleDomain && !document.querySelector(`script[data-domain="${plausibleDomain}"]`)) {
      const plausibleScript = document.createElement("script");
      plausibleScript.defer = true;
      plausibleScript.dataset.domain = plausibleDomain;
      plausibleScript.src = "https://plausible.io/js/script.js";
      document.head.appendChild(plausibleScript);
    }
  }, []);

  return null;
}
