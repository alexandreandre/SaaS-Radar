import type { PennylaneCompanyTokenCredential, PennylaneCredential } from "@/lib/connectors/pennylane/types";

const MIN_TOKEN_LENGTH = 20;

export function parsePennylaneApiToken(apiToken: string): string {
  const trimmed = apiToken.trim();
  if (!trimmed) {
    throw new Error("Token API Pennylane requis.");
  }
  if (trimmed.length < MIN_TOKEN_LENGTH) {
    throw new Error("Format de token API Pennylane invalide.");
  }
  return trimmed;
}

export function parsePennylaneCompanyTokenCredential(
  apiToken: string,
): PennylaneCompanyTokenCredential {
  return {
    authType: "company_token",
    apiToken: parsePennylaneApiToken(apiToken),
  };
}

export function parsePennylaneCredential(input: {
  apiToken?: string;
  credential?: PennylaneCredential;
}): PennylaneCredential {
  if (input.credential) {
    return input.credential;
  }
  if (input.apiToken?.trim()) {
    return parsePennylaneCompanyTokenCredential(input.apiToken);
  }
  throw new Error("Token API Pennylane requis.");
}

export function getPennylaneBearerToken(credential: PennylaneCredential): string {
  if (credential.authType === "company_token") {
    return credential.apiToken;
  }
  return credential.accessToken;
}
