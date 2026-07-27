import { landingPain } from "../../data/landing";
import { painIcons } from "./LandingIcons";

export function LandingPain() {
  return (
    <section className="landing-section landing-pain" id="pain" aria-labelledby="pain-title">
      <div className="section-heading">
        <h2 id="pain-title">Shopping Shouldn't Be This Hard</h2>
      </div>
      <div className="landing-pain-grid">
        {landingPain.map((item, index) => {
          const Icon = painIcons[index % painIcons.length];
          return (
            <article key={item.title} className="landing-pain-card">
              <Icon className="landing-icon" />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          );
        })}
      </div>
      <p className="landing-pain-closer">We built ClothME to fix all of it.</p>
    </section>
  );
}
