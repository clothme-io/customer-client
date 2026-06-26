import { useState } from "react";
import { SEO } from "../../components/SEO";
import { CityHeader } from "../../components/city/CityHeader";
import { CityFooter } from "../../components/city/CityFooter";
import { LandingHowItWorks } from "../../landing/shared/LandingHowItWorks";
import { LandingFamilyNote } from "../../landing/shared/LandingFamilyNote";
import { WaitlistModal } from "../../components/WaitlistModal";
import { BlogCard } from "../../components/BlogCard";
import { siteConfig } from "../../data/site";
import { apiFetch } from "../../lib/api";
import { track } from "../../lib/track";

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || "#";
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || "#";

export function CityHomePage({ city, posts = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cityUrl = `https://${city.slug}.${(siteConfig.siteUrl || "").replace(/^https?:\/\//, "")}`;

  async function handleWaitlist(e) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    track("cta_click", { city: city.slug, cta_type: "waitlist", location: "hero" });
    try {
      await apiFetch("/api/waitlist", {
        method: "POST",
        body: JSON.stringify({ email, source: `city:${city.slug}` }),
      });
    } catch {
      // still show modal even if request fails
    }
    setIsModalOpen(true);
    e.currentTarget.reset();
  }

  const seoHome = city.seo?.home ?? {};
  const metaTitle = seoHome.metaTitle || `ClothME ${city.name} | Shop clothes that fit`;
  const metaDesc = seoHome.metaDescription || `Discover ClothME in ${city.name}. Generate your fashion size profile and shop clothes that fit you and your family — perfectly.`;
  const ogImage = seoHome.ogImage?.url ?? null;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `ClothME ${city.name}`,
    description: metaDesc,
    url: cityUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: city.name,
      addressRegion: city.region || "",
      addressCountry: city.country || "Canada",
    },
  };

  const faqSchema =
    city.faq?.items?.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: city.faq.items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null;

  const hreflangAlts = [
    { hreflang: "en-CA", href: cityUrl },
    { hreflang: "x-default", href: cityUrl },
  ];

  return (
    <>
      <SEO
        title={metaTitle}
        description={metaDesc}
        path="/"
        image={ogImage}
        jsonLd={[localBusinessSchema, ...(faqSchema ? [faqSchema] : [])]}
        alternates={hreflangAlts}
      />

      <CityHeader cityName={city.name} />

      <main>
        {/* ── Hero ── */}
        <section className="hero" id="top">
          <div className="hero-content">
            <p className="eyebrow">Coming to {city.name}</p>
            <h1>{city.hero?.headline || `Shop clothes that fit in ${city.name}.`}</h1>
            <p className="hero-text">
              {city.hero?.subheadline ||
                `ClothME generates precise fashion size profiles from two photos and matches you with clothes that fit — for you and your whole family.`}
            </p>

            <div className="city-app-ctas">
              <a
                href={`${APP_STORE_URL}?utm_source=${city.slug}&utm_medium=microsite&utm_campaign=app_download&utm_content=hero`}
                className="city-store-btn"
                aria-label="Download on the App Store"
                onClick={() => track("cta_click", { city: city.slug, cta_type: "app_store", location: "hero" })}
              >
                <img src="/app-store-badge.svg" alt="Download on the App Store" height="44" />
              </a>
              <a
                href={`${PLAY_STORE_URL}?utm_source=${city.slug}&utm_medium=microsite&utm_campaign=app_download&utm_content=hero`}
                className="city-store-btn"
                aria-label="Get it on Google Play"
                onClick={() => track("cta_click", { city: city.slug, cta_type: "play_store", location: "hero" })}
              >
                <img src="/google-play-badge.svg" alt="Get it on Google Play" height="44" />
              </a>
            </div>

            <form className="waitlist-form" onSubmit={handleWaitlist} style={{ marginTop: "16px" }}>
              <label className="sr-only" htmlFor="city-email">Email address</label>
              <input id="city-email" name="email" type="email" placeholder="Enter your email" autoComplete="email" required />
              <button type="submit">Reserve Your Spot</button>
            </form>
            <p className="privacy-note">Early access invites sent by email. No spam.</p>
          </div>

          <div className="hero-visual" aria-label="ClothME shopping preview">
            <figure>
              <img src="/family-shopping.jpg" alt="Mother and children smiling while using a smartphone" />
              <figcaption>Shop for family</figcaption>
            </figure>
            <figure>
              <img src="/personal-shopping.jpg" alt="Woman smiling while shopping on her smartphone" />
              <figcaption>Shop for yourself</figcaption>
            </figure>
          </div>
        </section>

        {/* ── How It Works ── */}
        <LandingHowItWorks />

        {/* ── Pain Points ── */}
        {city.painPoints?.items?.length > 0 && (
          <section className="city-section" id="pain">
            <div className="city-section-inner">
              <div className="section-heading">
                <p className="eyebrow">The problem</p>
                <h2>{city.painPoints.headline || "Sound familiar?"}</h2>
              </div>
              <div className="city-cards" style={{ marginTop: "28px" }}>
                {city.painPoints.items.map((item, i) => (
                  <article key={i} className="city-card">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Benefits ── */}
        {city.benefits?.items?.length > 0 && (
          <section className="city-section city-section--alt" id="benefits">
            <div className="city-section-inner">
              <div className="section-heading">
                <p className="eyebrow">Why ClothME</p>
                <h2>{city.benefits.headline || `The fit-first way to shop in ${city.name}`}</h2>
              </div>
              <div className="city-cards" style={{ marginTop: "28px" }}>
                {city.benefits.items.map((item, i) => (
                  <article key={i} className="city-card">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Family Note ── */}
        <LandingFamilyNote />

        {/* ── Local Shopping ── */}
        {city.localShopping?.boutiques?.length > 0 && (
          <section className="city-section" id="local">
            <div className="city-section-inner">
              <div className="section-heading">
                <p className="eyebrow">Local boutiques</p>
                <h2>{city.localShopping.headline || `Shop ${city.name} with confidence`}</h2>
                {city.localShopping.intro && (
                  <p style={{ color: "var(--muted)", fontSize: "18px", lineHeight: 1.55, marginTop: "12px" }}>
                    {city.localShopping.intro}
                  </p>
                )}
              </div>
              <div className="city-boutiques" style={{ marginTop: "28px" }}>
                {city.localShopping.boutiques.map((b, i) => (
                  <article key={i} className="city-boutique-card">
                    {b.image?.url && (
                      <img
                        src={b.image.url}
                        alt={b.image.alt || b.name}
                        className="city-boutique-img"
                      />
                    )}
                    <div className="city-boutique-body">
                      <p className="eyebrow">{b.neighborhood}</p>
                      <h3>{b.name}</h3>
                      <p>{b.description}</p>
                      {b.websiteUrl && (
                        <a
                          href={b.websiteUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          style={{ fontWeight: 700 }}
                        >
                          Visit →
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Blog Preview ── */}
        {posts.length > 0 && (
          <section className="blog-band" id="blog">
            <div className="blog">
              <div className="section-heading">
                <p className="eyebrow">ClothME blog</p>
                <h2>Helpful reads before launch.</h2>
              </div>
              <div className="post-grid">
                {posts.slice(0, 3).map((post) => (
                  <BlogCard key={post.id || post.slug} post={mapCmsPost(post)} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ── */}
        {city.faq?.items?.length > 0 && (
          <section className="city-section" id="faq">
            <div className="city-section-inner city-section-inner--narrow">
              <div className="section-heading">
                <p className="eyebrow">Questions</p>
                <h2>{city.faq.headline || "Frequently Asked Questions"}</h2>
              </div>
              <div className="city-faq" style={{ marginTop: "32px" }}>
                {city.faq.items.map((item, i) => (
                  <details key={i} className="city-faq-item">
                    <summary className="city-faq-q">{item.question}</summary>
                    <p className="city-faq-a">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Final CTA ── */}
        <section className="city-section city-section--cta">
          <div className="city-section-inner" style={{ textAlign: "center" }}>
            <p className="eyebrow">Get started</p>
            <h2>Ready to shop clothes that fit in {city.name}?</h2>
            <div className="city-app-ctas" style={{ justifyContent: "center", marginTop: "28px" }}>
              <a
                href={`${APP_STORE_URL}?utm_source=${city.slug}&utm_medium=microsite&utm_campaign=app_download&utm_content=final_cta`}
                className="city-store-btn"
                aria-label="Download on the App Store"
                onClick={() => track("cta_click", { city: city.slug, cta_type: "app_store", location: "final_cta" })}
              >
                <img src="/app-store-badge.svg" alt="Download on the App Store" height="44" />
              </a>
              <a
                href={`${PLAY_STORE_URL}?utm_source=${city.slug}&utm_medium=microsite&utm_campaign=app_download&utm_content=final_cta`}
                className="city-store-btn"
                aria-label="Get it on Google Play"
                onClick={() => track("cta_click", { city: city.slug, cta_type: "play_store", location: "final_cta" })}
              >
                <img src="/google-play-badge.svg" alt="Get it on Google Play" height="44" />
              </a>
            </div>
            <p style={{ marginTop: "16px" }}>
              <a
                href={`/?utm_source=${city.slug}&utm_medium=microsite&utm_campaign=waitlist&utm_content=final_cta#waitlist`}
                style={{ fontWeight: 700, color: "var(--blue)" }}
              >
                Or reserve your spot on the waitlist →
              </a>
            </p>
          </div>
        </section>
      </main>

      <CityFooter cityName={city.name} region={city.region} />
      <WaitlistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

// Map a Payload cms-post document to the shape BlogCard expects
function mapCmsPost(post) {
  return {
    slug: post.slug,
    title: post.title,
    category: post.category,
    excerpt: post.excerpt,
    image: post.heroImage?.url || post.heroImage || "",
    imageAlt: post.heroImage?.alt || "",
    publishedAt: post.publishedAt,
  };
}
