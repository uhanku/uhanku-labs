import { randomBytes, randomUUID } from "node:crypto";
import type { Dirent } from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rm,
  stat,
  unlink,
  utimes,
  writeFile,
  link,
} from "node:fs/promises";
import path from "node:path";

import {
  getMaxMediaUploadBytes,
  getSupportedMediaExtension,
  matchesMediaMimeSignature,
  normalizeMediaRelativePath,
  resolveExistingMediaPath,
  sanitizeMediaStem,
} from "@/lib/media-storage";

const DEFAULT_UPLOAD_CHUNK_BYTES = 5 * 1024 * 1024;
const DEFAULT_UPLOAD_TEMP_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MIN_UPLOAD_CHUNK_BYTES = 256 * 1024;
const MAX_UPLOAD_CHUNK_BYTES = 16 * 1024 * 1024;
const MAX_UPLOAD_CHUNKS = 20_000;
const UPLOAD_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const METADATA_FILENAME = "upload.json";
const ASSEMBLY_PREFIX = ".media-upload-";

interface UploadMetadata {
  version: 1;
  uploadId: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  chunkSize: number;
  totalChunks: number;
  directory: string;
  finalFilename: string;
  createdAt: string;
}

export interface ChunkUploadIdentity {
  uploadId: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  totalChunks: number;
  directory: string;
}

export class ChunkedMediaUploadError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid-upload"
      | "upload-not-found"
      | "invalid-chunk"
      | "missing-chunk"
      | "too-large"
      | "unsupported"
      | "invalid-path"
      | "storage",
  ) {
    super(message);
  }
}

export function getMediaUploadChunkBytes() {
  const configured = Number(process.env.MEDIA_UPLOAD_CHUNK_BYTES ?? DEFAULT_UPLOAD_CHUNK_BYTES);

  if (!Number.isFinite(configured) || configured < MIN_UPLOAD_CHUNK_BYTES) {
    return DEFAULT_UPLOAD_CHUNK_BYTES;
  }

  return Math.min(Math.floor(configured), MAX_UPLOAD_CHUNK_BYTES);
}

function getMediaUploadTempMaxAgeMs() {
  const configured = Number(process.env.MEDIA_UPLOAD_TEMP_MAX_AGE_MS ?? DEFAULT_UPLOAD_TEMP_MAX_AGE_MS);

  if (!Number.isFinite(configured) || configured < 60_000) {
    return DEFAULT_UPLOAD_TEMP_MAX_AGE_MS;
  }

  return Math.floor(configured);
}

function getMediaUploadTempDirectory() {
  return path.resolve(
    process.env.MEDIA_UPLOAD_TEMP_DIR ?? path.join(process.cwd(), "storage", "media-uploads"),
  );
}

function validateUploadId(uploadId: string) {
  return UPLOAD_ID_PATTERN.test(uploadId);
}

function uploadDirectoryPath(uploadId: string) {
  if (!validateUploadId(uploadId)) return null;

  const root = getMediaUploadTempDirectory();
  const candidate = path.resolve(root, uploadId);

  if (candidate === root || !candidate.startsWith(`${root}${path.sep}`)) return null;
  return candidate;
}

function metadataPath(uploadId: string) {
  const directory = uploadDirectoryPath(uploadId);
  return directory ? path.join(directory, METADATA_FILENAME) : null;
}

function chunkPath(uploadId: string, chunkIndex: number) {
  const directory = uploadDirectoryPath(uploadId);
  if (!directory) return null;

  return path.join(directory, `chunk-${String(chunkIndex).padStart(6, "0")}.part`);
}

function assemblyFilename(uploadId: string) {
  return `${ASSEMBLY_PREFIX}${uploadId}.partial`;
}

function safeOriginalFilename(value: string) {
  if (!value || value.length > 255 || path.basename(value) !== value) return false;
  if (/[\u0000-\u001f\u007f/\\]/.test(value)) return false;
  return true;
}

