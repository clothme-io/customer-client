import { ModalOverlay } from "../../../../components/ModalOverlay";

export default async function BrandModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <ModalOverlay>
      <div style={{ padding: 24 }}>
        <p>Opening brand {id}…</p>
      </div>
    </ModalOverlay>
  );
}
