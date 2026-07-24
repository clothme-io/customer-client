import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { WaitlistModal } from "../../components/WaitlistModal";
import { LandingBenefits } from "./LandingBenefits";
import { LandingBrands } from "./LandingBrands";
import { LandingFamily } from "./LandingFamily";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingHero } from "./LandingHero";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingImagine } from "./LandingImagine";
import { LandingTrustFaq } from "./LandingTrustFaq";

export function LandingPageShell({ className, isModalOpen, onCloseModal, onWaitlistSubmit }) {
  const content = (
    <>
      <Header />
      <main id="main" className="mock-landing">
        <LandingHero onWaitlistSubmit={onWaitlistSubmit} />
        <LandingBenefits />
        <LandingHowItWorks />
        <LandingImagine />
        <LandingBrands />
        <LandingFamily />
        <LandingTrustFaq />
        <LandingFinalCta onWaitlistSubmit={onWaitlistSubmit} />
      </main>
      <Footer />
      <WaitlistModal isOpen={isModalOpen} onClose={onCloseModal} />
    </>
  );

  if (!className) {
    return content;
  }

  return <div className={className}>{content}</div>;
}
