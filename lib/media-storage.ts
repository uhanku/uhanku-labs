import { randomBytes } from "node:crypto";
import { lstat, mkdir, open, realpath } from "node:fs/promises";
import path from "node:path";

const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const SAFE_FILENAME = /^[a-z0-9][a-z0-9-]{0,79}-[a-f0-9]{12}\.(?:jpg|png|webp|gif|avif|mp4|webm|mp3|ogg|wav|m4a)$/;
const MAX_MEDIA_PATH_SEGMENT_LENGTH = 255;

const MIME_TO_EXTENSION = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
  ["audio/mpeg", ".mp3"],
  ["audio/ogg", ".ogg"],
  ["audio/wav", ".wav"],
  ["audio/x-wav", ".wav"],
  ["audio/mp4", ".m4a"],
]);

const EXTENSION_TO_MIME = new Map<string, string>([
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".avif", "image/avif"],
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
  [".mp3", "audio/mpeg"],
  [".ogg", "audio/ogg"],
  [".wav", "audio/wav"],
  [".m4a", "audio/mp4"],
]);

export class MediaUploadError extends Error {
  constructor(
    message: string,
    public readonly code: "missing" | "too-large" | "unsupported" | "invalid" | "storage",
  ) {
    super(message);
  }
}

export function getMediaStorageDirectory() {
  return path.resolve(process.env.MEDIA_STORAGE_DIR ?? path.join(process.cwd(), "storage", "media"));
}

export function getMaxMediaUploadBytes() {
  const configured = Number(process.env.MEDIA_MAX_UPLOAD_BYTES ?? DEFAULT_MAX_UPLOAD_BYTES);

  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_MAX_UPLOAD_BYTES;
  }

  return Math.floor(configured);
}

export function sanitizeMediaStem(filename: string) {
  const parsed = path.parse(path.basename(filename));
  const sanitized = parsed.name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return sanitized || "media";
}

function hasSignature(bytes: Uint8Array, signature: readonly number[], offset = 0) {
  return signature.every((value, index) => bytes[offset + index] === value);
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return Buffer.from(bytes.slice(start, end)).toString("ascii");
}

