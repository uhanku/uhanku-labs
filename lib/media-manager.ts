import type { Dirent } from "node:fs";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

import {
  getMediaContentType,
  isSafeMediaPathSegment,
  normalizeMediaRelativePath,
  resolveExistingMediaPath,
} from "@/lib/media-storage";

const MAX_BULK_DELETE_TARGETS = 200;

export type MediaEntryKind = "file" | "folder";
export type MediaPreviewKind = "image" | "video" | "other";

export interface MediaBrowserEntry {
  name: string;
  relativePath: string;
  kind: MediaEntryKind;
  size: number | null;
  modifiedAt: string;
  fileType: string;
  previewKind: MediaPreviewKind;
  hasChildren: boolean;
}

export interface MediaTreeNode {
  name: string;
  relativePath: string;
  kind: MediaEntryKind;
  children?: MediaTreeNode[];
}

export class MediaManagerError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid-path"
      | "not-found"
      | "not-directory"
      | "invalid-folder-name"
      | "folder-exists"
      | "folder-not-empty"
      | "invalid-delete"
      | "too-many-targets"
      | "storage",
  ) {
    super(message);
  }
}

function joinRelativePath(parent: string, child: string) {
  return parent ? `${parent}/${child}` : child;
}

function previewKindFor(filename: string): MediaPreviewKind {
  const contentType = getMediaContentType(filename);

  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";

  return "other";
}

function fileTypeFor(filename: string) {
  const contentType = getMediaContentType(filename);
  if (contentType !== "application/octet-stream") return contentType;

  const extension = path.extname(filename).slice(1).toUpperCase();
  return extension ? `${extension} file` : "File";
}

async function directoryHasChildren(absolutePath: string) {
  try {
    const entries = await readdir(absolutePath, { withFileTypes: true });
    return entries.some((entry) => !entry.isSymbolicLink());
  } catch {
    return false;
  }
}

export function sanitizeMediaFolderName(value: string) {
  const sanitized = value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

  if (
    sanitized.length > 80 ||
    !isSafeMediaPathSegment(sanitized) ||
    sanitized.includes("/") ||
    sanitized.includes("\\")
  ) {
    return null;
  }

  return sanitized;
}

export async function listMediaDirectory(relativeDirectory = "") {
  const normalized = normalizeMediaRelativePath(relativeDirectory);
  if (normalized === null) {
    throw new MediaManagerError("The requested media directory is invalid.", "invalid-path");
  }

  const directory = await resolveExistingMediaPath(normalized);
  if (!directory) {
    throw new MediaManagerError("The requested media directory was not found.", "not-found");
  }
  if (!directory.metadata.isDirectory()) {
    throw new MediaManagerError("The requested media path is not a directory.", "not-directory");
  }

  let dirents: Dirent[];
  try {
    dirents = await readdir(directory.path, { withFileTypes: true });
  } catch {
    throw new MediaManagerError("The media directory could not be read.", "storage");
  }

  const entries = (
    await Promise.all(
      dirents.map(async (dirent): Promise<MediaBrowserEntry | null> => {
        if (dirent.isSymbolicLink()) return null;

        const relativePath = joinRelativePath(normalized, dirent.name);
        const resolved = await resolveExistingMediaPath(relativePath);
        if (!resolved) return null;

        if (resolved.metadata.isDirectory()) {
          return {
            name: dirent.name,
            relativePath,
            kind: "folder",
            size: null,
            modifiedAt: resolved.metadata.mtime.toISOString(),
            fileType: "Folder",
            previewKind: "other",
            hasChildren: await directoryHasChildren(resolved.path),
          };
        }

        if (!resolved.metadata.isFile()) return null;

        return {
          name: dirent.name,
          relativePath,
          kind: "file",
          size: resolved.metadata.size,
          modifiedAt: resolved.metadata.mtime.toISOString(),
          fileType: fileTypeFor(dirent.name),
          previewKind: previewKindFor(dirent.name),
          hasChildren: false,
        };
      }),
    )
  ).filter((entry): entry is MediaBrowserEntry => entry !== null);

  entries.sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === "folder" ? -1 : 1;
    return left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: "base" });
  });

  return {
    relativePath: normalized,
    entries,
  };
}

async function buildTreeBranch(relativeDirectory: string): Promise<MediaTreeNode[]> {
  const directory = await resolveExistingMediaPath(relativeDirectory);
  if (!directory?.metadata.isDirectory()) return [];

  let dirents: Dirent[];
  try {
    dirents = await readdir(directory.path, { withFileTypes: true });
  } catch {
    return [];
  }

  const nodes = (
    await Promise.all(
      dirents.map(async (dirent): Promise<MediaTreeNode | null> => {
        if (dirent.isSymbolicLink()) return null;

        const relativePath = joinRelativePath(relativeDirectory, dirent.name);
        const resolved = await resolveExistingMediaPath(relativePath);
        if (!resolved) return null;

        if (resolved.metadata.isDirectory()) {
          return {
            name: dirent.name,
            relativePath,
            kind: "folder",
            children: await buildTreeBranch(relativePath),
          };
        }

        if (resolved.metadata.isFile()) {
          return {
            name: dirent.name,
            relativePath,
            kind: "file",
          };
        }

        return null;
      }),
    )
  ).filter((node): node is MediaTreeNode => node !== null);

  nodes.sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === "folder" ? -1 : 1;
    return left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: "base" });
  });

  return nodes;
}

