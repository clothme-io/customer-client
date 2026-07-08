import { useState } from "react";
import { SEO } from "../components/SEO";
import { siteConfig } from "../data/site";
import { BlueLanding } from "../landing/versions/blue/BlueLanding";
import { CurrentLanding } from "../landing/versions/current/CurrentLanding";
import { WhiteLanding } from "../landing/versions/white/WhiteLanding";
import { apiFetch } from "../lib/api";

const versionMap = {
  current: {
    Component: CurrentLanding,
    title: null,
    path: "/"
  },
  "blue-swap": {
    Component: BlueLanding,
    title: "ClothME | Blue color scheme preview",
    path: "/color-scheme-blue"
  },
  white: {
    Component: WhiteLanding,
    title: null,
    path: "/"
  }
};

export function HomePage({ version = "current", posts = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const config = versionMap[version] || versionMap.current;
  const LandingVersion = config.Component;

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");

    try {
      await apiFetch("/api/waitlist", {
        method: "POST",
        body: JSON.stringify({
          email,
          source: window.location.pathname
        })
      });
    } catch (error) {
      console.warn("Waitlist API unavailable, showing local confirmation.", error);
    }

    setIsModalOpen(true);
    form.reset();
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    logo: new URL(siteConfig.defaultOgImage, siteConfig.siteUrl).toString(),
    description: siteConfig.description
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    description: siteConfig.description
  };

  return (
    <>
      <SEO
        title={config.title || siteConfig.defaultTitle}
        description={siteConfig.description}
        path={config.path}
        image={siteConfig.defaultOgImage}
        jsonLd={[organizationSchema, websiteSchema]}
      />
      <LandingVersion
        isModalOpen={isModalOpen}
        onCloseModal={() => setIsModalOpen(false)}
        onWaitlistSubmit={handleSubmit}
        posts={posts}
      />
    </>
  );
}
