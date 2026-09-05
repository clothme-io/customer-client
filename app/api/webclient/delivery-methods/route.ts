import { NextResponse } from "next/server";
import { fetchDeliveryMethods } from "../../../(webclient)/lib/commerce";
import { requireSession } from "../../../(webclient)/lib/require-session";

export async function GET(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendorId") || "";
  const brandId = searchParams.get("brandId") || "";
  if (!vendorId || !brandId) {
    return NextResponse.json({ message: "vendorId and brandId are required" }, { status: 400 });
  }

  try {
    const methods = await fetchDeliveryMethods(vendorId, brandId);
    return NextResponse.json({ methods });
  } catch {
    return NextResponse.json({ methods: [] });
  }
}
