import { notFound } from "next/navigation";
import { getContinuation } from "../../../lib/continuation-store";
import { mobileLink } from "../../../lib/continuation-contract";
import QRCode from "qrcode";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Continue on your phone",
  referrer: "no-referrer",
};
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const intent = await getContinuation(token);
  if (!intent) notFound();
  const url = mobileLink(
    `clothme://continue/${token}`,
    `${process.env.WEBCLIENT_PUBLIC_URL}/continue/${token}`,
    process.env.AIRBRIDGE_WEB_CHANNEL || "",
  );
  return (
    <section style={{ padding: 24 }}>
      <h1>Continue on your phone</h1>
      <p>
        Scan this code with your phone to open ClothME and complete your sizing.
      </p>
      <img
        src={await QRCode.toDataURL(url)}
        width={240}
        height={240}
        alt="Open ClothME on your phone"
      />
      <p>
        <a href={url} rel="noreferrer">
          Open the mobile app
        </a>
      </p>
      <a href={`/product/${encodeURIComponent(intent.productId)}`}>
        Continue shopping here
      </a>
    </section>
  );
}
