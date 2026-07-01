import Head from 'next/head';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CreatorHero } from '../components/creators/CreatorHero';
import { CreatorAbout } from '../components/creators/CreatorAbout';
import { CreatorWhoFor } from '../components/creators/CreatorWhoFor';
import { CreatorBenefits } from '../components/creators/CreatorBenefits';
import { CreatorForm } from '../components/creators/CreatorForm';

export function CreatorsPage() {
  return (
    <>
      <Head>
        <title>ClothME Creator Program — Become a Founding Creator</title>
        <meta
          name="description"
          content="Join the ClothME Creator Program. Help shape the future of fashion shopping while earning money creating content. Recruiting 20 founding creators in the USA and Canada."
        />
        <meta property="og:title" content="ClothME Creator Program" />
        <meta
          property="og:description"
          content="Become a founding ClothME creator. Paid opportunities, early access, affiliate program, and more."
        />
      </Head>
      <div className="creator-page">
        <Header />
        <main>
          <CreatorHero />
          <CreatorAbout />
          <CreatorWhoFor />
          <CreatorBenefits />
          <CreatorForm />
        </main>
        <Footer />
      </div>
    </>
  );
}
