import { useState } from "react";
import { landingFaq } from "../../data/landing";

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <section className="mock-faq-section" id="faq" aria-labelledby="faq-title">
      <div className="mock-faq-inner">
        <h2 id="faq-title" className="mock-section-title mock-section-title--left mock-faq-heading">
          Frequently asked questions
        </h2>
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
    </section>
  );
}
