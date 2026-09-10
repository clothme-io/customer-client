import { AccountSignInGate } from "../../../components/AccountSignInGate";
import { AccountSubHeader } from "../../../components/AccountSubHeader";
import { OrderListView } from "../../../components/OrderListView";
import { fetchOrders } from "../../../lib/commerce";
import { getSession, isRegistered } from "../../../lib/session";
import styles from "../../../webclient.module.css";

export const metadata = {
  title: "Orders",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session || !isRegistered(session)) return <AccountSignInGate title="Orders" />;

  try {
    const orders = await fetchOrders(session);
    return (
      <section>
        <AccountSubHeader title="Orders" />
        <OrderListView orders={orders} />
      </section>
    );
  } catch (error) {
    return (
      <section>
        <AccountSubHeader title="Orders" />
        <p className={styles.error} style={{ padding: 16 }}>
          {error instanceof Error ? error.message : "Could not load orders"}
        </p>
      </section>
    );
  }
}
