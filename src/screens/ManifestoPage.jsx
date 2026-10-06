import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { SEO } from "../components/SEO";

export function ManifestoPage() {
  return (
    <div className="theme-blue-landing">
      <SEO
        title="The ClothME Manifesto"
        description="Our vision: the operating system of fashion retail. Discover how ClothME connects fit, family shopping, local fashion and businesses."
        path="/manifesto"
      />
      <Header />
      <main id="main" className="about-page">
        <article>
          <header className="about-intro">
            <div className="about-content">
              <h1>The ClothME Manifesto</h1>
              <h2>Our vision: the operating system of fashion retail.</h2>
              <p className="about-lead">Fashion is personal. Shopping should be too.</p>
              <p>What fits your body. What suits your life. Who you’re shopping for. What’s available nearby. These things should shape your experience from the beginning.</p>
              <p>We’re building ClothME to make that possible—and to connect the people, products and businesses behind fashion in a more useful way.</p>
            </div>
          </header>

          <div className="about-content about-story">
            <section aria-labelledby="manifesto-person">
              <h2 id="manifesto-person">Start with the person</h2>
              <p>Every decision begins with a question: <strong>How does this improve the customer’s life?</strong></p>
              <p>Can we save them time? Help them choose with more confidence? Make shopping for their family easier? Introduce them to a business they’ll love?</p>
              <p>Growth matters because it allows us to serve more people. It has to come with an experience worth returning to.</p>
            </section>

            <section aria-labelledby="manifesto-fit">
              <h2 id="manifesto-fit">Make fit the foundation</h2>
              <p>Today, shoppers repeatedly work out their size across different brands and stores.</p>
              <p>We believe a personal Fit Profile should become a reusable part of shopping—helping people discover suitable products wherever they choose to buy.</p>
              <p>ClothME starts with fit-powered discovery in our marketplace. Our longer-term ambition is to make that fit intelligence useful across other stores, websites and apps through <strong>Sign in with ClothME</strong> and partner integrations.</p>
              <p>One profile should become more useful as more businesses connect to it.</p>
            </section>

            <section aria-labelledby="manifesto-families">
              <h2 id="manifesto-families">Build around real families</h2>
              <p>An account can represent more than one shopper.</p>
              <p>It can hold a parent’s preferences, a child’s changing size and a partner’s Fit Profile. With permission, family connections can make birthdays, anniversaries and everyday gifting more thoughtful.</p>
              <p>We want ClothME to understand who you’re shopping for, while giving each person control over what they share.</p>
            </section>

            <section aria-labelledby="manifesto-local">
              <h2 id="manifesto-local">Bring local fashion into everyday discovery</h2>
              <p>Local stores hold products, expertise and personality that deserve to be easier to find.</p>
              <p>Our vision connects online browsing with what’s available in the real world: discover a piece nearby, check its suitability, reserve it and visit the store—or have it delivered.</p>
              <p>A boutique’s physical location should be an advantage. ClothME should help turn nearby interest into meaningful customer relationships.</p>
            </section>

            <section aria-labelledby="manifesto-businesses">
              <h2 id="manifesto-businesses">Give fashion businesses room to grow</h2>
              <p>Small brands, independent designers, resellers, boutiques and established retailers all have a place in ClothME.</p>
              <p>We want to help them reach the right customers, manage their presence and understand demand without assembling an overwhelming collection of tools.</p>
              <p>Our marketplace model reflects that commitment: no setup, subscription or listing fees. We earn a commission when we generate a sale.</p>
              <p>As we expand, optional services should offer clear value, with clear choices.</p>
            </section>

            <section aria-labelledby="manifesto-discovery">
              <h2 id="manifesto-discovery">Make discovery useful</h2>
              <p>A new product should have a better chance of reaching someone it suits.</p>
              <p>We plan to connect fit, preferences, location and availability so that recommendations and notifications become more relevant.</p>
              <p>Sponsored discovery must meet the same standard: useful to the shopper, clearly identified and worthy of their attention.</p>
              <p>Attention is something we earn.</p>
            </section>

            <section aria-labelledby="manifesto-decisions">
              <h2 id="manifesto-decisions">Help the industry make better decisions</h2>
              <p>Better retail begins with better understanding.</p>
              <p>We want to help businesses see where demand exists, which products attract interest and where fit creates friction. Aggregated insights can support more informed decisions about assortments, stock and future collections.</p>
              <p>Our ambition is to help reduce avoidable returns, unsold inventory and wasted effort. We’ll measure progress through actual outcomes.</p>
            </section>

            <section aria-labelledby="manifesto-trust">
              <h2 id="manifesto-trust">Earn trust as we grow</h2>
              <p>Fit Profiles and family connections involve personal information. Protecting that information is part of building the product well.</p>
              <p>We believe people should understand how their data is used and have meaningful control over it. Business insights should help retailers without exposing individual customers.</p>
              <p>Trust must grow alongside the platform.</p>
            </section>

            <section aria-labelledby="manifesto-experience">
              <h2 id="manifesto-experience">Connect the experience</h2>
              <p>Becoming the operating system of fashion retail means making the parts work together:</p>
              <p><strong>Fit. Discovery. Family shopping. Local inventory. Store connections. Checkout. Pickup. Delivery. Customer relationships. Business insights.</strong></p>
              <p>We’ll build toward that vision step by step, proving each part solves a real problem before expanding it.</p>
              <p>ClothME should become a useful connection between the way people want to shop and the way fashion businesses need to operate.</p>
            </section>

            <section className="about-promise" aria-labelledby="manifesto-together">
              <h2 id="manifesto-together">Build it together</h2>
              <p>Our team makes this vision possible. Every role contributes to the customer experience, and every team member deserves the clarity, support and ownership to improve it.</p>
              <p>Our customers and vendors will help shape what comes next. We’ll listen closely, act on feedback and remain accountable for the experience we deliver.</p>
              <p><strong>That is the future we’re working toward: fashion retail that understands people better, helps businesses thrive and makes shopping feel more personal.</strong></p>
              <p><strong>That is ClothME.</strong></p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
