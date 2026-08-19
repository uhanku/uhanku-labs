import { NextResponse, type NextRequest } from "next/server";

import { getMediaSessionFromRequest } from "@/lib/media-auth";
import {
  ChunkedMediaUploadError,
  initializeChunkedMediaUpload,
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
    const body = await request.json() as Partial<{
      originalFilename: string;
      contentType: string;
      fileSize: number;
      directory: string;
    }>;

    if (
      typeof body.originalFilename !== "string" ||
      typeof body.contentType !== "string" ||
      typeof body.fileSize !== "number" ||
      typeof body.directory !== "string"
    ) {
      return jsonError("Upload metadata is incomplete.", 400, "invalid-upload");
    }

    const upload = await initializeChunkedMediaUpload({
      originalFilename: body.originalFilename,
      contentType: body.contentType,
      fileSize: body.fileSize,
      directory: body.directory,
    });

    return NextResponse.json(upload, { status: 201 });
  } catch (error) {
    if (error instanceof ChunkedMediaUploadError) {
      const status = error.code === "too-large" ? 413 : error.code === "storage" ? 500 : 400;
      return jsonError(error.message, status, error.code);
    }

    console.error("Unexpected media upload initialization failure.", error);
    return jsonError("The upload could not be initialized.", 500, "storage");
  }
}
