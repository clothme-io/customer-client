import { getPostById, savePost } from "../../../../../../server/posts.mjs";
import { dbRequired, errorResponse, json, requireAdminRequest } from "../../../../_utils.mjs";

export async function POST(request, { params }) {
  const unavailable = dbRequired();
  if (unavailable) return unavailable;

  try {
    const { id } = await params;
    const admin = await requireAdminRequest(request);
    const existing = await getPostById(id);
    if (!existing) return json({ error: "Post not found" }, { status: 404 });
    const body = await request.json();
    const post = await savePost({ ...existing, status: "scheduled", scheduledFor: body.scheduledFor }, admin.email);
    return json({ post });
  } catch (error) {
    return errorResponse(error);
  }
}
