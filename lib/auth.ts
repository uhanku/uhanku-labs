import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";

export const MEDIA_SESSION_COOKIE = "uhanku_media_session";

const SESSION_TTL_SECONDS = 60 * 60 * 8;
const MIN_SESSION_SECRET_BYTES = 32;
const SCRYPT_KEY_LENGTH = 64;

interface MediaSessionPayload {
  username: string;
  expiresAt: number;
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function getSessionSecret() {
  const secret = getRequiredEnv("MEDIA_SESSION_SECRET");
  const bytes = Buffer.from(secret, "utf8");

  if (bytes.byteLength < MIN_SESSION_SECRET_BYTES) {
    throw new Error(
      `MEDIA_SESSION_SECRET must be at least ${MIN_SESSION_SECRET_BYTES} bytes long.`,
    );
  }

  return secret;
}

function decodePasswordHash(value: string) {
  const [algorithm, salt, derivedKey] = value.split(":");

  if (algorithm !== "scrypt" || !salt || !derivedKey) {
    throw new Error(
      "MEDIA_ADMIN_PASSWORD_HASH must use the format scrypt:<salt>:<derived-key>.",
    );
  }

  const saltBuffer = Buffer.from(salt, "base64url");
  const derivedKeyBuffer = Buffer.from(derivedKey, "base64url");

  if (saltBuffer.byteLength < 16 || derivedKeyBuffer.byteLength !== SCRYPT_KEY_LENGTH) {
    throw new Error("MEDIA_ADMIN_PASSWORD_HASH is malformed.");
  }

  return { saltBuffer, derivedKeyBuffer };
}

export function verifyMediaCredentials(username: string, password: string) {
  const configuredUsername = getRequiredEnv("MEDIA_ADMIN_USERNAME");
  const configuredPasswordHash = getRequiredEnv("MEDIA_ADMIN_PASSWORD_HASH");

  const usernameA = Buffer.from(username, "utf8");
  const usernameB = Buffer.from(configuredUsername, "utf8");
  const usernameMatches =
    usernameA.byteLength === usernameB.byteLength && timingSafeEqual(usernameA, usernameB);

  const { saltBuffer, derivedKeyBuffer } = decodePasswordHash(configuredPasswordHash);
  const candidate = scryptSync(password, saltBuffer, SCRYPT_KEY_LENGTH);
  const passwordMatches = timingSafeEqual(candidate, derivedKeyBuffer);

  return usernameMatches && passwordMatches;
}

function signSessionBody(body: string) {
  return createHmac("sha256", getSessionSecret()).update(body).digest("base64url");
}

export function createMediaSessionToken(username: string) {
  const payload: MediaSessionPayload = {
    username,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signSessionBody(body);

  return `${body}.${signature}`;
}

export function verifyMediaSessionToken(token: string | undefined) {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = signSessionBody(body);
  const actualBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expected, "base64url");

  if (
    actualBuffer.byteLength !== expectedBuffer.byteLength ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as MediaSessionPayload;

    if (
      typeof payload.username !== "string" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    if (payload.username !== getRequiredEnv("MEDIA_ADMIN_USERNAME")) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getMediaSessionFromRequest(request: NextRequest) {
  return verifyMediaSessionToken(request.cookies.get(MEDIA_SESSION_COOKIE)?.value);
}

export function mediaSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
