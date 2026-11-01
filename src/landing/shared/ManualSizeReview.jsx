import { useState } from "react";
import { applyManualMeasurementEdits, linkedManualFields, manualProfileRows } from "../../lib/manualSizeProfile";

export function ManualSizeReview({ result, onDirtyChange, onSaved }) {
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const sections = manualProfileRows(result);
  const shownFields = new Set(sections.flatMap(({ rows }) => rows.map(({ key }) => key)));
  const dirty = Object.keys(drafts).length > 0;

  function measurement(key) {
    const [section, field] = key.split(".");
    return section === "body" ? result.measurements[field] : result.sizing[section][field];
  }

  function change(key, value) {
    setDrafts((current) => {
      const next = { ...current };
      for (const target of linkedManualFields(key)) {
        if (shownFields.has(target)) next[target] = value;
      }
      return next;
    });
    onDirtyChange(true);
    setMessage("");
  }

  function save() {
    if (!dirty) return;
    setError("");
    const edits = Object.fromEntries(Object.entries(drafts).map(([key, value]) => [key, Number(value)]));
    let updated;
    try {
      updated = applyManualMeasurementEdits(result, edits);
    } catch (cause) {
      setError(cause.message);
      return;
    }
    setDrafts({});
    onSaved(updated);
    onDirtyChange(false);
    setMessage("Changes applied to this preview. Save your size when you’re ready.");
  }

  return (
    <div className="size-tool-manual-review">
      <p>These measurements are estimates from your answers. Review them and adjust anything that doesn’t look right.</p>
      {sections.map(({ section, title, rows }) => <section key={section} className="size-tool-manual-section" aria-label={title}>
        <h4>{title}</h4>
        <div className="size-tool-manual-measurements">
          {rows.map(({ key, label }) => <label key={key}>
            <span className="size-tool-manual-measurement-label">{label} <small>(cm)</small></span>
            <input type="number" inputMode="decimal" min="0.01" max="400" step="any"
              aria-label={`${title}: ${label} in centimeters`}
              value={key in drafts ? drafts[key] : measurement(key).cm}
              onChange={(event) => change(key, event.target.value)} />
          </label>)}
        </div>
      </section>)}
      {error ? <p className="size-tool-error" role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      {dirty ? <button type="button" className="size-tool-ghost" onClick={save}>
        Apply measurement changes
      </button> : null}
      {dirty ? <p className="size-tool-manual-limit">Apply your changes before saving this size.</p> : null}
    </div>
  );
}
