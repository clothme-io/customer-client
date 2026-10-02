// Dependency injection lets contract tests exercise the exact browser orchestration.
export function createSizeToolRunner({
  fetcher,
  compress,
  track = () => {},
  pause = (ms) => new Promise((r) => setTimeout(r, ms)),
  maxPolls = 150,
}) {
  async function request(url, options) {
    const response = await fetcher(url, options);
    const body = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        body.message ||
          body.error?.message ||
          "Sizing failed. Please try again.",
      );
    return body;
  }
  async function poll(url) {
    for (let i = 0; i < maxPolls; i++) {
      const body = await request(url);
      if (body.state === "complete") return body;
      if (body.state !== "processing")
        throw new Error(body.message || "Sizing failed.");
      await pause(2000);
    }
    throw new Error(
      "Sizing is taking longer than expected. Try again to check the same job.",
    );
  }
  return async function run({
    frontFile,
    sideFile,
    heightCm,
    profile,
    progress = {},
  }) {
    await request("/api/webclient/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "guest" }),
    });
    const session = await request("/api/webclient/session");
    if (!session.authenticated)
      throw new Error("Could not start your shopping session.");
    const identity = `${session.accountId}:${session.personId}`;
    if (progress.identity && progress.identity !== identity)
      throw new Error(
        "Your selected profile changed. Replace the photos before starting again.",
      );
    progress.identity = identity;
    if (progress.submitting)
      throw new Error(
        "The previous submission may still be processing. Please check your account before starting another scan.",
      );
    if (!progress.taskId) {
      track("size_tool_started");
      const front = await compress(frontFile),
        side = await compress(sideFile);
      function form() {
        const body = new FormData();
        for (const [key, value] of Object.entries(profile))
          body.set(key, String(value || ""));
        body.set("height", String(heightCm));
        body.set("genderDemography", profile.gender);
        return body;
      }
      async function validate(pose, file) {
        const body = form();
        body.set("pose", pose);
        body.set("image", file, `${pose}.jpg`);
        const queued = await request("/api/size-tool/validate", {
          method: "POST",
          body,
        });
        if (!queued.taskId)
          throw new Error("Photo validation did not return a task ID.");
        const result = await poll(
          `/api/size-tool/validate-result?pose=${pose}&taskId=${encodeURIComponent(queued.taskId)}`,
        );
        if (!result.predictionId)
          throw new Error("Photo validation did not return a prediction ID.");
        return result.predictionId;
      }
      const frontId = await validate("front", front),
        sideId = await validate("side", side);
      const body = form();
      body.set("frontTaskId", frontId);
      body.set("sideTaskId", sideId);
      body.set("frontImage", front, "front.jpg");
      body.set("sideImage", side, "side.jpg");
      progress.submitting = true;
      const response = await fetcher("/api/size-tool/generate", {
        method: "POST",
        body,
      });
      const queued = await response.json().catch(() => ({}));
      if (!response.ok || !queued.taskId) {
        if (response.status >= 400 && response.status < 500)
          progress.submitting = false;
        throw new Error(
          queued.message ||
            "Could not start sizing. Please check your account before submitting again.",
        );
      }
      progress.taskId = queued.taskId;
      progress.submitting = false;
    }
    const result = await poll(
      `/api/size-tool/generate?taskId=${encodeURIComponent(progress.taskId)}`,
    );
    track("size_tool_result");
    return result.result;
  };
}
