import { listPosts } from "../../../server/posts.mjs";
import { dbRequired, errorResponse, json } from "../_utils.mjs";

export async function GET() {
  const unavailable = dbRequired();
  if (unavailable) return unavailable;

  try {
    const posts = await listPosts({ admin: false });
    return json({ posts });
  } catch (error) {
    return errorResponse(error);
  }
}
