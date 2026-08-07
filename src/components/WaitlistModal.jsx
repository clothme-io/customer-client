import { landingPerk } from "../data/landing";

export function WaitlistModal({ isOpen, onClose }) {
  return (
    <div className={`modal-backdrop${isOpen ? " open" : ""}`} id="success-modal" aria-hidden={!isOpen}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="close-button" type="button" aria-label="Close modal" onClick={onClose}>
          &times;
        </button>
        <p className="modal-logo" aria-label="ClothME">C<span className="brand-lower-l">l</span>othME</p>
        <h2 id="modal-title">You're on the waitlist.</h2>
        <p>Thanks for joining. We'll email you when ClothME early access opens.</p>
        <p className="modal-perk">{landingPerk.text}</p>
        <a
          className="modal-instagram"
          href="https://www.instagram.com/clothme_io"
          target="_blank"
          rel="noreferrer"
        >
          Follow us on Instagram
        </a>
      </div>
    </div>
  );
}
