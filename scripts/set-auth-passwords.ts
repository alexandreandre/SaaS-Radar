/**
 * Définit ou met à jour le mot de passe d'un ou plusieurs comptes Supabase Auth.
 * Usage :
 *   tsx --env-file=.env.local scripts/set-auth-passwords.ts email:motdepasse [email2:motdepasse2 ...]
 */
import { getSupabaseUrl } from "../src/lib/supabase/env";

type Account = { email: string; password: string };

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY requis dans .env.local");
  return key;
}

function adminHeaders(key: string): HeadersInit {
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    "Content-Type": "application/json",
  };
}

function parseAccounts(argv: string[]): Account[] {
  const accounts = argv
    .map((arg) => {
      const sep = arg.indexOf(":");
      if (sep <= 0) return null;
      const email = arg.slice(0, sep).trim().toLowerCase();
      const password = arg.slice(sep + 1);
      if (!email || !password) return null;
      return { email, password };
    })
    .filter((a): a is Account => a !== null);

  if (accounts.length === 0) {
    throw new Error("Fournissez au moins un compte au format email:motdepasse");
  }
  return accounts;
}

async function findUserIdByEmail(
  baseUrl: string,
  key: string,
  email: string,
): Promise<string | null> {
  let page = 1;
  const perPage = 200;

  while (true) {
    const res = await fetch(
      `${baseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      { headers: adminHeaders(key) },
    );
    if (!res.ok) {
      throw new Error(`listUsers failed: ${res.status} ${await res.text()}`);
    }
    const body = (await res.json()) as { users?: Array<{ id: string; email?: string }> };
    const users = body.users ?? [];
    const match = users.find((u) => u.email?.toLowerCase() === email);
    if (match?.id) return match.id;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function upsertPassword(
  baseUrl: string,
  key: string,
  { email, password }: Account,
): Promise<void> {
  const existingId = await findUserIdByEmail(baseUrl, key, email);

  if (existingId) {
    const res = await fetch(`${baseUrl}/auth/v1/admin/users/${existingId}`, {
      method: "PUT",
      headers: adminHeaders(key),
      body: JSON.stringify({ password, email_confirm: true }),
    });
    if (!res.ok) {
      throw new Error(`updateUser failed (${email}): ${res.status} ${await res.text()}`);
    }
    console.log(`✓ Mot de passe mis à jour : ${email}`);
    return;
  }

  const res = await fetch(`${baseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders(key),
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!res.ok) {
    throw new Error(`createUser failed (${email}): ${res.status} ${await res.text()}`);
  }
  console.log(`✓ Compte créé : ${email}`);
}

async function main(): Promise<void> {
  const baseUrl = getSupabaseUrl();
  if (!baseUrl) throw new Error("SUPABASE_URL requis dans .env.local");
  const key = getServiceRoleKey();
  const accounts = parseAccounts(process.argv.slice(2));
  for (const account of accounts) {
    await upsertPassword(baseUrl, key, account);
  }
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
