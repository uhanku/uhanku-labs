import { NextResponse, type NextRequest } from "next/server";

import { getMediaSessionFromRequest } from "@/lib/media-auth";
import {
  cancelChunkedMediaUpload,
  ChunkedMediaUploadError,
} from "@/lib/media-chunk-upload";
import { isAllowedMediaMutationRequest } from "@/lib/media-host";

export const runtime = "nodejs";

function jsonError(message: string, status: number, code = "upload-error") {
  return NextResponse.json({ error: code, message }, { status });
}

export async function POST(request: NextRequest) {
  if (!isAllowedMediaMutationRequest(request)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    if (!getMediaSessionFromRequest(request)) {
      return jsonError("Authentication is required.", 401, "unauthorized");
    }
  } catch (error) {
    console.error("Media session validation failed.", error);
    return jsonError("Media authentication is unavailable.", 503, "auth-unavailable");
  }

  try {
    const body = await request.json() as Partial<{ uploadId: string }>;
    if (typeof body.uploadId !== "string") {
      return jsonError("The upload identifier is missing.", 400, "invalid-upload");
    }

    await cancelChunkedMediaUpload(body.uploadId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ChunkedMediaUploadError) {
      return jsonError(error.message, error.code === "storage" ? 500 : 400, error.code);
    }

    console.error("Unexpected media upload cancellation failure.", error);
    return jsonError("The temporary upload data could not be removed.", 500, "storage");
  }
}
