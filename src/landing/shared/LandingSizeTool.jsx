import { useEffect, useId, useRef, useState } from "react";
import { submitWaitlist } from "../../lib/waitlist";
import { runSizeTool } from "../../lib/sizeToolClient";
import { sizeToolProfileFromAge } from "../../lib/sizeToolProfile";
import { track } from "../../lib/track";
import { ManualSizeForm } from "./ManualSizeForm";
import { ManualSizeReview } from "./ManualSizeReview";

const LOADING_FACTS = [
  { icon: "👖", text: "Levi’s added rivets to jeans in 1873" },
  { icon: "👔", text: "Neckties began as soldiers’ scarves" },
  { icon: "🧵", text: "A T-shirt can take 2,700 liters of water to make" },
  { icon: "👟", text: "Sneakers outsell dress shoes" },
  { icon: "🧶", text: "Merino wool naturally resists moisture" },
  { icon: "👗", text: "Fashion Week began in New York in 1943" },
];

function ProcessingFeedback({ status, seconds, factIndex }) {
  const stage = status.stage === "front" ? "Checking front photo" : status.stage === "side" ? "Checking side photo" : status.stage === "generation" ? "Calculating your size" : "Preparing your profile";
  const percent = Number.isFinite(status.percent) ? Math.max(0, Math.min(100, Math.round(status.percent))) : null;
  const stageSeconds = status.beganAt ? Math.max(1, (Date.now() - status.beganAt) / 1000) : 0;
  const estimate = status.stage === "generation" && percent >= 15 && percent < 100
    ? Math.min(300, Math.round(stageSeconds * (100 - percent) / percent / 5) * 5)
    : null;
  const fact = LOADING_FACTS[factIndex % LOADING_FACTS.length];
  return <div className="size-tool-progress" role="status" aria-live="polite">
    <div className="size-tool-progress-heading"><strong>{stage}</strong>{percent !== null ? <span>{percent}%</span> : null}</div>
    <div className="size-tool-progress-track" role="progressbar" aria-label={stage} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent ?? 0}><span style={{ width: `${percent ?? 0}%` }} /></div>
    <p className="size-tool-progress-time">{estimate !== null ? `About ${estimate < 60 ? `${Math.max(5, estimate)} seconds` : `${Math.ceil(estimate / 60)} minutes`} remaining (estimate)` : `${seconds}s elapsed · Time remaining varies`}</p>
    <div className="size-tool-progress-fact" key={factIndex}><span className="size-tool-progress-icon" aria-hidden="true">{fact.icon}</span><span>{fact.text}</span></div>
    {status.message?.includes("Reconnecting") ? <p className="size-tool-progress-connection">{status.message}</p> : null}
  </div>;
}

