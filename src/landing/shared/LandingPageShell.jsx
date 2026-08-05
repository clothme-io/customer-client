import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { WaitlistModal } from "../../components/WaitlistModal";
import { LandingBenefits } from "./LandingBenefits";
// import { LandingBrands } from "./LandingBrands"; // restore when brand logos are ready
import { LandingBlogPreview } from "./LandingBlogPreview";
import { LandingFamily } from "./LandingFamily";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingHero } from "./LandingHero";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingImagine } from "./LandingImagine";
import { LandingReveal } from "./LandingReveal";
import { LandingStatement } from "./LandingStatement";
import { LandingTrustFaq } from "./LandingTrustFaq";

export function LandingPageShell({ className, isModalOpen, onCloseModal, onWaitlistSuccess }) {
  const content = (
    <>
      <Header />
      <main id="main" className="mock-landing">
        <LandingReveal className="landing-reveal--hero" eager>
          <LandingHero onWaitlistSuccess={onWaitlistSuccess} />
        </LandingReveal>
        <LandingReveal>
          <LandingBenefits />
        </LandingReveal>
        <LandingReveal>
          <LandingHowItWorks />
        </LandingReveal>
        <LandingReveal>
          <LandingImagine />
        </LandingReveal>
        {/* Brands marquee — uncomment when logos are ready
        <LandingReveal>
          <LandingBrands />
        </LandingReveal>
        */}
        <LandingReveal>
          <LandingStatement />
        </LandingReveal>
        <LandingReveal>
          <LandingFamily />
        </LandingReveal>
        <LandingReveal>
          <LandingTrustFaq />
        </LandingReveal>
        <LandingReveal>
          <LandingBlogPreview />
        </LandingReveal>
        <LandingReveal>
          <LandingFinalCta onWaitlistSuccess={onWaitlistSuccess} />
        </LandingReveal>
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
