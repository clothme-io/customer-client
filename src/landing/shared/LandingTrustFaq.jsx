import { useState } from "react";
import { landingFaq, landingPrivacyPoints } from "../../data/landing";
import { IconCheck, IconShield } from "./LandingIcons";

export function LandingTrustFaq() {
  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <section className="mock-trust-band" id="faq" aria-labelledby="faq-title">
      <div className="mock-trust-faq">
        <div className="mock-privacy">
          <div className="mock-privacy-badge" aria-hidden="true">
            <IconShield className="mock-icon" />
          </div>
          <h2 className="mock-section-title mock-section-title--left">We protect your privacy</h2>
          <ul className="mock-check-list">
            {landingPrivacyPoints.map((line) => (
              <li key={line}>
                <IconCheck className="mock-check mock-check--accent" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mock-faq">
          <h2 id="faq-title" className="mock-section-title mock-section-title--left">Frequently asked questions</h2>
          <div className="mock-faq-list">
            {landingFaq.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div className={`mock-faq-item${isOpen ? " is-open" : ""}`} key={item.question}>
                  <button
                    type="button"
                    className="mock-faq-trigger"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  >
                    <span>{item.question}</span>
                    <span className="mock-faq-chevron" aria-hidden="true">{isOpen ? "▴" : "▾"}</span>
                  </button>
                  {isOpen ? <p className="mock-faq-answer">{item.answer}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
