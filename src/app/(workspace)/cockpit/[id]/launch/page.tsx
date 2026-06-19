import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { loadUserProject } from "@/lib/portfolio-sync";

export const dynamic = "force-dynamic";

/** Redirection serveur — évite la cascade client sur /launch. */
export default async function CockpitLaunchPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/cockpit/${params.id}/launch`)}`);
  }

  const project = await loadUserProject(user.id, params.id);
  if (!project) notFound();

  redirect(`/cockpit/${params.id}`);
}
