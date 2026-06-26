import { fileURLToPath } from "node:url";
import path from "node:path";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
const databaseSsl = process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false };

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, "..")
    },
    meta: {
      titleSuffix: " - ClothME CMS"
    },
    user: "cms-users"
  },
  collections: [
    {
      slug: "cms-users",
      auth: true,
      admin: {
        group: "Admin",
        useAsTitle: "email"
      },
      fields: [
        {
          name: "name",
          type: "text"
        }
      ]
    },
    {
      slug: "media",
      access: {
        read: () => true
      },
      admin: {
        group: "Content",
        useAsTitle: "alt"
      },
      upload: {
        imageSizes: [
          {
            name: "card",
            width: 900,
            height: 600,
            position: "centre"
          },
          {
            name: "og",
            width: 1200,
            height: 630,
            position: "centre"
          }
        ],
        staticDir: path.resolve(dirname, "../public/cms-media")
      },
      fields: [
        {
          name: "alt",
          type: "text",
          required: true
        },
        {
          name: "caption",
          type: "text"
        }
      ]
    },
    {
      slug: "locations",
      access: {
        create: () => true,
        delete: () => true,
        read: () => true,
        update: () => true
      },
      admin: {
        group: "Cities",
        useAsTitle: "name",
        defaultColumns: ["name", "slug", "region", "status"]
      },
      fields: [
        // ── Identity ─────────────────────────────────────────────────────────
        {
          name: "name",
          type: "text",
          required: true
        },
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true,
          admin: {
            description: "Subdomain slug — e.g. 'vancouver' for vancouver.clothme.io"
          }
        },
        {
          name: "region",
          type: "text",
          admin: { description: "Province or state — e.g. BC" }
        },
        {
          name: "country",
          type: "text",
          defaultValue: "Canada"
        },
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "draft",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
            { label: "Unpublished", value: "unpublished" }
          ],
          admin: {
            position: "sidebar"
          }
        },

        // ── AI Generation Inputs ──────────────────────────────────────────────
        {
          name: "aiGeneration",
          type: "group",
          label: "AI Generation",
          admin: {
            description: "Fill these in before clicking Generate Content. The AI uses them to write city-specific copy."
          },
          fields: [
            {
              name: "boutiquesContext",
              type: "textarea",
              label: "Local Boutiques Context",
              admin: {
                description: "Enter up to 3 boutique names with a one-line description each. One per line. Used by AI to write the Local Shopping section.",
                rows: 5
              }
            },
            {
              name: "articleTopics",
              type: "textarea",
              label: "Blog Article Topics",
              admin: {
                description: "Enter article topic ideas, one per line. Used by AI to generate blog articles for this city.",
                rows: 4
              }
            },
            {
              name: "lastGeneratedAt",
              type: "date",
              label: "Last Generated At",
              admin: {
                readOnly: true,
                description: "Set automatically when AI generation runs.",
                date: { pickerAppearance: "dayAndTime" }
              }
            }
          ]
        },

        // ── Generate Button (UI component) ───────────────────────────────────
        {
          name: "generateCityContent",
          type: "ui",
          admin: {
            components: {
              Field: "src/components/admin/GenerateCityContentButton#GenerateCityContentButton"
            }
          }
        },

        // ── Hero ─────────────────────────────────────────────────────────────
        {
          name: "hero",
          type: "group",
          label: "Hero Section",
          fields: [
            {
              name: "headline",
              type: "text",
              admin: {
                description: "Main headline — should include the city name. Max ~10 words."
              }
            },
            {
              name: "subheadline",
              type: "textarea",
              admin: {
                description: "1–2 sentences expanding on the headline.",
                rows: 2
              }
            },
            {
              name: "primaryCta",
              type: "select",
              label: "Primary CTA",
              defaultValue: "app-store",
              options: [
                { label: "Download on the App Store", value: "app-store" },
                { label: "Reserve Your Spot (Waitlist)", value: "waitlist" }
              ]
            }
          ]
        },

        // ── Pain Points ───────────────────────────────────────────────────────
        {
          name: "painPoints",
          type: "group",
          label: "Pain Points Section",
          fields: [
            {
              name: "headline",
              type: "text",
              defaultValue: "Sound familiar?"
            },
            {
              name: "items",
              type: "array",
              minRows: 0,
              maxRows: 5,
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true
                },
                {
                  name: "description",
                  type: "textarea",
                  required: true,
                  admin: { rows: 2 }
                }
              ]
            }
          ]
        },

        // ── Benefits ──────────────────────────────────────────────────────────
        {
          name: "benefits",
          type: "group",
          label: "Benefits Section",
          fields: [
            {
              name: "headline",
              type: "text"
            },
            {
              name: "items",
              type: "array",
              minRows: 0,
              maxRows: 6,
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true
                },
                {
                  name: "description",
                  type: "textarea",
                  required: true,
                  admin: { rows: 2 }
                }
              ]
            }
          ]
        },

        // ── Local Shopping (Boutiques) ─────────────────────────────────────
        {
          name: "localShopping",
          type: "group",
          label: "Local Shopping Section",
          fields: [
            {
              name: "headline",
              type: "text",
              admin: { description: "e.g. 'Shop Vancouver with confidence'" }
            },
            {
              name: "intro",
              type: "textarea",
              admin: {
                description: "1–2 sentence intro to the boutiques section.",
                rows: 2
              }
            },
            {
              name: "boutiques",
              type: "array",
              minRows: 0,
              maxRows: 3,
              fields: [
                {
                  name: "name",
                  type: "text",
                  required: true
                },
                {
                  name: "neighborhood",
                  type: "text"
                },
                {
                  name: "description",
                  type: "textarea",
                  required: true,
                  admin: { rows: 2 }
                },
                {
                  name: "websiteUrl",
                  type: "text",
                  label: "Website URL"
                },
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media"
                }
              ]
            }
          ]
        },

        // ── FAQ ───────────────────────────────────────────────────────────────
        {
          name: "faq",
          type: "group",
          label: "FAQ Section",
          fields: [
            {
              name: "headline",
              type: "text",
              defaultValue: "Frequently Asked Questions"
            },
            {
              name: "items",
              type: "array",
              minRows: 0,
              maxRows: 12,
              fields: [
                {
                  name: "question",
                  type: "text",
                  required: true
                },
                {
                  name: "answer",
                  type: "textarea",
                  required: true,
                  admin: { rows: 3 }
                }
              ]
            }
          ]
        },

        // ── About Page ────────────────────────────────────────────────────────
        {
          name: "aboutPage",
          type: "group",
          label: "About Page",
          fields: [
            {
              name: "headline",
              type: "text"
            },
            {
              name: "body",
              type: "richText",
              editor: lexicalEditor({})
            }
          ]
        },

        // ── Contact Page ──────────────────────────────────────────────────────
        {
          name: "contactPage",
          type: "group",
          label: "Contact Page",
          fields: [
            {
              name: "headline",
              type: "text",
              defaultValue: "Get in touch"
            },
            {
              name: "subheadline",
              type: "textarea",
              admin: { rows: 2 }
            }
          ]
        },

        // ── SEO (per page) ────────────────────────────────────────────────────
        {
          name: "seo",
          type: "group",
          label: "SEO",
          fields: [
            {
              name: "home",
              type: "group",
              label: "Home Page",
              fields: [
                { name: "metaTitle", type: "text", admin: { description: "Recommended: 50–60 characters" } },
                { name: "metaDescription", type: "textarea", admin: { description: "Recommended: 140–160 characters", rows: 2 } },
                { name: "ogImage", type: "upload", relationTo: "media", label: "OG Image" }
              ]
            },
            {
              name: "about",
              type: "group",
              label: "About Page",
              fields: [
                { name: "metaTitle", type: "text" },
                { name: "metaDescription", type: "textarea", admin: { rows: 2 } }
              ]
            },
            {
              name: "blog",
              type: "group",
              label: "Blog Page",
              fields: [
                { name: "metaTitle", type: "text" },
                { name: "metaDescription", type: "textarea", admin: { rows: 2 } }
              ]
            },
            {
              name: "contact",
              type: "group",
              label: "Contact Page",
              fields: [
                { name: "metaTitle", type: "text" },
                { name: "metaDescription", type: "textarea", admin: { rows: 2 } }
              ]
            }
          ]
        }
      ]
    },
    {
      slug: "cms-posts",
      access: {
        create: () => true,
        delete: () => true,
        read: () => true,
        update: () => true
      },
      admin: {
        defaultColumns: ["title", "status", "location", "publishedAt"],
        group: "Content",
        useAsTitle: "title"
      },
      versions: {
        drafts: {
          autosave: true,
          schedulePublish: true
        },
        maxPerDoc: 25
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true
        },
        {
          name: "slug",
          type: "text",
          required: true,
          unique: true
        },
        {
          name: "excerpt",
          type: "textarea",
          required: true
        },
        {
          name: "status",
          type: "select",
          defaultValue: "draft",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Scheduled", value: "scheduled" },
            { label: "Published", value: "published" }
          ],
          required: true
        },
        {
          name: "publishedAt",
          type: "date",
          admin: {
            date: {
              pickerAppearance: "dayAndTime"
            }
          }
        },
        {
          name: "location",
          type: "relationship",
          relationTo: "locations"
        },
        {
          name: "category",
          type: "select",
          options: [
            { label: "Fit Guide", value: "fit-guide" },
            { label: "Family Shopping", value: "family-shopping" },
            { label: "Personal Style", value: "personal-style" },
            { label: "Location Guide", value: "location-guide" }
          ]
        },
        {
          name: "heroImage",
          type: "upload",
          relationTo: "media"
        },
        {
          name: "content",
          type: "richText",
          editor: lexicalEditor({}),
          required: true
        },
        {
          name: "seo",
          type: "group",
          fields: [
            {
              name: "title",
              type: "text"
            },
            {
              name: "description",
              type: "textarea"
            },
            {
              name: "keywords",
              type: "array",
              fields: [
                {
                  name: "keyword",
                  type: "text"
                }
              ]
            },
            {
              name: "canonicalUrl",
              type: "text"
            },
            {
              name: "ogImage",
              type: "upload",
              relationTo: "media"
            }
          ]
        },
        {
          name: "aiSummary",
          type: "textarea",
          admin: {
            description: "A concise summary for AI search engines and answer engines."
          }
        }
      ]
    }
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      ssl: databaseSsl
    },
    push: process.env.PAYLOAD_DB_PUSH !== "false",
    tablesFilter: ["cms_*", "media", "media_*", "locations", "locations_*", "payload_*"]
  }),
  editor: lexicalEditor({}),
  graphQL: {
    disablePlaygroundInProduction: true
  },
  routes: {
    admin: "/admin/cms",
    api: "/api/payload",
    graphQL: "/graphql",
    graphQLPlayground: "/graphql-playground"
  },
  secret: process.env.PAYLOAD_SECRET || "development-payload-secret-change-me",
  serverURL: siteUrl,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts")
  }
});
