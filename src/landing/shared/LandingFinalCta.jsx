import { WaitlistForm } from "../../components/WaitlistForm";

export function LandingFinalCta({ onWaitlistSuccess }) {
  return (
    <section className="mock-final-cta" id="join" aria-labelledby="final-cta-title">
      <div className="mock-final-cta-inner">
        <h2 id="final-cta-title" className="mock-display">
          Be the first to experience shopping that finally fits.
        </h2>

        <div className="mock-perk mock-perk--centered">
          <p className="mock-perk-text">Send me a download link for the app.</p>
        </div>

        <WaitlistForm
          id="waitlist-final"
          source="landing:final"
          ctaLabel="Send me a download link"
          onSuccess={onWaitlistSuccess}
          showState={false}
          note="Your photos are used for sizing only — never shared, never sold."
        />
      </div>
    </section>
  );
}
