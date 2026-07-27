import { landingImages, landingWelcomeCards } from "../../data/landing";

export function LandingWelcome() {
  const image = landingImages.welcome;

  return (
    <section className="landing-section landing-welcome" id="welcome" aria-labelledby="welcome-title">
      <div className="section-heading">
        <h2 id="welcome-title">Welcome to Personalized Shopping</h2>
      </div>
      <div className="landing-welcome-layout">
        <div className="landing-phone" aria-hidden="true">
          <div className="landing-phone-frame">
            <img src={image.src} alt="" />
          </div>
        </div>
        <div className="landing-welcome-cards">
          {landingWelcomeCards.map((card) => (
            <article key={card.title} className="landing-feature-row">
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
