import { landingWhyExist } from "../../data/landing";

export function LandingWhyExist() {
  return (
    <section className="landing-section landing-why-exist" id="why-exist" aria-labelledby="why-exist-title">
      <div className="section-heading">
        <h2 id="why-exist-title">Why We Exist</h2>
      </div>
      <ul className="landing-promise-list">
        {landingWhyExist.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="landing-promise-closer">That's why we built ClothME.</p>
    </section>
  );
}
