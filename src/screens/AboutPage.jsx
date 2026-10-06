import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { SEO } from "../components/SEO";

export function AboutPage() {
  return (
    <div className="theme-blue-landing">
      <SEO
        title="About ClothME | Better fit. More discovery."
        description="ClothME is a fashion marketplace built around you—your fit, your family and the brands you’ll love discovering."
        path="/about"
      />
      <Header />
      <main id="main" className="about-page">
        <article>
          <header className="about-intro">
            <div className="about-content">
              <p className="eyebrow">About ClothME</p>
              <h1>Better fit. More discovery. Shopping made personal.</h1>
              <p className="about-lead">ClothME is a fashion marketplace built around you—your fit, your family and the brands you’ll love discovering.</p>
              <p>We believe finding clothes should feel exciting. Whether you’re shopping for yourself, your kids or someone special, you deserve a simpler way to find pieces that suit your life and are likely to fit.</p>
            </div>
          </header>

          <div className="about-content about-story">
            <section aria-labelledby="about-why">
              <h2 id="about-why">Why we’re building ClothME</h2>
              <p>A size label only tells part of the story. The same size can fit differently across brands, making shopping a cycle of guessing, ordering and returning.</p>
              <p>At the same time, great fashion businesses—from independent designers to neighbourhood boutiques and established brands—can struggle to reach the people their products are right for.</p>
              <p>We started ClothME to bring those two sides closer together: helping people discover fashion that fits, while helping businesses find the right customers.</p>
            </section>

            <section aria-labelledby="about-fit">
              <h2 id="about-fit">Your fit comes first</h2>
              <p>With your height and two photos, ClothME creates a personal Fit Profile to help recommend suitable products and sizes.</p>
              <p>Instead of starting every shopping trip with “What size am I in this brand?”, you can start with what you like.</p>
              <p>Our goal is to give you more confidence before you buy, save you time and reduce avoidable fit-related returns.</p>
            </section>

            <section aria-labelledby="about-family">
              <h2 id="about-family">Built for everyone you shop for</h2>
              <p>Shopping often means thinking about more than yourself.</p>
              <p>ClothME brings multiple Fit Profiles into one family account, making it easier to shop for your children, your partner and yourself while keeping everyone’s fit personal.</p>
              <p>From everyday essentials to a thoughtful gift, we want shopping for someone you love to feel easier.</p>
            </section>

            <section aria-labelledby="about-local">
              <h2 id="about-local">Discover what’s closer to you</h2>
              <p>Some of your next favourite pieces might be in a boutique just around the corner.</p>
              <p>ClothME connects online discovery with local fashion, helping you explore nearby businesses alongside a wider range of brands. With participating stores, you can reserve an item and pick it up in person, or choose delivery.</p>
            </section>

            <section aria-labelledby="about-businesses">
              <h2 id="about-businesses">Helping fashion businesses grow</h2>
              <p>Vendors are an essential part of ClothME. We’re building tools that help businesses of every size reach suitable customers, understand demand and make better decisions with less complexity.</p>
              <p>There are no setup, subscription or listing fees. ClothME earns a marketplace commission when we generate a sale.</p>
              <p>By improving how products find their customers, we aim to support stronger fashion businesses and help reduce waste across the industry.</p>
            </section>

            <section className="about-promise" aria-labelledby="about-promise">
              <h2 id="about-promise">Our promise</h2>
              <p>Customers come first. We’ll keep listening, learning and improving—with care for the people who shop with us and the businesses that make their discoveries possible.</p>
              <p><strong>Shopping that finally fits—for you and everyone you shop for.</strong></p>
              <a className="about-cta" href="https://clothme.io/#get-your-size">Get your size</a>
            </section>

            <section aria-labelledby="about-addresses">
              <h2 id="about-addresses">Our addresses</h2>
              <div className="about-addresses">
                <div>
                  <h3>Canada</h3>
                  <address>Suite 250 - #1430, 97 Seymour St, Vancouver, BC V6B 3M1, Canada</address>
                </div>
                <div>
                  <h3>United States</h3>
                  <address>3413 GALT OCEAN DR FORT LAUDERDALE, FLORIDA 33308, BROWARD, FLORIDA</address>
                </div>
              </div>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
