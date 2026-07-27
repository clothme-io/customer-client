import { WaitlistForm } from "../../components/WaitlistForm";

export function LandingFinalCta({ onWaitlistSuccess }) {
  return (
    <section className="mock-final-cta" id="join" aria-labelledby="final-cta-title">
      <div className="mock-final-cta-inner">
        <h2 id="final-cta-title" className="mock-display">
          Be the first to experience shopping that finally fits.
        </h2>
        <WaitlistForm
          id="waitlist-final"
          source="landing:final"
          onSuccess={onWaitlistSuccess}
          note="Early access. Exclusive updates. Special perks."
        />
      </div>
    </section>
  );
}
