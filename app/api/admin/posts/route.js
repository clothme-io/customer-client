import { listPosts, savePost } from "../../../../server/posts.mjs";
import { dbRequired, errorResponse, json, requireAdminRequest } from "../../_utils.mjs";

export async function GET(request) {
  const unavailable = dbRequired();
  if (unavailable) return unavailable;

  try {
    await requireAdminRequest(request);
    const posts = await listPosts({ admin: true });
    return json({ posts });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request) {
  const unavailable = dbRequired();
  if (unavailable) return unavailable;

  try {
    const admin = await requireAdminRequest(request);
    const post = await savePost(await request.json(), admin.email);
    return json({ post }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
