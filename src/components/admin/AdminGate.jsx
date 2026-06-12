import { SignedIn, SignedOut, SignInButton, UserButton, useAuth, useUser } from "@clerk/clerk-react";
import { Header } from "../Header";

function ClerkMissing() {
  return (
    <>
      <Header />
      <main className="admin-shell">
        <section className="admin-panel">
          <p className="eyebrow">Admin setup</p>
          <h1>Clerk is not configured yet.</h1>
          <p>Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `ADMIN_EMAILS` to enable the custom blog admin.</p>
        </section>
      </main>
    </>
  );
}

export function AdminGate({ children }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !process.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return <ClerkMissing />;
  }

  return (
    <>
      <Header />
      <SignedOut>
        <main className="admin-shell">
          <section className="admin-panel">
            <p className="eyebrow">Admin</p>
            <h1>Sign in to manage ClothME articles.</h1>
            <SignInButton
              mode="modal"
              redirectUrl="/admin/blog"
              signInForceRedirectUrl="/admin/blog"
              signUpForceRedirectUrl="/admin/blog"
              signInFallbackRedirectUrl="/admin/blog"
              signUpFallbackRedirectUrl="/admin/blog"
            >
              <button
                className="admin-primary-button"
                type="button"
                onClick={() => window.sessionStorage.setItem("clothme-admin-return-to", "/admin/blog")}
              >
                Sign in
              </button>
            </SignInButton>
          </section>
        </main>
      </SignedOut>
      <SignedIn>
        <AdminFrame>{children}</AdminFrame>
      </SignedIn>
    </>
  );
}

function AdminFrame({ children }) {
  const { user } = useUser();
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  return (
    <main className="admin-shell">
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">ClothME admin</p>
          <h1>Blog manager</h1>
        </div>
        <div className="admin-user">
          <span>{user?.primaryEmailAddress?.emailAddress}</span>
          <UserButton />
        </div>
      </div>
      {children}
    </main>
  );
}
