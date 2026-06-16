import { Suspense } from "react";
import { LoginClient } from "./login-client";

export const metadata = {
  title: "Connexion — SaaS Radar",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