function parseHeightCm(unit, cm, inches) {
  if (unit === "cm") {
    const n = Number(cm);
    return Number.isFinite(n) && n >= 90 && n <= 250 ? Math.round(n) : null;
  }
  const n = Number(inches);
  const total = n * 2.54;
  return total >= 90 && total <= 250 ? Math.round(total) : null;
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
        <span className="size-tool-tile-title">{label} <span className="size-tool-required" aria-hidden="true">*</span></span>
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
        aria-required="true"
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
  const [sizingMethod, setSizingMethod] = useState("photo");
  const [manualDirty, setManualDirty] = useState(false);
  const [frontFile, setFrontFile] = useState(null);
  const [sideFile, setSideFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [sidePreview, setSidePreview] = useState(null);
  const [heightUnit, setHeightUnit] = useState("cm");
  const [heightCm, setHeightCm] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [progressStatus, setProgressStatus] = useState({ stage: "session", percent: null, message: "" });
  const [processingSeconds, setProcessingSeconds] = useState(0);
  const [loadingFactIndex, setLoadingFactIndex] = useState(0);
  const [savingSize, setSavingSize] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [accountStep, setAccountStep] = useState("result");
  const [sizeReady, setSizeReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
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
  useEffect(() => {
    if (phase !== "processing") return;
    const started = Date.now();
    setProcessingSeconds(0);
    const timer = window.setInterval(() => setProcessingSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    const facts = window.setInterval(() => setLoadingFactIndex((index) => index + 1), 2800);
    return () => { window.clearInterval(timer); window.clearInterval(facts); };
  }, [phase]);
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
    if (!accountHandoff || !modalOpen) return;
    const previous = document.body.style.overflow;
    const onKeyDown = (event) => { if (event.key === "Escape" && !manualDirty) closeResult(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [accountHandoff, modalOpen, manualDirty]);
  useEffect(() => {
    if (!accountHandoff || phase !== "result") return;
    let cancelled = false;
    fetch("/api/webclient/session").then((response) => response.json()).then((session) => {
      if (cancelled) return;
      if (session.isRegistered) {
        setAlreadyRegistered(true);
        if (session.email) setEmail(session.email);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [accountHandoff, phase]);
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

  const heightValue = parseHeightCm(heightUnit, heightCm, heightIn);
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
    setProgressStatus({ stage: "session", percent: null, message: "Preparing your fit profile…", beganAt: Date.now() });

    try {
      const next = await runSizeTool({
        frontFile,
        sideFile,
        heightCm: heightValue,
        profile: sizeToolProfileFromAge(profile),
        progress: progress.current,
        onProgress: (update) => setProgressStatus((current) => ({
          ...update,
          beganAt: current.stage === update.stage ? current.beganAt : Date.now(),
        })),
      });
      setFrontPreview(null);
      setSidePreview(null);
      setFrontFile(null);
      setSideFile(null);
      setResult({ ...next, method: "photo" });
      setSizeReady(false);
      setAccountStep("result");
      setModalOpen(accountHandoff);
      setPhase("result");
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setPhase("upload");
    } finally {
      submitting.current = false;
    }
  }

  async function saveSize() {
    if (!result || savingSize || manualDirty) return;
    setSavingSize(true);
    setSaveError("");
    try {
      const response = await fetch("/api/size-tool/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.method === "manual"
          ? { method: "manual", result }
          : { method: "photo", taskId: result.taskId }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Could not save your size.");
      setSizeReady(true);
      setAccountStep("details");
    } catch (err) {
      setSaveError(err?.message || "Could not save your size. Please try again.");
    } finally {
      setSavingSize(false);
    }
  }

  function onManualGenerated(next, details) {
    setProfile(details);
    setManualDirty(false);
    setResult({ ...next, method: "manual" });
    setSizeReady(false);
    setAccountStep("result");
    setModalOpen(accountHandoff);
    setPhase("result");
  }

  function closeResult() {
    setModalOpen(false);
    setResult(null);
    setManualDirty(false);
    setSizeReady(false);
    setPhase("upload");
  }

  function startOtherMethod() {
    closeResult();
    progress.current = {};
    setSizingMethod((current) => current === "photo" ? "manual" : "photo");
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
          {sizingMethod === "manual" && accountHandoff ? "Find your size without photos." : "Get your size in seconds."}
        </h2>
        <p className="size-tool-subhead">{sizingMethod === "manual" && accountHandoff
          ? "Answer a few questions and review your estimated measurements — no photos needed."
          : "Add 2 photos and we’ll find your size in every brand — no measuring tape, no guessing."}</p>
      </div>

      {accountHandoff && (phase === "upload" || phase === "processing") ? <div className="size-tool-method" role="group" aria-label="Sizing method">
        <button type="button" disabled={phase !== "upload"} aria-pressed={sizingMethod === "photo"} className={sizingMethod === "photo" ? "is-active" : ""} onClick={() => setSizingMethod("photo")}>Photo sizing</button>
        <button type="button" disabled={phase !== "upload"} aria-pressed={sizingMethod === "manual"} className={sizingMethod === "manual" ? "is-active" : ""} onClick={() => setSizingMethod("manual")}>Manual sizing</button>
      </div> : null}

      {accountHandoff && phase === "upload" && sizingMethod === "manual" ? <ManualSizeForm onGenerated={onManualGenerated} /> : null}

      {sizingMethod === "photo" && (phase === "upload" || phase === "processing") ? (
        <form className="size-tool-panel" onSubmit={onGetSize} aria-busy={phase === "processing"}>
            <div className="size-tool-photo-fields" inert={phase === "processing" ? true : undefined}>
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
                    Your height (for accuracy) <span className="size-tool-required" aria-hidden="true">*</span>
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
                      className={heightUnit === "in" ? "is-active" : ""}
                      onClick={() => setHeightUnit("in")}
                    >
                      inches
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
                  <input
                    id={`${baseId}-height`}
                    type="number"
                    inputMode="decimal"
                    min={90 / 2.54}
                    max={250 / 2.54}
                    step="any"
                    placeholder="e.g. 67"
                    aria-label="Height in inches"
                    value={heightIn}
                    onChange={(e) => {
                      progress.current = {};
                      setHeightIn(e.target.value);
                    }}
                    required
                  />
                )}
              </div>

              <div className="size-tool-profile">
                <p>
                  These details help calculate your sizes. Use photos and
                  details for your selected account profile.
                </p>
                <label>
                  <span>Age <span className="size-tool-required" aria-hidden="true">*</span></span>
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
                  <span>Gender <span className="size-tool-required" aria-hidden="true">*</span></span>
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
                className={`size-tool-cta${phase === "processing" ? " is-processing" : ""}`}
                disabled={!canSubmit}
                aria-live="polite"
              >
                {phase === "processing" ? "Calculating your size…" : progress.current.taskId ? "Check my size →" : "Get my size →"}
              </button>
              {phase === "processing" ? <ProcessingFeedback status={progressStatus} seconds={processingSeconds} factIndex={loadingFactIndex} /> : null}
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
            </div>
        </form>
      ) : null}

      {accountHandoff && (phase === "result" || phase === "success") && result && !modalOpen ? (
        <button type="button" className="size-tool-cta size-tool-reopen" onClick={() => setModalOpen(true)}>
          {phase === "success" ? "View your saved size" : "View your size and save it"} →
        </button>
      ) : null}

      {(phase === "result" || phase === "success") && result && (!accountHandoff || modalOpen) ? (
        <div className={accountHandoff ? "size-tool-modal-backdrop" : undefined} onMouseDown={accountHandoff ? (event) => { if (event.target === event.currentTarget && !manualDirty) closeResult(); } : undefined}>
        <div className={`size-tool-panel size-tool-result${accountHandoff ? " size-tool-modal" : ""}`} role={accountHandoff ? "dialog" : undefined} aria-modal={accountHandoff ? "true" : undefined} aria-labelledby={accountHandoff ? `${baseId}-result-title` : undefined}>
          {accountHandoff ? <button type="button" className="size-tool-modal-close" aria-label="Close size result" disabled={manualDirty} title={manualDirty ? "Save measurement changes before closing" : undefined} onClick={closeResult}>×</button> : null}
          <div className="size-tool-result-card">
            {result.method === "manual" ? <>
              <p className="size-tool-result-label">Manual sizing result</p>
              <h3 className="size-tool-result-line" id={`${baseId}-result-title`}>Your estimated measurements</h3>
              <ManualSizeReview result={result} onDirtyChange={setManualDirty}
                onSaved={(updated) => {
                  setResult((current) => ({ ...current, ...updated }));
                  if (sizeReady) {
                    setSizeReady(false);
                    setAccountStep("result");
                  }
                }} />
            </> : <>
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
            </>}
          </div>

          {phase === "result" && accountHandoff && accountStep === "result" ? (
            <div className="size-tool-email">
              <h3>Keep this size in your ClothME account</h3>
              <p>Save it once, then log in to the app and choose the products you want to shop.</p>
              <button type="button" className="size-tool-cta" disabled={manualDirty || savingSize} onClick={() => void saveSize()}>{savingSize ? "Saving your size…" : "Save this size →"}</button>
              {manualDirty ? <p>Apply your measurement changes before saving this size.</p> : null}
              {saveError ? <p className="size-tool-error" role="alert">{saveError}</p> : null}
            </div>
          ) : phase === "result" && accountHandoff ? (
            <form className="size-tool-email" onSubmit={onSaveAccount}>
              <h3>{alreadyRegistered ? "Save your size to your account" : "Create an account to save your size"}</h3>
              <p>Then sign in to the app and choose the products you want to shop.</p>
              <div className="size-tool-account-fields">
                <label>First name<input name="firstName" autoComplete="given-name" required maxLength={100} value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label>
                <label>City<input name="city" autoComplete="address-level2" required maxLength={100} value={city} onChange={(e) => setCity(e.target.value)} /></label>
                <label>State or province<input name="region" autoComplete="address-level1" required maxLength={100} value={region} onChange={(e) => setRegion(e.target.value)} /></label>
                <label>Country code<input name="country" autoComplete="country" placeholder="CA, US, GB…" required pattern="[A-Za-z]{2}" maxLength={2} value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} /></label>
                <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                {!alreadyRegistered ? <label>Password<input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} /></label> : null}
              </div>
              <button type="submit" className="size-tool-cta" disabled={!sizeReady || manualDirty || saveStatus === "submitting"}>
                {saveStatus === "submitting" ? "Creating your account…" : alreadyRegistered ? "Continue to the app →" : "Create account →"}
              </button>
              {saveError ? <p className="size-tool-error" role="alert">{saveError}</p> : null}
              <p className="size-tool-privacy">
                {result.method === "manual" ? "Your answers are used to estimate your sizing." : "Your photos are used for sizing."} Your account lets you use this size in the app.
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
          {accountHandoff && phase === "result" ? <button type="button" className="size-tool-ghost" onClick={startOtherMethod}>
            {manualDirty ? "Discard changes and try photo sizing" : `Try ${result.method === "manual" ? "photo" : "manual"} sizing instead`}
          </button> : null}
        </div>
        </div>
      ) : null}
    </section>
  );
}
