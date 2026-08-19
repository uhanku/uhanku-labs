"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { UploadProgress, type UploadProgressItem } from "@/components/media/UploadProgress";
import type { MediaBrowserEntry, MediaTreeNode } from "@/lib/media-manager";

import styles from "./media-admin.module.css";

interface MediaFileManagerProps {
  currentPath: string;
  currentFolderSize: number;
  entries: MediaBrowserEntry[];
  maxUploadBytes: number;
  tree: MediaTreeNode[];
}

interface UploadInitResponse {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
}

interface UploadCompleteResponse {
  relativePath: string;
  publicPath: string;
}

const CHUNK_RETRY_LIMIT = 3;
const CHUNK_RETRY_BASE_DELAY_MS = 450;
const MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,audio/mpeg,audio/ogg,audio/wav,audio/mp4";

function publicMediaPath(relativePath: string) {
  return `/media/${relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

function adminPath(relativePath: string) {
  if (!relativePath) return "/media-admin";
  return `/media-admin?path=${encodeURIComponent(relativePath)}`;
}

function formatBytes(bytes: number | null) {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(value: string) {
  // Keep SSR and hydration deterministic. Using the runtime defaults here
  // makes the server and browser format this same timestamp differently.
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function submitPost(action: string, fields: Array<[string, string]>) {
  const form = document.createElement("form");
  form.method = "post";
  form.action = action;
  form.hidden = true;

  for (const [name, value] of fields) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

function TreeNodes({ nodes, currentPath }: { nodes: MediaTreeNode[]; currentPath: string }) {
  return (
    <ul className={styles.treeList}>
      {nodes.map((node) => (
        <li key={node.relativePath} className={styles.treeItem}>
          {node.kind === "folder" ? (
            <>
              <Link
                className={`${styles.treeLink} ${currentPath === node.relativePath ? styles.treeLinkActive : ""}`}
                href={adminPath(node.relativePath)}
              >
                <span aria-hidden="true">▸</span>
                {node.name}
              </Link>
              {node.children?.length ? (
                <TreeNodes nodes={node.children} currentPath={currentPath} />
              ) : null}
            </>
          ) : (
            <span className={styles.treeFile} title={node.relativePath}>
              <span aria-hidden="true">·</span>
              {node.name}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as { message?: string } | null;

  if (!response.ok) {
    throw new Error(body?.message ?? `Upload request failed with status ${response.status}.`);
  }

  return body as T;
}

async function cancelServerUploadRequest(uploadId: string) {
  try {
    await fetch("/api/media/upload/cancel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ uploadId }),
      keepalive: true,
    });
  } catch {
    // Stale temporary uploads are also removed by server-side expiry cleanup.
  }
}

function validFolderName(value: string) {
  if (!value || value.length > 80) return false;
  if (value.trim() !== value || value.startsWith(".")) return false;
  if (value === "." || value === ".." || /[. ]$/.test(value)) return false;
  return !/[\u0000-\u001f\u007f/\\]/.test(value);
}

export default function MediaFileManager({
  currentPath,
  currentFolderSize,
  entries,
  maxUploadBytes,
  tree,
}: MediaFileManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadIdsRef = useRef(new Map<string, string>());
  const uploadControllersRef = useRef(new Map<string, AbortController>());
  const cancelledUploadItemsRef = useRef(new Set<string>());

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<MediaBrowserEntry | null>(null);
  const [uploads, setUploads] = useState<UploadProgressItem[]>([]);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderError, setFolderError] = useState("");

  const files = useMemo(() => entries.filter((entry) => entry.kind === "file"), [entries]);
  const allFilesSelected = files.length > 0 && files.every((file) => selected.has(file.relativePath));
  const uploading = uploads.some((item) => ["preparing", "uploading", "processing"].includes(item.state));

  useEffect(() => {
    for (const [itemId, controller] of uploadControllersRef.current) {
      cancelledUploadItemsRef.current.add(itemId);
      controller.abort();

      const uploadId = uploadIdsRef.current.get(itemId);
      if (uploadId) void cancelServerUploadRequest(uploadId);
    }

    const resetState = window.setTimeout(() => {
      setUploads([]);
      setSelected(new Set());
      setPreview(null);
    }, 0);

    return () => window.clearTimeout(resetState);
  }, [currentPath]);

  useEffect(() => {
    if (!preview) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreview(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [preview]);

  useEffect(() => {
    if (!folderModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFolderModalOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [folderModalOpen]);

  const updateUpload = (id: string, patch: Partial<UploadProgressItem>) => {
    setUploads((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const cancelUpload = (itemId: string) => {
    cancelledUploadItemsRef.current.add(itemId);
    uploadControllersRef.current.get(itemId)?.abort();

    const uploadId = uploadIdsRef.current.get(itemId);
    if (uploadId) void cancelServerUploadRequest(uploadId);

    updateUpload(itemId, {
      state: "failed",
      error: "Upload cancelled.",
    });
  };

  const uploadChunkWithRetry = async (
    formDataFactory: () => FormData,
    signal: AbortSignal,
  ) => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= CHUNK_RETRY_LIMIT; attempt += 1) {
      try {
        const response = await fetch("/api/media/upload/chunk", {
          method: "POST",
          body: formDataFactory(),
          signal,
        });

        if (response.ok) return;

        const body = await response.json().catch(() => null) as { message?: string } | null;
        const error = new Error(body?.message ?? `Chunk upload failed with status ${response.status}.`);

        if (response.status < 500 && response.status !== 429) throw error;
        lastError = error;
      } catch (error) {
        if (signal.aborted) throw error;
        lastError = error instanceof Error ? error : new Error("The chunk upload failed.");
      }

      if (attempt < CHUNK_RETRY_LIMIT) {
        await sleep(CHUNK_RETRY_BASE_DELAY_MS * attempt);
      }
    }

    throw lastError ?? new Error("The chunk upload failed after multiple attempts.");
  };

  const uploadOneFile = async (file: File, itemId: string) => {
    if (cancelledUploadItemsRef.current.has(itemId)) return false;

    if (file.size > maxUploadBytes) {
      updateUpload(itemId, {
        state: "failed",
        error: `File exceeds the ${formatBytes(maxUploadBytes)} upload limit.`,
      });
      return false;
    }

    const controller = new AbortController();
    uploadControllersRef.current.set(itemId, controller);

    let uploadId: string | null = null;

    try {
      updateUpload(itemId, { state: "preparing", progress: 0, uploadedBytes: 0, error: undefined });

      const initialized = await responseJson<UploadInitResponse>(await fetch("/api/media/upload/init", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          originalFilename: file.name,
          contentType: file.type,
          fileSize: file.size,
          directory: currentPath,
        }),
        signal: controller.signal,
      }));

      uploadId = initialized.uploadId;
      uploadIdsRef.current.set(itemId, uploadId);

      if (cancelledUploadItemsRef.current.has(itemId)) {
        await cancelServerUploadRequest(uploadId);
        return false;
      }

      updateUpload(itemId, { state: "uploading" });

      let uploadedBytes = 0;

      for (let chunkIndex = 0; chunkIndex < initialized.totalChunks; chunkIndex += 1) {
        if (cancelledUploadItemsRef.current.has(itemId)) {
          controller.abort();
          throw new DOMException("Upload cancelled.", "AbortError");
        }

        const start = chunkIndex * initialized.chunkSize;
        const end = Math.min(file.size, start + initialized.chunkSize);
        const chunk = file.slice(start, end);

        await uploadChunkWithRetry(() => {
          const formData = new FormData();
          formData.set("uploadId", initialized.uploadId);
          formData.set("originalFilename", file.name);
          formData.set("contentType", file.type);
          formData.set("fileSize", String(file.size));
          formData.set("chunkIndex", String(chunkIndex));
          formData.set("totalChunks", String(initialized.totalChunks));
          formData.set("directory", currentPath);
          formData.set("chunk", chunk, `chunk-${chunkIndex}.part`);
          return formData;
        }, controller.signal);

        uploadedBytes += chunk.size;
        const progress = Math.min(99, Math.floor((uploadedBytes / file.size) * 100));
        updateUpload(itemId, { uploadedBytes, progress, state: "uploading" });
      }

      updateUpload(itemId, {
        state: "processing",
        uploadedBytes: file.size,
        progress: 99,
      });

      await responseJson<UploadCompleteResponse>(await fetch("/api/media/upload/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          uploadId: initialized.uploadId,
          originalFilename: file.name,
          contentType: file.type,
          fileSize: file.size,
          totalChunks: initialized.totalChunks,
          directory: currentPath,
        }),
        signal: controller.signal,
      }));

      updateUpload(itemId, {
        state: "completed",
        progress: 100,
        uploadedBytes: file.size,
      });

      return true;
    } catch (error) {
      if (uploadId) await cancelServerUploadRequest(uploadId);

      if (cancelledUploadItemsRef.current.has(itemId) || (error instanceof DOMException && error.name === "AbortError")) {
        updateUpload(itemId, { state: "failed", error: "Upload cancelled." });
      } else {
        updateUpload(itemId, {
          state: "failed",
          error: error instanceof Error ? error.message : "The upload failed.",
        });
      }

      return false;
    } finally {
      uploadControllersRef.current.delete(itemId);
      uploadIdsRef.current.delete(itemId);
    }
  };

  const uploadFiles = async (fileList: FileList) => {
    if (fileList.length === 0) return;

    const selectedFiles = [...fileList];
    const items = selectedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
      filename: file.name,
      progress: 0,
      uploadedBytes: 0,
      totalBytes: file.size,
      state: "preparing" as const,
    }));

    cancelledUploadItemsRef.current.clear();
    setUploads(items);

    let changed = false;
    for (let index = 0; index < selectedFiles.length; index += 1) {
      const item = items[index];
      if (cancelledUploadItemsRef.current.has(item.id)) continue;
      changed = (await uploadOneFile(selectedFiles[index], item.id)) || changed;
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (changed) router.refresh();
  };

  const toggleFile = (relativePath: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(relativePath)) next.delete(relativePath);
      else next.add(relativePath);
      return next;
    });
  };

  const toggleAllFiles = () => {
    setSelected((current) => {
      if (allFilesSelected) return new Set();

      const next = new Set(current);
      for (const file of files) next.add(file.relativePath);
      return next;
    });
  };

  const deleteSingle = (entry: MediaBrowserEntry) => {
    const isFolder = entry.kind === "folder";
    const confirmation = isFolder
      ? entry.hasChildren
        ? `Delete the folder “${entry.name}” and everything inside it? This cannot be undone.`
        : `Delete the empty folder “${entry.name}”? This cannot be undone.`
      : `Delete “${entry.name}”? This cannot be undone.`;

    if (!window.confirm(confirmation)) return;

    submitPost("/api/media-admin/delete", [
      ["mode", "single"],
      ["currentPath", currentPath],
      ["target", entry.relativePath],
      ["recursive", isFolder && entry.hasChildren ? "true" : "false"],
    ]);
  };

  const deleteSelected = () => {
    const targets = [...selected];
    if (targets.length === 0) return;

    if (!window.confirm(`Delete ${targets.length} selected file${targets.length === 1 ? "" : "s"}? This cannot be undone.`)) {
      return;
    }

    submitPost("/api/media-admin/delete", [
      ["mode", "bulk"],
      ["currentPath", currentPath],
      ...targets.map((target) => ["targets", target] as [string, string]),
    ]);
  };

  const submitFolder = (event: FormEvent<HTMLFormElement>) => {
    if (validFolderName(folderName)) {
      setFolderError("");
      return;
    }

    event.preventDefault();
    setFolderError("Use a safe folder name without path separators, hidden segments, or trailing dots/spaces.");
  };

  return (
    <>
      <div className={styles.browserLayout}>
        <aside className={styles.treePanel} aria-label="Media directory tree">
          <div className={styles.treeHeader}>DIRECTORY TREE</div>
          <Link
            className={`${styles.treeLink} ${currentPath === "" ? styles.treeLinkActive : ""}`}
            href="/media-admin"
          >
            <span aria-hidden="true">◆</span>
            media
          </Link>
          {tree.length ? <TreeNodes nodes={tree} currentPath={currentPath} /> : (
            <p className={styles.treeEmpty}>No media yet.</p>
          )}
        </aside>

        <section className={styles.browserPanel} aria-label="Media files">
          <div className={styles.browserToolbar}>
            <div className={styles.toolbarPrimaryActions}>
              <input
                ref={fileInputRef}
                className={styles.visuallyHidden}
                type="file"
                accept={MEDIA_ACCEPT}
                multiple
                onChange={(event) => {
                  if (event.currentTarget.files) void uploadFiles(event.currentTarget.files);
                }}
              />

              <button
                className={styles.button}
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                UPLOAD FILES
              </button>

              <button
                className={styles.folderIconButton}
                type="button"
                aria-label="Create folder"
                title="Create folder"
                onClick={() => {
                  setFolderName("");
                  setFolderError("");
                  setFolderModalOpen(true);
                }}
              >
                <span aria-hidden="true">＋</span>
              </button>

              <div className={styles.folderSize} title="Includes files inside nested folders">
                <span>CURRENT FOLDER SIZE</span>
                <strong>{formatBytes(currentFolderSize)}</strong>
              </div>
            </div>

            <div className={styles.toolbarSelectionActions}>
              <label className={styles.selectAll}>
                <input
                  type="checkbox"
                  checked={allFilesSelected}
                  onChange={toggleAllFiles}
                  disabled={files.length === 0}
                />
                SELECT ALL FILES
              </label>

              <button
                className={`${styles.button} ${styles.buttonDanger}`}
                type="button"
                onClick={deleteSelected}
                disabled={selected.size === 0}
              >
                DELETE SELECTED {selected.size ? `(${selected.size})` : ""}
              </button>
            </div>
          </div>

          <UploadProgress items={uploads} onCancel={cancelUpload} />

          <div className={styles.tableWrap}>
            <table className={styles.fileTable}>
              <thead>
                <tr>
                  <th className={styles.checkboxCell} aria-label="Selection" />
                  <th>NAME</th>
                  <th>TYPE</th>
                  <th>SIZE</th>
                  <th>MODIFIED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.relativePath}>
                    <td className={styles.checkboxCell}>
                      {entry.kind === "file" ? (
                        <input
                          type="checkbox"
                          aria-label={`Select ${entry.name}`}
                          checked={selected.has(entry.relativePath)}
                          onChange={() => toggleFile(entry.relativePath)}
                        />
                      ) : null}
                    </td>
                    <td>
                      <div className={styles.nameCell}>
                        <span className={entry.kind === "folder" ? styles.folderIndicator : styles.fileIndicator} aria-hidden="true">
                          {entry.kind === "folder" ? "DIR" : "FILE"}
                        </span>
                        {entry.kind === "folder" ? (
                          <Link href={adminPath(entry.relativePath)}>{entry.name}</Link>
                        ) : (
                          <span title={entry.relativePath}>{entry.name}</span>
                        )}
                      </div>
                    </td>
                    <td>{entry.fileType}</td>
                    <td>{formatBytes(entry.size)}</td>
                    <td>{formatDate(entry.modifiedAt)}</td>
                    <td>
                      <div className={styles.rowActions}>
                        {entry.kind === "file" ? (
                          <button className={styles.textButton} type="button" onClick={() => setPreview(entry)}>
                            PREVIEW
                          </button>
                        ) : null}
                        <button className={`${styles.textButton} ${styles.textButtonDanger}`} type="button" onClick={() => deleteSingle(entry)}>
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {entries.length === 0 ? (
                  <tr>
                    <td className={styles.emptyState} colSpan={6}>
                      This directory is empty.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {preview ? (
          <div className={styles.previewBackdrop} role="presentation" onMouseDown={() => setPreview(null)}>
            <section
              className={styles.previewModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="media-preview-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className={styles.previewHeader}>
                <div>
                  <p className={styles.eyebrow}>MEDIA / PREVIEW</p>
                  <h2 id="media-preview-title">{preview.name}</h2>
                </div>
                <button className={styles.previewClose} type="button" onClick={() => setPreview(null)} aria-label="Close preview">
                  ×
                </button>
              </div>

              <div className={styles.previewBody}>
                {preview.previewKind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={publicMediaPath(preview.relativePath)} alt={`Preview of ${preview.name}`} />
                ) : preview.previewKind === "video" ? (
                  <video src={publicMediaPath(preview.relativePath)} controls preload="metadata" />
                ) : (
                  <div className={styles.unsupportedPreview}>
                    <strong>No embedded preview for this file type.</strong>
                    <p>{preview.fileType} · {formatBytes(preview.size)}</p>
                  </div>
                )}
              </div>

              <dl className={styles.previewDetails}>
                <div><dt>TYPE</dt><dd>{preview.fileType}</dd></div>
                <div><dt>SIZE</dt><dd>{formatBytes(preview.size)}</dd></div>
                <div><dt>MODIFIED</dt><dd>{formatDate(preview.modifiedAt)}</dd></div>
                <div><dt>PATH</dt><dd>{preview.relativePath}</dd></div>
              </dl>

              {preview.previewKind !== "other" ? (
                <a className={styles.previewLink} href={publicMediaPath(preview.relativePath)} target="_blank" rel="noreferrer">
                  OPEN PUBLIC MEDIA ↗
                </a>
              ) : null}
            </section>
          </div>
        ) : null}
      </div>

      {folderModalOpen ? (
        <div className={styles.previewBackdrop} role="presentation" onMouseDown={() => setFolderModalOpen(false)}>
          <section
            className={`${styles.previewModal} ${styles.folderModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-folder-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.previewHeader}>
              <div>
                <p className={styles.eyebrow}>MEDIA / NEW FOLDER</p>
                <h2 id="create-folder-title">Create folder</h2>
              </div>
              <button className={styles.previewClose} type="button" onClick={() => setFolderModalOpen(false)} aria-label="Close create-folder dialog">
                ×
              </button>
            </div>

            <p className={styles.folderLocation}>
              Create inside <code>{currentPath ? `media/${currentPath}` : "media/"}</code>
            </p>

            <form className={styles.form} action="/api/media-admin/folders" method="post" onSubmit={submitFolder}>
              <input type="hidden" name="parent" value={currentPath} />
              <div className={styles.field}>
                <label htmlFor="folder-name-modal">FOLDER NAME</label>
                <input
                  id="folder-name-modal"
                  name="name"
                  type="text"
                  maxLength={80}
                  autoComplete="off"
                  placeholder="campaign-assets"
                  value={folderName}
                  onChange={(event) => {
                    setFolderName(event.target.value);
                    setFolderError("");
                  }}
                  autoFocus
                  required
                />
              </div>

              {folderError ? <p className={styles.modalError} role="alert">{folderError}</p> : null}

              <div className={styles.modalActions}>
                <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={() => setFolderModalOpen(false)}>
                  CANCEL
                </button>
                <button className={styles.button} type="submit">
                  CREATE FOLDER
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
