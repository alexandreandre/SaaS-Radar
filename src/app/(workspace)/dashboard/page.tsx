import { redirect, RedirectType } from "next/navigation";

export default function DashboardPage() {
  redirect("/mes-saas", RedirectType.permanent);
}
