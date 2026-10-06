import { landingFooterLinks } from "../data/landing";

export function Footer() {
  return (
    <footer className="site-footer mock-footer">
      <div className="mock-footer-top">
        <div className="mock-footer-brand">
          <a className="brand" href="/" aria-label="ClothME home">
            <img className="brand-logo" src="/clothme-logo.png" alt="" aria-hidden="true" />
            <span className="brand-word" aria-label="ClothME">C<span className="brand-lower-l">l</span>othME</span>
          </a>
          <p>Better fit. Better shopping.</p>
          <div className="mock-socials">
            <a className="social-link" href="https://www.instagram.com/clothme_io" target="_blank" rel="noreferrer" aria-label="ClothME on Instagram">
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mock-footer-cols">
          <section>
            <h2>Shop</h2>
            {landingFooterLinks.shop.map((link) => (
              <a key={link.href + link.label} href={link.href}>{link.label}</a>
            ))}
          </section>
          <section>
            <h2>Company</h2>
            {landingFooterLinks.company.map((link) => (
              <a key={link.href + link.label} href={link.href}>{link.label}</a>
            ))}
          </section>
          <section>
            <h2>Support</h2>
            {landingFooterLinks.support.map((link) => (
              <a key={link.href + link.label} href={link.href}>{link.label}</a>
            ))}
          </section>
        </div>
      </div>

      <div className="footer-bottom mock-footer-bottom">
        <p>&copy; Copyright 2026 ClothME. All rights reserved.</p>
      </div>
    </footer>
  );
}
