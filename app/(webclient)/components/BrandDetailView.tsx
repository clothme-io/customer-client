import Link from "next/link";
import type { BrandPayload } from "../lib/types";
import styles from "../webclient.module.css";
import shopStyles from "../shop.module.css";
export function BrandDetailView({
  brand,
}: {
  brand: NonNullable<BrandPayload["brand"]>;
}) {
  return (
    <section className={styles.pagePad}>
      <header className={shopStyles.brandMeta} style={{ marginBottom: 16 }}>
        {brand.logoUrl ? (
          <img src={brand.logoUrl} alt="" className={shopStyles.brandLogo} />
        ) : null}
        <div>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>
            {brand.name}
          </h1>
          <p className={styles.muted}>
            {[brand.city, brand.country].filter(Boolean).join(", ")}
          </p>
        </div>
      </header>
      {brand.description || brand.brandDescription ? (
        <p className={styles.muted}>
          {brand.description || brand.brandDescription}
        </p>
      ) : null}
      {brand.products && brand.products.length > 0 ? (
        <div
          className={shopStyles.railRow}
          style={{ padding: "16px 0", flexWrap: "wrap" }}
        >
          {brand.products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              style={{ width: 140, textDecoration: "none", color: "inherit" }}
            >
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className={shopStyles.productTile}
                />
              ) : (
                <div className={shopStyles.productTile} />
              )}
              <p style={{ margin: "8px 0 0", fontSize: 13 }}>{product.name}</p>
              <p>{product.amount}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
