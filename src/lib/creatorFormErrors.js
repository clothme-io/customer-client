/** Extract a user-facing message from a creator application API response. */
export function parseCreatorApplicationError(json, fallback = "Submission failed. Please try again.") {
  if (json?.error?.message && typeof json.error.message === "string") {
    return json.error.message;
  }

  if (Array.isArray(json?.message)) {
    return json.message.join(". ");
  }

  if (typeof json?.message === "string") {
    return json.message;
  }

  return fallback;
}
