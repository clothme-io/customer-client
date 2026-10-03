import {
  submitSizeTool,
  readSizeTool,
} from "../../../../src/lib/sizeToolProxy";
export const runtime = "nodejs";
export async function POST(request) {
  return submitSizeTool(request, true);
}
export async function GET(request) {
  return readSizeTool(request, true);
}
