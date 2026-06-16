import { AdminPageHeader } from "@/components/admin/admin-ui";

export default function AdminSecurityPage() {
  return (
    <div>
      <AdminPageHeader
        title="Sécurité"
        description="Authentification à deux facteurs (MFA) désactivée pour le moment — accès admin via session uniquement."
      />
      <section className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        <p>
          Le MFA TOTP pourra être réactivé plus tard lorsque l&apos;équipe sera prête. En
          attendant, seuls les comptes avec un rôle admin peuvent accéder au back-office après
          connexion.
        </p>
      </section>
    </div>
  );
}
