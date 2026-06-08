import { DashboardClient } from "./dashboard-client";

export const revalidate = 3600;

export default function DashboardPage() {
  return <DashboardClient />;
}
