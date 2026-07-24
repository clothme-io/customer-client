import { landingWhyLove } from "../../data/landing";
import { whyLoveIcons } from "./LandingIcons";

export function LandingWhyLove() {
  return (
    <section className="landing-section landing-why" id="why" aria-labelledby="why-title">
      <div className="section-heading">
        <h2 id="why-title">Why You'll Love ClothME</h2>
      </div>
      <div className="landing-why-grid">
        {landingWhyLove.map((item, index) => {
          const Icon = whyLoveIcons[index % whyLoveIcons.length];
          return (
            <article key={item.title} className="landing-why-card">
              <Icon className="landing-icon" />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
