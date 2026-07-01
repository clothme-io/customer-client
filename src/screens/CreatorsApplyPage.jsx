import Head from 'next/head';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CreatorForm } from '../components/creators/CreatorForm';

export function CreatorsApplyPage() {
  return (
    <>
      <Head>
        <title>Apply — ClothME Creator Program</title>
        <meta
          name="description"
          content="Apply to become a founding ClothME creator. Join our community of fashion creators, UGC creators, and influencers."
        />
      </Head>
      <div className="creator-apply-page">
        <Header />
        <main>
          <CreatorForm />
        </main>
        <Footer />
      </div>
    </>
  );
}
