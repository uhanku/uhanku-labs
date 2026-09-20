"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

export function BusinessesImportControl() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function importFile() {
    if (!file || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const document = JSON.parse(await file.text());
      const response = await fetch("/api/businesses/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileName: file.name, document }),
      });
      const result = (await response.json()) as { message?: string; imported?: { businessCount: number; osmRecordCount: number } };
      if (!response.ok) throw new Error(result.message ?? "The dataset could not be imported.");
      setStatus({
        type: "success",
        message: `Imported ${result.imported?.businessCount ?? 0} businesses and ${result.imported?.osmRecordCount ?? 0} OSM records.`,
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "The dataset could not be imported." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.importPanel} aria-label="Import businesses dataset">
      <div>
        <p className={styles.importLabel}>DATASET IMPORT</p>
        <p className={styles.importHelp}>Import a cleaned JSON export. It replaces the active dataset.</p>
      </div>
      <div className={styles.importActions}>
        <input
          ref={inputRef}
          className={styles.fileInput}
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setStatus(null);
          }}
        />
        <button className={styles.button} type="button" disabled={!file || busy} onClick={importFile}>
          {busy ? "IMPORTING..." : "IMPORT JSON"}
        </button>
      </div>
      {file ? <p className={styles.fileName}>Selected: {file.name}</p> : null}
      {status ? <p className={`${styles.importStatus} ${status.type === "error" ? styles.importError : styles.importSuccess}`} role="status">{status.message}</p> : null}
    </section>
  );
}
