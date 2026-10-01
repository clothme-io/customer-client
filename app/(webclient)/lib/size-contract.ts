/** The public mobile/size-api contract. Keep this module free of browser/server dependencies. */
export type SizeOperation =
  "validate" | "validateResult" | "generate" | "generateResult";
export type SizeReply = {
  status: number;
  state: "processing" | "complete" | "failed";
  taskId?: string;
  predictionId?: string;
  percent: number;
  message: string;
  result?: Record<string, any>;
};

function record(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

export function normalizeSizeReply(
  value: unknown,
  httpStatus: number,
  operation: SizeOperation,
): SizeReply {
  const body = record(value);
  const status =
    httpStatus >= 400 ? httpStatus : Number(body.status || httpStatus);
  const error =
    typeof body.error === "string" ? body.error : body.error?.message;
  const fail = (message: string, code = 502): SizeReply => ({
    status: code,
    state: "failed",
    percent: 0,
    message,
  });
  if (status >= 400 || body.error)
    return fail(
      error || body.message || "Sizing failed. Please try again.",
      status >= 400 ? status : 502,
    );
  const result = record(body.result);
  const percent = Math.max(0, Math.min(100, Number(body.percentage_done) || 0));
  if (operation === "validate" || operation === "generate") {
    if (typeof result.task_id !== "string" || !result.task_id)
      return fail("The sizing service did not return a task ID.");
    return {
      status: 202,
      state: "processing",
      taskId: result.task_id,
      percent,
      message: body.message || "Queued",
    };
  }
  if (status === 202)
    return {
      status: 202,
      state: "processing",
      percent,
      message: body.message || "Processing…",
    };
  if (status !== 200) return fail("Unexpected sizing response.");
  if (operation === "validateResult") {
    if (typeof result.prediction_id !== "string" || !result.prediction_id)
      return fail("Photo validation is incomplete. Please retake the photo.");
    return {
      status: 200,
      state: "complete",
      predictionId: result.prediction_id,
      percent: 100,
      message: "Pose looks good",
    };
  }
  const rich = record(result.result);
  if (
    !Object.keys(record(rich.size_recommendations)).length ||
    !Object.keys(record(rich.measurements)).length
  ) {
    return fail("The sizing service returned incomplete measurements.");
  }
  return {
    status: 200,
    state: "complete",
    taskId: result.task_id,
    percent: 100,
    message: "Measurements calculated",
    result: rich,
  };
}

export function safeInternalPath(value: unknown, fallback = "/shop") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return fallback;
  try {
    const url = new URL(value, "https://clothme.invalid");
    return url.origin === "https://clothme.invalid"
      ? `${url.pathname}${url.search}`
      : fallback;
  } catch {
    return fallback;
  }
}

export function hasSavedSizes(value: unknown): boolean {
  const body = record(value);
  return [body.tops, body.bottoms, body.full].some(
    (rows) =>
      Array.isArray(rows) &&
      rows.some(
        (row) =>
          row?.is_primary === true &&
          typeof row.size_label === "string" &&
          row.size_label.trim(),
      ),
  );
}
