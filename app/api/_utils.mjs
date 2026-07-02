import { NextResponse } from "next/server";

export function json(data, init = {}) {
  return NextResponse.json(data, init);
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
