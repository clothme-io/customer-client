import { landingNav } from "../data/landing";

export function Header() {
  return (
    <header className="site-header landing-header">
      <a className="brand" href="/" aria-label="ClothME home">
        <img className="brand-logo" src="/clothme-logo.png" alt="" aria-hidden="true" />
        <span className="brand-word" aria-label="ClothME">C<span className="brand-lower-l">l</span>othME</span>
      </a>
      <nav aria-label="Primary navigation">
        {landingNav.map((item) => (
          <a key={item.href} href={item.href}>{item.label}</a>
        ))}
      </nav>
      <a className="header-cta" href="/#waitlist">Join Early Access</a>
    </header>
  );
}
