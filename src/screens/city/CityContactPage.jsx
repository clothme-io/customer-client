import { useState } from "react";
import { SEO } from "../../components/SEO";
import { CityHeader } from "../../components/city/CityHeader";
import { CityFooter } from "../../components/city/CityFooter";
import { apiFetch } from "../../lib/api";
import { siteConfig } from "../../data/site";

export function CityContactPage({ city }) {
  const seoData = city.seo?.contact ?? {};
  const metaTitle = seoData.metaTitle || `Contact ClothME — ${city.name}`;
  const metaDesc = seoData.metaDescription || `Get in touch with ClothME in ${city.name}.`;

  const rootDomain = (siteConfig.siteUrl || "https://clothme.app").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const cityUrl = `https://${city.slug}.${rootDomain}/contact`;
  const hreflangAlts = [
    { hreflang: "en-CA", href: cityUrl },
    { hreflang: "x-default", href: cityUrl },
  ];

  const [status, setStatus] = useState("idle");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("/api/waitlist", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          source: `contact:${city.slug}`,
        }),
      });
      setStatus("sent");
      e.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <SEO title={metaTitle} description={metaDesc} path="/contact" alternates={hreflangAlts} />
      <CityHeader cityName={city.name} />
      <main>
        <div className="city-page-shell">
          <p className="eyebrow">Contact</p>
          <h1>{city.contactPage?.headline || "Get in touch"}</h1>
          <p>
            {city.contactPage?.subheadline ||
              `Have a question about ClothME in ${city.name}? We'd love to hear from you.`}
          </p>

          {status === "sent" ? (
            <p style={{ marginTop: "32px", fontWeight: 700, color: "var(--blue)" }}>
              ✓ Thanks! We&rsquo;ll be in touch soon.
            </p>
          ) : (
            <form className="city-contact-form" onSubmit={handleSubmit}>
              <label>
                Name
                <input name="name" type="text" placeholder="Your name" required />
              </label>
              <label>
                Email
                <input name="email" type="email" placeholder="you@example.com" required />
              </label>
              <label>
                Message
                <textarea name="message" placeholder="What's on your mind?" required />
              </label>
              <button type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : "Send message"}
              </button>
              {status === "error" && (
                <p style={{ color: "#dc2626", fontSize: "14px" }}>
                  Something went wrong. Email us directly at talk2us@clothme.io
                </p>
              )}
            </form>
          )}
        </div>
      </main>
      <CityFooter cityName={city.name} region={city.region} />
    </>
  );
}
