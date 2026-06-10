export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <section>
          <h2>About</h2>
          <p>
            We are organizing the world's fashion products by Size/Fit in every city and giving access to brands and consumers by creating a new commerce category <strong>"Fashion Size Commerce"</strong>
          </p>
        </section>
        <section>
          <h2>Contacts</h2>
          <p>Email: talk2us@clothme.io</p>
          <p>Address: Suite 250 - #1430</p>
          <p>97 Seymour St. Vancouver,</p>
          <p>V6B 3M1 BC, Canada</p>
        </section>
        <section>
          <h2>Social</h2>
          <a className="social-link" href="https://www.instagram.com/clothme_io" target="_blank" rel="noreferrer" aria-label="ClothME on Instagram">
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" />
            </svg>
          </a>
        </section>
      </div>
      <div className="footer-bottom">
        <p>&copy; Copyright 2026 ClothME. All rights reserved.</p>
        <a href="/privacy-policy">Privacy Policy</a>
      </div>
    </footer>
  );
}
