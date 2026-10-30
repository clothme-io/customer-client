import { useEffect, useId, useRef, useState } from "react";
import { submitWaitlist } from "../../lib/waitlist";
import { runSizeTool } from "../../lib/sizeToolClient";
import { sizeToolProfileFromAge } from "../../lib/sizeToolProfile";
import { track } from "../../lib/track";

const PROCESS_COPY = [
  "Reading your proportions…",
  "Calculating clothing sizes…",
  "Almost there…",
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
      holdTimer = window.setTimeout(
        () => {
          if (!cancelled) setMsgIndex((n) => (n + 1) % messages.length);
        },
        MESSAGE_HOLD_MS + full.length * TYPE_MS,
      );
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

function PoseTile({ id, label, file, previewUrl, onFile, inputRef }) {
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
                  <circle
                    cx="12"
                    cy="12"
                    r="3.2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </span>
              <span className="size-tool-tile-hint">
                Tap to upload or drop a photo
              </span>
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

export function LandingSizeTool({ accountHandoff = false }) {
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
  const [firstName, setFirstName] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [sizeReady, setSizeReady] = useState(false);
  const [sizeCheckRetry, setSizeCheckRetry] = useState(0);
  const [sizeCheckTimedOut, setSizeCheckTimedOut] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [deliveryFailed, setDeliveryFailed] = useState(false);
  const [emailStatus, setEmailStatus] = useState("idle");
  const [emailError, setEmailError] = useState("");
  const [profile, setProfile] = useState({
    age: "",
    gender: "",
  });
  const progress = useRef({});
  const submitting = useRef(false);
  useEffect(
    () => () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
    },
    [frontPreview],
  );
  useEffect(
    () => () => {
      if (sidePreview) URL.revokeObjectURL(sidePreview);
    },
    [sidePreview],
  );
  useEffect(() => {
    if (!accountHandoff || phase !== "result" || sizeReady) return;
    let cancelled = false;
    let timer;
    let attempts = 0;
    const check = async () => {
      try {
        const response = await fetch("/api/size-tool/saved", { cache: "no-store" });
        if (!response.ok) throw new Error("Saved size check failed");
        const data = await response.json();
        if (!cancelled && data.ready) {
          setSizeReady(true);
          return;
        }
      } catch { /* Keep the result visible while the save is checked again. */ }
      if (!cancelled && ++attempts < 30) timer = window.setTimeout(check, 2000);
      else if (!cancelled) setSizeCheckTimedOut(true);
    };
    void check();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [accountHandoff, phase, sizeReady, sizeCheckRetry]);
  useEffect(() => {
    if (!accountHandoff || !modalOpen) return;
    const previous = document.body.style.overflow;
    const onKeyDown = (event) => { if (event.key === "Escape") setModalOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [accountHandoff, modalOpen]);
  function updateProfile(key, value) {
    progress.current = {};
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function setPose(which, file) {
    progress.current = {};
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
  const canSubmit =
    Boolean(
      frontFile &&
      sideFile &&
      heightValue &&
      profile.age !== "" &&
      Number.isInteger(Number(profile.age)) &&
      Number(profile.age) >= 1 &&
      Number(profile.age) <= 120 &&
      profile.gender,
    ) && phase === "upload";

  async function onGetSize(event) {
    event.preventDefault();
    if (!canSubmit || submitting.current) return;
    submitting.current = true;
    setError("");
    setPhase("processing");

    try {
      const next = await runSizeTool({
        frontFile,
        sideFile,
        heightCm: heightValue,
        profile: sizeToolProfileFromAge(profile),
        progress: progress.current,
      });
      setFrontPreview(null);
      setSidePreview(null);
      setFrontFile(null);
      setSideFile(null);
      setResult(next);
      setSizeReady(false);
      setSizeCheckTimedOut(false);
      setModalOpen(accountHandoff);
      setPhase("result");
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setPhase("upload");
    } finally {
      submitting.current = false;
    }
  }

  async function onSaveAccount(event) {
    event.preventDefault();
    if (saveStatus === "submitting" || !sizeReady) return;
    setSaveError("");
    setSaveStatus("submitting");
    try {
      const response = await fetch("/api/size-tool/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, city, region, country, email, password, gender: profile.gender }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not save your account.");
      setPassword("");
      setPhase("success");
      setSaveStatus("saved");
      track("size_tool_signup");
      await sendDownloadLink();
    } catch (err) {
      setSaveStatus("idle");
      setSaveError(err?.message || "Could not save your account. Please try again.");
    }
  }

  async function sendDownloadLink() {
    setDeliveryStatus("Sending your app download link…");
    setDeliveryFailed(false);
    try {
      const download = await fetch("/api/app-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, requestId: crypto.randomUUID(), savedSize: true }),
      });
      if (!download.ok) throw new Error("Email delivery unavailable");
      setDeliveryStatus("We sent your app download link. Sign in with this email and password in the app.");
    } catch {
      setDeliveryStatus("Your size is saved. We couldn’t send the app link yet.");
      setDeliveryFailed(true);
    }
  }

  async function onSaveEmail(event) {
    event.preventDefault();
    if (emailStatus === "submitting") return;
    setEmailError("");
    setEmailStatus("submitting");
    setPhase("success");
    try {
      await submitWaitlist({ email, source: "size_tool", honeypot: "", skipTrack: true });
      track("size_tool_signup");
    } catch (err) {
      setEmailError(err?.message || "We saved your size locally — email sync will retry at launch.");
    } finally {
      setEmailStatus("idle");
    }
  }

  const sizeParts = String(result?.size || "").match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
  const sizeTitle = sizeParts ? sizeParts[1] : result?.size;
  const sizeMeasurements = sizeParts ? sizeParts[2].split("|").map((part) => part.trim()) : [];

  return (
    <section
      className="mock-section size-tool"
      id="size-tool"
      aria-labelledby="size-tool-title"
    >
      <div id="get-your-size" className="mock-section-heading size-tool-anchor">
        <p className="eyebrow">Free Size Tool</p>
        <h2 id="size-tool-title" className="mock-section-title">
          Get your size in seconds.
        </h2>
        <p className="size-tool-subhead">
          Add 2 photos and we&apos;ll find your size in every brand — no
          measuring tape, no guessing.
        </p>
      </div>

      {phase === "upload" || phase === "processing" ? (
        <form className="size-tool-panel" onSubmit={onGetSize}>
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
                  <label htmlFor={`${baseId}-height`}>
                    Your height (for accuracy)
                  </label>
                  <div
                    className="size-tool-unit"
                    role="group"
                    aria-label="Height units"
                  >
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
                    onChange={(e) => {
                      progress.current = {};
                      setHeightCm(e.target.value);
                    }}
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
                      onChange={(e) => {
                        progress.current = {};
                        setHeightFt(e.target.value);
                      }}
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
                      onChange={(e) => {
                        progress.current = {};
                        setHeightIn(e.target.value);
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="size-tool-profile">
                <p>
                  These details help calculate your sizes. Use photos and
                  details for your selected account profile.
                </p>
                <label>
                  Age
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    min="1"
                    max="120"
                    step="1"
                    placeholder="Age in years"
                    value={profile.age}
                    onChange={(e) => updateProfile("age", e.target.value)}
                  />
                </label>
                <label>
                  Gender
                  <select
                    required
                    value={profile.gender}
                    onChange={(e) => updateProfile("gender", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="size-tool-cta"
                disabled={!canSubmit}
              >
                {progress.current.taskId ? "Check my size →" : "Get my size →"}
              </button>
              <p className="size-tool-privacy">
                Your photos are sent to our sizing service. This page clears its
                photo previews after success or when you leave. See our privacy
                policy for processing and retention details.
              </p>
              <ul className="size-tool-trust">
                <li>Processing time varies</li>
                <li>Works on any phone</li>
                <li>Any body, any brand</li>
              </ul>
              {error ? (
                <p className="size-tool-error" role="alert">
                  {error}
                </p>
              ) : null}
            </>
          ) : (
            <div
              className="size-tool-processing"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="size-tool-loader">
                <span className="fit-score-badge size-tool-loader-badge">
                  Calculating your size…
                </span>
                <div className="size-tool-loader-bar" aria-hidden="true">
                  <span />
                </div>
              </div>
              <MorphingProcessCopy messages={PROCESS_COPY} />
            </div>
          )}
        </form>
      ) : null}

      {accountHandoff && (phase === "result" || phase === "success") && result && !modalOpen ? (
        <button type="button" className="size-tool-cta size-tool-reopen" onClick={() => setModalOpen(true)}>
          {phase === "success" ? "View your saved size" : "View your size and save it"} →
        </button>
      ) : null}

      {(phase === "result" || phase === "success") && result && (!accountHandoff || modalOpen) ? (
        <div className={accountHandoff ? "size-tool-modal-backdrop" : undefined} onMouseDown={accountHandoff ? (event) => { if (event.target === event.currentTarget) setModalOpen(false); } : undefined}>
        <div className={`size-tool-panel size-tool-result${accountHandoff ? " size-tool-modal" : ""}`} role={accountHandoff ? "dialog" : undefined} aria-modal={accountHandoff ? "true" : undefined} aria-labelledby={accountHandoff ? `${baseId}-result-title` : undefined}>
          {accountHandoff ? <button type="button" className="size-tool-modal-close" aria-label="Close size result" onClick={() => setModalOpen(false)}>×</button> : null}
          <div className="size-tool-result-card">
            <p className="size-tool-result-label">Your recommended size</p>
            <h3 className="size-tool-result-line" id={`${baseId}-result-title`}>{sizeTitle}</h3>
            {sizeMeasurements.length ? (
              <ul className="size-tool-measurements" aria-label="Size measurements">
                {sizeMeasurements.map((measurement) => (
                  <li key={measurement}>{measurement}</li>
                ))}
              </ul>
            ) : null}
            {result.confidence != null ? (
              <p className="size-tool-confidence">{result.confidence}% confidence</p>
            ) : null}
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

          {phase === "result" && accountHandoff ? (
            <form className="size-tool-email" onSubmit={onSaveAccount}>
              <h3>Create an account to save your size</h3>
              <p>Then sign in to the app and choose the products you want to shop.</p>
              <div className="size-tool-account-fields">
                <label>First name<input name="firstName" autoComplete="given-name" required maxLength={100} value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label>
                <label>City<input name="city" autoComplete="address-level2" required maxLength={100} value={city} onChange={(e) => setCity(e.target.value)} /></label>
                <label>State or province<input name="region" autoComplete="address-level1" required maxLength={100} value={region} onChange={(e) => setRegion(e.target.value)} /></label>
                <label>Country code<input name="country" autoComplete="country" placeholder="CA, US, GB…" required pattern="[A-Za-z]{2}" maxLength={2} value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} /></label>
                <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                <label>Password<input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
              </div>
              <button type="submit" className="size-tool-cta" disabled={!sizeReady || saveStatus === "submitting"}>
                {saveStatus === "submitting" ? "Saving your size…" : sizeReady ? "Save my size and create account →" : "Saving your size profile…"}
              </button>
              {!sizeReady ? <p role="status">Your result is ready. We’re confirming it has been saved before you create an account.</p> : null}
              {sizeCheckTimedOut ? <button type="button" className="size-tool-ghost" onClick={() => { setSizeCheckTimedOut(false); setSizeCheckRetry((value) => value + 1); }}>Check saved size again</button> : null}
              {saveError ? <p className="size-tool-error" role="alert">{saveError}</p> : null}
              <p className="size-tool-privacy">
                Your photos are used for sizing. Your account lets you use this size in the app.
              </p>
            </form>
          ) : phase === "result" ? (
            <form className="size-tool-email" onSubmit={onSaveEmail}>
              <h3>Save your size profile</h3>
              <div className="size-tool-email-row">
                <label className="sr-only" htmlFor={`${baseId}-email`}>Email</label>
                <input id={`${baseId}-email`} type="email" name="email" autoComplete="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button type="submit" className="size-tool-cta" disabled={emailStatus === "submitting"}>Save my size &amp; join →</button>
              </div>
              <p className="size-tool-privacy">Sizing only — never shared or sold.</p>
            </form>
          ) : accountHandoff ? (
            <div className="size-tool-success" role="status">
              <h3>Your size is saved to your account.</h3>
              <p>{deliveryStatus || "Preparing your app download link…"}</p>
              {deliveryFailed ? <button type="button" className="size-tool-ghost" onClick={() => { void sendDownloadLink(); }}>Retry app link email</button> : null}
            </div>
          ) : (
            <div className="size-tool-success" role="status">
              <h3>You&apos;re in!</h3>
              <p>We&apos;ll email you about early access.</p>
              {emailError ? <p className="size-tool-error">{emailError}</p> : null}
            </div>
          )}
        </div>
        </div>
      ) : null}
    </section>
  );
}
