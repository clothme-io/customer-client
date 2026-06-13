import "@payloadcms/next/css";
import { RootLayout, handleServerFunctions } from "@payloadcms/next/layouts";
import config from "@payload-config";
import { importMap } from "./admin/cms/importMap.js";

async function serverFunction(args) {
  "use server";

  return handleServerFunctions({
    ...args,
    config,
    importMap
  });
}

export default function PayloadLayout({ children }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
