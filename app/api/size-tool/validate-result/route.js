import { readSizeTool } from "../../../../src/lib/sizeToolProxy";
export const runtime = "nodejs";
export async function GET(request) {
  return readSizeTool(request);
}
