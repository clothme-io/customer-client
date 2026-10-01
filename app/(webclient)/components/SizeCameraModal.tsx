"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

export function SizeCameraModal({
  pose,
  onClose,
  onCapture,
}: {
  pose: "front" | "side";
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [delay, setDelay] = useState(10);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function start() {
      setError("");
      setReady(false);
      setCountdown(null);
      try {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("UNSUPPORTED");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 1920 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        setError(
          name === "NotAllowedError"
            ? "Camera access was denied. Allow camera access in your browser settings, or go back and upload a photo."
            : name === "NotFoundError"
              ? "No camera was found. Go back and upload a photo from another device."
              : name === "NotReadableError"
                ? "The camera is busy. Close other apps using it and try again."
                : "This browser could not open the camera. Open this page in Safari or Chrome, or go back and upload a photo.",
        );
      }
    }
    if (!preview) start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [facingMode, preview]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      snap();
      return;
    }
    const timer = setTimeout(
      () => setCountdown((value) => (value === null ? null : value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [countdown]);

  function snap() {
    const video = videoRef.current;
    if (!video || !ready || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setPreview(canvas.toDataURL("image/jpeg", 0.85));
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }

  return (
    <div
      className={styles.cameraRoot}
      role="dialog"
      aria-label={`${pose} pose camera`}
    >
      {preview ? (
        <>
          <img src={preview} alt="" className={styles.cameraVideo} />
          <div className={styles.cameraBar}>
            <button
              type="button"
              className={`${shell.button} ${shell.ghostButton}`}
              onClick={() => setPreview("")}
            >
              Retake
            </button>
            <button
              type="button"
              className={shell.button}
              onClick={() => onCapture(preview)}
            >
              Accept photo
            </button>
          </div>
        </>
      ) : (
        <>
          <video
            ref={videoRef}
            className={styles.cameraVideo}
            playsInline
            muted
            autoPlay
            onLoadedData={() => setReady(true)}
          />
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              right: 16,
              color: "white",
              textAlign: "center",
              background: "#0009",
              padding: 12,
            }}
          >
            <p>
              {pose === "front" ? "Face the camera" : "Turn sideways"}. Keep
              your full body and feet visible.
            </p>
            <label>
              Timer{" "}
              <select
                value={delay}
                onChange={(event) => setDelay(Number(event.target.value))}
                disabled={countdown !== null}
              >
                <option value={0}>Off</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
              </select>
            </label>
            {countdown !== null ? (
              <p role="status" aria-live="polite" style={{ fontSize: 48 }}>
                {countdown}
              </p>
            ) : null}
          </div>
          <div className={styles.silhouette} aria-hidden="true" />
          {error ? <p className={styles.cameraError}>{error}</p> : null}
          <div className={styles.cameraBar}>
            <button
              type="button"
              className={`${shell.button} ${shell.ghostButton}`}
              onClick={onClose}
            >
              Back
            </button>
            <button
              type="button"
              className={styles.shutter}
              disabled={!ready || !!error}
              onClick={() =>
                countdown !== null
                  ? setCountdown(null)
                  : delay
                    ? setCountdown(delay)
                    : snap()
              }
              aria-label={countdown !== null ? "Cancel timer" : "Take photo"}
            />
            <button
              type="button"
              className={`${shell.button} ${shell.ghostButton}`}
              disabled={countdown !== null}
              onClick={() =>
                setFacingMode((mode) =>
                  mode === "user" ? "environment" : "user",
                )
              }
            >
              Flip
            </button>
          </div>
        </>
      )}
    </div>
  );
}
