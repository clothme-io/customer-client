import { submitSizeTool } from "../../../../src/lib/sizeToolProxy";
export const runtime = "nodejs";
export async function POST(request) {
  return submitSizeTool(request);
}
