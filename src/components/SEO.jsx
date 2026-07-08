import Head from "next/head";
import { siteConfig } from "../data/site";

export function SEO({ title, description, path = "/", image, type = "website", jsonLd = [], robots = "index,follow", alternates = [] }) {
  const absoluteTitle = title || siteConfig.defaultTitle;
  const absoluteDescription = description || siteConfig.description;
  const canonical = new URL(path, siteConfig.siteUrl).toString();
  const imageSource = image || siteConfig.defaultOgImage || "";
  const imageUrl = imageSource ? new URL(imageSource, siteConfig.siteUrl).toString() : "";

  return (
    <Head>
      <title>{absoluteTitle}</title>
      <meta name="description" content={absoluteDescription} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={absoluteTitle} />
      <meta property="og:description" content={absoluteDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
      <meta name="twitter:card" content={imageUrl ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={absoluteTitle} />
      <meta name="twitter:description" content={absoluteDescription} />
      {imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}
      {alternates.map(({ hreflang, href }) => (
        <link key={hreflang} rel="alternate" hreflang={hreflang} href={href} />
      ))}
      {jsonLd.map((schema, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replaceAll("<", "\\u003c") }} />
      ))}
    </Head>
  );
}
