"use client";
let refreshing: Promise<boolean> | undefined;

/** Only retry requests rejected for authentication; never retry ambiguous mutations. */
export async function sessionFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (
    response.status !== 401 ||
    (String(input).includes("/api/webclient/session") &&
      init?.method === "POST")
  )
    return response;
  refreshing ??= fetch("/api/webclient/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "refresh" }),
  })
    .then((r) => r.ok)
    .finally(() => {
      refreshing = undefined;
    });
  if (!(await refreshing)) return response;
  return fetch(input, init);
}
