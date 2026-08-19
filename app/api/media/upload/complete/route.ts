import { NextResponse, type NextRequest } from "next/server";

import { getMediaSessionFromRequest } from "@/lib/media-auth";
import {
  ChunkedMediaUploadError,
  completeChunkedMediaUpload,
} from "@/lib/media-chunk-upload";
import { isAllowedMediaMutationRequest, getPublicMediaPath } from "@/lib/media-host";

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
      uploadId: string;
      originalFilename: string;
      contentType: string;
      fileSize: number;
      totalChunks: number;
      directory: string;
    }>;

    if (
      typeof body.uploadId !== "string" ||
      typeof body.originalFilename !== "string" ||
      typeof body.contentType !== "string" ||
      typeof body.fileSize !== "number" ||
      typeof body.totalChunks !== "number" ||
      typeof body.directory !== "string"
    ) {
      return jsonError("Upload completion metadata is incomplete.", 400, "invalid-upload");
    }

    const stored = await completeChunkedMediaUpload({
      uploadId: body.uploadId,
      originalFilename: body.originalFilename,
      contentType: body.contentType,
      fileSize: body.fileSize,
      totalChunks: body.totalChunks,
      directory: body.directory,
    });

    return NextResponse.json({
      ok: true,
      ...stored,
      publicPath: getPublicMediaPath(stored.relativePath),
    });
  } catch (error) {
    if (error instanceof ChunkedMediaUploadError) {
      const status = error.code === "upload-not-found" ? 404 : error.code === "storage" ? 500 : 400;
      return jsonError(error.message, status, error.code);
    }

    console.error("Unexpected media upload completion failure.", error);
    return jsonError("The uploaded file could not be reconstructed.", 500, "storage");
  }
}
