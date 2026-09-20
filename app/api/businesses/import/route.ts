import { NextResponse, type NextRequest } from "next/server";

import { getMediaSessionFromRequest } from "@/lib/auth";
import {
  parseBusinessesDocument,
  toDatasetCreate,
  type BusinessesDataset,
  BusinessesError,
} from "@/lib/businesses";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_IMPORT_BYTES = 8 * 1024 * 1024;

function jsonError(message: string, status: number, code = "import-error") {
  return NextResponse.json({ error: code, message }, { status });
}

function sanitizeFileName(value: unknown) {
  if (typeof value !== "string") return "businesses.json";
  const base = value.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return !clean || clean.length > 255 ? "businesses.json" : clean;
}

function countOsmRecords(dataset: BusinessesDataset) {
  return dataset.businesses.reduce((count, business) => count + business.openstreetmap.length, 0);
}

export async function POST(request: NextRequest) {
  try {
    if (!getMediaSessionFromRequest(request)) return jsonError("Authentication is required.", 401, "unauthorized");
  } catch (error) {
    console.error("Import session validation failed.", error);
    return jsonError("Authentication is unavailable.", 503, "auth-unavailable");
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_IMPORT_BYTES) {
    return jsonError("The file exceeds the maximum size of 8 MB.", 413, "too-large");
  }

  let text: string;
  try {
    text = await request.text();
  } catch (error) {
    console.error("Failed to read the import body.", error);
    return jsonError("Failed to read the file data.", 400, "invalid-json");
  }

  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) {
    return jsonError("The file exceeds the maximum size of 8 MB.", 413, "too-large");
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return jsonError("The file is not valid JSON.", 400, "invalid-json");
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return jsonError("The import payload is not valid.", 400, "invalid-document");
  }

  const payload = body as { fileName?: unknown; document?: unknown };
  const document = Object.prototype.hasOwnProperty.call(payload, "document") ? payload.document : body;
  let dataset: BusinessesDataset;
  try {
    dataset = parseBusinessesDocument(document);
  } catch (error) {
    if (error instanceof BusinessesError) return jsonError(error.message, 400, error.code);
    console.error("Unexpected validation failure.", error);
    return jsonError("The file is not a valid businesses document.", 400, "invalid-document");
  }

  try {
    const imported = await prisma.$transaction(async (tx) => {
      const created = await tx.businessDataset.create({
        data: toDatasetCreate(dataset, sanitizeFileName(payload.fileName)),
        select: { id: true, importedAt: true },
      });
      await tx.businessDataset.deleteMany({ where: { id: { not: created.id } } });
      return created;
    });

    return NextResponse.json({
      imported: {
        id: imported.id,
        importedAt: imported.importedAt.toISOString(),
        source: sanitizeFileName(payload.fileName),
        businessCount: dataset.businesses.length,
        osmRecordCount: countOsmRecords(dataset),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Unexpected import failure.", error);
    return jsonError("The businesses could not be imported. Try again.", 500);
  }
}
