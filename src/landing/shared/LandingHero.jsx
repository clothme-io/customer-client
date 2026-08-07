import { WaitlistForm } from "../../components/WaitlistForm";
import {
  landingImages,
  landingPerk,
  landingWaitlistMomentum
} from "../../data/landing";
import { FitScoreBadge } from "./FitScoreBadge";

export function LandingHero({ onWaitlistSuccess }) {
  const circles = landingImages.heroStrip;

  return (
    <section className="creator-hero mock-hero-landing" id="waitlist">
      {circles.map((image) => (
        <div
          key={image.slot}
          className={`creator-hero-circle creator-hero-circle--${image.slot}${image.showFitBadge ? " creator-hero-circle--badge" : ""}`}
        >
          <img src={image.src} alt="" aria-hidden="true" decoding="async" />
          {image.showFitBadge ? (
            <FitScoreBadge className="fit-score-badge--on-media fit-score-badge--circle" decorative />
          ) : null}
        </div>
      ))}

      <div className="creator-hero-inner mock-hero-landing-inner">
        <p className="mock-pill">Coming Soon — Canada + US</p>
        <h1 className="mock-display">Shopping That Finally Fits.</h1>
        <p className="mock-hero-text">
          Add 2 photos, get your exact size in any brand. No measuring tape, no guessing, no returns
          pile. For you — and everyone you shop for.
        </p>

        <div className="mock-perk mock-perk--centered">
          <p className="mock-perk-text">{landingPerk.text}</p>
        </div>

        <WaitlistForm
          id="waitlist-hero"
          source="landing:hero"
          onSuccess={onWaitlistSuccess}
          showState={false}
          note="Your photos are used for sizing only — never shared, never sold."
          className="mock-hero-landing-form"
        />

        {landingWaitlistMomentum ? (
          <p className="mock-hero-momentum">{landingWaitlistMomentum}</p>
        ) : null}
      </div>
    </section>
  );
}
