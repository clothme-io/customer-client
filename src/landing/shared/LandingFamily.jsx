import { landingFamilyPoints, landingImages } from "../../data/landing";
import { familyPointIcons } from "./LandingIcons";
import { IphoneFrame } from "./IphoneFrame";

export function LandingFamily() {
  const phone = landingImages.familyPhone;

  return (
    <section className="mock-family-band" id="family" aria-labelledby="family-title">
      <div className="mock-family">
        <div className="mock-family-visual">
          <IphoneFrame src={phone.src} alt={phone.alt} className="iphone-frame--family" />
        </div>

        <div className="mock-family-copy">
          <h2 id="family-title" className="mock-display">One account. The whole family.</h2>
          <p className="mock-lede">
            Create profiles for everyone you shop for—so fit, style, and preferences stay personal, even when you're buying for them.
          </p>
          <div className="mock-family-points">
            {landingFamilyPoints.map((point, index) => {
              const Icon = familyPointIcons[index % familyPointIcons.length];
              return (
                <div key={point.label} className="mock-family-point">
                  <span className="mock-family-point-icon" aria-hidden="true">
                    <Icon className="mock-icon mock-icon--sm" />
                  </span>
                  <span>{point.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
