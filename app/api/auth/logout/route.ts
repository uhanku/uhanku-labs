import { NextResponse, type NextRequest } from "next/server";

import { MEDIA_SESSION_COOKIE, mediaSessionCookieOptions } from "@/lib/auth";
import { isAllowedMediaMutationRequest, redirectToMediaPath } from "@/lib/media-host";

export async function POST(request: NextRequest) {
  if (!isAllowedMediaMutationRequest(request)) {
    return new NextResponse(null, { status: 404 });
  }

  const response = redirectToMediaPath("/");
  response.cookies.set(MEDIA_SESSION_COOKIE, "", {
    ...mediaSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
