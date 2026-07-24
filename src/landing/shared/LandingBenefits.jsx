import { landingBenefits } from "../../data/landing";
import { benefitIcons } from "./LandingIcons";

export function LandingBenefits() {
  return (
    <section className="mock-section mock-benefits" id="why" aria-labelledby="benefits-title">
      <h2 id="benefits-title" className="mock-section-title">Why shoppers love ClothME</h2>
      <div className="mock-benefits-grid">
        {landingBenefits.map((item, index) => {
          const Icon = benefitIcons[index % benefitIcons.length];
          return (
            <article key={item.title} className="mock-benefit">
              <Icon className="mock-icon" />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
