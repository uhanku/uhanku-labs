"use client";

import { useEffect, useRef, useState } from "react";

import {
  BUS_DAY_LABELS,
  BUS_PREVIOUS_DAY,
  BusScheduleParseError,
  parseBusScheduleDocument,
  type BusDayType,
  type BusDirection,
  type BusDirectionInfo,
  type BusLineSchedule,
  type BusScheduleData,
  type BusScheduleMeta,
  type BusScheduleParseResult,
} from "@/lib/bus-schedule";
import { ArcadePanel } from "@/components/arcade";

import styles from "./BusSchedule.module.css";

const PERIODS: readonly { period: string; label: string }[] = [
  { period: "now", label: "Now" },
  { period: "03:00", label: "Early morning" },
  { period: "09:00", label: "Morning" },
  { period: "15:00", label: "Afternoon" },
  { period: "21:00", label: "Night" },
];

const MAX_IMPORT_BYTES = 256 * 1024;

const EXAMPLE_STRUCTURE = `{
  "document": {
    "title": "Horários Granja ↔ Campanhã",
    "consultedOn": "2026-09-07",
    "generalNotes": [
      "Nas linhas circulares, os horários 00:xx e 01:xx ..."
    ]
  },
  "schedules": [
    {
      "direction": "granja",
      "dayType": "weekday",
      "heading": "Granja → Campanhã",
      "location": "Paragem Granja, Gondomar (São Cosme), Valbom e Jovim",
      "howToRead": "Horas previstas de passagem na paragem Granja.",
      "lines": [
        {
          "line": "8017",
          "route": "Campanhã Estação - via Centro de Saúde",
          "operates": true,
          "times": ["06:36", "07:16", "07:51"]
        },
        {
          "line": "8041",
          "route": "Campanhã Estação - via Vila Verde",
          "operates": false,
          "status": "Não opera ao sábado",
          "times": []
        }
      ]
    }
  ]
}`;

const STRUCTURE_RULES: readonly string[] = [
  "document.title: 1–255 chars · document.consultedOn: YYYY-MM-DD · document.generalNotes: optional string array.",
  "schedules: one entry per direction and dayType (weekday / saturday / sunday) — every combination is required.",
  "line: 1–8 digits · route: 1–255 chars · operates: true/false (false requires status).",
  "times: 'HH:MM' strings, up to 128 per line; 00:xx / 01:xx belong to the early morning after the service day.",
  "File: valid JSON, max 256 KB.",
];

