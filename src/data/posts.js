export const posts = [
  {
    slug: "why-clothing-sizes-change-from-brand-to-brand",
    title: "Why clothing sizes change from brand to brand",
    category: "Fit Guide",
    excerpt: "A practical guide to why the same size can fit differently across fashion brands and how size-aware shopping can help.",
    image: "/personal-shopping.jpg",
    imageAlt: "Woman smiling while shopping on her smartphone",
    publishedAt: "2026-06-08",
    updatedAt: "2026-06-08",
    author: "ClothME Team",
    readingTime: "4 min read",
    tags: ["fashion sizing", "online shopping", "fit guide"],
    aiSummary: "Clothing sizes vary because brands use different fit models, fabrics, cuts, and customer assumptions. ClothME aims to match products to a person's generated fashion size instead of relying only on labels like S, M, or L.",
    sections: [
      {
        heading: "The label is only a starting point",
        body: "A medium in one brand can feel like a small in another because every brand builds around its own patterns, fit models, and customer expectations. That makes size labels useful, but not reliable enough on their own."
      },
      {
        heading: "Fabric and cut change the fit",
        body: "Stretch denim, rigid cotton, ribbed knit, and structured tailoring all behave differently on the body. ClothME is being built to account for more than the tag by connecting size, fabric, style, and product details."
      },
      {
        heading: "Fit-first shopping saves time",
        body: "When products are filtered by size compatibility before you browse, you spend less time guessing and more time choosing pieces that match your taste."
      }
    ],
    faq: [
      {
        question: "Why do fashion sizes vary so much?",
        answer: "Fashion sizes vary because brands use different fit models, patterns, measurements, fabrics, and style goals."
      },
      {
        question: "Can ClothME replace size charts?",
        answer: "ClothME is designed to make size charts less confusing by matching products to a generated fashion size profile."
      }
    ]
  },
  {
    slug: "how-to-shop-for-kids-as-their-sizes-keep-changing",
    title: "How to shop for kids as their sizes keep changing",
    category: "Family Shopping",
    excerpt: "Kids grow quickly. Here is how saved family size profiles can make fashion shopping simpler for parents and caregivers.",
    image: "/family-shopping.jpg",
    imageAlt: "Mother and children smiling while using a smartphone",
    publishedAt: "2026-06-08",
    updatedAt: "2026-06-08",
    author: "ClothME Team",
    readingTime: "3 min read",
    tags: ["kids clothing", "family shopping", "size profiles"],
    aiSummary: "Parents can reduce wrong-size purchases by keeping updated size profiles for each child. ClothME is designed to let families switch between profiles and shop products that match each person.",
    sections: [
      {
        heading: "Kids do not grow on a neat schedule",
        body: "A child can outgrow a favorite size between seasons, brands, or even product categories. Saved size profiles help parents shop with better context."
      },
      {
        heading: "One family can have many fit needs",
        body: "ClothME is built for households. You can keep separate size profiles for your child, spouse, partner, or anyone you regularly shop for."
      },
      {
        heading: "The goal is fewer returns",
        body: "When a shopping feed understands who you are buying for, it can prioritize products that are more likely to fit before checkout."
      }
    ],
    faq: [
      {
        question: "Can ClothME save sizes for family members?",
        answer: "Yes. ClothME is planned to support saved profiles for kids, spouses, partners, and other family members."
      },
      {
        question: "Is ClothME only for parents?",
        answer: "No. ClothME is for personal shopping and family shopping."
      }
    ]
  },
  {
    slug: "how-color-fabric-and-fit-shape-your-shopping-feed",
    title: "How color, fabric, and fit shape your shopping feed",
    category: "Personal Style",
    excerpt: "A good fashion feed should understand more than size. It should learn the colors, fabrics, brands, and styles you actually love.",
    image: "/personal-shopping.jpg",
    imageAlt: "Woman smiling while shopping on her smartphone",
    publishedAt: "2026-06-08",
    updatedAt: "2026-06-08",
    author: "ClothME Team",
    readingTime: "4 min read",
    tags: ["personal style", "fashion discovery", "shopping feed"],
    aiSummary: "A useful fashion feed combines size, location, color, fabric, brand, and style preferences. ClothME is designed to show only fashion products that match both fit and taste.",
    sections: [
      {
        heading: "Size solves only one part of shopping",
        body: "A product can fit your body and still fail your taste. ClothME combines size with personal style signals so your feed feels more relevant."
      },
      {
        heading: "Preference makes discovery faster",
        body: "When the system knows the colors, fabrics, brands, and silhouettes you prefer, it can reduce noise and show products worth considering."
      },
      {
        heading: "Location matters too",
        body: "ClothME is designed around products in your location, so the shopping experience can connect fit and availability."
      }
    ],
    faq: [
      {
        question: "What preferences can ClothME use?",
        answer: "ClothME is planned to support preferences such as color, style, fabric, brand, size, and location."
      },
      {
        question: "Will ClothME show products that do not fit?",
        answer: "The goal is to show only fashion products that match size from brands you love in your location."
      }
    ]
  }
];

export function getPostBySlug(slug) {
  return posts.find((post) => post.slug === slug);
}