export function matchesMediaMimeSignature(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") return hasSignature(bytes, [0xff, 0xd8, 0xff]);
  if (mime === "image/png") return hasSignature(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (mime === "image/gif") return ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a";
  if (mime === "image/webp") return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";
  if (mime === "image/avif") {
    return ascii(bytes, 4, 8) === "ftyp" && ["avif", "avis"].some((brand) => ascii(bytes, 8, 32).includes(brand));
  }
  if (mime === "video/webm") return hasSignature(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
  if (mime === "video/mp4") return ascii(bytes, 4, 8) === "ftyp";
  if (mime === "audio/ogg") return ascii(bytes, 0, 4) === "OggS";
  if (mime === "audio/wav" || mime === "audio/x-wav") {
    return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WAVE";
  }
  if (mime === "audio/mp4") return ascii(bytes, 4, 8) === "ftyp";
  if (mime === "audio/mpeg") {
    return ascii(bytes, 0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  }

  return false;
}

export function isSafeMediaFilename(filename: string) {
  return SAFE_FILENAME.test(filename);
}

export function isSafeMediaPathSegment(segment: string) {
  if (!segment || segment.length > MAX_MEDIA_PATH_SEGMENT_LENGTH) return false;
  if (segment === "." || segment === "..") return false;
  if (segment.startsWith(".")) return false;
  if (segment.trim() !== segment || /[. ]$/.test(segment)) return false;
  if (/[\u0000-\u001f\u007f/\\]/.test(segment)) return false;

  return true;
}

export function normalizeMediaRelativePath(value: string | undefined | null) {
  if (!value) return "";
  if (value.startsWith("/") || value.startsWith("\\") || /^[a-zA-Z]:/.test(value)) return null;

  const normalizedSeparators = value.replace(/\\/g, "/");
  const segments = normalizedSeparators.split("/");

  if (segments.some((segment) => !isSafeMediaPathSegment(segment))) return null;

  return segments.join("/");
}

function isPathWithin(root: string, candidate: string) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

export function resolveMediaStoragePath(relativePath: string) {
  const normalized = normalizeMediaRelativePath(relativePath);
  if (normalized === null) return null;

  const root = getMediaStorageDirectory();
  const candidate = normalized
    ? path.resolve(root, ...normalized.split("/"))
    : root;

  if (!isPathWithin(root, candidate)) return null;

  return { path: candidate, relativePath: normalized };
}

export async function resolveExistingMediaPath(relativePath: string) {
  const resolved = resolveMediaStoragePath(relativePath);
  if (!resolved) return null;

  try {
    await mkdir(getMediaStorageDirectory(), { recursive: true });

    const [rootRealPath, candidateRealPath, metadata] = await Promise.all([
      realpath(getMediaStorageDirectory()),
      realpath(resolved.path),
      lstat(resolved.path),
    ]);

    if (metadata.isSymbolicLink() || !isPathWithin(rootRealPath, candidateRealPath)) {
      return null;
    }

    return {
      path: candidateRealPath,
      relativePath: resolved.relativePath,
      metadata,
    };
  } catch {
    return null;
  }
}


export function getSupportedMediaExtension(mime: string) {
  return MIME_TO_EXTENSION.get(mime.toLowerCase()) ?? null;
}

export function isSupportedMediaMimeType(mime: string) {
  return getSupportedMediaExtension(mime) !== null;
}

export function getMediaContentType(filename: string) {
  return EXTENSION_TO_MIME.get(path.extname(filename).toLowerCase()) ?? "application/octet-stream";
}

export function isSupportedMediaPath(relativePath: string) {
  const normalized = normalizeMediaRelativePath(relativePath);
  if (normalized === null || !normalized) return false;

  return getMediaContentType(normalized) !== "application/octet-stream";
}

export async function saveUploadedMedia(file: File, relativeDirectory = "") {
  if (!file.name || file.size === 0) {
    throw new MediaUploadError("No media file was provided.", "missing");
  }

  const maxBytes = getMaxMediaUploadBytes();
  if (file.size > maxBytes) {
    throw new MediaUploadError("The uploaded file exceeds the configured size limit.", "too-large");
  }

  const extension = getSupportedMediaExtension(file.type.toLowerCase());
  if (!extension) {
    throw new MediaUploadError("That media type is not supported.", "unsupported");
  }

  const directory = await resolveExistingMediaPath(relativeDirectory);
  if (!directory?.metadata.isDirectory()) {
    throw new MediaUploadError("The selected media directory is invalid.", "invalid");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesMediaMimeSignature(bytes, file.type.toLowerCase())) {
    throw new MediaUploadError("The file contents do not match the declared media type.", "invalid");
  }

  const stem = sanitizeMediaStem(file.name);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = randomBytes(6).toString("hex");
    const filename = `${stem}-${suffix}${extension}`;
    const destination = path.join(directory.path, filename);

    try {
      const handle = await open(destination, "wx", 0o640);

      try {
        await handle.writeFile(bytes);
      } finally {
        await handle.close();
      }

      const relativePath = directory.relativePath
        ? `${directory.relativePath}/${filename}`
        : filename;

      return {
        filename,
        relativePath,
        size: bytes.byteLength,
        contentType: file.type.toLowerCase(),
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") continue;
      throw new MediaUploadError("The media file could not be stored.", "storage");
    }
  }

  throw new MediaUploadError("A unique media filename could not be generated.", "storage");
}

export async function getMediaFile(relativePath: string) {
  const normalized = normalizeMediaRelativePath(relativePath);
  if (normalized === null || !normalized || !isSupportedMediaPath(normalized)) return null;

  const resolved = await resolveExistingMediaPath(normalized);
  if (!resolved?.metadata.isFile()) return null;

  return {
    path: resolved.path,
    relativePath: resolved.relativePath,
    size: resolved.metadata.size,
    contentType: getMediaContentType(normalized),
  };
}