function parseMetadata(value: unknown): UploadMetadata | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Partial<UploadMetadata>;

  if (
    data.version !== 1 ||
    typeof data.uploadId !== "string" ||
    !validateUploadId(data.uploadId) ||
    typeof data.originalFilename !== "string" ||
    !safeOriginalFilename(data.originalFilename) ||
    typeof data.contentType !== "string" ||
    !getSupportedMediaExtension(data.contentType) ||
    typeof data.fileSize !== "number" ||
    !Number.isSafeInteger(data.fileSize) ||
    data.fileSize <= 0 ||
    typeof data.chunkSize !== "number" ||
    !Number.isSafeInteger(data.chunkSize) ||
    data.chunkSize <= 0 ||
    typeof data.totalChunks !== "number" ||
    !Number.isSafeInteger(data.totalChunks) ||
    data.totalChunks <= 0 ||
    data.totalChunks > MAX_UPLOAD_CHUNKS ||
    typeof data.directory !== "string" ||
    normalizeMediaRelativePath(data.directory) !== data.directory ||
    typeof data.finalFilename !== "string" ||
    !data.finalFilename ||
    typeof data.createdAt !== "string"
  ) {
    return null;
  }

  return data as UploadMetadata;
}

async function loadUploadMetadata(uploadId: string) {
  const uploadDirectory = uploadDirectoryPath(uploadId);
  const metadataFile = metadataPath(uploadId);
  if (!uploadDirectory || !metadataFile) {
    throw new ChunkedMediaUploadError("The upload identifier is invalid.", "invalid-upload");
  }

  try {
    const directoryMetadata = await lstat(uploadDirectory);
    if (!directoryMetadata.isDirectory() || directoryMetadata.isSymbolicLink()) {
      throw new ChunkedMediaUploadError("The upload workspace is invalid.", "invalid-upload");
    }

    const parsed = parseMetadata(JSON.parse(await readFile(metadataFile, "utf8")));
    if (!parsed || parsed.uploadId !== uploadId) {
      throw new ChunkedMediaUploadError("The upload metadata is invalid.", "invalid-upload");
    }

    return parsed;
  } catch (error) {
    if (error instanceof ChunkedMediaUploadError) throw error;

    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ChunkedMediaUploadError("The upload session no longer exists.", "upload-not-found");
    }

    throw new ChunkedMediaUploadError("The upload metadata could not be read.", "storage");
  }
}

function assertIdentityMatches(metadata: UploadMetadata, identity: ChunkUploadIdentity) {
  const normalizedDirectory = normalizeMediaRelativePath(identity.directory);

  if (
    identity.uploadId !== metadata.uploadId ||
    identity.originalFilename !== metadata.originalFilename ||
    identity.contentType.toLowerCase() !== metadata.contentType ||
    identity.fileSize !== metadata.fileSize ||
    identity.totalChunks !== metadata.totalChunks ||
    normalizedDirectory === null ||
    normalizedDirectory !== metadata.directory
  ) {
    throw new ChunkedMediaUploadError(
      "Chunk metadata does not match the initialized upload.",
      "invalid-upload",
    );
  }
}

function expectedChunkLength(metadata: UploadMetadata, chunkIndex: number) {
  const start = chunkIndex * metadata.chunkSize;
  return Math.min(metadata.chunkSize, metadata.fileSize - start);
}

async function removeAssemblyFile(metadata: UploadMetadata) {
  const directory = await resolveExistingMediaPath(metadata.directory);
  if (!directory?.metadata.isDirectory()) return;

  await rm(path.join(directory.path, assemblyFilename(metadata.uploadId)), { force: true }).catch(() => {});
}

export async function cleanupExpiredMediaUploads() {
  const root = getMediaUploadTempDirectory();
  const cutoff = Date.now() - getMediaUploadTempMaxAgeMs();

  try {
    await mkdir(root, { recursive: true, mode: 0o750 });
  } catch {
    return;
  }

  let entries: Dirent[];
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return;
  }

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory() || entry.isSymbolicLink() || !validateUploadId(entry.name)) return;

      const directory = path.join(root, entry.name);

      try {
        const metadata = await stat(directory);
        if (metadata.mtimeMs >= cutoff) return;

        try {
          const uploadMetadata = await loadUploadMetadata(entry.name);
          await removeAssemblyFile(uploadMetadata);
        } catch {
          // Invalid stale upload workspaces are still safe to remove below.
        }

        await rm(directory, { recursive: true, force: true });
      } catch {
        // Cleanup is best-effort and must not block the file manager.
      }
    }),
  );
}

