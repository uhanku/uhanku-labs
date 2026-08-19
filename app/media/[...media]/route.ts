import { createReadStream } from "node:fs";
import { Readable } from "node:stream";

import { type NextRequest } from "next/server";

import { isAllowedMediaHost } from "@/lib/media-host";
import { getMediaFile } from "@/lib/media-storage";

export const runtime = "nodejs";

function baseHeaders(contentType: string, size: number) {
  return {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Length": String(size),
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  };
}

function parseRange(range: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match) return null;

  let start = match[1] ? Number(match[1]) : null;
  let end = match[2] ? Number(match[2]) : null;

  if (start === null && end === null) return null;

  if (start === null) {
    const suffixLength = end ?? 0;
    if (suffixLength <= 0) return null;
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    end = end ?? size - 1;
  }

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= size) {
    return null;
  }

  return { start, end: Math.min(end, size - 1) };
}

async function mediaResponse(request: NextRequest, mediaPath: string, headOnly = false) {
  if (!isAllowedMediaHost(request)) {
    return new Response(null, { status: 404 });
  }

  const file = await getMediaFile(mediaPath);
  if (!file) {
    return new Response(null, { status: 404 });
  }

  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    const range = parseRange(rangeHeader, file.size);
    if (!range) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${file.size}` },
      });
    }

    const length = range.end - range.start + 1;
    const headers = {
      ...baseHeaders(file.contentType, length),
      "Content-Range": `bytes ${range.start}-${range.end}/${file.size}`,
    };

    if (headOnly) return new Response(null, { status: 206, headers });

    const stream = Readable.toWeb(
      createReadStream(file.path, { start: range.start, end: range.end }),
    ) as ReadableStream<Uint8Array>;

    return new Response(stream, { status: 206, headers });
  }

  const headers = baseHeaders(file.contentType, file.size);
  if (headOnly) return new Response(null, { status: 200, headers });

  const stream = Readable.toWeb(createReadStream(file.path)) as ReadableStream<Uint8Array>;
  return new Response(stream, { status: 200, headers });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ media: string[] }> },
) {
  const { media } = await context.params;
  return mediaResponse(request, media.join("/"));
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ media: string[] }> },
) {
  const { media } = await context.params;
  return mediaResponse(request, media.join("/"), true);
}
