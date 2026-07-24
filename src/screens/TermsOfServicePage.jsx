import Link from "next/link";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { SEO } from "../components/SEO";

export function TermsOfServicePage() {
  return (
    <>
      <SEO
        title="Customer Terms of Service | ClothME"
        description="Read the terms governing your access to and use of ClothME's website, mobile applications, and related services."
        path="/terms-of-service"
      />
      <Header />
      <main className="legal-shell">
        <article className="legal-page">
          <h1>ClothME Customer Terms of Service</h1>
          <p className="legal-updated">Effective Date: July 24, 2026</p>

          <section>
            <p>Welcome to ClothME (&quot;ClothME,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).</p>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the ClothME website, mobile
              applications, and related services (collectively, the &quot;Services&quot;).
            </p>
            <p>
              By creating an account or using ClothME, you agree to these Terms. If you do not agree, please do not use
              our Services.
            </p>
          </section>

          <section>
            <h2>1. About ClothME</h2>
            <p>
              ClothME is a customer growth platform that helps shoppers discover clothing that fits while helping
              fashion brands acquire customers, reduce fit-related returns, and grow sales.
            </p>
            <p>
              Our Services include personalized Fit Profiles, product recommendations, local boutique discovery,
              creator content, family profiles, and shopping tools.
            </p>
            <p>
              Unless otherwise stated, products available through ClothME are sold by independent brands, boutiques,
              or retailers—not by ClothME.
            </p>
          </section>

          <section>
            <h2>2. Eligibility</h2>
            <p>
              You must be at least 13 years old, or the minimum legal age in your jurisdiction, to create an account.
            </p>
            <p>
              If you are under the age of majority in your jurisdiction, you may only use ClothME with the involvement
              of a parent or legal guardian.
            </p>
            <p>
              By creating an account, you represent that the information you provide is accurate and that you have the
              legal capacity to accept these Terms.
            </p>
          </section>

          <section>
            <h2>3. Your Account</h2>
            <p>You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your login credentials.</li>
              <li>Keeping your account information accurate and up to date.</li>
              <li>All activity that occurs under your account.</li>
            </ul>
            <p>
              You agree to notify ClothME immediately if you believe your account has been accessed without
              authorization.
            </p>
          </section>

          <section>
            <h2>4. Fit Profiles</h2>
            <p>ClothME allows you to create personalized Fit Profiles to improve clothing recommendations.</p>
            <p>Fit Profiles may include information such as:</p>
            <ul>
              <li>Height</li>
              <li>Weight</li>
              <li>Body measurements</li>
              <li>Clothing sizes</li>
              <li>Fit preferences</li>
              <li>Style preferences</li>
            </ul>
            <p>
              Recommendations are based on the information you provide and are intended to assist your shopping
              decisions. They do not guarantee that a product will fit perfectly.
            </p>
          </section>

          <section>
            <h2>5. Family Profiles</h2>
            <p>You may create profiles for members of your household.</p>
            <p>
              By creating a Family Profile, you confirm that you have permission to provide the information entered
              for that individual.
            </p>
            <p>You are responsible for managing all Family Profiles linked to your account.</p>
          </section>

          <section>
            <h2>6. Shopping Through ClothME</h2>
            <p>ClothME helps you discover products from participating brands and boutiques.</p>
            <p>Products may be purchased:</p>
            <ul>
              <li>Through a brand&apos;s online store</li>
              <li>Through integrated ecommerce platforms</li>
              <li>Through future purchasing methods supported by ClothME</li>
            </ul>
            <p>
              The seller identified at checkout is responsible for the sale, fulfillment, shipping, returns,
              warranties, and customer support unless otherwise stated.
            </p>
          </section>

          <section>
            <h2>7. Pricing and Availability</h2>
            <p>Prices, inventory, promotions, and availability are determined by participating brands.</p>
            <p>
              Although ClothME strives to display accurate information, we cannot guarantee that product details,
              pricing, or inventory will always be current or error-free.
            </p>
            <p>Brands may change pricing or availability without notice.</p>
          </section>

          <section>
            <h2>8. Returns and Refunds</h2>
            <p>
              Returns, exchanges, refunds, and warranty claims are governed by the policies of the brand or retailer
              from whom you purchased the product.
            </p>
            <p>
              ClothME may assist in facilitating communication where appropriate but is not responsible for return
              decisions made by participating brands.
            </p>
          </section>

          <section>
            <h2>9. Creator Content</h2>
            <p>ClothME may feature content created by creators, influencers, or brand ambassadors.</p>
            <p>
              Creator opinions, reviews, and recommendations reflect their own experiences and do not constitute
              guarantees or endorsements by ClothME.
            </p>
          </section>

          <section>
            <h2>10. User Content</h2>
            <p>You may submit content such as:</p>
            <ul>
              <li>Reviews</li>
              <li>Ratings</li>
              <li>Photos</li>
              <li>Comments</li>
              <li>Outfit inspiration</li>
              <li>Profile information</li>
            </ul>
            <p>You retain ownership of your content.</p>
            <p>
              By submitting content to ClothME, you grant us a non-exclusive, worldwide, royalty-free license to use,
              display, reproduce, and distribute that content in connection with operating and promoting the Services.
            </p>
            <p>You represent that you own or have permission to share any content you submit.</p>
          </section>

          <section>
            <h2>11. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use ClothME for unlawful purposes.</li>
              <li>Submit false or misleading information.</li>
              <li>Attempt to gain unauthorized access to the platform.</li>
              <li>Upload malicious software or harmful code.</li>
              <li>Infringe another person&apos;s intellectual property rights.</li>
              <li>Harass, abuse, or threaten other users.</li>
              <li>Attempt to manipulate recommendations, reviews, or platform features.</li>
            </ul>
          </section>

          <section>
            <h2>12. Intellectual Property</h2>
            <p>
              All ClothME software, branding, logos, graphics, and platform content are owned by ClothME or its
              licensors and are protected by applicable intellectual property laws.
            </p>
            <p>These Terms do not grant you ownership of any ClothME intellectual property.</p>
          </section>

          <section>
            <h2>13. Privacy</h2>
            <p>
              Your use of ClothME is also governed by our <Link href="/privacy-policy">Privacy Policy</Link>, which
              explains how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2>14. Third-Party Services</h2>
            <p>
              ClothME may integrate with third-party services, including ecommerce platforms, payment providers,
              social media platforms, and mapping services.
            </p>
            <p>Your use of those services may also be subject to their own terms and privacy policies.</p>
          </section>

          <section>
            <h2>15. Suspension or Termination</h2>
            <p>We may suspend or terminate your account if you:</p>
            <ul>
              <li>Violate these Terms.</li>
              <li>Engage in fraudulent or illegal activity.</li>
              <li>Misuse the Services.</li>
              <li>Interfere with the operation or security of the platform.</li>
            </ul>
            <p>You may stop using ClothME or delete your account at any time.</p>
          </section>

          <section>
            <h2>16. Disclaimer</h2>
            <p>ClothME is provided on an &quot;as is&quot; and &quot;as available&quot; basis.</p>
            <p>
              We strive to provide accurate recommendations and a reliable shopping experience, but we do not
              guarantee:
            </p>
            <ul>
              <li>Product availability</li>
              <li>Product quality</li>
              <li>Perfect fit</li>
              <li>Uninterrupted access to the Services</li>
              <li>Error-free operation</li>
            </ul>
          </section>

          <section>
            <h2>17. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, ClothME is not liable for indirect, incidental, consequential,
              special, or punitive damages arising from your use of the Services.
            </p>
            <p>
              Where permitted by law, ClothME&apos;s total liability relating to the Services will not exceed the
              greater of the amount you paid directly to ClothME for the Services in the previous twelve (12) months or
              USD $100.
            </p>
            <p>Nothing in these Terms limits liability that cannot legally be excluded under applicable law.</p>
          </section>

          <section>
            <h2>18. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless ClothME, its affiliates, officers, employees, and contractors
              from claims, damages, liabilities, and expenses arising from:
            </p>
            <ul>
              <li>Your use of the Services.</li>
              <li>Your violation of these Terms.</li>
              <li>Your infringement of another person&apos;s rights.</li>
              <li>Your violation of applicable law.</li>
            </ul>
          </section>

          <section>
            <h2>19. Changes to These Terms</h2>
            <p>We may update these Terms from time to time.</p>
            <p>
              If we make material changes, we will update the &quot;Effective Date&quot; and notify users through the
              Services or by email where required by law.
            </p>
            <p>
              Your continued use of ClothME after the updated Terms become effective constitutes your acceptance of the
              revised Terms.
            </p>
          </section>

          <section>
            <h2>20. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Province of British Columbia and the federal laws of Canada
              applicable therein, without regard to conflict of law principles.
            </p>
            <p>
              Any disputes arising from these Terms shall be resolved in the courts located in British Columbia,
              unless applicable law provides otherwise.
            </p>
          </section>

          <section>
            <h2>21. Contact Us</h2>
            <p>If you have questions about these Terms, please contact:</p>
            <p>
              <strong>ClothME</strong>
            </p>
            <p>
              Email: <a href="mailto:legal@clothme.io">legal@clothme.io</a>
            </p>
            <p>
              Website:{" "}
              <a href="https://clothme.io" target="_blank" rel="noreferrer">
                https://clothme.io
              </a>
            </p>
          </section>

          <section>
            <p>
              By creating an account or using ClothME, you acknowledge that you have read, understood, and agree to
              these Terms of Service.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