export async function initializeChunkedMediaUpload(input: {
  originalFilename: string;
  contentType: string;
  fileSize: number;
  directory: string;
}) {
  if (!safeOriginalFilename(input.originalFilename)) {
    throw new ChunkedMediaUploadError("The original filename is invalid.", "invalid-upload");
  }

  if (!Number.isSafeInteger(input.fileSize) || input.fileSize <= 0) {
    throw new ChunkedMediaUploadError("The file size is invalid.", "invalid-upload");
  }

  if (input.fileSize > getMaxMediaUploadBytes()) {
    throw new ChunkedMediaUploadError("The file exceeds the configured upload limit.", "too-large");
  }

  const contentType = input.contentType.toLowerCase();
  const extension = getSupportedMediaExtension(contentType);
  if (!extension) {
    throw new ChunkedMediaUploadError("That media type is not supported.", "unsupported");
  }

  const normalizedDirectory = normalizeMediaRelativePath(input.directory);
  if (normalizedDirectory === null) {
    throw new ChunkedMediaUploadError("The selected media directory is invalid.", "invalid-path");
  }

  const destinationDirectory = await resolveExistingMediaPath(normalizedDirectory);
  if (!destinationDirectory?.metadata.isDirectory()) {
    throw new ChunkedMediaUploadError("The selected media directory does not exist.", "invalid-path");
  }

  await cleanupExpiredMediaUploads();

  const uploadId = randomUUID();
  const chunkSize = getMediaUploadChunkBytes();
  const totalChunks = Math.ceil(input.fileSize / chunkSize);

  if (totalChunks <= 0 || totalChunks > MAX_UPLOAD_CHUNKS) {
    throw new ChunkedMediaUploadError("The file requires too many upload chunks.", "too-large");
  }

  const suffix = randomBytes(6).toString("hex");
  const finalFilename = `${sanitizeMediaStem(input.originalFilename)}-${suffix}${extension}`;
  const uploadDirectory = uploadDirectoryPath(uploadId);
  const metadataFile = metadataPath(uploadId);

  if (!uploadDirectory || !metadataFile) {
    throw new ChunkedMediaUploadError("A safe upload workspace could not be created.", "storage");
  }

  const metadata: UploadMetadata = {
    version: 1,
    uploadId,
    originalFilename: input.originalFilename,
    contentType,
    fileSize: input.fileSize,
    chunkSize,
    totalChunks,
    directory: normalizedDirectory,
    finalFilename,
    createdAt: new Date().toISOString(),
  };

  try {
    await mkdir(uploadDirectory, { recursive: false, mode: 0o750 });
    await writeFile(metadataFile, JSON.stringify(metadata), { encoding: "utf8", flag: "wx", mode: 0o600 });
  } catch {
    await rm(uploadDirectory, { recursive: true, force: true }).catch(() => {});
    throw new ChunkedMediaUploadError("The upload workspace could not be created.", "storage");
  }

  return {
    uploadId,
    chunkSize,
    totalChunks,
  };
}

export async function storeChunkedMediaUploadPart(
  identity: ChunkUploadIdentity,
  chunkIndex: number,
  bytes: Uint8Array,
) {
  const metadata = await loadUploadMetadata(identity.uploadId);
  assertIdentityMatches(metadata, identity);

  if (!Number.isSafeInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= metadata.totalChunks) {
    throw new ChunkedMediaUploadError("The chunk index is invalid.", "invalid-chunk");
  }

  const expectedLength = expectedChunkLength(metadata, chunkIndex);
  if (expectedLength <= 0 || bytes.byteLength !== expectedLength) {
    throw new ChunkedMediaUploadError("The chunk size does not match the upload metadata.", "invalid-chunk");
  }

  const destination = chunkPath(metadata.uploadId, chunkIndex);
  const uploadDirectory = uploadDirectoryPath(metadata.uploadId);
  if (!destination || !uploadDirectory) {
    throw new ChunkedMediaUploadError("The chunk destination is invalid.", "invalid-upload");
  }

  try {
    const handle = await open(destination, "wx", 0o600);
    try {
      await handle.writeFile(bytes);
    } finally {
      await handle.close();
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      const existing = await stat(destination).catch(() => null);
      if (existing?.isFile() && existing.size === bytes.byteLength) {
        await utimes(uploadDirectory, new Date(), new Date()).catch(() => {});
        return { duplicate: true };
      }

      throw new ChunkedMediaUploadError("A retried chunk conflicts with stored upload data.", "invalid-chunk");
    }

    throw new ChunkedMediaUploadError("The upload chunk could not be stored.", "storage");
  }

  await utimes(uploadDirectory, new Date(), new Date()).catch(() => {});
  return { duplicate: false };
}

