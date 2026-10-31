import { useState } from "react";
import { sessionFetch } from "../../../app/(webclient)/lib/session-client";
import { applyManualMeasurementEdits, MANUAL_BODY_FIELDS } from "../../lib/manualSizeProfile";

export function ManualSizeReview({ result, onDirtyChange, onSaved }) {
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const rows = MANUAL_BODY_FIELDS.filter(([key]) =>
    Number.isFinite(result.measurements?.[key]?.cm) && result.measurements[key].cm > 0,
  );
  const dirty = Object.keys(drafts).length > 0;

  async function save() {
    if (!dirty || saving) return;
    setError("");
    const edits = {};
    for (const [key] of rows) {
      if (key in drafts) edits[key] = Number(drafts[key]);
    }
    let updated;
    try {
      updated = applyManualMeasurementEdits(result, edits);
    } catch (cause) {
      setError(cause.message);
      return;
    }
    setSaving(true);
    try {
      const response = await sessionFetch("/api/size-tool/manual", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edits }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Could not save your measurement changes.");
      setDrafts({});
      onSaved(updated);
      onDirtyChange(false);
      setMessage("Measurement changes saved.");
    } catch (cause) {
      setError(cause.message || "Could not save your measurement changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="size-tool-manual-review">
      <p>These measurements are estimates from your answers. Review them and adjust anything that doesn’t look right.</p>
      <div className="size-tool-manual-measurements">
        {rows.map(([key, label]) => (
          <label key={key}><span className="size-tool-manual-measurement-label">{label} <small>(cm)</small></span>
            <input type="number" inputMode="decimal" min="0.01" max="400" step="any"
              value={key in drafts ? drafts[key] : result.measurements[key].cm}
              onChange={(event) => {
                setDrafts((current) => ({ ...current, [key]: event.target.value }));
                onDirtyChange(true);
                setMessage("");
              }} />
          </label>
        ))}
      </div>
      {error ? <p className="size-tool-error" role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      {dirty ? <button type="button" className="size-tool-ghost" disabled={saving} onClick={() => void save()}>
        {saving ? "Saving changes…" : "Save measurement changes"}
      </button> : null}
      {dirty ? <p className="size-tool-manual-limit">Save your changes before closing this result.</p> : null}
    </div>
  );
}
