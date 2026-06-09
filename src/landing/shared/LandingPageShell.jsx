import { Header } from "../../components/Header";
import { WaitlistModal } from "../../components/WaitlistModal";
import { LandingBlogPreview } from "./LandingBlogPreview";
import { LandingFamilyNote } from "./LandingFamilyNote";
import { LandingHero } from "./LandingHero";
import { LandingHowItWorks } from "./LandingHowItWorks";

export function LandingPageShell({ className, isModalOpen, onCloseModal, onWaitlistSubmit, posts }) {
  const content = (
    <>
      <Header />
      <main id="top">
        <LandingHero onWaitlistSubmit={onWaitlistSubmit} />
        <LandingHowItWorks />
        <LandingFamilyNote />
        <LandingBlogPreview posts={posts} />
      </main>
      <WaitlistModal isOpen={isModalOpen} onClose={onCloseModal} />
    </>
  );

  if (!className) {
    return content;
  }

  return <div className={className}>{content}</div>;
}
