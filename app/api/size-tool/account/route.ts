import { NextResponse } from "next/server";
import { customerFetch, CustomerApiError } from "../../../(webclient)/lib/api";
import { WEBCLIENT_MOCK } from "../../../(webclient)/lib/config";
import { fetchGeneratedSizeProfile } from "../../../(webclient)/lib/fit-profile";
import { getSession, setSession } from "../../../(webclient)/lib/session";

export const runtime = "nodejs";

type AuthReply = {
  accessToken: string;
  refreshToken: string;
  account: { id: string };
  person: { id: string };
};

export async function POST(request: Request) {
  if (WEBCLIENT_MOCK) {
    return NextResponse.json({ message: "Account saving requires the live services." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const firstName = String(body.firstName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const city = String(body.city || "").trim();
  const region = String(body.region || "").trim();
  const country = String(body.country || "").trim();
  const gender = String(body.gender || "").toUpperCase();
  if (!firstName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || !city || !region || !/^[A-Za-z]{2}$/.test(country) || !["MALE", "FEMALE"].includes(gender)) {
    return NextResponse.json({ message: "Enter your first name, city, region, two-letter country code, email, and a password of at least 8 characters." }, { status: 400 });
  }

  let session = await getSession();
  if (!session) return NextResponse.json({ message: "Your sizing session expired. Please sign in or try again." }, { status: 401 });

  try {
    const saved = await fetchGeneratedSizeProfile(session);
    if (!saved.ready) return NextResponse.json({ message: "Your size is still being saved. Please try again in a moment." }, { status: 409 });

    if (session.authLevel === "guest") {
      const auth = await customerFetch<AuthReply>("/v1/auth/email/signup", {
        method: "POST",
        accessToken: session.accessToken,
        body: {
          accountId: session.accountId,
          linkExistingGuest: true,
          email,
          password,
          firstName,
          registrationSource: "website_size_tool",
        },
      });
      if (auth.account?.id !== session.accountId || auth.person?.id !== session.personId) {
        throw new Error("Account creation returned a different size profile. Please contact support.");
      }
      session = {
        ...session,
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        authLevel: "registered",
        email,
      };
      await setSession(session);
    } else if (session.email.toLowerCase() !== email) {
      return NextResponse.json({ message: "Please use the email on your signed-in account." }, { status: 409 });
    }

    await customerFetch(`/v1/customer/persons/${session.personId}`, {
      method: "PATCH",
      accessToken: session.accessToken,
      personId: session.personId,
      body: { firstName, lastName: "", gender },
    });
    const addresses = await customerFetch<{ items?: Array<{ city?: string; provinceState?: string; country?: string }> }>(
      `/v1/customer/persons/${session.personId}/addresses`,
      { accessToken: session.accessToken, personId: session.personId },
    );
    const existing = addresses.items?.some((address) =>
      address.city?.toLowerCase() === city.toLowerCase() &&
      address.provinceState?.toLowerCase() === region.toLowerCase(),
    );
    if (!existing) {
      await customerFetch(`/v1/customer/persons/${session.personId}/addresses`, {
        method: "POST",
        accessToken: session.accessToken,
        personId: session.personId,
        body: {
          city,
          provinceState: region,
          country,
          latitude: "0",
          longitude: "0",
          isPrimary: true,
        },
      });
    }
    if (!(await fetchGeneratedSizeProfile(session)).ready) throw new Error("Your account was created, but we could not confirm its saved size. Please try again.");
    return NextResponse.json({ ok: true, email, accountId: session.accountId, personId: session.personId });
  } catch (error) {
    const status = error instanceof CustomerApiError ? error.status : 500;
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not save your account." }, { status });
  }
}
