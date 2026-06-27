import "server-only";

const BREVO_API = "https://api.brevo.com/v3";
const LIST_NAME = "The Build Road Newsletter";

function apiKey(): string {
  const key = process.env.BREVO_NEWSLETTER_API_KEY;
  if (!key) throw new Error("BREVO_NEWSLETTER_API_KEY non défini");
  return key;
}

async function brevoFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BREVO_API}${path}`, {
    ...options,
    headers: {
      "api-key": apiKey(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Brevo ${res.status} — ${path}: ${text}`);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

/** Renvoie l'ID de la liste newsletter (créée si absente). */
export async function getOrCreateNewsletterList(): Promise<number> {
  const envId = Number(process.env.BREVO_NEWSLETTER_LIST_ID ?? 0);
  if (envId > 0) return envId;

  const { lists } = await brevoFetch<{ lists: { id: number; name: string }[] }>(
    "/contacts/lists?limit=50&offset=0"
  );
  const existing = lists?.find((l) => l.name === LIST_NAME);
  if (existing) {
    console.log(`[newsletter] Liste Brevo existante : id=${existing.id}`);
    return existing.id;
  }

  const created = await brevoFetch<{ id: number }>("/contacts/lists", {
    method: "POST",
    body: JSON.stringify({ name: LIST_NAME, folderId: 1 }),
  });
  console.log(
    `[newsletter] Liste Brevo créée : id=${created.id}. Ajoute BREVO_NEWSLETTER_LIST_ID=${created.id} dans ton .env.`
  );
  return created.id;
}

/**
 * Importe les emails dans la liste Brevo via CSV batch (async côté Brevo).
 * On attend 4 s pour que le traitement soit terminé avant l'envoi de la campagne.
 */
export async function importContactsToList(emails: string[], listId: number): Promise<void> {
  if (!emails.length) return;
  const csvBody = "EMAIL\n" + emails.join("\n");
  await brevoFetch("/contacts/import", {
    method: "POST",
    body: JSON.stringify({
      fileBody: csvBody,
      listIds: [listId],
      updateEnabled: true,
      emailBlacklist: false,
    }),
  });
  await new Promise((r) => setTimeout(r, 4000));
}

/** Crée et envoie immédiatement une campagne email Brevo. */
export async function createAndSendCampaign(opts: {
  campaignName: string;
  subject: string;
  htmlContent: string;
  listId: number;
}): Promise<{ id: number }> {
  const senderEmail =
    process.env.BREVO_NEWSLETTER_SENDER_EMAIL ?? "newsletter@thebuildroad.com";
  const senderName = process.env.BREVO_NEWSLETTER_SENDER_NAME ?? "The Build Road";

  const campaign = await brevoFetch<{ id: number }>("/emailCampaigns", {
    method: "POST",
    body: JSON.stringify({
      name: opts.campaignName,
      subject: opts.subject,
      sender: { name: senderName, email: senderEmail },
      type: "classic",
      htmlContent: opts.htmlContent,
      recipients: { listIds: [opts.listId] },
    }),
  });

  await brevoFetch(`/emailCampaigns/${campaign.id}/sendNow`, { method: "POST" });

  return campaign;
}

/** Envoie un email transactionnel de test (sans liste Brevo). */
export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  htmlContent: string;
}): Promise<void> {
  const senderEmail =
    process.env.BREVO_NEWSLETTER_SENDER_EMAIL ?? "newsletter@thebuildroad.com";
  const senderName = process.env.BREVO_NEWSLETTER_SENDER_NAME ?? "The Build Road";

  await brevoFetch("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: opts.to }],
      subject: opts.subject,
      htmlContent: opts.htmlContent,
    }),
  });
}
