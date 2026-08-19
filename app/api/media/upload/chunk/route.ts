import { NextResponse, type NextRequest } from "next/server";

import { getMediaSessionFromRequest } from "@/lib/media-auth";
import {
  ChunkedMediaUploadError,
  getMediaUploadChunkBytes,
  storeChunkedMediaUploadPart,
} from "@/lib/media-chunk-upload";
import { isAllowedMediaMutationRequest } from "@/lib/media-host";

export const runtime = "nodejs";

const MULTIPART_OVERHEAD_ALLOWANCE = 1024 * 1024;

function jsonError(message: string, status: number, code = "upload-error") {
  return NextResponse.json({ error: code, message }, { status });
}

function integerField(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
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

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > getMediaUploadChunkBytes() + MULTIPART_OVERHEAD_ALLOWANCE
  ) {
    return jsonError("The upload chunk is larger than allowed.", 413, "invalid-chunk");
  }

  try {
    const formData = await request.formData();
    const uploadId = formData.get("uploadId");
    const originalFilename = formData.get("originalFilename");
    const contentType = formData.get("contentType");
    const directory = formData.get("directory");
    const fileSize = integerField(formData, "fileSize");
    const totalChunks = integerField(formData, "totalChunks");
    const chunkIndex = integerField(formData, "chunkIndex");
    const chunk = formData.get("chunk");

    if (
      typeof uploadId !== "string" ||
      typeof originalFilename !== "string" ||
      typeof contentType !== "string" ||
      typeof directory !== "string" ||
      fileSize === null ||
      totalChunks === null ||
      chunkIndex === null ||
      !(chunk instanceof File)
    ) {
      return jsonError("Chunk metadata is incomplete.", 400, "invalid-chunk");
    }

    const result = await storeChunkedMediaUploadPart(
      { uploadId, originalFilename, contentType, fileSize, totalChunks, directory },
      chunkIndex,
      new Uint8Array(await chunk.arrayBuffer()),
    );

    return NextResponse.json({ ok: true, duplicate: result.duplicate });
  } catch (error) {
    if (error instanceof ChunkedMediaUploadError) {
      const status = error.code === "upload-not-found" ? 404 : error.code === "storage" ? 500 : 400;
      return jsonError(error.message, status, error.code);
    }

    console.error("Unexpected media chunk upload failure.", error);
    return jsonError("The upload chunk could not be stored.", 500, "storage");
  }
}
