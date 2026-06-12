import "@payloadcms/next/css";
import { RootLayout } from "@payloadcms/next/layouts";
import config from "@payload-config";
import { importMap } from "./admin/cms/importMap.js";

export default function PayloadLayout({ children }) {
  return (
    <RootLayout config={config} importMap={importMap}>
      {children}
    </RootLayout>
  );
}
