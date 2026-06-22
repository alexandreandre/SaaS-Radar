import { Suspense } from "react";
import { LoginClient } from "./login-client";

import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: `Connexion — ${BRAND_NAME}`,
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
