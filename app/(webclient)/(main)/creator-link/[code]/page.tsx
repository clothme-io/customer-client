import { notFound } from "next/navigation";
import { ReferralLanding } from "../../../components/ReferralLanding";
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  if (!/^[A-Za-z0-9_-]{43}$/.test((await params).code)) notFound();
  return <ReferralLanding />;
}
