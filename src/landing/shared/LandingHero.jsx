import { WaitlistForm } from "../../components/WaitlistForm";
import { landingImages } from "../../data/landing";

export function LandingHero({ onWaitlistSubmit }) {
  const image = landingImages.hero;

  return (
    <section className="mock-hero" id="top">
      <div className="mock-hero-copy">
        <p className="mock-pill">Coming Soon</p>
        <h1 className="mock-display">Shopping That Finally Fits.</h1>
        <p className="mock-hero-sub">For you. For your family.</p>
        <p className="mock-hero-text">
          Personalized shopping for the whole family. Discover brands you'll love, shop with confidence, and spend less time guessing what fits.
        </p>
        <WaitlistForm onSubmit={onWaitlistSubmit} />
      </div>

      <div className="mock-hero-visual">
        <img className="mock-hero-image" src={image.src} alt={image.alt} />
      </div>
    </section>
  );
}
