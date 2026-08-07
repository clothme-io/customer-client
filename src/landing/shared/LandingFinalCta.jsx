import { WaitlistForm } from "../../components/WaitlistForm";
import { landingPerk } from "../../data/landing";

export function LandingFinalCta({ onWaitlistSuccess }) {
  return (
    <section className="mock-final-cta" id="join" aria-labelledby="final-cta-title">
      <div className="mock-final-cta-inner">
        <h2 id="final-cta-title" className="mock-display">
          Be the first to experience shopping that finally fits.
        </h2>

        <div className="mock-perk mock-perk--centered">
          <p className="mock-perk-text">{landingPerk.text}</p>
          <p className="mock-perk-fine">{landingPerk.finePrint}</p>
        </div>

        <WaitlistForm
          id="waitlist-final"
          source="landing:final"
          onSuccess={onWaitlistSuccess}
          showState
          stateLabel="Where are you? (optional)"
          note="Your photos are used for sizing only — never shared, never sold."
        />
      </div>
    </section>
  );
}
