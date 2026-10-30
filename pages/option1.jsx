import { useState } from "react";
import { SEO } from "../src/components/SEO";
import { LandingSizeTool } from "../src/landing/shared/LandingSizeTool";
import { LandingBlogPreview } from "../src/landing/shared/LandingBlogPreview";
import styles from "./option1.module.css";

const Arrow = () => <span aria-hidden="true">↗</span>;

const features = [
  {
    number: "01",
    title: "A size that makes sense.",
    body: "Build your size profile and see a recommended size before you choose what to buy.",
    image: "/phone-generate-size.png",
    alt: "ClothME screen showing the two-photo size profile process",
    tone: "sky"
  },
  {
    number: "02",
    title: "A store that feels like yours.",
    body: "See products matched to your size profile and preferences, all in one place.",
    image: "/phone-store.png",
    alt: "ClothME store screen with a product and fit recommendation",
    tone: "peach"
  },
  {
    number: "03",
    title: "Everyone you shop for, together.",
    body: "Keep a profile for yourself and the people you love to shop for.",
    image: "/phone-account.png",
    alt: "ClothME account screen with multiple shopper profiles",
    tone: "mint"
  }
];

const previewGuides = [
  {
    slug: "does-pacsun-run-small",
    href: "https://clothme.io/blog/does-pacsun-run-small",
    category: "fit-guide",
    title: "Does PacSun Run Small? a Size-by-Size Guide",
    excerpt: "Does PacSun run small? Only some cuts do. Compare bust, waist, and hip numbers, then see when jeans and shorts need a size up."
  },
  {
    slug: "fabric-hand-meaning",
    href: "https://clothme.io/blog/fabric-hand-meaning",
    category: "personal-style",
    title: "Fabric Hand Meaning: What It Is and How to Judge It",
    excerpt: "Fabric hand is how a fabric feels and behaves when you touch it. Learn the terms, what shapes hand, and how to check it."
  },
  {
    slug: "best-online-shopping-tools",
    href: "https://clothme.io/blog/best-online-shopping-tools",
    category: "family-shopping",
    title: "Best Online Shopping Tools for Fit and Families",
    excerpt: "Compare online shopping tools for price tracking, size finding, and family lists, with trade-offs for fit-aware shoppers."
  }
];

const faqs = [
  {
    question: "How does ClothME find my size?",
    answer: "ClothME uses two photos and a few details to build a size profile. It then uses that profile to show products matched to your fit."
  },
  {
    question: "Do I need a measuring tape?",
    answer: "No. The size profile starts with two photos, so you can begin without taking manual measurements."
  },
  {
    question: "Can I shop for my family?",
    answer: "ClothME is designed for multiple profiles in one account, so you can keep each person's fit information separate."
  },
  {
    question: "What happens to my photos?",
    answer: "Your photos are used to generate your size profile. Read the ClothME privacy policy for details about how your information is handled and how to request deletion."
  }
];

function Cta({ children = "Get your size", light = false }) {
  return (
    <a className={`${styles.cta}${light ? ` ${styles.ctaLight}` : ""}`} href="#size-tool">
      <span>{children}</span><Arrow />
    </a>
  );
}

