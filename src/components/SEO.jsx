import { siteConfig } from "../data/site";

function setTag(selector, createTag) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = createTag();
    document.head.appendChild(tag);
  }
  return tag;
}

export function SEO({ title, description, path = "/", image, type = "website", jsonLd = [], robots = "index,follow" }) {
  const absoluteTitle = title || siteConfig.defaultTitle;
  const absoluteDescription = description || siteConfig.description;
  const canonical = new URL(path, siteConfig.siteUrl).toString();
  const imageUrl = image ? new URL(image, siteConfig.siteUrl).toString() : "";

  document.title = absoluteTitle;

  const meta = [
    ["name", "description", absoluteDescription],
    ["name", "robots", robots],
    ["property", "og:title", absoluteTitle],
    ["property", "og:description", absoluteDescription],
    ["property", "og:type", type],
    ["property", "og:url", canonical],
    ["name", "twitter:card", imageUrl ? "summary_large_image" : "summary"],
    ["name", "twitter:title", absoluteTitle],
    ["name", "twitter:description", absoluteDescription]
  ];

  if (imageUrl) {
    meta.push(["property", "og:image", imageUrl]);
    meta.push(["name", "twitter:image", imageUrl]);
  }

  meta.forEach(([attr, key, content]) => {
    const tag = setTag(`meta[${attr}="${key}"]`, () => {
      const node = document.createElement("meta");
      node.setAttribute(attr, key);
      return node;
    });
    tag.setAttribute("content", content);
  });

  const canonicalTag = setTag('link[rel="canonical"]', () => {
    const node = document.createElement("link");
    node.setAttribute("rel", "canonical");
    return node;
  });
  canonicalTag.setAttribute("href", canonical);

  document.querySelectorAll("script[data-json-ld]").forEach((node) => node.remove());
  jsonLd.forEach((schema, index) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.jsonLd = String(index);
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  });

  return null;
}
