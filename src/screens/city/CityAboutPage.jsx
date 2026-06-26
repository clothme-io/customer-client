import { SEO } from "../../components/SEO";
import { CityHeader } from "../../components/city/CityHeader";
import { CityFooter } from "../../components/city/CityFooter";
import { siteConfig } from "../../data/site";

export function CityAboutPage({ city }) {
  const seoAbout = city.seo?.about ?? {};
  const metaTitle = seoAbout.metaTitle || `About ClothME in ${city.name}`;
  const metaDesc = seoAbout.metaDescription || `Learn about ClothME and how we are bringing fit-first fashion shopping to ${city.name}.`;

  const headline = city.aboutPage?.headline || `ClothME in ${city.name}`;

  // aboutPage.body is Lexical JSON — extract plain text for the server-rendered view
  const bodyText = extractLexicalText(city.aboutPage?.body);

  const rootDomain = (siteConfig.siteUrl || "https://clothme.app").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const cityUrl = `https://${city.slug}.${rootDomain}/about`;
  const hreflangAlts = [
    { hreflang: "en-CA", href: cityUrl },
    { hreflang: "x-default", href: cityUrl },
  ];

  return (
    <>
      <SEO title={metaTitle} description={metaDesc} path="/about" alternates={hreflangAlts} />
      <CityHeader cityName={city.name} />
      <main>
        <div className="city-page-shell">
          <p className="eyebrow">About</p>
          <h1>{headline}</h1>
          {bodyText
            ? bodyText.map((para, i) => <p key={i}>{para}</p>)
            : (
              <>
                <p>
                  ClothME is a digital shopping service that generates precise fashion size profiles
                  from two photos and matches you with apparel that fits. We support multi-person
                  households by saving sizes for family members and curating location-aware product
                  feeds aligned with each person&rsquo;s fit, style, color, fabric, and brand preferences.
                </p>
                <p>
                  We are currently in pre-launch in {city.name}, operating a waitlist and publishing
                  guidance on fit and family shopping. Join our waitlist to be among the first to
                  experience ClothME.
                </p>
                <p>
                  Our mission: organize the world&rsquo;s fashion inventory by Size/Fit — creating a new
                  commerce category, <strong>Fashion Size Commerce</strong>, for brands and consumers alike.
                </p>
              </>
            )}

          <div style={{ marginTop: "40px" }}>
            <a href="/" style={{ fontWeight: 700, color: "var(--blue)" }}>
              ← Back to home
            </a>
          </div>
        </div>
      </main>
      <CityFooter cityName={city.name} region={city.region} />
    </>
  );
}

function extractLexicalText(lexical) {
  if (!lexical?.root?.children) return null;
  const paras = [];
  for (const node of lexical.root.children) {
    if (node.type === "paragraph") {
      const text = (node.children || [])
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("");
      if (text.trim()) paras.push(text.trim());
    }
  }
  return paras.length > 0 ? paras : null;
}
