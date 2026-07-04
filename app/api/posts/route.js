import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { mapPayloadPostToLegacy } from "../../../server/webhooks/transform.mjs";

export async function GET() {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "cms-posts",
      where: { _status: { equals: "published" } },
      sort: "-publishedAt",
      limit: 50,
      depth: 1,
    });

    const posts = result.docs.map(doc => mapPayloadPostToLegacy(doc));
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[api/posts]", error.message);
    return NextResponse.json({ posts: [] }, { status: 500 });
  }
}
