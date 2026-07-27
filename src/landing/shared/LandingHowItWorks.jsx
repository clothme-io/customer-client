import { landingSteps } from "../../data/landing";
import { IconArrow, stepIcons } from "./LandingIcons";

export function LandingHowItWorks() {
  return (
    <section className="mock-section mock-how" id="how" aria-labelledby="how-title">
      <h2 id="how-title" className="mock-section-title">How ClothME works</h2>
      <div className="mock-steps">
        {landingSteps.map((step, index) => {
          const Icon = stepIcons[index % stepIcons.length];
          return (
            <div className="mock-step-wrap" key={step.title}>
              <article className="mock-step">
                <span className="mock-step-num">{index + 1}</span>
                <div className="mock-step-bubble">
                  <Icon className="mock-icon" />
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
              {index < landingSteps.length - 1 ? (
                <div className="mock-step-arrow" aria-hidden="true">
                  <IconArrow />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
