import { createHmac, timingSafeEqual } from "node:crypto";

function signSessionPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(userId: unknown, secret: string) {
  const normalizedUserId = String(userId ?? "").trim();
  const normalizedSecret = String(secret ?? "").trim();

  if (!normalizedUserId || !normalizedSecret) {
    throw new Error("User id and session secret are required.");
  }

  const payload = Buffer.from(JSON.stringify({ userId: normalizedUserId }), "utf8").toString("base64url");
  const signature = signSessionPayload(payload, normalizedSecret);

  return `${payload}.${signature}`;
}

export function parseSessionToken(token: unknown, secret: string) {
  const normalizedSecret = String(secret ?? "").trim();

  if (!normalizedSecret) {
    return null;
  }

  const [payload, signature, extra] = String(token ?? "").split(".");

  if (!payload || !signature || extra !== undefined) {
    return null;
  }

  const expectedSignature = signSessionPayload(payload, normalizedSecret);
  const providedSignatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    providedSignatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const userId = String(parsed?.userId ?? "").trim();
    return userId || null;
  } catch {
    return null;
  }
}
