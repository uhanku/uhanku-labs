"use client";

import styles from "./UploadProgress.module.css";

export type UploadProgressState =
  | "preparing"
  | "uploading"
  | "processing"
  | "completed"
  | "failed";

export interface UploadProgressItem {
  id: string;
  filename: string;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  state: UploadProgressState;
  error?: string;
}

interface UploadProgressProps {
  items: UploadProgressItem[];
  onCancel?: (id: string) => void;
}

function formatBytes(bytes: number) {
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

function stateLabel(state: UploadProgressState) {
  switch (state) {
    case "preparing": return "PREPARING";
    case "uploading": return "UPLOADING";
    case "processing": return "PROCESSING";
    case "completed": return "COMPLETED";
    case "failed": return "FAILED";
  }
}

export function UploadProgress({ items, onCancel }: UploadProgressProps) {
  if (items.length === 0) return null;

  const totalBytes = items.reduce((sum, item) => sum + item.totalBytes, 0);
  const uploadedBytes = items.reduce((sum, item) => sum + Math.min(item.uploadedBytes, item.totalBytes), 0);
  const allCompleted = items.every((item) => item.state === "completed");
  const rawOverall = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;
  const overallProgress = allCompleted ? 100 : Math.min(rawOverall, 99);

  return (
    <section className={styles.root} aria-label="Upload progress">
      {items.length > 1 ? (
        <div className={styles.overall}>
          <div className={styles.overallHeader}>
            <span>OVERALL UPLOAD</span>
            <strong>{overallProgress}%</strong>
          </div>
          <div className={styles.track} aria-hidden="true">
            <span style={{ width: `${overallProgress}%` }} />
          </div>
          <div className={styles.bytes}>
            {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
          </div>
        </div>
      ) : null}

      <div className={styles.items}>
        {items.map((item) => {
          const canCancel = item.state === "preparing" || item.state === "uploading";

          return (
            <article className={styles.item} key={item.id}>
              <div className={styles.itemHeader}>
                <div className={styles.filenameWrap}>
                  <span className={`${styles.state} ${styles[`state_${item.state}`]}`}>
                    {stateLabel(item.state)}
                  </span>
                  <strong title={item.filename}>{item.filename}</strong>
                </div>

                <div className={styles.itemActions}>
                  <span className={styles.percent}>{item.progress}%</span>
                  {canCancel && onCancel ? (
                    <button type="button" onClick={() => onCancel(item.id)}>
                      CANCEL
                    </button>
                  ) : null}
                </div>
              </div>

              <div className={styles.track} aria-hidden="true">
                <span style={{ width: `${item.progress}%` }} />
              </div>

              <div className={styles.footer}>
                <span className={styles.bytes}>
                  {formatBytes(item.uploadedBytes)} / {formatBytes(item.totalBytes)}
                </span>
                {item.error ? <span className={styles.error}>{item.error}</span> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
