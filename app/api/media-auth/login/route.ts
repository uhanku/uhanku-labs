import { NextResponse, type NextRequest } from "next/server";

import {
  MEDIA_SESSION_COOKIE,
  createMediaSessionToken,
  mediaSessionCookieOptions,
  verifyMediaCredentials,
} from "@/lib/media-auth";
import { isAllowedMediaMutationRequest, redirectToMediaPath } from "@/lib/media-host";
import {
  canAttemptMediaLogin,
  clearMediaLoginFailures,
  recordMediaLoginFailure,
} from "@/lib/media-login-rate-limit";

export const runtime = "nodejs";

function clientKey(request: NextRequest) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return forwarded?.at(-1) || "unknown";
}

function redirectToLogin(error: string) {
  const params = new URLSearchParams({ error });
  return redirectToMediaPath(`/media-admin/login?${params}`);
}

export async function POST(request: NextRequest) {
  if (!isAllowedMediaMutationRequest(request)) {
    return new NextResponse(null, { status: 404 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > 16 * 1024) {
    return redirectToLogin("invalid");
  }

  const key = clientKey(request);
  if (!canAttemptMediaLogin(key)) {
    return redirectToLogin("rate-limited");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return redirectToLogin("invalid");
  }

  const username = formData.get("username");
  const password = formData.get("password");

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length > 255 ||
    password.length > 4096
  ) {
    recordMediaLoginFailure(key);
    return redirectToLogin("invalid");
  }

  try {
    if (!verifyMediaCredentials(username, password)) {
      recordMediaLoginFailure(key);
      return redirectToLogin("invalid");
    }

    clearMediaLoginFailures(key);
    const response = redirectToMediaPath("/media-admin");
    response.cookies.set(
      MEDIA_SESSION_COOKIE,
      createMediaSessionToken(username),
      mediaSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    console.error("Media authentication is not configured correctly.", error);
    return redirectToLogin("unavailable");
  }
}
