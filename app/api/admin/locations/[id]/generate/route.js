import { getPayload } from "payload";
import config from "@payload-config";
import { json, errorResponse } from "../../../../_utils.mjs";

export const dynamic = "force-dynamic";

const CLOTHME_BRAND_CONTEXT = `
ClothME is a digital shopping service that generates precise fashion size profiles from two photos
and matches users with apparel that fits. The platform supports multi-person households by saving
sizes for family members and curating location-aware product feeds aligned with each person's fit,
style, color, fabric, and brand preferences. Currently in pre-launch, it operates a waitlist and
publishes guidance on fit and family shopping.

Key features:
- Two-photo size profiling to estimate apparel sizes for adults and children
- Family profiles that save sizes and preferences for kids, spouses, partners, or other recipients
- Personalized product discovery showing only items matching saved sizes, fits, colors, fabrics, and favored brands
- Location-aware availability to surface products from brands active in the user's city
- Early access waitlist with email notifications for invite distribution
- Editorial blog with Fit Guide, Family Shopping, and Personal Style articles

Differentiators:
- Size prediction from two photos rather than manual size charts or guesswork
- A single place to manage multiple shoppers' sizes, enabling coordinated family purchasing
- Product feeds filtered by verified fit attributes before browsing, not after checkout
- City-level product and brand view to align discovery with local availability
- Focus on organizing world fashion inventory by Size/Fit across brands — a new "Fashion Size Commerce" category

Customer problems solved:
- Brand-to-brand size inconsistency — delivers size-matched recommendations that normalize fit across labels
- Time lost scrolling through mismatched items — provides a pre-filtered feed limited to items aligned with saved profiles
- High return rates from poor fit — reduces mis-sizing by selecting products predicted to fit before purchase
- Managing kids' rapidly changing sizes — centralizes and updates profiles so selectors reflect current growth stages
- Coordinating shopping for multiple people — consolidates needs into one experience, decreasing errors

Conversion goals: get visitors to download the app from the App Store or Google Play, or join the waitlist.
`.trim();

const OUTPUT_SCHEMA = `
Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "hero": {
    "headline": "string — city-specific, includes city name, max 10 words",
    "subheadline": "string — 1-2 sentences expanding on the headline"
  },
  "painPoints": {
    "headline": "string — e.g. 'Sound familiar?'",
    "items": [
      { "title": "string", "description": "string — 1-2 sentences" }
    ]
  },
  "benefits": {
    "headline": "string",
    "items": [
      { "title": "string", "description": "string — 1-2 sentences" }
    ]
  },
  "localShopping": {
    "headline": "string — e.g. 'Shop [city] with confidence'",
    "intro": "string — 1-2 sentences introducing the boutiques section",
    "boutiques": [
      { "name": "string", "neighborhood": "string", "description": "string — 1-2 sentences connecting the boutique to fit-first shopping" }
    ]
  },
  "faq": {
    "headline": "Frequently Asked Questions",
    "items": [
      { "question": "string", "answer": "string — 2-4 sentences" }
    ]
  },
  "aboutPage": {
    "headline": "string",
    "bodyText": "string — 3-4 paragraphs separated by \\n\\n, city-aware, explains ClothME mission and how it serves this city"
  },
  "contactPage": {
    "headline": "string — e.g. 'Get in touch'",
    "subheadline": "string — 1 sentence"
  },
  "seo": {
    "home": { "metaTitle": "string — max 60 chars", "metaDescription": "string — max 160 chars" },
    "about": { "metaTitle": "string — max 60 chars", "metaDescription": "string — max 160 chars" },
    "blog": { "metaTitle": "string — max 60 chars", "metaDescription": "string — max 160 chars" },
    "contact": { "metaTitle": "string — max 60 chars", "metaDescription": "string — max 160 chars" }
  }
}
`.trim();

// ── AI provider helpers ────────────────────────────────────────────────────

async function callAnthropic(systemPrompt, userPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content[0]?.text?.trim() || "";
}

async function callOpenAI(systemPrompt, userPrompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0]?.message?.content?.trim() || "";
}

async function callOpenRouter(systemPrompt, userPrompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://clothme.app",
      "X-Title": "ClothME Admin",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4-5",
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0]?.message?.content?.trim() || "";
}

function callAI(systemPrompt, userPrompt) {
  if (process.env.OPENROUTER_API_KEY) return callOpenRouter(systemPrompt, userPrompt);
  if (process.env.ANTHROPIC_API_KEY) return callAnthropic(systemPrompt, userPrompt);
  if (process.env.OPENAI_API_KEY) return callOpenAI(systemPrompt, userPrompt);
  throw new Error("No AI provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or OPENROUTER_API_KEY in .env");
}

// ── Lexical helpers ────────────────────────────────────────────────────────

function textToLexical(text) {
  const paragraphs = String(text || "")
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) paragraphs.push("");

  return {
    root: {
      children: paragraphs.map((para) => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: para,
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      })),
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

