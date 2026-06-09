export const siteConfig = {
  name: "ClothME",
  defaultTitle: "ClothME | Join the waitlist",
  description: "Join the ClothME waitlist to shop fashion products that match your size and your family's sizes.",
  siteUrl: import.meta.env.VITE_SITE_URL || "https://clothme.app",
  twitterHandle: "",
  analytics: {
    gaId: import.meta.env.VITE_GA_ID || "",
    gtmId: import.meta.env.VITE_GTM_ID || "",
    plausibleDomain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || ""
  }
};
