import { getSession } from "../../lib/session";
import { fetchSupportMessages } from "../../lib/commerce";
import type { SupportMessage } from "../../lib/types";
import { InboxView } from "../../components/InboxView";

export const metadata = {
  title: "Inbox",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await getSession();

  if (!session) {
    return <InboxView messages={[]} signedIn />;
  }

  let messages: SupportMessage[] = [];
  try {
    const result = await fetchSupportMessages(session);
    messages = Array.isArray(result) ? result : [];
  } catch {
    messages = [];
  }

  return <InboxView messages={Array.isArray(messages) ? messages : []} signedIn />;
}
