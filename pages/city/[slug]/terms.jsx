import Head from "next/head";
import { getCityBySlug } from "../../../src/lib/getCityData";
import { CityHeader } from "../../../src/components/city/CityHeader";
import { CityFooter } from "../../../src/components/city/CityFooter";

export async function getServerSideProps({ params }) {
  const city = await getCityBySlug(params?.slug || "");
  if (!city) return { notFound: true };
  return {
    props: {
      cityName: city.name,
      citySlug: city.slug,
      region: city.region || "",
    },
  };
}

export default function CityTerms({ cityName, citySlug, region }) {
  return (
    <>
      <Head>
        <title>Terms of Service | ClothME</title>
        <meta name="description" content="Read the ClothME Terms of Service." />
      </Head>
      <CityHeader cityName={cityName} />
      <main className="legal-shell">
        <article className="legal-page">
          <h1>Terms of Service</h1>
          <p className="legal-updated">Last updated: May 5, 2026</p>

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using ClothME ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>ClothME is a digital shopping service that generates fashion size profiles and matches users with apparel that fits. The Service is currently in pre-launch and operates a waitlist for early access.</p>
          </section>

          <section>
            <h2>3. User Accounts</h2>
            <p>To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          </section>

          <section>
            <h2>4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Violate any applicable laws or regulations.</li>
              <li>Infringe on the intellectual property rights of others.</li>
              <li>Transmit any harmful, offensive, or disruptive content.</li>
              <li>Attempt to gain unauthorized access to any part of the Service.</li>
            </ul>
          </section>

          <section>
            <h2>5. Intellectual Property</h2>
            <p>All content, features, and functionality of the Service — including but not limited to text, graphics, logos, and software — are the exclusive property of ClothME and are protected by applicable intellectual property laws.</p>
          </section>

          <section>
            <h2>6. Disclaimers</h2>
            <p>The Service is provided "as is" without warranties of any kind, either express or implied. ClothME does not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.</p>
          </section>

          <section>
            <h2>7. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, ClothME shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p>
          </section>

          <section>
            <h2>8. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. We will notify users of significant changes by posting a notice on the Service. Your continued use of the Service after changes constitutes acceptance of the revised terms.</p>
          </section>

          <section>
            <h2>9. Contact Us</h2>
            <p>If you have any questions about these Terms of Service, please contact us at:</p>
            <p>Email: talk2us@clothme.io</p>
            <p>Address: Suite 250 - #1430, 97 Seymour St. Vancouver, V6B 3M1 BC, Canada</p>
          </section>
        </article>
      </main>
      <CityFooter cityName={cityName} region={region} />
    </>
  );
}
