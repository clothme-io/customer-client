import { publicAnalyticsConfig } from "../../../src/lib/analytics/runtime-config.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json(publicAnalyticsConfig(process.env), {
    headers: { "Cache-Control": "no-store" },
  });
}
