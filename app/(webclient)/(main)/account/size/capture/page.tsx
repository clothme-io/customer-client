import { SizeCaptureView } from "../../../../components/SizeCaptureView";
import { AccountSubHeader } from "../../../../components/AccountSubHeader";

export const metadata = {
  title: "Add sizes",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function SizeCapturePage() {
  return (
    <section>
      <AccountSubHeader title="Pose photos" backHref="/account/size/age-height" />
      <SizeCaptureView />
    </section>
  );
}
