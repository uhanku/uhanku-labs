import { NextResponse, type NextRequest } from "next/server";

const PRODUCTION_MEDIA_HOST = "labs.uhanku.com";
const DEVELOPMENT_MEDIA_HOST = "labs.uhanku.test";

function normalizedHost(request: NextRequest) {
  return request.headers.get("host")?.split(":", 1)[0]?.trim().toLowerCase() ?? "";
}

export function isAllowedMediaHost(request: NextRequest) {
  const hostHeader = request.headers.get("host");

  // Next's image optimizer re-dispatches relative URLs internally with no Host
  // header; every real HTTP/1.1 request carries one.
  if (!hostHeader) return true;

  const host = hostHeader.split(":", 1)[0]?.trim().toLowerCase() ?? "";

  if (host === PRODUCTION_MEDIA_HOST) return true;

  return process.env.NODE_ENV === "development" && host === DEVELOPMENT_MEDIA_HOST;
}

export function isAllowedMediaMutationRequest(request: NextRequest) {
  if (!isAllowedMediaHost(request)) return false;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    const sameHost = originUrl.hostname.toLowerCase() === normalizedHost(request);
    const allowedProtocol =
      process.env.NODE_ENV === "production" ? originUrl.protocol === "https:" : ["http:", "https:"].includes(originUrl.protocol);

    return sameHost && allowedProtocol;
  } catch {
    return false;
  }
}

/** Keep redirects relative to the browser's current public hostname. */
export function redirectToMediaPath(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
}

function encodeMediaPath(relativePath: string) {
  return relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function getPublicMediaPath(relativePath: string) {
  return `/media/${encodeMediaPath(relativePath)}`;
}

export function getPublicMediaUrl(relativePath: string) {
  return `https://${PRODUCTION_MEDIA_HOST}${getPublicMediaPath(relativePath)}`;
}
