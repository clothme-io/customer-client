export const siteConfig = {
  name: "ClothME",
  defaultTitle: "ClothME | Join the waitlist",
  description: "Join the ClothME waitlist to shop fashion products that match your size and your family's sizes.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL || "https://clothme.app",
  twitterHandle: "",
  analytics: {
    gaId: process.env.NEXT_PUBLIC_GA_ID || process.env.VITE_GA_ID || "",
    gtmId: process.env.NEXT_PUBLIC_GTM_ID || process.env.VITE_GTM_ID || "",
    plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || process.env.VITE_PLAUSIBLE_DOMAIN || ""
  }
};
