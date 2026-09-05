import { fetchProductDetail } from "../../../../lib/catalog";
import { getSession } from "../../../../lib/session";
import { ModalOverlay } from "../../../../components/ModalOverlay";
import { ProductDetailView } from "../../../../components/ProductDetailView";

export default async function ProductModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await fetchProductDetail(id, await getSession()).catch(() => null);

  return (
    <ModalOverlay>
      {product ? <ProductDetailView product={product} /> : <p style={{ padding: 24 }}>Product unavailable.</p>}
    </ModalOverlay>
  );
}
