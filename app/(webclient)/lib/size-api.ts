import { SIZE_API_TOKEN, SIZE_API_URL, WEBCLIENT_MOCK } from "./config";
import type { WebClientSession } from "./session";

export function sizeApiHeaders(session: WebClientSession) {
  return {
    Authorization: session.accessToken.startsWith("Bearer ")
      ? session.accessToken
      : `Bearer ${session.accessToken}`,
    "X-token": SIZE_API_TOKEN,
    "X-Account-Id": session.accountId,
    "X-Person-Id": session.personId,
    Accept: "application/json"
  };
}

export async function sizeApiFetch(path: string, session: WebClientSession, init: RequestInit = {}) {
  const url = `${SIZE_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    ...sizeApiHeaders(session),
    ...(init.headers || {})
  };
  return fetch(url, { ...init, headers, cache: "no-store" });
}

export function mockSizeResponse(path: string, method: string) {
  if (method === "POST" && path.includes("validate")) {
    return { status: 200, task_id: path.includes("side") ? "mock-side-task" : "mock-front-task" };
  }
  if (path.includes("validate") && path.includes("result")) {
    return {
      status: 200,
      percentage_done: 100,
      message: "Pose looks good",
      data: { prediction_id: path.includes("side") ? "mock-side-pred" : "mock-front-pred" }
    };
  }
  if (method === "POST" && path.includes("generate")) {
    return { status: 200, task_id: "mock-generate-task" };
  }
  if (path.includes("generate")) {
    return {
      status: 200,
      percentage_done: 100,
      message: "Done",
      data: {
        result: {
          size_recommendations: {
            US_CAD: {
              tops: {
                fitted: { size: "S" },
                regular: { size: "M" },
                relaxed: { size: "L" },
                oversized: { size: "XL" }
              },
              bottoms: {
                fitted: { size: "6" },
                regular: { size: "8" },
                relaxed: { size: "10" },
                oversized: { size: "12" }
              }
            },
            EU: {
              tops: { regular: { size: "38" } },
              bottoms: { regular: { size: "38" } }
            }
          },
          measurements: {
            "chest/bust": { cm: 88, in: 34.6, confidence: 0.9 },
            waist: { cm: 68, in: 26.8, confidence: 0.92 },
            hips: { cm: 96, in: 37.8, confidence: 0.91 },
            inseam: { cm: 78, in: 30.7, confidence: 0.8 }
          },
          body_profile: {
            shape: "Hourglass",
            shape_label: "Hourglass",
            description: "Balanced shoulders and hips with a defined waist."
          },
          insights: {
            body_type_analysis: {
              body_type: "Hourglass",
              fit_recommendations: "Fitted or regular tops and bottoms will follow your proportions."
            }
          },
          quality: { overall_score: 86 }
        }
      }
    };
  }
  return { ok: true };
}

export function sizeMockEnabled() {
  return WEBCLIENT_MOCK;
}
