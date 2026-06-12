import { RootPage, generatePageMetadata } from "@payloadcms/next/views";
import config from "@payload-config";
import { importMap } from "../importMap.js";

export const dynamic = "force-dynamic";

export const generateMetadata = ({ params, searchParams }) =>
  generatePageMetadata({ config, params, searchParams });

export default function PayloadAdminPage({ params, searchParams }) {
  return RootPage({ config, importMap, params, searchParams });
}
