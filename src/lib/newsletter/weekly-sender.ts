import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";
import {
  getOrCreateNewsletterList,
  importContactsToList,
  createAndSendCampaign,
  sendTransactionalEmail,
} from "./brevo";
import {
  loadTemplate,
  renderTemplate,
  formatFrenchDate,
  truncate,
  extractWhyText,
  extractPoints,
  formatMrr,
  sectorLabel,
} from "./template";
import { generateNewsletterCopy } from "./ai-copy";

type OpportunityRow = Database["public"]["Tables"]["opportunities"]["Row"];

function parseScores(raw: Json) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { opportunity: 0, franceFit: 0, buildability: 0, margin: 0, competitionGap: 0 };
  }
  const s = raw as Record<string, unknown>;
  return {
    opportunity: Math.round(Number(s.opportunity ?? 0)),
    franceFit: Number(s.franceFit ?? 0),
    buildability: Number(s.buildability ?? 0),
    margin: Number(s.margin ?? 0),
    competitionGap: Number(s.competitionGap ?? 0),
  };
}

function appUrl(): string {
  // || plutôt que ?? pour court-circuiter les chaînes vides ("" est falsy)
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://thebuildroad.com"
  ).replace(/\/$/, "");
}

function oppUrl(slug: string): string {
  // Route publique : /(workspace)/opportunities/[slug]
  return `${appUrl()}/opportunities/${slug}`;
}

function buildVars(
  opps: OpportunityRow[],
  editionNo: number,
  nbScannes: number,
  nbPublished: number,
  nbPays: number,
  mode: "campaign" | "test",
  aiCopy: { preheader: string; accrocheTitre: string; accrocheTexte: string }
): Record<string, string> {
  const now = new Date();
  const [main, s1, s2] = opps;

  const mainScores = parseScores(main?.scores ?? null);

  const [point1, point2] = extractPoints(main?.why_it_works ?? null);

  const pourquoiTexte =
    extractWhyText(main?.why_it_works ?? null) || main?.pitch || "Forte demande détectée à l'étranger, marché français non adressé.";

  const baseUrl = appUrl();
  // Pour les campagnes Brevo, {{ contact.EMAIL }} est un merge tag remplacé par Brevo
  // per-recipient au moment de l'envoi. Notre endpoint met à jour Supabase + Brevo blacklist.
  const unsubscribeUrl =
    mode === "campaign"
      ? `${baseUrl}/api/newsletter/unsubscribe?email={{ contact.EMAIL }}`
      : "#";

  return {
    PREHEADER: truncate(aiCopy.preheader, 140),
    EDITION_NO: String(editionNo),
    EDITION_DATE: formatFrenchDate(now),

    NB_SCANNES: String(nbScannes),
    NB_RETENUS: String(nbPublished),
    NB_PAYS: String(nbPays),

    ACCROCHE_TITRE: aiCopy.accrocheTitre,
    ACCROCHE_TEXTE: aiCopy.accrocheTexte,

    SCORE: String(mainScores.opportunity),
    SAAS_NOM: main?.name ?? "—",
    SAAS_CATEGORIE: sectorLabel(main?.sector ?? ""),
    SAAS_PAYS: main?.origin_country ?? "—",
    SAAS_MRR: formatMrr(main?.revenue_min ?? 0, main?.revenue_max ?? 0),

    STAT1_VAL: `${mainScores.franceFit}/10`,
    STAT1_LABEL: "France Fit",
    STAT2_VAL: formatMrr(main?.revenue_min ?? 0, main?.revenue_max ?? 0),
    STAT2_LABEL: "MRR estimé",
    STAT3_VAL: String(main?.entrepreneurs_building ?? 0),
    STAT3_LABEL: "Builders actifs",

    POURQUOI_TEXTE: truncate(pourquoiTexte, 400),
    POINT_1: truncate(point1, 200),
    POINT_2: truncate(point2, 200),
    URL_FICHE_PRINCIPALE: main ? oppUrl(main.slug) : baseUrl,

    S1_CATEGORIE: sectorLabel(s1?.sector ?? ""),
    S1_PAYS: s1?.origin_country ?? "—",
    S1_MRR: s1 ? formatMrr(s1.revenue_min ?? 0, s1.revenue_max ?? 0) : "—",
    S1_NOM: s1?.name ?? "—",
    S1_PHRASE: truncate(s1?.pitch ?? "—", 140),
    S1_URL: s1 ? oppUrl(s1.slug) : baseUrl,

    S2_CATEGORIE: sectorLabel(s2?.sector ?? ""),
    S2_PAYS: s2?.origin_country ?? "—",
    S2_MRR: s2 ? formatMrr(s2.revenue_min ?? 0, s2.revenue_max ?? 0) : "—",
    S2_NOM: s2?.name ?? "—",
    S2_PHRASE: truncate(s2?.pitch ?? "—", 140),
    S2_URL: s2 ? oppUrl(s2.slug) : baseUrl,

    URL_TOUTES_OPPORTUNITES: `${baseUrl}/opportunities`,
    NB_OPPORTUNITES: String(nbPublished),
    URL_WEB: `${baseUrl}/newsletter`,
    URL_PREFERENCES: `${baseUrl}/account`,
    URL_DESABONNEMENT: unsubscribeUrl,
  };
}

