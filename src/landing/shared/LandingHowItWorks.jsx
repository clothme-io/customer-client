import { useEffect, useState } from "react";
import { landingImages, landingSteps } from "../../data/landing";
import { FitScoreBadge } from "./FitScoreBadge";
import { IconArrow, stepIcons } from "./LandingIcons";
import { IphoneFrame } from "./IphoneFrame";

function DemoMedia() {
  const phone = landingImages.howPhone;
  const demo = landingImages.demoVideo;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const showVideo = Boolean(demo.src) && !reduceMotion;

  if (showVideo) {
    return (
      <div className="mock-how-visual">
        <div className="iphone-frame iphone-frame--how">
          <div className="iphone-frame-bezel">
            <div className="iphone-frame-island" aria-hidden="true" />
            <div className="iphone-frame-screen">
              <video
                className="mock-demo-video"
                poster={demo.poster || phone.src}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              >
                <source src={demo.src} type="video/mp4" />
              </video>
            </div>
            <div className="iphone-frame-home" aria-hidden="true" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-how-visual">
      <IphoneFrame
        src={phone.src}
        alt={phone.alt}
        className="iphone-frame--how"
        loading="lazy"
      />
    </div>
  );
}

export function LandingHowItWorks() {
  return (
    <section className="mock-section mock-how" id="how" aria-labelledby="how-title">
      <div className="mock-section-heading">
        <FitScoreBadge className="fit-score-badge--inline" decorative />
        <h2 id="how-title" className="mock-section-title">
          How ClothME works
        </h2>
      </div>

      <div className="mock-how-layout">
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

        <DemoMedia />
      </div>
    </section>
  );
}
