import { IconShield } from "./LandingIcons";

export function LandingPrivacy() {
  return (
    <section className="landing-section landing-privacy" id="privacy" aria-labelledby="privacy-title">
      <div className="landing-privacy-card">
        <IconShield className="landing-icon" />
        <h2 id="privacy-title">Your Privacy Matters</h2>
        <ul>
          <li>Your shopping experience belongs to you.</li>
          <li>Your personal information stays protected.</li>
          <li>Any insights shared with brands are aggregated and anonymized.</li>
        </ul>
      </div>
    </section>
  );
}
