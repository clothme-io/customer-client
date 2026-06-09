import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { Analytics } from "./components/Analytics";
import { BlogIndexPage } from "./pages/BlogIndexPage";
import { BlogPostPage } from "./pages/BlogPostPage";
import { HomePage } from "./pages/HomePage";
import { AdminBlogPage } from "./pages/admin/AdminBlogPage";
import { AdminPostEditorPage } from "./pages/admin/AdminPostEditorPage";

function getRoute() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";

  if (path === "/") {
    return <HomePage />;
  }

  if (path === "/color-scheme-blue") {
    return <HomePage version="blue-swap" />;
  }

  if (path === "/version/white") {
    return <HomePage version="white" />;
  }

  if (path === "/blog") {
    return <BlogIndexPage />;
  }

  if (path === "/admin" || path === "/admin/blog") {
    return <AdminBlogPage />;
  }

  if (path === "/admin/blog/new") {
    return <AdminPostEditorPage mode="new" />;
  }

  if (path.startsWith("/admin/blog/edit/")) {
    return <AdminPostEditorPage mode="edit" id={path.replace("/admin/blog/edit/", "")} />;
  }

  if (path.startsWith("/preview/")) {
    const params = new URLSearchParams(window.location.search);
    return <BlogPostPage slug={path.replace("/preview/", "")} previewToken={params.get("token") || ""} />;
  }

  if (path.startsWith("/blog/")) {
    return <BlogPostPage slug={path.replace("/blog/", "")} />;
  }

  return <BlogPostPage slug="" />;
}

export function App() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const app = (
    <>
      <Analytics />
      {getRoute()}
    </>
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

function AdminAuthRedirect() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    const returnTo = window.sessionStorage.getItem("clothme-admin-return-to");
    if (returnTo && window.location.pathname !== returnTo) {
      window.sessionStorage.removeItem("clothme-admin-return-to");
      window.location.replace(returnTo);
    }
  }

  return null;
}
