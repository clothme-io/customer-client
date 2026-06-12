import { fileURLToPath } from "node:url";
import path from "node:path";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

const isAdmin = ({ req: { user } }) => Boolean(user);
const publishedOrAdmin = ({ req: { user } }) => {
  if (user) {
    return true;
  }

  return {
    status: {
      equals: "published"
    }
  };
};

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
        create: isAdmin,
        delete: isAdmin,
        read: () => true,
        update: isAdmin
      },
      admin: {
        group: "SEO",
        useAsTitle: "name"
      },
      fields: [
        {
          name: "name",
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
          name: "region",
          type: "text"
        },
        {
          name: "country",
          type: "text",
          defaultValue: "Canada"
        },
        {
          name: "seoTitle",
          type: "text"
        },
        {
          name: "seoDescription",
          type: "textarea"
        }
      ]
    },
    {
      slug: "cms-posts",
      access: {
        create: isAdmin,
        delete: isAdmin,
        read: publishedOrAdmin,
        update: isAdmin
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
      connectionString: process.env.DATABASE_URL
    },
    push: process.env.PAYLOAD_DB_PUSH === "true" || process.env.NODE_ENV !== "production"
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
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts")
  }
});
