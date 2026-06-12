import { getPostBySlug } from "../../../../server/posts.mjs";
import { dbRequired, errorResponse, json } from "../../_utils.mjs";

export async function GET(request, { params }) {
  const unavailable = dbRequired();
  if (unavailable) return unavailable;

  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const post = await getPostBySlug(slug, { previewToken: url.searchParams.get("previewToken") || "" });

    if (!post) {
      return json({ error: "Post not found" }, { status: 404 });
    }

    return json({ post });
  } catch (error) {
    return errorResponse(error);
  }
}
