import { archivePost, getPostById, savePost } from "../../../../../server/posts.mjs";
import { dbRequired, errorResponse, json, requireAdminRequest } from "../../../_utils.mjs";

export async function GET(request, { params }) {
  const unavailable = dbRequired();
  if (unavailable) return unavailable;

  try {
    const { id } = await params;
    await requireAdminRequest(request);
    const post = await getPostById(id);
    if (!post) return json({ error: "Post not found" }, { status: 404 });
    return json({ post });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request, { params }) {
  const unavailable = dbRequired();
  if (unavailable) return unavailable;

  try {
    const { id } = await params;
    const admin = await requireAdminRequest(request);
    const post = await savePost({ ...(await request.json()), id }, admin.email);
    return json({ post });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request, { params }) {
  const unavailable = dbRequired();
  if (unavailable) return unavailable;

  try {
    const { id } = await params;
    const admin = await requireAdminRequest(request);
    await archivePost(id, admin.email);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
