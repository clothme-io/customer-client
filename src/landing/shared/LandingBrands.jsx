import { landingBrands } from "../../data/landing";

export function LandingBrands() {
  const loop = [...landingBrands, ...landingBrands];

  return (
    <section className="mock-section mock-brands" id="brands" aria-labelledby="brands-title">
      <h2 id="brands-title" className="mock-display mock-section-title">Shop from brands you love</h2>
      <div className="brand-marquee" aria-label="Featured brands">
        <div className="brand-marquee-track">
          {loop.map((brand, index) => (
            <div className="brand-marquee-item" key={`${brand.name}-${index}`}>
              {brand.logo ? <img src={brand.logo} alt={brand.name} /> : <span>{brand.name}</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
