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

export default function CityCareers({ cityName, citySlug, region }) {
  return (
    <>
      <Head>
        <title>{`Careers at ClothME — ${cityName}`}</title>
        <meta
          name="description"
          content={`Join ClothME and help build the future of fashion commerce in ${cityName} and beyond.`}
        />
      </Head>
      <CityHeader cityName={cityName} />
      <main>
        <div className="city-page-shell">
          <p className="eyebrow">Careers</p>
          <h1>Join ClothME.</h1>
          <p>
            We&rsquo;re building the first fashion commerce platform organized by
            Size/Fit — connecting people in {cityName} and every city with clothes
            that actually fit.
          </p>
          <p>
            We&rsquo;re a small team with big ambitions. If you are passionate about
            fashion, technology, or commerce — and want to help solve one of retail&rsquo;s
            oldest problems — we&rsquo;d love to hear from you.
          </p>
          <p>
            <strong>No open roles listed yet.</strong> Send your details to{" "}
            <a href="mailto:talk2us@clothme.io" style={{ fontWeight: 700 }}>
              talk2us@clothme.io
            </a>{" "}
            and we&rsquo;ll keep you in mind as we grow.
          </p>
        </div>
      </main>
      <CityFooter cityName={cityName} region={region} />
    </>
  );
}
