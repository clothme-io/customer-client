const BENEFITS = [
  {
    icon: '💰',
    title: 'Paid Opportunities',
    description: 'Earn money for the content you create. Campaigns, UGC, and paid partnerships.',
  },
  {
    icon: '🤝',
    title: 'Long-Term Partnership',
    description: 'We invest in creators for the long haul — not one-off posts.',
  },
  {
    icon: '⚡',
    title: 'Early Access',
    description: 'Be first to test new products and features before anyone else.',
  },
  {
    icon: '👥',
    title: 'Creator Community',
    description: 'Join a network of like-minded creators building something together.',
  },
  {
    icon: '🔗',
    title: 'Affiliate Opportunities',
    description: 'Earn a commission every time someone shops through your link.',
  },
  {
    icon: '🏪',
    title: 'Potential Creator Storefront',
    description: 'Future opportunity to sell products through your own ClothME store.',
  },
];

export function CreatorBenefits() {
  return (
    <section className="creator-benefits" id="benefits">
      <div className="creator-section-inner">
        <p className="eyebrow">Why Join</p>
        <h2>What's in it for you</h2>
        <div className="creator-benefits-grid">
          {BENEFITS.map(({ icon, title, description }) => (
            <div key={title} className="creator-benefit-item">
              <span className="creator-benefit-icon" aria-hidden="true">{icon}</span>
              <h3 className="creator-benefit-title">{title}</h3>
              <p className="creator-benefit-desc">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