export default function OptionOnePage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className={styles.page}>
      <SEO
        title="ClothME | Shopping that finally fits"
        description="Create your size profile, discover clothes with your fit in mind, and shop for the people you love. Explore the ClothME experience."
        path="/option1"
        image="/clothme-logo.png"
        robots="noindex,nofollow"
      />

      <header className={styles.header}>
        <a className={styles.wordmark} href="/option1" aria-label="ClothME option one home">Cloth<span>ME</span><span className={styles.wordmarkDot}>.</span></a>
        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#why">Why ClothME</a>
          <a href="#experience">The experience</a>
          <a href="#family">For family</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className={styles.headerCta} href="#size-tool">Get your size <Arrow /></a>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="option1-title">
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>A better way to get dressed starts here</p>
            <h1 id="option1-title">Shopping that <em>finally</em> fits.</h1>
            <p className={styles.heroDescription}>Find your size. Discover clothes that feel like you. Shop for everyone you love, all in one place.</p>
            <Cta />
            <p className={styles.heroNote}>Your size profile starts with two photos.</p>
          </div>
          <div className={styles.heroVisual}>
            <img src="/personal-shopping.jpg" alt="Shopper looking at clothing on her phone" />
            <div className={styles.heroVisualOverlay}>
              <span className={styles.smallLabel}>More confidence in every choice</span>
              <span className={styles.heroVisualMark}>Find it. Love it. Wear it.</span>
            </div>
          </div>
          <a href="#why" className={styles.scrollHint}>Scroll to explore <span aria-hidden="true">↓</span></a>
        </section>

        <section className={styles.statement} id="why" aria-labelledby="why-title">
          <div className={styles.sectionKicker}><span className={styles.kickerLine} /> Why ClothME</div>
          <div>
            <h2 id="why-title">Your clothes should fit <span>your life.</span> Finding them should feel just as easy.</h2>
            <p>Sizes change from brand to brand. The people you shop for have different needs. ClothME brings fit, discovery, and family shopping into one more personal experience.</p>
          </div>
        </section>

        <section className={styles.experience} id="experience" aria-labelledby="experience-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>The ClothME experience</p>
            <h2 id="experience-title">Made around <em>you.</em></h2>
            <p>Less second-guessing. More of the good part of shopping.</p>
          </div>
          <div className={styles.featureGrid}>
            {features.map((item) => (
              <article className={styles.feature} key={item.number}>
                <div className={`${styles.featureMedia} ${styles[item.tone]}`}>
                  <span className={styles.featureNumber}>{item.number} / 03</span>
                  <img src={item.image} alt={item.alt} loading="lazy" />
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.fitSection} id="fit" aria-labelledby="fit-title">
          <div className={styles.fitMedia}>
            <img src="/phone-generate-size.png" alt="ClothME Generate Size screen showing photo instructions" loading="lazy" />
            <div className={styles.fitBadge}>A profile for your fit</div>
          </div>
          <div className={styles.fitContent}>
            <p className={styles.eyebrow}>01 / Your size</p>
            <h2 id="fit-title">Start with your fit. Go wherever your style takes you.</h2>
            <p>Two photos help create your size profile. ClothME uses it to show you products matched to your fit, so you can focus on what works for you.</p>
            <div className={styles.fitSteps}>
              <div><span>01</span><strong>Add two photos</strong><p>No measuring tape to find before you start.</p></div>
              <div><span>02</span><strong>Build your profile</strong><p>Keep your fit information in one place.</p></div>
              <div><span>03</span><strong>See only what fits</strong><p>Browse products matched to your size profile.</p></div>
            </div>
            <Cta />
          </div>
        </section>

        <div className={styles.toolSection}>
          <LandingSizeTool />
        </div>

        <section className={styles.discovery} aria-labelledby="discovery-title">
          <div className={styles.discoveryCopy}>
            <p className={styles.eyebrow}>02 / Your discovery</p>
            <h2 id="discovery-title">More of what you love. Less looking for it.</h2>
            <p>ClothME filters discovery around your size profile, so the products you see are matched to your fit from the start.</p>
          </div>
          <div className={styles.discoveryMedia}>
            <img src="/phone-store.png" alt="Example ClothME store view with jeans and a fit score" loading="lazy" />
            <div className={styles.discoveryCaption}>Browse with fit in mind <Arrow /></div>
          </div>
        </section>

        <section className={styles.family} id="family" aria-labelledby="family-title">
          <div className={styles.familyPhoto}>
            <img src="/family-shopping.jpg" alt="Parent and children looking at clothing on a phone" loading="lazy" />
          </div>
          <div className={styles.familyCopy}>
            <p className={styles.eyebrow}>03 / Your people</p>
            <h2 id="family-title">One account. <em>Everyone</em> you shop for.</h2>
            <p>Make room for the people in your life. Separate profiles help keep their sizes and preferences personal, even when you’re shopping for them.</p>
            <div className={styles.familyChips}><span>You</span><span>Your partner</span><span>Your kids</span><span>Your people</span></div>
          </div>
        </section>

        <section className={styles.trust} aria-labelledby="trust-title">
          <div className={styles.sectionKicker}><span className={styles.kickerLine} /> Made for peace of mind</div>
          <div>
            <h2 id="trust-title">Personal to you. In your control.</h2>
            <p>Your size profile and family information deserve care. ClothME explains how your photos are used and gives you a way to request deletion of your account and associated photos.</p>
            <a href="/privacy-policy" className={styles.textLink}>Read our privacy policy <Arrow /></a>
          </div>
        </section>

        <div className={styles.guidesSection}>
          <LandingBlogPreview limit={3} fallbackPosts={previewGuides} showAllLink allGuidesHref="https://clothme.io/blog" />
        </div>

        <section className={styles.faq} id="faq" aria-labelledby="faq-title">
          <div className={styles.faqIntro}>
            <p className={styles.eyebrow}>Good to know</p>
            <h2 id="faq-title">A few things you might be wondering.</h2>
          </div>
          <div className={styles.faqList}>
            {faqs.map((item, index) => (
              <div className={styles.faqItem} key={item.question}>
                <button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                  <span>{item.question}</span><span aria-hidden="true">{openFaq === index ? "−" : "+"}</span>
                </button>
                {openFaq === index && <p>{item.answer}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-title">
          <p className={styles.eyebrow}>The next way to shop</p>
          <h2 id="final-title">Find what you love. <em>Feel good</em> in it.</h2>
          <p>Your better-fitting shopping experience starts with a size profile.</p>
          <Cta light />
        </section>
      </main>

      <footer className={styles.footer}>
        <a className={styles.wordmark} href="/option1">Cloth<span>ME</span><span className={styles.wordmarkDot}>.</span></a>
        <p>Shopping that finally fits.</p>
        <div><a href="/about">About</a><a href="/privacy-policy">Privacy</a><a href="/terms-of-service">Terms</a><a href="https://vendor.clothme.io">For brands</a></div>
        <small>© {new Date().getFullYear()} ClothME</small>
      </footer>
    </div>
  );
}
