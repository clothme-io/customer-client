import { CUSTOMER_API_URL, PERSON_ID_HEADER, WEBCLIENT_MOCK } from "./config";
import { mockApiResponse } from "./mock";

type Envelope<T> = {
  status?: number;
  error?: { message?: string } | string | null;
  result?: T;
  data?: T;
  accessToken?: string;
  refreshToken?: string;
};

export class CustomerApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function unwrap<T>(body: Envelope<T> | T): T {
  if (
    body &&
    typeof body === "object" &&
    ("result" in body || "data" in body)
  ) {
    const envelope = body as Envelope<T>;
    return (envelope.result ?? envelope.data ?? body) as T;
  }
  return body as T;
}

function errorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;
  const record = body as Envelope<unknown> & { message?: string };
  if (typeof record.error === "string") return record.error;
  if (
    record.error &&
    typeof record.error === "object" &&
    record.error.message
  ) {
    return record.error.message;
  }
  if (typeof record.message === "string" && record.message.trim())
    return record.message;
  return fallback;
}

export function isTooManyRequests(error: unknown) {
  if (error instanceof CustomerApiError) return error.status === 429;
  return error instanceof Error && /too many requests/i.test(error.message);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function customerFetch<T>(
  path: string,
  options: {
    method?: string;
    accessToken?: string;
    personId?: string;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
  } = {},
): Promise<T> {
  if (WEBCLIENT_MOCK) {
    return mockApiResponse(path, options) as T;
  }

  if (!CUSTOMER_API_URL)
    throw new CustomerApiError(
      "Shopping is not configured. Please contact support.",
      503,
    );

  const query = Object.entries(options.query || {})
    .filter(([, value]) => value !== undefined && value !== "")
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  const url = `${CUSTOMER_API_URL}${path.startsWith("/") ? path : `/${path}`}${query ? `?${query}` : ""}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (options.accessToken) {
    const bearer = options.accessToken.startsWith("Bearer ")
      ? options.accessToken
      : `Bearer ${options.accessToken}`;
    headers.Authorization = bearer;
    headers["X-token"] = options.accessToken.replace(/^Bearer\s+/i, "");
  }

  if (options.personId) {
    headers[PERSON_ID_HEADER] = options.personId;
  }

  const init: RequestInit = {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  };

  let lastError: CustomerApiError | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(30_000),
    });

    if (response.status === 204) {
      return null as T;
    }

    const body = (await response.json().catch(() => ({}))) as Envelope<T> & {
      message?: string;
    };
    const status =
      typeof body.status === "number" ? body.status : response.status;
    const limited = response.status === 429 || status === 429;

    if (limited) {
      lastError = new CustomerApiError(
        errorMessage(body, "Too Many Requests"),
        429,
      );
      if (attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const waitMs =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(retryAfter * 1000, 2000)
            : 400 * 2 ** attempt;
        await delay(waitMs);
        continue;
      }
      throw lastError;
    }

    if (!response.ok || status > 209) {
      throw new CustomerApiError(
        errorMessage(body, "Request failed"),
        status || response.status,
      );
    }

    return unwrap<T>(body);
  }

  throw lastError || new CustomerApiError("Request failed", 500);
}
