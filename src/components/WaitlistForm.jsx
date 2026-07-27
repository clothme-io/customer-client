import { useState } from "react";
import { usStatesAndProvinces } from "../data/landing";
import { submitWaitlist } from "../lib/waitlist";

export function WaitlistForm({
  id = "waitlist",
  source = "landing",
  onSuccess,
  className = "",
  ctaLabel = "Join Early Access",
  note = "We respect your privacy. No spam, ever.",
  showState = true
}) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("submitting");
    setError("");

    try {
      await submitWaitlist({
        email: data.get("email"),
        state: data.get("state"),
        source,
        honeypot: data.get("company")
      });
      form.reset();
      setStatus("idle");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className={`waitlist-block ${className}`.trim()}>
      <form className="waitlist-form waitlist-form--mock" id={id} onSubmit={handleSubmit} noValidate={false}>
        <label className="sr-only" htmlFor={`${id}-email`}>Email address</label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          placeholder="Email address"
          autoComplete="email"
          required
          disabled={status === "submitting"}
        />

        {showState ? (
          <>
            <label className="sr-only" htmlFor={`${id}-state`}>State (optional)</label>
            <select
              id={`${id}-state`}
              name="state"
              defaultValue=""
              aria-label="State (optional)"
              disabled={status === "submitting"}
            >
              <option value="">State (optional)</option>
              {usStatesAndProvinces.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </>
        ) : null}

        {/* Honeypot — leave empty. Hidden from assistive tech and sighted users. */}
        <div className="waitlist-honeypot" aria-hidden="true">
          <label htmlFor={`${id}-company`}>Company</label>
          <input
            id={`${id}-company`}
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Joining…" : ctaLabel}
        </button>
      </form>
      {error ? (
        <p className="waitlist-error" role="alert">{error}</p>
      ) : note ? (
        <p className="waitlist-note">{note}</p>
      ) : null}
    </div>
  );
}
