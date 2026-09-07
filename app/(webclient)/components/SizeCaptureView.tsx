"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SizeCameraModal } from "./SizeCameraModal";
import { SIZE_PHOTOS_KEY, dataUrlToBlob, loadSizeProfile } from "../lib/size-profile";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

type Pose = "front" | "side";
type Validation = "pending" | "success" | "error" | null;

async function pollValidation(type: Pose, id: string) {
  for (let i = 0; i < 30; i += 1) {
    const response = await fetch(`/api/webclient/size?action=validateResult&type=${type}&id=${encodeURIComponent(id)}`);
    const body = await response.json().catch(() => ({}));
    const status = Number(body.status || response.status);
    if (status === 202) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }
    if (status >= 400 || body.error) {
      throw new Error(body.error?.message || body.message || "Pose validation failed");
    }
    return String(body.data?.prediction_id || body.task_id || id);
  }
  throw new Error("Validation timed out");
}

export function SizeCaptureView() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [front, setFront] = useState<string | null>(null);
  const [side, setSide] = useState<string | null>(null);
  const [frontState, setFrontState] = useState<Validation>(null);
  const [sideState, setSideState] = useState<Validation>(null);
  const [frontMsg, setFrontMsg] = useState("Validating pose…");
  const [sideMsg, setSideMsg] = useState("Validating pose…");
  const [frontTask, setFrontTask] = useState("");
  const [sideTask, setSideTask] = useState("");
  const [sourcePose, setSourcePose] = useState<Pose | null>(null);
  const [cameraPose, setCameraPose] = useState<Pose | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const profile = loadSizeProfile();
    if (!profile.dob || !profile.height) {
      router.replace("/account/size/age-height");
    }
  }, [router]);

  async function validate(pose: Pose, dataUrl: string) {
    const profile = loadSizeProfile();
    const form = new FormData();
    form.append("action", pose === "front" ? "validateFront" : "validateSide");
    form.append("image", dataUrlToBlob(dataUrl), "size_image.jpg");
    form.append("type", pose);
    form.append("dob", profile.dob || "1996-01-01");
    form.append("gender", profile.gender || "female");
    form.append("genderDemography", profile.gender || "female");
    form.append("height", profile.height || "170");
    form.append("weight", profile.weight || "");
    form.append("city", profile.city || "");
    form.append("country", profile.country || "Canada");
    form.append("provinceState", profile.provinceState || "");
    if (pose === "front") {
      setFrontState("pending");
      setFrontMsg("Validating pose…");
    } else {
      setSideState("pending");
      setSideMsg("Validating pose…");
    }
    const response = await fetch("/api/webclient/size", { method: "POST", body: form });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || "Could not upload pose");
    const taskId = String(body.task_id || body.taskId || body.data?.task_id || "");
    if (!taskId) throw new Error("Validation did not return a task");
    const predictionId = await pollValidation(pose, taskId);
    if (pose === "front") {
      setFrontTask(predictionId);
      setFrontState("success");
      setFrontMsg("Pose looks good");
    } else {
      setSideTask(predictionId);
      setSideState("success");
      setSideMsg("Pose looks good");
    }
  }

  async function onPhoto(pose: Pose, dataUrl: string) {
    setError("");
    if (pose === "front") setFront(dataUrl);
    else setSide(dataUrl);
    setCameraPose(null);
    setSourcePose(null);
    try {
      await validate(pose, dataUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed, retake pose";
      if (pose === "front") {
        setFrontState("error");
        setFrontMsg(message);
      } else {
        setSideState("error");
        setSideMsg(message);
      }
    }
  }

  function pickFile(pose: Pose) {
    setSourcePose(null);
    setCameraPose(null);
    fileRef.current?.setAttribute("data-pose", pose);
    fileRef.current?.click();
  }

  async function generate() {
    if (frontState !== "success" || sideState !== "success" || !front || !side) return;
    setBusy(true);
    setError("");
    try {
      const profile = loadSizeProfile();
      sessionStorage.setItem(
        SIZE_PHOTOS_KEY,
        JSON.stringify({ front, side, frontTask, sideTask, profile })
      );
      router.push("/account/size/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate sizes");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <p className={shell.muted} style={{ padding: "12px 16px 0" }}>
        Before we can calculate your sizes, we need two photos. Follow every instruction.
      </p>
      <ol className={styles.instructionList}>
        <li>Take 2 photos in the same posture. Full body visible, feet flat, camera level with your waist.</li>
        <li>Wear tight clothes, like sports or yoga wear.</li>
        <li>Tie hair back, away from your neck.</li>
        <li>Stand in front of a plain backdrop.</li>
      </ol>

      <div className={styles.poseRow}>
        {(["front", "side"] as const).map((pose) => {
          const photo = pose === "front" ? front : side;
          const state = pose === "front" ? frontState : sideState;
          const message = pose === "front" ? frontMsg : sideMsg;
          return (
            <button key={pose} type="button" className={styles.poseCard} onClick={() => setSourcePose(pose)}>
              {photo ? <img src={photo} alt="" /> : <div className={styles.posePlaceholder}>{pose === "front" ? "Front" : "Side"}</div>}
              <span>{pose === "front" ? "Front Image" : "Side Image"}</span>
              {state ? (
                <span className={`${styles.poseOverlay} ${state === "success" ? styles.poseOk : state === "error" ? styles.poseErr : ""}`}>
                  {state === "pending" ? message : state === "success" ? "✓" : "Failed, retake pose"}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {error ? <p className={shell.error} style={{ padding: "0 16px" }}>{error}</p> : null}

      <div style={{ padding: 16 }}>
        <button
          type="button"
          className={shell.button}
          style={{ width: "100%" }}
          disabled={busy || frontState !== "success" || sideState !== "success"}
          onClick={generate}
        >
          {busy ? "Starting…" : "Generate Measurement"}
        </button>
        <p className={shell.muted} style={{ marginTop: 16 }}>
          If you already know your sizes,{" "}
          <Link href="/account/size/manual">add them manually</Link>.
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          const pose = (event.currentTarget.getAttribute("data-pose") || "front") as Pose;
          event.currentTarget.value = "";
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onPhoto(pose, String(reader.result || ""));
          reader.readAsDataURL(file);
        }}
      />

      {sourcePose ? (
        <div className={styles.sheetRoot} onClick={() => setSourcePose(null)}>
          <div className={styles.sheet} onClick={(event) => event.stopPropagation()}>
            <p className={styles.sheetTitle}>Select Photo Source</p>
            <button
              type="button"
              className={styles.sheetRow}
              onClick={() => {
                setCameraPose(sourcePose);
                setSourcePose(null);
              }}
            >
              Take Photo
            </button>
            <button type="button" className={styles.sheetRow} onClick={() => pickFile(sourcePose)}>
              Choose from Library
            </button>
            <button type="button" className={styles.sheetRow} onClick={() => setSourcePose(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {cameraPose ? (
        <SizeCameraModal pose={cameraPose} onClose={() => setCameraPose(null)} onCapture={(dataUrl) => onPhoto(cameraPose, dataUrl)} />
      ) : null}
    </section>
  );
}
