export function CreatorHero() {
  return (
    <section className="creator-hero">
      <div className="creator-hero-circle creator-hero-circle--tl" aria-hidden="true">
        <img src="/family-shopping.jpg" alt="" />
      </div>
      <div className="creator-hero-circle creator-hero-circle--tr" aria-hidden="true">
        <img src="/personal-shopping.jpg" alt="" />
      </div>
      <div className="creator-hero-circle creator-hero-circle--bl" aria-hidden="true">
        <img src="/personal-shopping.jpg" alt="" />
      </div>
      <div className="creator-hero-circle creator-hero-circle--br" aria-hidden="true">
        <img src="/family-shopping.jpg" alt="" />
      </div>

      <div className="creator-hero-inner">
        <p className="eyebrow">ClothME Creator Community</p>
        <h1>Join ClothME as a<br />Founding Creator</h1>
        <p className="creator-hero-sub">
          We're building a fashion community — not just looking for content
        </p>
        <div className="creator-hero-ctas">
          <a href="/creators/apply" className="creator-btn-primary">Apply Now</a>
          <a href="#about" className="creator-btn-ghost">Learn More</a>
        </div>
      </div>
    </section>
  );
}
