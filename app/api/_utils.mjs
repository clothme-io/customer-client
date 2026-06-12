import { NextResponse } from "next/server";
import { hasDatabase } from "../../server/db.mjs";
import { getAdminFromAuthorization } from "../../server/auth.mjs";

export function json(data, init = {}) {
  return NextResponse.json(data, init);
}

export function dbRequired() {
  if (!hasDatabase()) {
    return json(
      {
        error: "Database not configured",
        message: "Set DATABASE_URL to connect Railway Postgres."
      },
      { status: 503 }
    );
  }
  return null;
}

export async function requireAdminRequest(request) {
  return getAdminFromAuthorization(request.headers.get("authorization") || "");
}

export function errorResponse(error) {
  console.error(error);
  return json(
    {
      error: error.code || error.message || "Request failed",
      message: error.message || "Request failed"
    },
    { status: error.status || 500 }
  );
}
