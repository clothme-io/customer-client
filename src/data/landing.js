/**
 * Homepage landing content — edit this file to swap images, brands, and copy.
 * Brand colors live in src/styles.css under :root / .theme-blue-landing (--brand-*).
 */

export const landingPerk = {
  text: "First 1,000 members: 5% off every order for your first year.",
  finePrint: "Not combinable with other discounts."
};

/** Set to a real count string (e.g. "2,400") when available; null hides the line. */
export const landingWaitlistMomentum = "Join thousands of shoppers waiting for a better way to buy clothes.";

export const landingImages = {
  heroStrip: [
    {
      src: "/family-shopping.jpg",
      alt: "Family shopping together for clothes that fit — ClothME family profiles",
      slot: "tl"
    },
    {
      src: "/personal-shopping.jpg",
      alt: "Shopper using phone while browsing — ClothME personalized fit shopping",
      slot: "tr"
    },
    {
      src: "/personal-shopping.jpg",
      alt: "Shopper with shopping bag checking phone — ClothME size match shopping",
      slot: "bl"
    },
    {
      src: "/family-shopping.jpg",
      alt: "Parent and kids discovering clothes together — ClothME family profiles",
      slot: "br"
    }
  ],
  /** How-it-works phone — Generate Size screen. Optional demoVideo.src for a clip later. */
  howPhone: {
    src: "/phone-generate-size.png",
    alt: "ClothME Generate Size screen with photo pose instructions for sizing"
  },
  demoVideo: {
    src: null,
    poster: "/phone-generate-size.png",
    posterAlt: "ClothME Generate Size screen with photo pose instructions for sizing"
  },
  imagine: {
    src: "/phone-store.png",
    alt: "ClothME store screen showing a product with fit score and add to cart"
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
  { name: "ALLSAINTS", logo: null }
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
  // { label: "Brands", href: "/#brands" }, // restore with brands section
  { label: "How It Works", href: "/#how" },
  { label: "FAQ", href: "/#faq" }
];

export const landingBenefits = [
  {
    title: "Your Best Fit",
    body: "See your recommended size in every brand before you buy."
  },
  {
    title: "For The Whole Family",
    body: "One account, a profile for everyone you shop for."
  },
  {
    title: "Fewer Returns",
    body: "Know it fits before it ships."
  },
  {
    title: "Local First",
    body: "Discover brands near you. Reserve and pick up in store, or get it delivered."
  }
];

export const landingSteps = [
  {
    title: "Snap 2 photos",
    body: "We generate your size profile for every brand — no measuring tape needed."
  },
  {
    title: "Personalized Store",
    body: "See products and sizes recommended just for you."
  },
  {
    title: "Fast with Less Returns",
    body: "Know more before you buy. Love what you receive."
  }
];

export const landingImagine = [
  "Never wondering \"Should I buy a Small or a Medium?\" again.",
  "Finding brands you actually love — without searching hundreds of websites.",
  "Discovering great brands made right in your city.",
  "Reserving something in your size at a boutique nearby — and picking it up today.",
  "Shopping for your kids in minutes, not hours.",
  "Buying a gift that actually fits — without asking their size.",
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
  "You control what you share.",
  "Photos are processed for sizing only."
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
  },
  {
    question: "What happens to my photos?",
    answer: "Your photos are used only to generate your size profile. We never sell or share them. You can request deletion of your account and associated photos anytime by emailing talk2us@clothme.io."
  },
  {
    question: "Is my family's data safe?",
    answer: "Yes. Family profiles are private to your account. Children's data is never sold, and parents control everything — who has a profile, what is shared, and when to remove it."
  },
  {
    question: "Do I have to wait for shipping?",
    answer: "Not always. For participating local stores, you can reserve your size on ClothME and pick it up in store, or pay on ClothME and have it delivered — options vary by brand."
  }
];

export const landingCompanyAddress = "Suite 250 - #1430, 97 Seymour St, Vancouver, BC V6B 3M1, Canada";

export const landingFooterLinks = {
  shop: [
    { label: "For You", href: "/#why" },
    { label: "For Your Family", href: "/#family" }
    // { label: "Brands", href: "/#brands" }, // restore with brands section
  ],
  company: [
    { label: "About Us", href: "/#why" },
    { label: "Contact Us", href: "mailto:talk2us@clothme.io" }
  ],
  support: [
    { label: "FAQ", href: "/#faq" },
    { label: "Privacy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" }
  ]
};
