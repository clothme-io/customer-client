import { useId, useState } from "react";
import { sessionFetch } from "../../../app/(webclient)/lib/session-client";
import { MANUAL_SHAPES, validateManualAnswers } from "../../lib/manualSizeProfile";
import { track } from "../../lib/track";
import { ManualBodyPreview } from "./ManualBodyPreview";

const THREE_CHOICES = [[1, "Short"], [2, "Average"], [3, "Long"]];

function Choices({ title, options, value, onChange }) {
  return (
    <div className="size-tool-manual-group" role="group" aria-label={title}>
      <p>{title}</p>
      <div className="size-tool-manual-choices">
        {options.map(([choice, label]) => (
          <button key={choice} type="button" className={value === choice ? "is-active" : ""}
            aria-pressed={value === choice} onClick={() => onChange(choice)}>{label}</button>
        ))}
      </div>
    </div>
  );
}

export function ManualSizeForm({ onGenerated }) {
  const baseId = useId();
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("");
  const [shape, setShape] = useState("");
  const [belly, setBelly] = useState(2);
  const [build, setBuild] = useState(2);
  const [legs, setLegs] = useState(2);
  const [arms, setArms] = useState(2);
  const [cup, setCup] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    let answers;
    try {
      answers = validateManualAnswers({
        age, height_cm: heightUnit === "cm" ? height : Number(height) * 2.54,
        mass_kg: weight, gender, body_shape: shape, belly, build, legs, arms,
        cupsize: gender === "female" ? cup : "",
      });
    } catch (cause) {
      setError(cause.message);
      return;
    }
    setBusy(true);
    track("manual_size_started");
    try {
      const guest = await sessionFetch("/api/webclient/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "guest" }),
      });
      if (!guest.ok) {
        const body = await guest.json().catch(() => ({}));
        throw new Error(body.message || "Could not start your sizing session.");
      }
      const response = await sessionFetch("/api/size-tool/manual", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, age: Number(age) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.result)
        throw new Error(body.message || "Could not generate your estimated sizing.");
      track("manual_size_result");
      onGenerated(body.result, { age, gender });
    } catch (cause) {
      track("manual_size_failed");
      setError(cause.message || "Manual sizing is unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="size-tool-panel size-tool-manual" onSubmit={submit}>
      <p className="size-tool-manual-intro">Answer a few questions and we’ll estimate your measurements. You can review them before creating an account.</p>
      <div className="size-tool-manual-numbers">
        <label htmlFor={`${baseId}-age`}>Age
          <input id={`${baseId}-age`} type="number" inputMode="numeric" min="18" max="120" step="1"
            value={age} onChange={(event) => setAge(event.target.value)} required placeholder="18 or older" />
        </label>
        <label htmlFor={`${baseId}-height`}>Height
          <span className="size-tool-manual-height-unit" role="group" aria-label="Height units">
            <button type="button" className={heightUnit === "cm" ? "is-active" : ""} aria-pressed={heightUnit === "cm"} onClick={() => { setHeightUnit("cm"); setHeight(""); }}>cm</button>
            <button type="button" className={heightUnit === "in" ? "is-active" : ""} aria-pressed={heightUnit === "in"} onClick={() => { setHeightUnit("in"); setHeight(""); }}>inches</button>
          </span>
          <input id={`${baseId}-height`} type="number" inputMode="decimal" step="any"
            min={heightUnit === "cm" ? 140 : 140 / 2.54}
            max={heightUnit === "cm" ? 220 : 220 / 2.54}
            value={height} onChange={(event) => setHeight(event.target.value)} required placeholder={heightUnit === "cm" ? "e.g. 170" : "e.g. 67"} />
        </label>
        <label htmlFor={`${baseId}-weight`}>Weight (kg)
          <input id={`${baseId}-weight`} type="number" inputMode="decimal" min="30" max="200" step="any"
            value={weight} onChange={(event) => setWeight(event.target.value)} required placeholder="e.g. 70" />
        </label>
      </div>
      <p className="size-tool-manual-limit">Manual sizing currently supports adults from 140–220 cm and 30–200 kg. For children, use photo sizing.</p>
      <Choices title="Body model" options={[["female", "Female"], ["male", "Male"]]} value={gender} onChange={setGender} />
      <div className="size-tool-manual-shape-layout">
        <div className="size-tool-manual-shape-options">
          <Choices title="Body shape" options={MANUAL_SHAPES} value={shape} onChange={setShape} />
          {gender === "female" ? <Choices title="Cup size (optional)" options={[["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"], ["DD", "DD"], ["F", "F"]]} value={cup} onChange={setCup} /> : null}
          <Choices title="Belly" options={[[1, "Flat"], [2, "Average"], [3, "Prominent"]]} value={belly} onChange={setBelly} />
          <Choices title="Build" options={[[1, "Soft"], [2, "Average"], [3, "Athletic"]]} value={build} onChange={setBuild} />
          <Choices title="Leg length relative to your height" options={THREE_CHOICES} value={legs} onChange={setLegs} />
          <Choices title="Arm length relative to your height" options={THREE_CHOICES} value={arms} onChange={setArms} />
        </div>
        <ManualBodyPreview shape={shape} gender={gender} cup={cup} />
      </div>
      {error ? <p className="size-tool-error" role="alert">{error}</p> : null}
      <button className="size-tool-cta" type="submit" disabled={busy}>{busy ? "Estimating your size…" : "Generate my sizing →"}</button>
      <p className="size-tool-privacy">These answers are used to estimate your sizing. You can review and adjust the result.</p>
    </form>
  );
}
