import Link from "next/link";
import { customerFetch } from "../../../lib/api";
import { getSession } from "../../../lib/session";
import styles from "../../../webclient.module.css";
import shopStyles from "../../../shop.module.css";

type PageProps = {
  params: Promise<{ id: string }>;
};

type BrandPayload = {
  brand?: {
    id?: string;
    name?: string;
    description?: string;
    brandDescription?: string;
    logoUrl?: string;
    city?: string;
    country?: string;
    products?: {
      id: string;
      name: string;
      amount: number;
      images: string[];
    }[];
  };
};

async function loadBrand(id: string) {
  const session = await getSession();
  return customerFetch<BrandPayload>("/v1/catalog/brand-details", {
    accessToken: session?.accessToken,
    personId: session?.personId,
    query: { brandId: id }
  });
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const data = await loadBrand(id).catch(() => null);
  const name = data?.brand?.name || "Brand";
  const description = data?.brand?.description || `${name} on ClothME`;
  return {
    title: name,
    description,
    robots: { index: true, follow: true }
  };
}

export default async function BrandPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadBrand(id).catch(() => null);
  const brand = data?.brand;

  if (!brand) {
    return (
      <section className={styles.pagePad}>
        <h1 className={styles.pageTitle}>Brand</h1>
        <p className={styles.muted}>This brand could not be found.</p>
      </section>
    );
  }

  return (
    <section className={styles.pagePad}>
      <header className={shopStyles.brandMeta} style={{ marginBottom: 16 }}>
        {brand.logoUrl ? <img src={brand.logoUrl} alt="" className={shopStyles.brandLogo} /> : null}
        <div>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>
            {brand.name}
          </h1>
          <p className={styles.muted}>{[brand.city, brand.country].filter(Boolean).join(", ")}</p>
        </div>
      </header>
      {brand.description || brand.brandDescription ? (
        <p className={styles.muted}>{brand.description || brand.brandDescription}</p>
      ) : null}
      {brand.products && brand.products.length > 0 ? (
        <div className={shopStyles.railRow} style={{ padding: "16px 0", flexWrap: "wrap" }}>
          {brand.products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} style={{ width: 140, textDecoration: "none", color: "inherit" }}>
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className={shopStyles.productTile} />
              ) : (
                <div className={shopStyles.productTile} />
              )}
              <p style={{ margin: "8px 0 0", fontSize: 13 }}>{product.name}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