function buildUserPrompt(location) {
  const city = location.name;
  const region = location.region || "";
  const country = location.country || "Canada";
  const boutiquesContext = location.aiGeneration?.boutiquesContext || "";

  return `
Generate all microsite content for ClothME in ${city}${region ? `, ${region}` : ""}, ${country}.

City: ${city}
${region ? `Province/State: ${region}` : ""}
Country: ${country}

Local boutiques context (use these exactly for the localShopping.boutiques array):
${boutiquesContext || "No boutiques provided yet — create 3 placeholder boutique entries appropriate for " + city + "."}

Content rules:
- Every hero headline must naturally include "${city}"
- Pain points should feel relevant to shoppers in ${city}
- FAQ must include at least 2 city-specific questions (e.g. "Is ClothME available in ${city}?", "Which brands does ClothME carry in ${city}?")
- Tone: modern, warm, inclusive, direct — not corporate
- The only CTAs allowed: "Download on the App Store", "Get it on Google Play", "Reserve Your Spot"
- painPoints.items: exactly 4 items
- benefits.items: exactly 5 items
- faq.items: exactly 8 items
- localShopping.boutiques: exactly as many as provided in the context above (max 3)

${OUTPUT_SCHEMA}
`.trim();
}

export async function POST(request, { params }) {
  try {
    const payload = await getPayload({ config });

    const { user } = await payload.auth({ headers: request.headers });
    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
      return json(
        { error: "No AI provider configured. Add ANTHROPIC_API_KEY, OPENAI_API_KEY, or OPENROUTER_API_KEY to your .env file." },
        { status: 500 }
      );
    }

    const location = await payload.findByID({
      collection: "locations",
      id: params.id,
      overrideAccess: true,
    });

    if (!location) {
      return json({ error: "Location not found" }, { status: 404 });
    }

    const systemPrompt = `You are a copywriter generating marketing content for ClothME city microsites. ${CLOTHME_BRAND_CONTEXT}\n\nAlways respond with ONLY a valid JSON object. No markdown fences, no explanation.`;
    const raw = await callAI(systemPrompt, buildUserPrompt(location));

    let generated;
    try {
      generated = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return json(
          { error: "AI returned invalid JSON. Try again.", raw },
          { status: 502 }
        );
      }
      generated = JSON.parse(jsonMatch[0]);
    }

    await payload.update({
      collection: "locations",
      id: params.id,
      overrideAccess: true,
      data: {
        hero: {
          headline: generated.hero?.headline ?? "",
          subheadline: generated.hero?.subheadline ?? "",
        },
        painPoints: {
          headline: generated.painPoints?.headline ?? "Sound familiar?",
          items: (generated.painPoints?.items ?? []).map((item) => ({
            title: item.title ?? "",
            description: item.description ?? "",
          })),
        },
        benefits: {
          headline: generated.benefits?.headline ?? "",
          items: (generated.benefits?.items ?? []).map((item) => ({
            title: item.title ?? "",
            description: item.description ?? "",
          })),
        },
        localShopping: {
          headline: generated.localShopping?.headline ?? "",
          intro: generated.localShopping?.intro ?? "",
          boutiques: (generated.localShopping?.boutiques ?? []).map((b) => ({
            name: b.name ?? "",
            neighborhood: b.neighborhood ?? "",
            description: b.description ?? "",
          })),
        },
        faq: {
          headline: generated.faq?.headline ?? "Frequently Asked Questions",
          items: (generated.faq?.items ?? []).map((item) => ({
            question: item.question ?? "",
            answer: item.answer ?? "",
          })),
        },
        aboutPage: {
          headline: generated.aboutPage?.headline ?? "",
          body: textToLexical(generated.aboutPage?.bodyText ?? ""),
        },
        contactPage: {
          headline: generated.contactPage?.headline ?? "Get in touch",
          subheadline: generated.contactPage?.subheadline ?? "",
        },
        seo: {
          home: {
            metaTitle: generated.seo?.home?.metaTitle ?? "",
            metaDescription: generated.seo?.home?.metaDescription ?? "",
          },
          about: {
            metaTitle: generated.seo?.about?.metaTitle ?? "",
            metaDescription: generated.seo?.about?.metaDescription ?? "",
          },
          blog: {
            metaTitle: generated.seo?.blog?.metaTitle ?? "",
            metaDescription: generated.seo?.blog?.metaDescription ?? "",
          },
          contact: {
            metaTitle: generated.seo?.contact?.metaTitle ?? "",
            metaDescription: generated.seo?.contact?.metaDescription ?? "",
          },
        },
        aiGeneration: {
          boutiquesContext: location.aiGeneration?.boutiquesContext ?? "",
          articleTopics: location.aiGeneration?.articleTopics ?? "",
          lastGeneratedAt: new Date().toISOString(),
        },
      },
    });

    return json({ ok: true, city: location.name }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
