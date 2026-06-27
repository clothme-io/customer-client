import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { mapPayloadPostToLegacy } from "../../../../server/webhooks/transform.mjs";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const payload = await getPayload({ config });

    const result = await payload.find({
      collection: "cms-posts",
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: "published" } },
        ],
      },
      limit: 1,
      depth: 1,
    });

    const doc = result.docs[0];
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ post: mapPayloadPostToLegacy(doc) });
  } catch (error) {
    console.error("[api/posts/[slug]]", error.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