export async function completeChunkedMediaUpload(identity: ChunkUploadIdentity) {
  const metadata = await loadUploadMetadata(identity.uploadId);
  assertIdentityMatches(metadata, identity);

  const destinationDirectory = await resolveExistingMediaPath(metadata.directory);
  if (!destinationDirectory?.metadata.isDirectory()) {
    throw new ChunkedMediaUploadError("The destination directory no longer exists.", "invalid-path");
  }

  for (let index = 0; index < metadata.totalChunks; index += 1) {
    const file = chunkPath(metadata.uploadId, index);
    if (!file) throw new ChunkedMediaUploadError("The chunk path is invalid.", "invalid-upload");

    const chunkMetadata = await stat(file).catch(() => null);
    if (!chunkMetadata?.isFile() || chunkMetadata.size !== expectedChunkLength(metadata, index)) {
      throw new ChunkedMediaUploadError(`Chunk ${index + 1} is missing or incomplete.`, "missing-chunk");
    }
  }

  const partialPath = path.join(destinationDirectory.path, assemblyFilename(metadata.uploadId));
  const finalPath = path.join(destinationDirectory.path, metadata.finalFilename);
  let handle: Awaited<ReturnType<typeof open>> | undefined;

  try {
    // The reconstructed file is read below to validate its media signature,
    // so it must be opened read/write rather than write-only.
    handle = await open(partialPath, "wx+", 0o640);
    let offset = 0;

    for (let index = 0; index < metadata.totalChunks; index += 1) {
      const file = chunkPath(metadata.uploadId, index);
      if (!file) throw new ChunkedMediaUploadError("The chunk path is invalid.", "invalid-upload");

      const bytes = await readFile(file);
      let written = 0;

      while (written < bytes.byteLength) {
        const result = await handle.write(
          bytes,
          written,
          bytes.byteLength - written,
          offset + written,
        );

        if (result.bytesWritten <= 0) {
          throw new ChunkedMediaUploadError("The reconstructed file could not be written completely.", "storage");
        }

        written += result.bytesWritten;
      }

      offset += bytes.byteLength;
    }

    if (offset !== metadata.fileSize) {
      throw new ChunkedMediaUploadError("The reconstructed file size is invalid.", "invalid-upload");
    }

    const signature = Buffer.alloc(Math.min(64, metadata.fileSize));
    await handle.read(signature, 0, signature.byteLength, 0);

    if (!matchesMediaMimeSignature(signature, metadata.contentType)) {
      throw new ChunkedMediaUploadError(
        "The reconstructed file does not match the declared media type.",
        "invalid-upload",
      );
    }

    await handle.sync();
    await handle.close();
    handle = undefined;

    // Hard-linking is atomic and fails if a final filename somehow already exists,
    // so a partial file can never be exposed under /media/.
    await link(partialPath, finalPath);
    await unlink(partialPath);
    await rm(uploadDirectoryPath(metadata.uploadId)!, { recursive: true, force: true });

    const relativePath = metadata.directory
      ? `${metadata.directory}/${metadata.finalFilename}`
      : metadata.finalFilename;

    return {
      filename: metadata.finalFilename,
      relativePath,
      size: metadata.fileSize,
      contentType: metadata.contentType,
    };
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await rm(partialPath, { force: true }).catch(() => {});

    if (error instanceof ChunkedMediaUploadError) throw error;
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new ChunkedMediaUploadError("The final media filename already exists.", "storage");
    }

    throw new ChunkedMediaUploadError("The media file could not be reconstructed.", "storage");
  }
}

export async function cancelChunkedMediaUpload(uploadId: string) {
  if (!validateUploadId(uploadId)) {
    throw new ChunkedMediaUploadError("The upload identifier is invalid.", "invalid-upload");
  }

  try {
    const metadata = await loadUploadMetadata(uploadId);
    await removeAssemblyFile(metadata);
  } catch (error) {
    if (
      error instanceof ChunkedMediaUploadError &&
      error.code !== "upload-not-found"
    ) {
      throw error;
    }
  }

  const directory = uploadDirectoryPath(uploadId);
  if (directory) await rm(directory, { recursive: true, force: true });
}
