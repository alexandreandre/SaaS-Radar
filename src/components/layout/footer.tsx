import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold">SaaS Radar</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Intelligence micro-SaaS pour entrepreneurs français.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/world" className="hover:text-accent">
              Carte monde
            </Link>
            <Link href="/opportunities" className="hover:text-accent">
              Opportunités
            </Link>
            <Link href="/weekly" className="hover:text-accent">
              Pick hebdo
            </Link>
            <Link href="/simulator" className="hover:text-accent">
              Simulateur
            </Link>
          </div>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} SaaS Radar. Données indicatives, pas des conseils financiers.
        </p>
      </div>
    </footer>
  );
}
