import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { SEO } from "../components/SEO";

const legalRights = [
  "Request access to your personal data.",
  "Request correction of your personal data.",
  "Request erasure of your personal data.",
  "Object to processing of your personal data.",
  "Request restriction of processing your personal data.",
  "Request transfer of your personal data.",
  "Right to withdraw consent."
];

const dataSecurityText = "We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed.";
const dataSecurityAccessText = "In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.";

function renderRemainingPolicy() {
  return (
    <>
      <section>
        <h2>4. Data Security</h2>
        <p>{dataSecurityText} {dataSecurityAccessText}</p>
      </section>
      <section>
        <h2>5. Your Legal Rights</h2>
        <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including:</p>
        <ul>
          {legalRights.map((right) => (
            <li key={right}>{right}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2>6. Contact Us</h2>
        <p>If you have any questions about this privacy policy or our privacy practices, please contact us at:</p>
        <p>Email: privacy@clothme.io</p>
        <p>Address: Suite 250 - #1430, 97 Seymour St. Vancouver, V6B 3M1 BC, Canada</p>
      </section>
    </>
  );
}

export function PrivacyPolicyPage() {
  return (
    <>
      <SEO
        title="Privacy Policy | ClothME"
        description="Read the ClothME privacy policy, including how we handle personal data, body measurement photos, and Face ID authentication."
        path="/privacy-policy"
      />
      <Header />
      <main className="legal-shell">
        <article className="legal-page">
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last updated: May 5, 2026</p>

          <section>
            <h2>1. Introduction</h2>
            <p>At ClothME ("we", "our", or "us"), we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.</p>
          </section>

          <section>
            <h2>2. The Data We Collect About You</h2>
            <p>Personal data means any information about an individual from which that person can be identified. We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul>
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
              <li><strong>Usage Data</strong> includes information about how you use our website, products, and services.</li>
              <li><strong>Marketing and Communications Data</strong> includes your preferences in receiving marketing from us and our third parties and your communication preferences.</li>
            </ul>
            <h3>Body Measurement Photo Data</h3>
            <p>When you use the size measurement feature in our mobile app, the app captures two photos — one front-facing and one side-facing — using your device camera. These photos are transmitted securely to our servers solely for the purpose of calculating your clothing size measurements. The photos are not stored, retained, or used for any other purpose after processing is complete. No photo data is shared with third parties.</p>
            <h3>Biometric Authentication (Face ID)</h3>
            <p>Our mobile app offers Face ID as an option to securely authenticate your identity when signing in to your account. ClothME does not access, collect, process, or store any facial or biometric data. Face ID authentication is handled entirely by iOS on your device, and no biometric information is ever transmitted to our servers or shared with any third party.</p>
          </section>

          <section>
            <h2>3. How We Use Your Personal Data</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul>
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal obligation.</li>
            </ul>
          </section>
          {renderRemainingPolicy()}
        </article>
      </main>
      <Footer />
    </>
  );
}
