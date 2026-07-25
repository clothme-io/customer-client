import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/png" href="/clothme-logo.png" />
        <link rel="apple-touch-icon" href="/clothme-logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Prevent permanent blank pages if Next FOUC hide never clears (dev HMR / blocked fonts). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                function reveal() {
                  document.querySelectorAll('[data-next-hide-fouc]').forEach(function (el) {
                    el.parentNode && el.parentNode.removeChild(el);
                  });
                  if (document.body) {
                    document.body.style.display = '';
                  }
                }
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', reveal);
                } else {
                  reveal();
                }
                window.addEventListener('load', reveal);
              })();
            `
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
