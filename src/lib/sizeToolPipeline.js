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
    if (!response.ok) {
      const error = new Error(
        body.message ||
          body.error?.message ||
          "Sizing failed. Please try again.",
      );
      error.status = response.status;
      throw error;
    }
    return body;
  }
  async function poll(url, onUpdate = () => {}) {
    let temporaryFailures = 0;
    for (let i = 0; i < maxPolls; i++) {
      let body;
      try {
        body = await request(url);
        temporaryFailures = 0;
      } catch (error) {
        if (![429, 502, 503, 504].includes(error.status) || ++temporaryFailures >= 5) throw error;
        onUpdate({ state: "processing", message: "Still working. Reconnecting to the sizing service…" });
        await pause(2000);
        continue;
      }
      onUpdate(body);
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
    onProgress = () => {},
  }) {
    const started = Date.now();
    let stage = "session";
    try {
      onProgress({ stage: "session", message: "Preparing your fit profile…" });
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
          stage = "validation";
          onProgress({ stage: pose, message: `Checking your ${pose} photo…`, percent: 0 });
          track("size_validation_started", { pose });
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
            (update) => onProgress({ stage: pose, percent: update.percent, message: update.message }),
          );
          if (!result.predictionId)
            throw new Error("Photo validation did not return a prediction ID.");
          track("size_validation_succeeded", { pose });
          return result.predictionId;
        }
        const frontId = await validate("front", front),
          sideId = await validate("side", side);
        const body = form();
        body.set("frontTaskId", frontId);
        body.set("sideTaskId", sideId);
        body.set("frontImage", front, "front.jpg");
        body.set("sideImage", side, "side.jpg");
        stage = "generation";
        onProgress({ stage: "generation", message: "Calculating your measurements…", percent: 0 });
        track("size_generation_started");
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
      onProgress({ stage: "generation", message: "Calculating your measurements…", percent: 0 });
      const result = await poll(
        `/api/size-tool/generate?taskId=${encodeURIComponent(progress.taskId)}`,
        (update) => onProgress({ stage: "generation", percent: update.percent, message: update.message }),
      );
      track("size_tool_result", {
        duration_ms: Date.now() - started,
        eventId: `size:${progress.taskId}`,
      });
      return { ...result.result, taskId: progress.taskId };
    } catch (error) {
      track("size_tool_failed", { stage, duration_ms: Date.now() - started });
      throw error;
    }
  };
}
