import { notFound } from "next/navigation";
import { fetchBrandDetail } from "../../../lib/catalog";
import { getSession } from "../../../lib/session";
import { BrandDetailView } from "../../../components/BrandDetailView";
type PageProps = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchBrandDetail(id, await getSession()).catch(() => null);
  const name = data?.brand?.name || "Brand";
  const description = data?.brand?.description || `${name} on ClothME`;
  return {
    title: name,
    description,
    robots: { index: true, follow: true },
  };
}

export default async function BrandPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchBrandDetail(id, await getSession());
  if (!data?.brand) notFound();
  return <BrandDetailView brand={data.brand} />;
}
