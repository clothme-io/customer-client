import { landingImages, landingImagine } from "../../data/landing";
import { IconCheck } from "./LandingIcons";
import { IphoneFrame } from "./IphoneFrame";

export function LandingImagine() {
  const phone = landingImages.imagine;
  const backdrop = landingImages.imagineBackdrop;

  return (
    <section className="mock-imagine-band" id="imagine" aria-labelledby="imagine-title">
      <div className="mock-imagine">
        <div className="mock-imagine-copy">
          <h2 id="imagine-title" className="mock-display">Imagine...</h2>
          <ul className="mock-check-list">
            {landingImagine.map((line) => (
              <li key={line}>
                <IconCheck className="mock-check" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mock-imagine-visual">
          <IphoneFrame src={phone.src} alt={phone.alt} className="iphone-frame--imagine" />
          <div className="mock-imagine-props" aria-hidden="true">
            <img src={backdrop.src} alt="" />
          </div>
        </div>
      </div>
    </section>
  );
}
