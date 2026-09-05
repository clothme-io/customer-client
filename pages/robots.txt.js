import { siteConfig } from "../src/data/site";

export async function getServerSideProps({ res }) {
  const body = `User-agent: *
Allow: /
Allow: /product
Allow: /brand
Disallow: /shop
Disallow: /discover
Disallow: /cart
Disallow: /inbox
Disallow: /account
Disallow: /settings
Disallow: /checkout
Disallow: /login

Sitemap: ${new URL("/sitemap.xml", siteConfig.siteUrl).toString()}
`;

  res.setHeader("Content-Type", "text/plain");
  res.write(body);
  res.end();
  return { props: {} };
}

export default function Robots() {
  return null;
}