function toMin(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function fmt(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

function formatConsultedOn(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

function dayTypeOf(date: Date): BusDayType {
  const d = date.getDay();
  if (d === 0) return "sunday";
  if (d === 6) return "saturday";
  return "weekday";
}

interface Candidate {
  line: BusLineSchedule;
  time: string;
  abs: number;
}

function collectCandidates(
  data: BusScheduleData,
  direction: BusDirection,
  day: BusDayType,
  prevDay: BusDayType,
  now: number,
): Candidate[] {
  const days: BusDayType[] = now < 360 && prevDay !== day ? [prevDay, day] : [day];
  const out: Candidate[] = [];
  const seen = new Set<string>();

  for (const d of days) {
    const isPrev = d !== day;
    for (const line of data[direction]?.[d] ?? []) {
      for (const time of line.times) {
        const m = toMin(time);
        const abs = m < 360 && !isPrev ? m + 1440 : m;
        const key = line.lineNo + "@" + abs;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ line, time, abs });
      }
    }
  }

  return out;
}

function badgeClass(lineNo: string, styles: Record<string, string>): string {
  switch (lineNo) {
    case "8017":
      return styles.b8017;
    case "8028":
      return styles.b8028;
    case "8029":
      return styles.b8029;
    case "8041":
      return styles.b8041;
    default:
      return styles.bDefault;
  }
}

type BusScheduleProps = {
  initialData: BusScheduleData | null;
  initialMeta: BusScheduleMeta | null;
  initialDirections: Record<string, BusDirectionInfo> | null;
};

function directionTitle(directions: Record<string, BusDirectionInfo> | null, direction: BusDirection): string {
  const heading = directions?.[direction]?.heading?.trim();
  return heading ? heading : direction;
}

function directionSub(directions: Record<string, BusDirectionInfo> | null, direction: BusDirection): string {
  return directions?.[direction]?.location ?? "";
}

export function BusSchedule({ initialData, initialMeta, initialDirections }: BusScheduleProps) {
  const [data, setData] = useState<BusScheduleData | null>(initialData);
  const [meta, setMeta] = useState<BusScheduleMeta | null>(initialMeta);
  const [directions, setDirections] = useState<Record<string, BusDirectionInfo> | null>(initialDirections);
  const [dayCtrl, setDayCtrl] = useState<"auto" | BusDayType>("auto");
  const [dirCtrl, setDirCtrl] = useState<string>("all");
  const [mode, setMode] = useState<"live" | "sim">("live");
  const [simTime, setSimTime] = useState("09:00");
  const [clock, setClock] = useState<Date | null>(null);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [structureOpen, setStructureOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  const structureDialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = structureDialogRef.current;
    if (!dialog) return;
    if (structureOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [structureOpen]);

  useEffect(() => {
    // Client-only clock init on mount: keeps SSR and first client render identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClock(new Date());
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // The clock starts as null so the server render and the first client render
  // are identical. Live time is filled in on mount by the effect above.
  const day = dayCtrl === "auto" ? (clock ? dayTypeOf(clock) : "weekday") : dayCtrl;
  const now = mode === "live" ? (clock ? clock.getHours() * 60 + clock.getMinutes() : 0) : toMin(simTime);
  const prevDay =
    mode === "live"
      ? clock
        ? dayTypeOf(new Date(clock.getTime() - 86400000))
        : BUS_PREVIOUS_DAY[day]
      : BUS_PREVIOUS_DAY[day];
  const activePeriod = mode === "live" ? "now" : simTime;
  const directionKeys = data ? Object.keys(data).sort() : [];
  const visibleDirections = directionKeys.filter((d) => dirCtrl === "all" || dirCtrl === d);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    if (file.size > MAX_IMPORT_BYTES) {
      setNotice({ tone: "error", text: "The file exceeds the maximum size of 256 KB." });
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      setNotice({ tone: "error", text: "The file is not valid JSON." });
      return;
    }

    let rawDocument: unknown;
    try {
      rawDocument = JSON.parse(text);
    } catch {
      setNotice({ tone: "error", text: "The file is not valid JSON." });
      return;
    }

    let parsed: BusScheduleParseResult;
    try {
      parsed = parseBusScheduleDocument(rawDocument);
    } catch (error) {
      const message =
        error instanceof BusScheduleParseError
          ? error.message
          : "The file is not a valid schedule document.";
      setNotice({ tone: "error", text: message });
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/bus/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, document: rawDocument }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.imported) {
        throw new Error((body && body.message) || "The schedules could not be imported. Try again.");
      }

      setData(parsed.data);
      setMeta({
        consultedOn: body.imported.consultedOn,
        source: body.schedule.source,
        importedAt: body.schedule.importedAt,
      });
      if (Array.isArray(body.directions)) {
        const next: Record<string, BusDirectionInfo> = {};
        for (const item of body.directions) {
          if (typeof item !== "object" || item === null) continue;
          const direction: unknown = item.direction;
          if (typeof direction !== "string" || direction.length === 0) continue;
          next[direction] = {
            heading: String(item.heading),
            location: String(item.location),
            howToRead: String(item.howToRead),
          };
        }
        setDirections(next);
        setDirCtrl("all");
      }
      setNotice({
        tone: "ok",
        text: `Schedules imported. Data checked: ${body.imported.consultedOn} · ${body.imported.lineCount} lines.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The schedules could not be imported. Try again.";
      setNotice({ tone: "error", text: message });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function renderPanel(direction: BusDirection, index: number) {
    const cands = collectCandidates(data as BusScheduleData, direction, day, prevDay, now)
      .filter((c) => c.abs >= now && c.abs < now + 60)
      .sort((a, b) => a.abs - b.abs);

    const inactive = ((data as BusScheduleData)[direction]?.[day] ?? [])
      .filter((l) => l.status !== undefined && l.times.length === 0)
      .map((l) => `${l.lineNo} — ${l.status}`)
      .join(" · ");

    return (
      <ArcadePanel tone={index % 2 === 0 ? "purple" : "cyan"} className={styles.panel}>
        <div className={styles.panelHead}>
          <h3 className={styles.panelTitle}>{directionTitle(directions, direction)}</h3>
          <p className={styles.panelSub}>{directionSub(directions, direction)}</p>
        </div>
        {cands.length === 0 && <p className={styles.empty}>No buses in the next hour.</p>}
        <ul className={styles.list}>
          {cands.map((c, i) => {
            const diff = c.abs - now;
            return (
              <li key={`${c.line.lineNo}@${c.time}`} className={i === 0 ? `${styles.row} ${styles.rowNext}` : styles.row}>
                <div className={styles.rowMain}>
                  <span className={`${styles.badge} ${badgeClass(c.line.lineNo, styles)}`}>{c.line.lineNo}</span>
                  <div className={styles.rowText}>
                    <div className={styles.rowRoute}>{c.line.route}</div>
                    <div className={styles.rowTimes}>{c.time}</div>
                  </div>
                </div>
                <div className={styles.rowSide}>
                  <div className={styles.rowCount}>{diff <= 1 ? "now" : `in ${diff} min`}</div>
                  {i === 0 && <div className={styles.rowEta}>NEXT</div>}
                </div>
              </li>
            );
          })}
        </ul>
        {inactive.length > 0 && <p className={styles.note}>No service: {inactive}</p>}
      </ArcadePanel>
    );
  }

  return (
    <div className={styles.root}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className={styles.fileInput}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <div className={styles.statusRow}>
        <div className={styles.clockBox}>
          <div className={styles.clock}>{clock ? fmt(clock.getHours() * 60 + clock.getMinutes()) : "--:--"}</div>
          <div className={styles.date}>
            {clock ? clock.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "--"}
          </div>
          {meta && (
            <div className={styles.metaLine}>
              Data checked: {formatConsultedOn(meta.consultedOn)} · {meta.source}
            </div>
          )}
        </div>
        <div className={styles.statusActions}>
          <button
            type="button"
            className={styles.structureButton}
            onClick={() => setStructureOpen(true)}
          >
            FILE STRUCTURE
          </button>
          <button
            type="button"
            className={styles.importButton}
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            {importing ? "Importing…" : "IMPORT SCHEDULES"}
          </button>
        </div>
      </div>

      <div role="group" aria-label="Day" className={styles.seg}>
        <span className={styles.segLabel}>Day</span>
        <button
          type="button"
          className={`${styles.segButton} ${dayCtrl === "auto" ? styles.segButtonActive : ""}`}
          aria-pressed={dayCtrl === "auto"}
          onClick={() => setDayCtrl("auto")}
        >
          Auto
        </button>
        {(["weekday", "saturday", "sunday"] as BusDayType[]).map((d) => (
          <button
            key={d}
            type="button"
            className={`${styles.segButton} ${dayCtrl === d ? styles.segButtonActive : ""}`}
            aria-pressed={dayCtrl === d}
            onClick={() => setDayCtrl(d)}
          >
            {d === "sunday" ? "Sun / holiday" : BUS_DAY_LABELS[d]}
          </button>
        ))}
      </div>

      <div role="group" aria-label="Direction" className={styles.seg}>
        <span className={styles.segLabel}>Direction</span>
        <button
          type="button"
          className={`${styles.segButton} ${dirCtrl === "all" ? styles.segButtonActive : ""}`}
          aria-pressed={dirCtrl === "all"}
          onClick={() => setDirCtrl("all")}
        >
          All
        </button>
        {directionKeys.map((d) => (
          <button
            key={d}
            type="button"
            className={`${styles.segButton} ${dirCtrl === d ? styles.segButtonActive : ""}`}
            aria-pressed={dirCtrl === d}
            onClick={() => setDirCtrl(d)}
          >
            {directionTitle(directions, d)}
          </button>
        ))}
      </div>

      <div role="group" aria-label="Time" className={styles.seg}>
        <span className={styles.segLabel}>Time</span>
        {PERIODS.map((p) => (
          <button
            key={p.period}
            type="button"
            className={`${styles.segButton} ${activePeriod === p.period ? styles.segButtonActive : ""}`}
            aria-pressed={activePeriod === p.period}
            onClick={() => {
              if (p.period === "now") {
                setMode("live");
              } else {
                setSimTime(p.period);
                setMode("sim");
              }
            }}
          >
            {p.label}
          </button>
        ))}
        <input
          ref={timeInputRef}
          type="time"
          value={simTime}
          className={styles.timeInput}
          onClick={() => {
            const el = timeInputRef.current;
            try {
              el?.showPicker();
            } catch {
              el?.focus();
            }
          }}
          onChange={(event) => {
            if (event.target.value) {
              setSimTime(event.target.value);
              setMode("sim");
            }
          }}
        />
      </div>

      {mode === "sim" && (
        <div className={styles.simBanner}>
          <span>
            Simulating: {BUS_DAY_LABELS[day]} · {simTime}  —  live time{" "}
            {clock ? fmt(clock.getHours() * 60 + clock.getMinutes()) : "--:--"}
          </span>
          <button type="button" className={styles.simBack} onClick={() => setMode("live")}>
            Use live time
          </button>
        </div>
      )}

      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`${styles.notice} ${notice.tone === "ok" ? styles.noticeOk : styles.noticeError}`}
        >
          {notice.text}
        </div>
      )}

      {data === null ? (
        <ArcadePanel tone="acid" className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>No schedules imported.</h3>
            <p className={styles.panelSub}>
              Import the JSON schedules file to get started.
            </p>
          </div>
          <button
            type="button"
            className={styles.importButton}
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            {importing ? "Importing…" : "IMPORT SCHEDULES"}
          </button>
        </ArcadePanel>
      ) : (
        <div className={styles.panels}>
          {visibleDirections.map((d) => (
            <div key={d} style={{ display: "contents" }}>
              {renderPanel(d, directionKeys.indexOf(d))}
            </div>
          ))}
        </div>
      )}
      <dialog
        ref={structureDialogRef}
        className={styles.structureDialog}
        aria-label="Schedules file structure"
        onClick={(event) => {
          if (event.target === structureDialogRef.current) setStructureOpen(false);
        }}
        onClose={() => setStructureOpen(false)}
      >
        <div className={styles.structureHead}>
          <h3 className={styles.structureTitle}>Schedules file structure</h3>
          <button
            type="button"
            className={styles.structureClose}
            onClick={() => setStructureOpen(false)}
          >
            CLOSE
          </button>
        </div>
        <p className={styles.structureIntro}>
          Import the JSON schedules file with the shape below — the same file the
          IMPORT SCHEDULES button accepts.
        </p>
        <pre className={styles.structureCode}>{EXAMPLE_STRUCTURE}</pre>
        <ul className={styles.structureRules}>
          {STRUCTURE_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </dialog>
    </div>
  );
}
