import { usStatesAndProvinces } from "../data/landing";

export function WaitlistForm({
  id = "waitlist",
  onSubmit,
  className = "",
  ctaLabel = "Join Early Access",
  note = "We respect your privacy. No spam, ever."
}) {
  return (
    <div className={`waitlist-block ${className}`.trim()}>
      <form className="waitlist-form waitlist-form--mock" id={id} onSubmit={onSubmit}>
        <label className="sr-only" htmlFor={`${id}-email`}>Email address</label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          placeholder="Email address"
          autoComplete="email"
          required
        />

        <label className="sr-only" htmlFor={`${id}-state`}>State (optional)</label>
        <select id={`${id}-state`} name="state" defaultValue="" aria-label="State (optional)">
          <option value="">State (optional)</option>
          {usStatesAndProvinces.map((code) => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>

        <button type="submit">{ctaLabel}</button>
      </form>
      {note ? <p className="waitlist-note">{note}</p> : null}
    </div>
  );
}
