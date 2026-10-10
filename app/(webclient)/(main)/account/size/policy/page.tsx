import { SizePolicyView } from "../../../../components/SizePolicyView";

export const metadata = {
  title: "Size policy",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function SizePolicyPage() {
  return <SizePolicyView />;
}
