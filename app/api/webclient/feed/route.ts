import { NextResponse } from "next/server";
import { getSession } from "../../../(webclient)/lib/session";
import { fetchFitProfile } from "../../../(webclient)/lib/fit-profile";
import {
  fetchPublicShopCards,
  fetchShopData,
  shopCards,
} from "../../../(webclient)/lib/catalog";
import { actionError } from "../../../(webclient)/lib/require-session";
export async function GET(request: Request) {
  const page = Number(new URL(request.url).searchParams.get("page") || 1);
  if (!Number.isInteger(page) || page < 1 || page > 10000)
    return NextResponse.json({ message: "Invalid page" }, { status: 400 });
  try {
    const session = await getSession();
    const personalized = session && (await fetchFitProfile(session)).ready;
    const items = personalized
      ? shopCards(await fetchShopData(session!, page))
      : await fetchPublicShopCards(page);
    return NextResponse.json(
      { items, hasMore: items.length >= 20 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return actionError(e);
  }
}
