import { readFileSync } from "fs";
import path from "path";

export const dynamic = "force-static";
export const contentType = "image/png";

export default function Icon() {
  const file = readFileSync(path.join(process.cwd(), "public", "icon.png"));
  return new Response(file, { headers: { "Content-Type": "image/png" } });
}
