import { landingImages, landingImagine } from "../../data/landing";
import { FitScoreBadge } from "./FitScoreBadge";
import { IconCheck } from "./LandingIcons";
import { IphoneFrame } from "./IphoneFrame";

export function LandingImagine() {
  const phone = landingImages.imagine;

  return (
    <section className="mock-imagine-band" id="imagine" aria-labelledby="imagine-title">
      <div className="mock-imagine">
        <div className="mock-imagine-visual">
          <IphoneFrame src={phone.src} alt={phone.alt} className="iphone-frame--imagine" />
        </div>

        <div className="mock-imagine-copy">
          <div className="mock-section-heading mock-section-heading--left">
            <FitScoreBadge className="fit-score-badge--inline" decorative />
            <h2 id="imagine-title" className="mock-display">
              Imagine...
            </h2>
          </div>
          <ul className="mock-check-list">
            {landingImagine.map((line) => (
              <li key={line}>
                <IconCheck className="mock-check mock-check--accent" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
