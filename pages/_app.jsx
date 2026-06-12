import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { Analytics } from "../src/components/Analytics";
import "../src/styles.css";

function AdminAuthRedirect() {
  const { isLoaded, isSignedIn } = useAuth();

  if (typeof window !== "undefined" && isLoaded && isSignedIn) {
    const returnTo = window.sessionStorage.getItem("clothme-admin-return-to");
    if (returnTo && window.location.pathname !== returnTo) {
      window.sessionStorage.removeItem("clothme-admin-return-to");
      window.location.replace(returnTo);
    }
  }

  return null;
}

export default function App({ Component, pageProps, router }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;
  const path = router.asPath.split("?")[0].replace(/\/$/, "") || "/";
  const pageClassName = path === "/blog" || path.startsWith("/blog/") || path === "/privacy-policy" || path.startsWith("/admin") ? "page-white" : "";
  const app = (
    <div className={pageClassName}>
      <Analytics />
      <Component {...pageProps} />
    </div>
  );

  if (!publishableKey) {
    return app;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInForceRedirectUrl="/admin/blog"
      signUpForceRedirectUrl="/admin/blog"
      signInFallbackRedirectUrl="/admin/blog"
      signUpFallbackRedirectUrl="/admin/blog"
    >
      <AdminAuthRedirect />
      {app}
    </ClerkProvider>
  );
}
