import { readFileSync } from "node:fs";
import { join } from "node:path";

// Local review only. The database remains authoritative for public jobs and applications.
const previewRoles = [
  ["founding-senior-backend-engineer", "Founding Senior Backend Engineer", "Engineering & Product", "Build reliable, scalable backend systems for ClothME’s fit-first fashion marketplace."],
  ["founding-senior-mobile-engineer", "Founding Senior Mobile Engineer", "Engineering & Product", "Build the ClothME mobile shopping experience and the engineering foundation behind it."],
  ["founding-ai-engineer", "Founding AI Engineer", "Engineering & Product", "Build applied AI systems for fit, search, recommendations, and the ClothME marketplace."],
  ["founding-growth-marketing-specialist", "Founding Growth & Marketing Specialist", "Growth & Marketplace", "Help introduce ClothME to shoppers, fashion businesses, and creators through hands-on growth and marketing."],
  ["founding-merchant-success-partnerships-specialist", "Founding Merchant Success & Partnerships Specialist", "Growth & Marketplace", "Build and support the fashion business partnerships that power the ClothME marketplace."],
  ["founding-creator-partnerships-community-specialist", "Founding Creator Partnerships & Community Specialist", "Growth & Marketplace", "Build creator partnerships and a community that connects fashion discovery with real people."],
  ["founding-customer-experience-specialist", "Founding Customer Experience Specialist", "Customer Experience", "Help shoppers, merchants, and creators get the most from ClothME."],
  ["founding-product-designer", "Founding Product Designer", "Engineering & Product", "Design useful, intuitive experiences across the ClothME marketplace and its tools."],
  ["founding-business-operations-specialist", "Founding Business Operations Specialist", "Business Operations", "Coordinate company execution and improve operational processes as ClothME grows."],
  ["founding-people-administrative-operations-specialist", "Founding People & Administrative Operations Specialist", "People & Administration", "Support hiring, employee processes, and administrative operations as ClothME grows."],
];

function markdownSection(source, heading) {
  const headingLine = `## ${heading}`;
  const start = source.split("\n").findIndex((line) => line.trim() === headingLine);
  if (start < 0) return "";
  return source.split("\n").slice(start + 1).join("\n").split(/\n## /, 1)[0].trim();
}

export function getLocalPreviewJobs() {
  if (process.env.NODE_ENV === "production") return [];
  return previewRoles.map(([slug, title, department, summary]) => {
    const contentSource = readFileSync(join(process.cwd(), "src", "data", "careers", `${slug}.md`), "utf8");
    return {
      id: slug, slug, title, department, status: "open", summary, contentSource,
      location: "Austin, Texas, USA", employmentType: "Full-Time", workArrangement: "On-site / Hybrid",
      relocationEligible: true, aboutRole: markdownSection(contentSource, "About the Role").split("\n\n")[0] || summary,
      responsibilities: [], requirements: [], preferred: [], technologyStack: [], successOutcomes: [], benefitCodes: [], screeningQuestions: [],
      openedAt: "2026-10-30T00:00:00.000Z", updatedAt: "2026-10-30T00:00:00.000Z",
    };
  });
}

export function getLocalPreviewJob(slug) {
  return getLocalPreviewJobs().find((job) => job.slug === slug) || null;
}
