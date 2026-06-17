"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { usePortfolio } from "@/contexts/portfolio-context";

function LaunchRedirectContent({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { hydrated, getProjectById } = usePortfolio();
  const project = getProjectById(projectId);

  useEffect(() => {
    if (hydrated && project) {
      router.replace(`/cockpit/${projectId}`);
    }
  }, [hydrated, project, projectId, router]);

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
  }

  if (!project) notFound();

  return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
}

export default function CockpitLaunchPage({ params }: { params: { id: string } }) {
  const { getProjectById, hydrated } = usePortfolio();
  const project = hydrated ? getProjectById(params.id) : null;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {project ? (
          <Link
            href={`/cockpit/${project.id}`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au cockpit
          </Link>
        ) : null}
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
          <LaunchRedirectContent projectId={params.id} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
