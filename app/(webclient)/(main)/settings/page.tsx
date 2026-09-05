import { getSession } from "../../lib/session";
import { SettingsForm } from "./settings-form";

export const metadata = {
  title: "Settings",
  robots: { index: false, follow: false }
};

export default async function SettingsPage() {
  const session = await getSession();
  return <SettingsForm signedIn={Boolean(session)} />;
}
