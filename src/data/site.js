export const siteConfig = {
  name: "ClothME",
  defaultTitle: "ClothME | Shopping That Finally Fits",
  description: "Find clothes you'll love—with personalized sizing, smarter discovery, and brands you'll actually want to wear. For you. For your family.",
  defaultOgImage: "/clothme-logo.png",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL || "https://clothme.app",
  twitterHandle: "",
  analytics: {
    gaId: process.env.NEXT_PUBLIC_GA_ID || process.env.VITE_GA_ID || "G-8H7MC8EYN1",
    gtmId: process.env.NEXT_PUBLIC_GTM_ID || process.env.VITE_GTM_ID || "",
    plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || process.env.VITE_PLAUSIBLE_DOMAIN || ""
  }
};
