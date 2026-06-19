import crypto from "node:crypto";

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

export function signJwtHs256(
  payload: Record<string, unknown>,
  secret: string,
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function buildSentryRefreshJwtClaims(clientId: string): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: clientId,
    sub: clientId,
    iat: now,
    exp: now + 60,
    jti: crypto.randomUUID(),
  };
}
