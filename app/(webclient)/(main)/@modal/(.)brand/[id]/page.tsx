import { ModalOverlay } from "../../../../components/ModalOverlay";
import { BrandDetailView } from "../../../../components/BrandDetailView";
import { fetchBrandDetail } from "../../../../lib/catalog";
import { getSession } from "../../../../lib/session";
export default async function BrandModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchBrandDetail(id, await getSession()).catch(() => null);
  return (
    <ModalOverlay>
      {data?.brand ? (
        <BrandDetailView brand={data.brand} />
      ) : (
        <p style={{ padding: 24 }}>
          This storefront is unavailable. Please try again.
        </p>
      )}
    </ModalOverlay>
  );
}
