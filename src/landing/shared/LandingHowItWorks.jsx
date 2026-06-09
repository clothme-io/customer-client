export function LandingHowItWorks() {
  return (
    <section className="how" id="how" aria-labelledby="how-title">
      <div className="section-heading">
        <p className="eyebrow">How ClothME works</p>
        <h2 id="how-title">A simpler way to shop for the right size.</h2>
      </div>
      <div className="steps">
        <article>
          <span>01</span>
          <h3>Create your size</h3>
          <p>Use two photos to generate a fashion size profile.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Add family members</h3>
          <p>Save sizes for your kids, spouse, partner, or anyone you shop for.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Shop matched products</h3>
          <p>See only fashion products that match size from brands you love in your location.</p>
        </article>
      </div>
    </section>
  );
}
