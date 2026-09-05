import { fetchProductDetail } from "../../../lib/catalog";
import { getGeoHint, pickClosestLocation } from "../../../lib/geo";
import { getSession } from "../../../lib/session";
import { ProductDetailView } from "../../../components/ProductDetailView";
import styles from "../../../webclient.module.css";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const product = await fetchProductDetail(id, await getSession());
    const name = product?.name || "Product";
    const brand = product?.brand?.name;
    const description = product?.description || `${name} on ClothME`;
    return {
      title: brand ? `${name} · ${brand}` : name,
      description,
      robots: { index: true, follow: true },
      openGraph: {
        title: name,
        description,
        images: product?.images?.[0] ? [product.images[0]] : undefined
      }
    };
  } catch {
    return { title: "Product", robots: { index: true, follow: true } };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();
  const geo = await getGeoHint();

  try {
    const product = await fetchProductDetail(id, session);
    if (!product) {
      return (
        <section className={styles.pagePad}>
          <h1 className={styles.pageTitle}>Product</h1>
          <p className={styles.muted}>This product could not be found.</p>
        </section>
      );
    }

    const closest = pickClosestLocation(product.variantLocations || [], geo);
    if (closest && product.variantLocations) {
      product.variantLocations = [
        closest,
        ...product.variantLocations.filter((item) => item.id !== closest.id)
      ];
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.images,
      brand: product.brand?.name ? { "@type": "Brand", name: product.brand.name } : undefined
    };

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <ProductDetailView product={product} />
      </>
    );
  } catch {
    return (
      <section className={styles.pagePad}>
        <h1 className={styles.pageTitle}>Product</h1>
        <p className={styles.muted}>This product could not be loaded.</p>
      </section>
    );
  }
}
