import { useState } from "react";
import { landingFaq } from "../../data/landing";

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="landing-section landing-faq" id="faq" aria-labelledby="faq-title">
      <div className="section-heading">
        <h2 id="faq-title">FAQ</h2>
      </div>
      <div className="landing-faq-list">
        {landingFaq.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div className={`landing-faq-item${isOpen ? " is-open" : ""}`} key={item.question}>
              <button
                type="button"
                className="landing-faq-trigger"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
              >
                <span>{item.question}</span>
                <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen ? <p className="landing-faq-answer">{item.answer}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
