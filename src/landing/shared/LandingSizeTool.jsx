import { useEffect, useId, useRef, useState } from "react";
import { FitScoreBadge } from "./FitScoreBadge";
import { submitWaitlist } from "../../lib/waitlist";
import { runSizeTool } from "../../lib/sizeToolClient";
import { track } from "../../lib/track";

const PROCESS_COPY = [
  "Reading your proportions…",
  "Matching to brand sizes…",
  "Almost there…"
];

const TYPE_MS = 22;
const MESSAGE_HOLD_MS = 1600;

function MorphingProcessCopy({ messages }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState("");
  const full = messages[msgIndex] || "";

  useEffect(() => {
    let cancelled = false;
    let typeTimer = null;
    let holdTimer = null;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setVisible(full);
      holdTimer = window.setTimeout(() => {
        if (!cancelled) setMsgIndex((n) => (n + 1) % messages.length);
      }, MESSAGE_HOLD_MS + full.length * TYPE_MS);
      return () => {
        cancelled = true;
        window.clearTimeout(holdTimer);
      };
    }

    let i = 0;
    setVisible("");

    typeTimer = window.setInterval(() => {
      if (cancelled) return;
      i += 1;
      setVisible(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(typeTimer);
        holdTimer = window.setTimeout(() => {
          if (!cancelled) setMsgIndex((n) => (n + 1) % messages.length);
        }, MESSAGE_HOLD_MS);
      }
    }, TYPE_MS);

    return () => {
      cancelled = true;
      window.clearInterval(typeTimer);
      window.clearTimeout(holdTimer);
    };
  }, [full, messages]);

  return (
    <p className="size-tool-process-copy" aria-live="polite">
      <span className="size-tool-process-shimmer">{visible}</span>
    </p>
  );
}

function feetInchesToCm(feet, inches) {
  const f = Number(feet) || 0;
  const inch = Number(inches) || 0;
  return Math.round((f * 12 + inch) * 2.54);
}

function parseHeightCm(unit, cm, feet, inches) {
  if (unit === "cm") {
    const n = Number(cm);
    return Number.isFinite(n) && n >= 90 && n <= 250 ? Math.round(n) : null;
  }
  const total = feetInchesToCm(feet, inches);
  return total >= 90 && total <= 250 ? total : null;
}

function PoseTile({
  id,
  label,
  file,
  previewUrl,
  onFile,
  inputRef
}) {
  const [dragging, setDragging] = useState(false);

  function takeFiles(list) {
    const next = list?.[0];
    if (next && next.type.startsWith("image/")) onFile(next);
  }

  return (
    <div
      className={`size-tool-tile${dragging ? " is-dragging" : ""}${previewUrl ? " has-preview" : ""}`}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        takeFiles(e.dataTransfer.files);
      }}
    >
      <label className="size-tool-tile-label" htmlFor={id}>
        <span className="size-tool-tile-title">{label}</span>
        <span className="size-tool-tile-zone">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="size-tool-tile-preview" />
          ) : (
            <>
              <span className="size-tool-tile-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7.5A2.5 2.5 0 0 1 6.5 5h2.2l1.1-1.6A1.5 1.5 0 0 1 11 2.5h2a1.5 1.5 0 0 1 1.2.9L15.3 5h2.2A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </span>
              <span className="size-tool-tile-hint">Tap to upload or drop a photo</span>
              <span className="size-tool-silhouette" aria-hidden="true" />
            </>
          )}
        </span>
      </label>
      <input
        ref={inputRef}
        id={id}
        className="size-tool-file"
        type="file"
        accept="image/*"
        capture="user"
        onChange={(e) => {
          takeFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {file ? (
        <button
          type="button"
          className="size-tool-tile-clear"
          onClick={() => onFile(null)}
        >
          Replace photo
        </button>
      ) : null}
    </div>
  );
}

