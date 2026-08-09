import { compressImageFile } from "./imageCompress";
import { track } from "./track";

const POLL_MS = 2000;
const POLL_MAX = 45;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll SAM3D validate-result until complete.
 * Returns the prediction Celery task id (required by /sam3d/generate/v2).
 */
async function pollValidation(pose, validateTaskId) {
  for (let i = 0; i < POLL_MAX; i += 1) {
    const res = await fetch(
      `/api/size-tool/validate-result?pose=${encodeURIComponent(pose)}&taskId=${encodeURIComponent(validateTaskId)}`
    );
    const json = await res.json().catch(() => ({}));
    if (res.status === 202 || json.ready === false) {
      await sleep(POLL_MS);
      continue;
    }
    if (!res.ok || json.error) {
      throw new Error(json?.error?.message || "Photo validation failed. Please try again.");
    }
    const predictionId = json.predictionId;
    if (!predictionId) {
      throw new Error("Validation completed but no prediction id was returned. Please try again.");
    }
    return predictionId;
  }
  throw new Error("Sizing is taking too long. Please try again.");
}

async function validatePose(pose, file, heightCm) {
  const body = new FormData();
  body.append("pose", pose);
  body.append("height", String(heightCm));
  body.append("image", file, `${pose}.jpg`);

  const res = await fetch("/api/size-tool/validate", { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 202) {
    throw new Error(json?.error?.message || "Could not upload photos.");
  }
  const taskId = json.taskId;
  if (!taskId) throw new Error("Could not start sizing.");
  return pollValidation(pose, taskId);
}

/**
 * Generate via /sam3d/generate/v2/{frontPredictionId}/{sidePredictionId}.
 * Path IDs must be prediction task ids (with sam3d_photo_b64), not validate task ids.
 */
async function generateSize(frontPredictionId, sidePredictionId, heightCm) {
  for (let i = 0; i < POLL_MAX; i += 1) {
    const res = await fetch("/api/size-tool/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frontPredictionId,
        sidePredictionId,
        height: String(heightCm)
      })
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 202 || json.ready === false) {
      await sleep(POLL_MS);
      continue;
    }
    if (!res.ok || json.error) {
      throw new Error(json?.error?.message || "Could not generate your size.");
    }
    return json.result;
  }
  throw new Error("Size generation timed out. Please try again.");
}

/**
 * Run the Size Tool pipeline. Revokes preview URLs and clears blob refs in finally.
 */
export async function runSizeTool({ frontFile, sideFile, heightCm, frontPreviewUrl, sidePreviewUrl }) {
  track("size_tool_started");

  let frontCompressed = null;
  let sideCompressed = null;

  try {
    frontCompressed = await compressImageFile(frontFile);
    sideCompressed = await compressImageFile(sideFile);

    const frontPredictionId = await validatePose("front", frontCompressed, heightCm);
    const sidePredictionId = await validatePose("side", sideCompressed, heightCm);
    const result = await generateSize(frontPredictionId, sidePredictionId, heightCm);
    track("size_tool_result");
    return result;
  } finally {
    if (frontPreviewUrl) URL.revokeObjectURL(frontPreviewUrl);
    if (sidePreviewUrl) URL.revokeObjectURL(sidePreviewUrl);
    frontCompressed = null;
    sideCompressed = null;
  }
}
