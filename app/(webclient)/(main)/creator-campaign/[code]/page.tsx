import { notFound } from "next/navigation";
import { mobileLink } from "../../../lib/continuation-contract";
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(code)) notFound();
  const origin = process.env.WEBCLIENT_PUBLIC_URL;
  const channel = process.env.AIRBRIDGE_WEB_CHANNEL;
  const url =
    origin && channel
      ? mobileLink(
          `clothme://creator-campaign/${code}`,
          `${origin}/creator-campaign/${code}`,
          channel,
        )
      : null;
  return (
    <section style={{ padding: 24 }}>
      <h1>Discover ClothME</h1>
      <p>Continue in the app to join through this creator’s invitation.</p>
      {url ? (
        <a href={url} rel="noreferrer">
          Open ClothME
        </a>
      ) : (
        <p>
          Mobile invitations are temporarily unavailable. Please try again
          later.
        </p>
      )}
      <p>
        <a href="/shop">Browse the shop</a>
      </p>
    </section>
  );
}
