import { SizeManualView } from "../../../../components/SizeManualView";

export const metadata = {
  title: "Manual size",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function SizeManualPage() {
  return <SizeManualView />;
}
