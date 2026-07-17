import { fileURLToPath } from "node:url";
import path from "node:path";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { bunnyStorage } from "@seshuk/payload-storage-bunny";
import { APIError, buildConfig } from "payload";
import sharp from "sharp";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
const databaseSsl = process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false };
const isProduction = process.env.NODE_ENV === "production";
const payloadSecret = process.env.PAYLOAD_SECRET;

if (isProduction) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set in production");
  }
  if (!payloadSecret || payloadSecret === "development-payload-secret-change-me") {
    throw new Error("PAYLOAD_SECRET must be set to a strong value in production");
  }
}

function bunnyHostname() {
  const base = process.env.BUNNY_CDN_BASE_URL || "";
  try {
    return new URL(base.startsWith("http") ? base : `https://${base}`).hostname;
  } catch {
    return base.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

const bunnyConfigured = Boolean(
  process.env.BUNNY_STORAGE_API_KEY &&
    process.env.BUNNY_STORAGE_ZONE &&
    process.env.BUNNY_CDN_BASE_URL
);

const authenticated = ({ req }) => Boolean(req.user);

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
        create: authenticated,
        delete: authenticated,
        read: () => true,
        update: authenticated
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
        create: authenticated,
        delete: authenticated,
        read: () => true,
        update: authenticated
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
        create: authenticated,
        delete: authenticated,
        read: () => true,
        update: authenticated
      },
      admin: {
        defaultColumns: ["title", "category", "createdAt", "updatedAt"],
        description: "Webhook articles arrive here as drafts. Review the content, choose a category, then publish.",
        enableListViewSelectAPI: true,
        group: "Content",
        useAsTitle: "title"
      },
      labels: {
        plural: "Blog Posts",
        singular: "Blog Post"
      },
      hooks: {
        beforeChange: [
          ({ data, originalDoc }) => {
            const status = data._status || originalDoc?._status || data.status || originalDoc?.status || "draft";
            const category = data.category || originalDoc?.category;

            if (status === "published") {
              if (!category) {
                throw new APIError("Choose a blog category before publishing this post.", 400, null, true);
              }
              if (!data.publishedAt) {
                data.publishedAt = originalDoc?.publishedAt || new Date().toISOString();
              }
            }

            data.status = status === "published" ? "published" : "draft";
            return data;
          }
        ]
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
          required: true,
          admin: {
            disableListColumn: true
          }
        },
        {
          name: "status",
          type: "select",
          defaultValue: "draft",
          admin: {
            description: "Mirrors Payload's publish state. Use the Publish button after choosing a category.",
            readOnly: true
          },
          options: [
            { label: "Draft", value: "draft" },
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
          relationTo: "locations",
          admin: {
            disableListColumn: true
          }
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
          relationTo: "media",
          admin: {
            disableListColumn: true
          }
        },
        {
          name: "externalHeroImageUrl",
          type: "text",
          label: "External Hero Image URL",
          admin: {
            description: "Image URL received from an auto-blogging webhook. Upload a CMS hero image to replace it."
          }
        },
        {
          name: "content",
          type: "richText",
          editor: lexicalEditor({}),
          required: true,
          admin: {
            disableListColumn: true
          }
        },
        {
          name: "seo",
          type: "group",
          admin: {
            disableListColumn: true
          },
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
        },
        {
          name: "source",
          type: "group",
          label: "Webhook Source",
          admin: {
            disableListColumn: true,
            position: "sidebar"
          },
          fields: [
            {
              name: "provider",
              type: "text",
              admin: { readOnly: true }
            },
            {
              name: "externalId",
              type: "text",
              admin: { readOnly: true }
            },
            {
              name: "publicUrl",
              type: "text",
              admin: { readOnly: true }
            },
            {
              name: "providerCreatedAt",
              type: "date",
              admin: { readOnly: true }
            },
            {
              name: "receivedAt",
              type: "date",
              admin: { readOnly: true }
            }
          ]
        }
      ]
    },
    {
      slug: "webhook-events",
      access: {
        create: authenticated,
        delete: authenticated,
        read: authenticated,
        update: authenticated
      },
      admin: {
        defaultColumns: ["provider", "eventType", "status", "slug", "createdAt"],
        group: false,
        useAsTitle: "slug"
      },
      fields: [
        {
          name: "provider",
          type: "select",
          options: [
            { label: "BabyLoveGrowth", value: "babylovegrowth" },
            { label: "Outrank", value: "outrank" }
          ],
          required: true
        },
        {
          name: "eventType",
          type: "text"
        },
        {
          name: "externalId",
          type: "text"
        },
        {
          name: "slug",
          type: "text"
        },
        {
          name: "post",
          type: "relationship",
          relationTo: "cms-posts"
        },
        {
          name: "status",
          type: "select",
          required: true,
          options: [
            { label: "Created", value: "created" },
            { label: "Updated", value: "updated" },
            { label: "Rejected", value: "rejected" },
            { label: "Skipped", value: "skipped" },
            { label: "Error", value: "error" }
          ]
        },
        {
          name: "message",
          type: "textarea"
        },
        {
          name: "payload",
          type: "json"
        },
        {
          name: "normalized",
          type: "json"
        }
      ]
    },
    {
      slug: "waitlist-entries",
      access: {
        create: () => true,
        delete: authenticated,
        read: authenticated,
        update: authenticated
      },
      admin: {
        defaultColumns: ["email", "source", "createdAt"],
        group: "Content",
        useAsTitle: "email"
      },
      fields: [
        {
          name: "email",
          type: "email",
          required: true,
          unique: true
        },
        {
          name: "source",
          type: "text"
        }
      ]
    }
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      ssl: databaseSsl
    },
    push: process.env.NODE_ENV === "development",
    tablesFilter: ["cms_*", "media", "media_*", "locations", "locations_*", "payload_*", "waitlist_entries", "webhook_events"]
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
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        defaultFromAddress: process.env.EMAIL_FROM || "noreply@clothme.io",
        defaultFromName: "ClothME",
        apiKey: process.env.RESEND_API_KEY,
      })
    : undefined,
  plugins: bunnyConfigured
    ? [
        bunnyStorage({
          collections: {
            media: {
              prefix: "cms-media",
              disablePayloadAccessControl: true
            }
          },
          storage: {
            apiKey: process.env.BUNNY_STORAGE_API_KEY,
            hostname: bunnyHostname(),
            zoneName: process.env.BUNNY_STORAGE_ZONE,
            ...(process.env.BUNNY_STORAGE_REGION
              ? { region: process.env.BUNNY_STORAGE_REGION }
              : {})
          }
        })
      ]
    : [],
  secret: payloadSecret || "development-payload-secret-change-me",
  serverURL: siteUrl,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts")
  }
});
