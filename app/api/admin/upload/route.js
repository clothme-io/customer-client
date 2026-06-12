import { uploadToBunny } from "../../../../server/bunny.mjs";
import { errorResponse, json, requireAdminRequest } from "../../_utils.mjs";

export async function POST(request) {
  try {
    await requireAdminRequest(request);
    const data = await request.formData();
    const image = data.get("image");

    if (!image || typeof image.arrayBuffer !== "function") {
      return json({ error: "Image file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const url = await uploadToBunny({
      buffer,
      originalname: image.name || "blog-image.jpg",
      mimetype: image.type || "application/octet-stream"
    });

    return json({ url }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
