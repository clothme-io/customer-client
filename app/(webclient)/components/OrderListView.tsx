"use client";

import { useMemo, useState } from "react";
import type { OrderListItem } from "../lib/types";
import { AccountEmpty } from "./AccountEmpty";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

const TABS = ["Pending", "Delivered", "Refunded"] as const;

function ordersForTab(orders: OrderListItem[], tab: (typeof TABS)[number]) {
  if (tab === "Pending") {
    return orders.filter((item) => item.orderState && item.orderStateText === "Pending");
  }
  if (tab === "Delivered") {
    return orders.filter((item) => item.orderState && item.orderStateText === "Delivered");
  }
  return orders.filter((item) => item.orderStateText === "Refunded");
}

export function OrderListView({ orders }: { orders: OrderListItem[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Pending");
  const active = useMemo(() => ordersForTab(orders, tab), [orders, tab]);

  return (
    <>
      <div className={styles.tabs}>
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            className={`${styles.tab} ${tab === name ? styles.tabActive : ""}`}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      {active.length === 0 ? (
        <AccountEmpty message="No orders here yet." icon="receipt" />
      ) : (
        active.map((order) => (
          <article key={order.orderId} className={styles.listRow}>
            {order.orderedProductAvatar ? (
              <img src={order.orderedProductAvatar} alt="" className={styles.listThumbProduct} />
            ) : (
              <div className={styles.listThumbProduct} />
            )}
            <div className={styles.listBody}>
              <p className={styles.listTitle}>{order.orderedProductName}</p>
              <p className={shell.muted} style={{ margin: "2px 0 0", fontSize: 15 }}>
                {order.orderedDate.split("T")[0]}
              </p>
              <p className={styles.listDesc} style={{ marginTop: 16 }}>
                {order.orderStateText}
              </p>
            </div>
          </article>
        ))
      )}
    </>
  );
}
