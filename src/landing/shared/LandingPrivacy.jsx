import { landingPrivacyPoints } from "../../data/landing";
import { IconCheck, IconShield } from "./LandingIcons";

export function LandingPrivacy() {
  return (
    <section className="mock-trust-band mock-privacy-section" id="privacy" aria-labelledby="privacy-title">
      <div className="mock-privacy-inner">
        <div className="mock-privacy-badge" aria-hidden="true">
          <IconShield className="mock-icon" />
        </div>
        <h2 id="privacy-title" className="mock-section-title mock-section-title--left">
          We protect your privacy
        </h2>
        <ul className="mock-check-list">
          {landingPrivacyPoints.map((line) => (
            <li key={line}>
              <IconCheck className="mock-check mock-check--accent" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