export interface WeeklySendResult {
  ok: boolean;
  mode: "campaign" | "test";
  editionNo?: number;
  campaignId?: number;
  recipientCount?: number;
  error?: string;
}

/** Envoi de la newsletter hebdomadaire. En mode test, envoie un transactionnel à testEmail. */
export async function runWeeklySend(opts?: { testEmail?: string }): Promise<WeeklySendResult> {
  const isTest = Boolean(opts?.testEmail);
  const mode = isTest ? "test" : "campaign";
  const admin = createAdminClient();

  // 1. Top 3 opportunités publiées par score
  const { data: allPublished, error: oppError } = await admin
    .from("opportunities")
    .select("*")
    .eq("status", "published");

  if (oppError) return { ok: false, mode, error: oppError.message };

  const sorted = (allPublished ?? []).sort((a, b) => {
    const sa = parseScores(a.scores);
    const sb = parseScores(b.scores);
    return sb.opportunity - sa.opportunity;
  });

  if (sorted.length === 0) return { ok: false, mode, error: "Aucune opportunité publiée." };

  const top3 = sorted.slice(0, 3);

  // 2. Statistiques globales
  const { count: totalCount } = await admin
    .from("opportunities")
    .select("id", { count: "exact", head: true });

  const distinctCountries = new Set(allPublished?.map((o) => o.origin_country_code)).size;

  // 3. Numéro d'édition
  const { count: sentCount } = await admin
    .from("newsletter_campaigns")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent");

  const editionNo = (sentCount ?? 0) + 1;

  // 4. Génération IA de l'accroche et de l'objet
  const aiCopy = await generateNewsletterCopy(
    top3[0],
    allPublished?.length ?? 0,
    totalCount ?? 0,
    editionNo
  );

  // 5. Rendu du template
  const html = renderTemplate(
    loadTemplate(),
    buildVars(
      top3,
      editionNo,
      totalCount ?? 0,
      allPublished?.length ?? 0,
      distinctCountries,
      mode,
      aiCopy
    )
  );

  // Warn si des placeholders non résolus trainent encore
  const unresolvedVars = html.match(/\{\{[^}]+\}\}/g);
  if (unresolvedVars) {
    console.warn("[newsletter] Placeholders non résolus :", Array.from(new Set(unresolvedVars)));
  }

  const subject = aiCopy.subject;
  const campaignName = `Newsletter #${editionNo} — ${formatFrenchDate(new Date())}`;

  // 6a. Mode test : email transactionnel direct
  if (isTest) {
    await sendTransactionalEmail({ to: opts!.testEmail!, subject, htmlContent: html });
    return { ok: true, mode, editionNo };
  }

  // 6b. Mode campagne : sync contacts + envoi Brevo
  const { data: subscribers } = await admin
    .from("newsletter_subscribers")
    .select("email")
    .eq("status", "active");

  const emails = (subscribers ?? []).map((s) => s.email);
  if (!emails.length) return { ok: false, mode, error: "Aucun abonné actif." };

  const listId = await getOrCreateNewsletterList();
  await importContactsToList(emails, listId);

  const campaign = await createAndSendCampaign({ campaignName, subject, htmlContent: html, listId });

  // 7. Log en base
  await admin.from("newsletter_campaigns").insert({
    slug: `edition-${editionNo}`,
    title: campaignName,
    subject,
    body_html: html,
    status: "sent",
    sent_at: new Date().toISOString(),
    recipient_count: emails.length,
  });

  return { ok: true, mode, editionNo, campaignId: campaign.id, recipientCount: emails.length };
}
