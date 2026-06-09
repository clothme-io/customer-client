export function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="ClothME home">
        <img className="brand-logo" src="/clothme-logo.png" alt="" aria-hidden="true" />
        <span>ClothME</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="/#how">How it works</a>
        <a href="/blog">Blog</a>
      </nav>
    </header>
  );
}