export async function getMediaTree() {
  return buildTreeBranch("");
}

export async function getMediaDirectorySize(relativeDirectory = "") {
  const normalized = normalizeMediaRelativePath(relativeDirectory);
  if (normalized === null) {
    throw new MediaManagerError("The requested media directory is invalid.", "invalid-path");
  }

  const directory = await resolveExistingMediaPath(normalized);
  if (!directory) {
    throw new MediaManagerError("The requested media directory was not found.", "not-found");
  }
  if (!directory.metadata.isDirectory()) {
    throw new MediaManagerError("The requested media path is not a directory.", "not-directory");
  }

  async function branchSize(relativePath: string): Promise<number> {
    const resolvedDirectory = await resolveExistingMediaPath(relativePath);
    if (!resolvedDirectory?.metadata.isDirectory()) return 0;

    let dirents: Dirent[];
    try {
      dirents = await readdir(resolvedDirectory.path, { withFileTypes: true });
    } catch {
      throw new MediaManagerError("The media directory size could not be calculated.", "storage");
    }

    let total = 0;

    for (const dirent of dirents) {
      if (dirent.isSymbolicLink()) continue;

      const childRelativePath = joinRelativePath(relativePath, dirent.name);
      const child = await resolveExistingMediaPath(childRelativePath);
      if (!child) continue;

      if (child.metadata.isFile()) {
        total += child.metadata.size;
      } else if (child.metadata.isDirectory()) {
        total += await branchSize(childRelativePath);
      }
    }

    return total;
  }

  return branchSize(normalized);
}

export async function createMediaDirectory(parentPath: string, folderName: string) {
  const normalizedParent = normalizeMediaRelativePath(parentPath);
  if (normalizedParent === null) {
    throw new MediaManagerError("The parent media directory is invalid.", "invalid-path");
  }

  const safeFolderName = sanitizeMediaFolderName(folderName);
  if (!safeFolderName) {
    throw new MediaManagerError(
      "Folder names cannot contain path separators, hidden path segments, or control characters.",
      "invalid-folder-name",
    );
  }

  const parent = await resolveExistingMediaPath(normalizedParent);
  if (!parent?.metadata.isDirectory()) {
    throw new MediaManagerError("The parent media directory was not found.", "not-directory");
  }

  const destination = path.join(parent.path, safeFolderName);

  try {
    await mkdir(destination, { mode: 0o750 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new MediaManagerError("A file or folder with that name already exists.", "folder-exists");
    }

    throw new MediaManagerError("The folder could not be created.", "storage");
  }

  return joinRelativePath(normalizedParent, safeFolderName);
}

export async function deleteMediaTarget(relativePath: string, allowRecursiveFolderDelete = false) {
  const normalized = normalizeMediaRelativePath(relativePath);
  if (normalized === null || !normalized) {
    throw new MediaManagerError("The delete target is invalid.", "invalid-delete");
  }

  const target = await resolveExistingMediaPath(normalized);
  if (!target) {
    throw new MediaManagerError("The delete target was not found.", "not-found");
  }

  try {
    if (target.metadata.isDirectory()) {
      const hasChildren = await directoryHasChildren(target.path);

      if (hasChildren && !allowRecursiveFolderDelete) {
        throw new MediaManagerError(
          "The folder contains files or subfolders and requires explicit recursive confirmation.",
          "folder-not-empty",
        );
      }

      await rm(target.path, { recursive: allowRecursiveFolderDelete, force: false });
      return "folder" as const;
    }

    if (!target.metadata.isFile()) {
      throw new MediaManagerError("Only regular files and folders can be deleted.", "invalid-delete");
    }

    await rm(target.path, { force: false });
    return "file" as const;
  } catch (error) {
    if (error instanceof MediaManagerError) throw error;
    throw new MediaManagerError("The selected media item could not be deleted.", "storage");
  }
}

export async function deleteMediaFiles(relativePaths: string[]) {
  const uniqueTargets = [...new Set(relativePaths)];

  if (uniqueTargets.length === 0) {
    throw new MediaManagerError("No files were selected.", "invalid-delete");
  }
  if (uniqueTargets.length > MAX_BULK_DELETE_TARGETS) {
    throw new MediaManagerError("Too many files were selected for one request.", "too-many-targets");
  }

  for (const relativePath of uniqueTargets) {
    const normalized = normalizeMediaRelativePath(relativePath);
    if (normalized === null || !normalized) {
      throw new MediaManagerError("One or more selected file paths are invalid.", "invalid-delete");
    }

    const target = await resolveExistingMediaPath(normalized);
    if (!target?.metadata.isFile()) {
      throw new MediaManagerError("Bulk deletion is limited to regular files.", "invalid-delete");
    }
  }

  for (const relativePath of uniqueTargets) {
    await deleteMediaTarget(relativePath, false);
  }

  return uniqueTargets.length;
}
