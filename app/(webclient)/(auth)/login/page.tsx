import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Log in",
  robots: { index: false, follow: false }
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
