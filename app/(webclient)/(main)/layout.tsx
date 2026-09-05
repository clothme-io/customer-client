import { AppShell } from "../components/AppShell";
import { cartCount, fetchCart } from "../lib/commerce";
import { getSession } from "../lib/session";

export default async function MainLayout({
  children,
  modal
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const session = await getSession();
  let count = 0;
  if (session) {
    try {
      count = cartCount(await fetchCart(session));
    } catch {
      count = 0;
    }
  }

  return (
    <AppShell signedIn={Boolean(session)} modal={modal} cartCount={count}>
      {children}
    </AppShell>
  );
}
