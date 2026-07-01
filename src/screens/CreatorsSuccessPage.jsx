import Head from 'next/head';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function CreatorsSuccessPage() {
  return (
    <>
      <Head>
        <title>Application Received — ClothME Creator Program</title>
      </Head>
      <div className="creator-page page-white">
        <Header />
        <main className="creator-success">
          <div className="creator-success-inner">
            <div className="creator-success-check" aria-hidden="true">✓</div>
            <h1>Application Received</h1>
            <p>
              Thank you for applying to become a founding ClothME creator.
            </p>
            <p>
              Our team reviews every application. Selected creators will receive
              an invitation by email.
            </p>
            <a href="https://clothme.io" className="creator-btn-primary">
              Back to ClothME
            </a>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
