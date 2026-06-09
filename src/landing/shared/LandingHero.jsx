export function LandingHero({ onWaitlistSubmit }) {
  return (
    <section className="hero">
      <div className="hero-content">
        <p className="eyebrow">Coming soon</p>
        <h1>Shop clothes that fit you and your family.</h1>
        <p className="hero-text">
          ClothME helps you generate fashion sizes from two photos, save sizes for family members, and find products that match each person's fit, style, color, fabric, and brand preferences.
        </p>

        <form className="waitlist-form" id="waitlist" onSubmit={onWaitlistSubmit}>
          <label className="sr-only" htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" placeholder="Enter your email" autoComplete="email" required />
          <button type="submit">Reserve Your Spot</button>
        </form>

        <p className="privacy-note">Early access invites will be sent by email. No spam.</p>
      </div>

      <div className="hero-visual" aria-label="ClothME shopping preview">
        <figure>
          <img src="/family-shopping.jpg" alt="Mother and children smiling while using a smartphone" />
          <figcaption>Shop for family</figcaption>
        </figure>
        <figure>
          <img src="/personal-shopping.jpg" alt="Woman smiling while shopping on her smartphone" />
          <figcaption>Shop for yourself</figcaption>
        </figure>
      </div>
    </section>
  );
}