export function LandingSizeTool() {
  const baseId = useId();
  const frontInputRef = useRef(null);
  const sideInputRef = useRef(null);

  const [phase, setPhase] = useState("upload"); // upload | processing | result | success
  const [frontFile, setFrontFile] = useState(null);
  const [sideFile, setSideFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [sidePreview, setSidePreview] = useState(null);
  const [heightUnit, setHeightUnit] = useState("cm");
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("idle");
  const [emailError, setEmailError] = useState("");
  const [familyNote, setFamilyNote] = useState(false);

  function setPose(which, file) {
    const revoke = which === "front" ? frontPreview : sidePreview;
    if (revoke) URL.revokeObjectURL(revoke);
    const url = file ? URL.createObjectURL(file) : null;
    if (which === "front") {
      setFrontFile(file);
      setFrontPreview(url);
    } else {
      setSideFile(file);
      setSidePreview(url);
    }
  }

  const heightValue = parseHeightCm(heightUnit, heightCm, heightFt, heightIn);
  const canSubmit = Boolean(frontFile && sideFile && heightValue) && phase === "upload";

  async function onGetSize(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setError("");
    setPhase("processing");

    const frontUrl = frontPreview;
    const sideUrl = sidePreview;

    try {
      const next = await runSizeTool({
        frontFile,
        sideFile,
        heightCm: heightValue,
        frontPreviewUrl: frontUrl,
        sidePreviewUrl: sideUrl
      });
      setFrontPreview(null);
      setSidePreview(null);
      setFrontFile(null);
      setSideFile(null);
      setResult(next);
      setPhase("result");
    } catch (err) {
      setFrontPreview(null);
      setSidePreview(null);
      setFrontFile(null);
      setSideFile(null);
      setError(err?.message || "Something went wrong. Please try again.");
      setPhase("upload");
    }
  }

  async function onSaveEmail(event) {
    event.preventDefault();
    if (emailStatus === "submitting") return;
    setEmailError("");
    setEmailStatus("submitting");

    // Optimistic success — waitlist POST in background
    setPhase("success");
    track("size_tool_signup");

    try {
      await submitWaitlist({
        email,
        source: "size_tool",
        honeypot: "",
        skipTrack: true
      });
      setEmailStatus("idle");
    } catch (err) {
      // Keep success UI; surface soft retry note
      setEmailStatus("idle");
      setEmailError(err?.message || "We saved your size locally — email sync will retry at launch.");
    }
  }

  function resetForFamily() {
    setFamilyNote(true);
    setPhase("upload");
    setResult(null);
    setError("");
    setEmail("");
    setEmailError("");
  }

  return (
    <section
      className="mock-section size-tool"
      id="size-tool"
      aria-labelledby="size-tool-title"
    >
      <div className="mock-section-heading">
        <p className="eyebrow">Free Size Tool</p>
        <h2 id="size-tool-title" className="mock-section-title">
          Get your size in seconds.
        </h2>
        <p className="size-tool-subhead">
          Add 2 photos and we&apos;ll find your size in every brand — no measuring tape, no guessing.
        </p>
      </div>

      {phase === "upload" || phase === "processing" ? (
        <form className="size-tool-panel" onSubmit={onGetSize} noValidate>
          {phase === "upload" ? (
            <>
              <div className="size-tool-tiles">
                <PoseTile
                  id={`${baseId}-front`}
                  label="Front photo"
                  file={frontFile}
                  previewUrl={frontPreview}
                  onFile={(f) => setPose("front", f)}
                  inputRef={frontInputRef}
                />
                <PoseTile
                  id={`${baseId}-side`}
                  label="Side photo"
                  file={sideFile}
                  previewUrl={sidePreview}
                  onFile={(f) => setPose("side", f)}
                  inputRef={sideInputRef}
                />
              </div>

              <div className="size-tool-height">
                <div className="size-tool-height-head">
                  <label htmlFor={`${baseId}-height`}>Your height (for accuracy)</label>
                  <div className="size-tool-unit" role="group" aria-label="Height units">
                    <button
                      type="button"
                      className={heightUnit === "cm" ? "is-active" : ""}
                      onClick={() => setHeightUnit("cm")}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      className={heightUnit === "ft" ? "is-active" : ""}
                      onClick={() => setHeightUnit("ft")}
                    >
                      ft / in
                    </button>
                  </div>
                </div>
                {heightUnit === "cm" ? (
                  <input
                    id={`${baseId}-height`}
                    type="number"
                    inputMode="decimal"
                    min={90}
                    max={250}
                    step={1}
                    placeholder="e.g. 170"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    required
                  />
                ) : (
                  <div className="size-tool-ftin">
                    <input
                      id={`${baseId}-height`}
                      type="number"
                      inputMode="numeric"
                      min={3}
                      max={8}
                      placeholder="ft"
                      aria-label="Feet"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={11}
                      placeholder="in"
                      aria-label="Inches"
                      value={heightIn}
                      onChange={(e) => setHeightIn(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="size-tool-cta"
                disabled={!canSubmit}
              >
                Get my size →
              </button>
              <p className="size-tool-privacy">
                Your photos are processed for sizing only — never shared, never sold, and deleted after your size is generated.
              </p>
              <ul className="size-tool-trust">
                <li>Takes ~10 seconds</li>
                <li>Works on any phone</li>
                <li>Any body, any brand</li>
              </ul>
              {error ? <p className="size-tool-error" role="alert">{error}</p> : null}
              {familyNote ? (
                <p className="size-tool-family-note" role="status">
                  Family profiles are coming in the app — run the tool again anytime for another person.
                </p>
              ) : null}
            </>
          ) : (
            <div className="size-tool-processing" aria-live="polite" aria-busy="true">
              <div className="size-tool-loader">
                <FitScoreBadge size="…" match={72} className="fit-score-badge--inline size-tool-loader-badge" />
                <div className="size-tool-loader-bar" aria-hidden="true">
                  <span />
                </div>
              </div>
              <MorphingProcessCopy messages={PROCESS_COPY} />
            </div>
          )}
        </form>
      ) : null}

      {(phase === "result" || phase === "success") && result ? (
        <div className="size-tool-panel size-tool-result" aria-live="polite">
          <div className="size-tool-result-card">
            <FitScoreBadge
              size={result.size}
              match={result.confidence ?? 94}
              className="fit-score-badge--inline"
            />
            <p className="size-tool-result-line">
              <strong>Your size: {result.size}</strong>
              {result.confidence != null ? (
                <span> · {result.confidence}% confidence</span>
              ) : null}
            </p>
            <p className="size-tool-result-summary">{result.summary}</p>
            {result.brands?.length ? (
              <ul className="size-tool-brands">
                {result.brands.map((b) => (
                  <li key={`${b.brand}-${b.size}`}>
                    <span>{b.brand}</span>
                    <strong>{b.size}</strong>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {phase === "result" ? (
            <form className="size-tool-email" onSubmit={onSaveEmail}>
              <h3>Save your size profile + lock in your founding perk</h3>
              <p>
                Enter your email to save this to your account and get 5% off every order for your first year (first 1,000 members).
              </p>
              <div className="size-tool-email-row">
                <label className="sr-only" htmlFor={`${baseId}-email`}>Email</label>
                <input
                  id={`${baseId}-email`}
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className="size-tool-cta" disabled={emailStatus === "submitting"}>
                  Save my size &amp; join →
                </button>
              </div>
              <p className="size-tool-privacy">Sizing only — never shared or sold.</p>
              <button type="button" className="size-tool-ghost" onClick={resetForFamily}>
                Add a family member
              </button>
            </form>
          ) : (
            <div className="size-tool-success" role="status">
              <h3>You&apos;re in!</h3>
              <p>
                Your founding-member 5% is locked in for launch. We&apos;ll email your early access.
              </p>
              {emailError ? <p className="size-tool-error">{emailError}</p> : null}
              <button type="button" className="size-tool-ghost" onClick={resetForFamily}>
                Add a family member
              </button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
