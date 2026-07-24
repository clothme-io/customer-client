/**
 * Homepage landing content — edit this file to swap images, brands, and copy.
 * Brand colors live in src/styles.css under :root (--brand-*).
 */

export const landingImages = {
  hero: {
    src: "/hero-family.png?v=2",
    alt: "Multi-generational family smiling together in coordinated cream and beige knitwear"
  },
  imagine: {
    src: "/phone-store.png",
    alt: "ClothME store screen showing a product with fit score and add to cart"
  },
  imagineBackdrop: {
    src: "/personal-shopping.jpg",
    alt: ""
  },
  familyPhone: {
    src: "/phone-account.png",
    alt: "ClothME account screen showing profile, users, brands, and wish bag"
  },
  familyBackdrop: {
    src: "/personal-shopping.jpg",
    alt: "Clothes on a rack"
  }
};

/** Add or remove brands. Set logo to a public path when you have artwork. */
export const landingBrands = [
  { name: "ZARA", logo: null },
  { name: "lululemon", logo: null },
  { name: "ARITZIA", logo: null },
  { name: "NIKE", logo: null },
  { name: "Levi's", logo: null },
  { name: "ALLSAINTS", logo: null },
  { name: "& More", logo: null }
];

export const usStatesAndProvinces = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"
];

export const landingNav = [
  { label: "For You", href: "/#why" },
  { label: "For Your Family", href: "/#family" },
  { label: "Brands", href: "/#brands" },
  { label: "How It Works", href: "/#how" },
  { label: "FAQ", href: "/#faq" }
];

export const landingBenefits = [
  { title: "Personalized For You", body: "Recommendations that match your style and fit." },
  { title: "Your Best Fit", body: "See your recommended size before you add to cart." },
  { title: "Discover Brands", body: "Find new favorites from local to global." },
  { title: "For The Whole Family", body: "Shop for everyone in one place with family profiles." },
  { title: "Shop With Confidence", body: "Less guessing. Fewer returns. More confidence." },
  { title: "Save Time", body: "A better way to shop. All in one app." }
];

export const landingSteps = [
  { title: "Generate Sizes", body: "Add 2 photos and we'll give you sizes to fit any brand." },
  { title: "Personalized Store", body: "See products and sizes recommended just for you." },
  { title: "Fast with Less Returns", body: "Know more before you buy. Love what you receive." }
];

export const landingImagine = [
  "Never wondering \"Should I buy a Small or a Medium?\" again.",
  "Finding brands you actually love—without searching hundreds of websites.",
  "Shopping for your kids in minutes, not hours.",
  "Opening one app instead of ten."
];

export const landingFamilyPoints = [
  { label: "Mom & Dad" },
  { label: "Kids" },
  { label: "Partners" },
  { label: "All In One Place" }
];

export const landingFamilyProfiles = [
  { name: "Me", role: "Primary" },
  { name: "James", role: "Partner" },
  { name: "Olivia", role: "Kid" },
  { name: "Noah", role: "Kid" }
];

export const landingPrivacyPoints = [
  "Your data stays yours—always.",
  "We never sell your personal information.",
  "You control what you share."
];

export const landingFaq = [
  {
    question: "How does ClothME know my size?",
    answer: "We build a size profile from your fit preferences and shopping history so you can see recommended sizes before you buy."
  },
  {
    question: "Do I need to take measurements?",
    answer: "No measuring tape required. ClothME learns your fit from a simple profile so shopping feels confident across brands."
  },
  {
    question: "Is ClothME free to use?",
    answer: "Joining early access is free. We'll share any pricing details clearly before launch."
  },
  {
    question: "Can I shop for my kids and family?",
    answer: "Yes. Create profiles for parents, kids, and partners so everyone gets personalized recommendations from one account."
  },
  {
    question: "Which brands are available on ClothME?",
    answer: "We're bringing together boutiques, independent labels, and global brands. Early access members see new brands first."
  }
];

export const landingFooterLinks = {
  shop: [
    { label: "For You", href: "/#why" },
    { label: "For Your Family", href: "/#family" },
    { label: "Brands", href: "/#brands" }
  ],
  company: [
    { label: "About Us", href: "/#why" },
    { label: "Contact Us", href: "mailto:talk2us@clothme.io" }
  ],
  support: [
    { label: "FAQ", href: "/#faq" },
    { label: "Privacy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/privacy-policy" }
  ]
};
