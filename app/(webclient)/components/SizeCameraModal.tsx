"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

export function SizeCameraModal({
  pose,
  onClose,
  onCapture
}: {
  pose: "front" | "side";
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function start() {
      setError("");
      try {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1920 } },
          audio: false
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
      } catch {
        setError("Camera permission is needed to take a pose photo.");
      }
    }
    if (!preview) start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [facingMode, preview]);

  function snap() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    setPreview(canvas.toDataURL("image/jpeg", 0.85));
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }

  return (
    <div className={styles.cameraRoot} role="dialog" aria-label={`${pose} pose camera`}>
      {preview ? (
        <>
          <img src={preview} alt="" className={styles.cameraVideo} />
          <div className={styles.cameraBar}>
            <button type="button" className={`${shell.button} ${shell.ghostButton}`} onClick={() => setPreview("")}>
              Retake
            </button>
            <button type="button" className={shell.button} onClick={() => onCapture(preview)}>
              Accept photo
            </button>
          </div>
        </>
      ) : (
        <>
          <video ref={videoRef} className={styles.cameraVideo} playsInline muted autoPlay />
          <div className={styles.silhouette} aria-hidden="true" />
          {error ? <p className={styles.cameraError}>{error}</p> : null}
          <div className={styles.cameraBar}>
            <button type="button" className={`${shell.button} ${shell.ghostButton}`} onClick={onClose}>
              Back
            </button>
            <button type="button" className={styles.shutter} onClick={snap} aria-label="Take photo" />
            <button
              type="button"
              className={`${shell.button} ${shell.ghostButton}`}
              onClick={() => setFacingMode((mode) => (mode === "user" ? "environment" : "user"))}
            >
              Flip
            </button>
          </div>
        </>
      )}
    </div>
  );
}
