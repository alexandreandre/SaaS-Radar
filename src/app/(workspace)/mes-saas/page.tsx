import { MesSaasClient } from "./mes-saas-client";

export const revalidate = 3600;

export default function MesSaasPage() {
  return <MesSaasClient />;
}
