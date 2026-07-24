import { WaitlistForm } from "../../components/WaitlistForm";

export function LandingFinalCta({ onWaitlistSubmit }) {
  return (
    <section className="mock-final-cta" id="join" aria-labelledby="final-cta-title">
      <div className="mock-final-cta-inner">
        <h2 id="final-cta-title" className="mock-display">
          Be the first to experience shopping that finally fits.
        </h2>
        <WaitlistForm
          id="waitlist-final"
          onSubmit={onWaitlistSubmit}
          note="Early access. Exclusive updates. Special perks."
        />
      </div>
    </section>
  );
}
