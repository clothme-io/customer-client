import { AppDownloadForm } from "../../components/AppDownloadForm";

export function LandingFinalCta() {
  return (
    <section className="mock-final-cta" id="join" aria-labelledby="final-cta-title">
      <div className="mock-final-cta-inner">
        <h2 id="final-cta-title" className="mock-display">
          Be the first to experience shopping that finally fits.
        </h2>

        <div className="mock-perk mock-perk--centered">
          <p className="mock-perk-text">Send me a download link for the app.</p>
        </div>

        <AppDownloadForm />
      </div>
    </section>
  );
}
