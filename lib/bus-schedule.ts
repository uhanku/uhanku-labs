export type BusDayType = "weekday" | "saturday" | "sunday";

export type BusDirection = string;

export interface BusLineSchedule {
  lineNo: string;
  route: string;
  times: readonly string[];
  status?: string;
}

export type BusScheduleData = Record<BusDirection, Record<BusDayType, BusLineSchedule[]>>;

export interface BusScheduleMeta {
  consultedOn: string;
  source: string;
  importedAt: string;
}

export interface BusDirectionInfo {
  heading: string;
  location: string;
  howToRead: string;
}

export interface BusScheduleParseResult {
  data: BusScheduleData;
  consultedOn: string;
  title: string;
  directionInfo: Record<BusDirection, BusDirectionInfo>;
  notes: readonly string[];
}

export interface BusScheduleLineRow {
  direction: string;
  dayType: string;
  lineNo: string;
  route: string;
  status: string | null;
  departures: readonly { time: string; position: number }[];
}

export interface BusLineCreate {
  direction: BusDirection;
  dayType: BusDayType;
  lineNo: string;
  route: string;
  status: string | null;
  departures: { time: string; position: number }[];
}

export const BUS_DAY_TYPES: readonly BusDayType[] = ["weekday", "saturday", "sunday"];

export const BUS_DAY_LABELS: Record<BusDayType, string> = {
  weekday: "Weekday",
  saturday: "Saturday",
  sunday: "Sunday & holidays",
};

export const BUS_PREVIOUS_DAY: Record<BusDayType, BusDayType> = {
  weekday: "sunday",
  saturday: "weekday",
  sunday: "saturday",
};

const DAY_TYPES_SET: ReadonlySet<string> = new Set(BUS_DAY_TYPES);

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class BusScheduleParseError extends Error {
  constructor(
    public readonly code: "invalid-document" | "invalid-line" | "invalid-time",
    message: string,
  ) {
    super(message);
  }
}

function emptyDayGroups(): Record<BusDayType, BusLineSchedule[]> {
  return { weekday: [], saturday: [], sunday: [] };
}

function ensureDirection(data: BusScheduleData, direction: string): Record<BusDayType, BusLineSchedule[]> {
  let groups = data[direction] as Record<BusDayType, BusLineSchedule[]> | undefined;
  if (!groups) {
    groups = emptyDayGroups();
    data[direction] = groups;
  }
  return groups;
}

function emptyScheduleData(): BusScheduleData {
  return {};
}

export function parseBusScheduleDocument(input: unknown): BusScheduleParseResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new BusScheduleParseError("invalid-document", "The file is not a valid schedule document.");
  }

  const document = (input as { document?: unknown }).document;
  const schedules = (input as { schedules?: unknown }).schedules;

  if (typeof document !== "object" || document === null || Array.isArray(document) || !Array.isArray(schedules)) {
    throw new BusScheduleParseError("invalid-document", "The file is not a valid schedule document.");
  }

  const consultedOnValue = (document as { consultedOn?: unknown }).consultedOn;
  if (typeof consultedOnValue !== "string" || !DATE_PATTERN.test(consultedOnValue)) {
    throw new BusScheduleParseError("invalid-document", "The schedule check date is not valid.");
  }

  const titleValue = (document as { title?: unknown }).title;
  if (typeof titleValue !== "string" || titleValue.length === 0 || titleValue.length > 255) {
    throw new BusScheduleParseError("invalid-document", "The document title is not valid.");
  }

  const notesValue = (document as { generalNotes?: unknown }).generalNotes;
  const notes: string[] = Array.isArray(notesValue)
    ? notesValue.filter((note): note is string => typeof note === "string")
    : [];

  const data = emptyScheduleData();
  const directionInfo: Record<string, BusDirectionInfo> = {};
  const seen = new Set<string>();

  for (const page of schedules) {
    if (typeof page !== "object" || page === null || Array.isArray(page)) {
      throw new BusScheduleParseError("invalid-document", "A page of the document is not valid.");
    }

    const directionValue = (page as { direction?: unknown }).direction;
    const dayTypeValue = (page as { dayType?: unknown }).dayType;
    const linesValue = (page as { lines?: unknown }).lines;

    const direction =
      typeof directionValue === "string" && directionValue.trim().length > 0 && directionValue.trim().length <= 64
        ? directionValue.trim()
        : undefined;
    const dayType =
      typeof dayTypeValue === "string" && DAY_TYPES_SET.has(dayTypeValue)
        ? (dayTypeValue as BusDayType)
        : undefined;

    if (!direction || !dayType || !Array.isArray(linesValue)) {
      throw new BusScheduleParseError("invalid-document", "A page of the document is not valid.");
    }

    const heading = (page as { heading?: unknown }).heading;
    const location = (page as { location?: unknown }).location;
    const howToRead = (page as { howToRead?: unknown }).howToRead;

    if (
      typeof heading !== "string" ||
      heading.length === 0 ||
      heading.length > 64 ||
      typeof location !== "string" ||
      location.length === 0 ||
      location.length > 255 ||
      typeof howToRead !== "string" ||
      howToRead.length === 0 ||
      howToRead.length > 255
    ) {
      throw new BusScheduleParseError("invalid-document", "A page of the document is not valid.");
    }

    if (!directionInfo[direction]) {
      directionInfo[direction] = { heading, location, howToRead };
    }

    const pageKey = `${direction}/${dayType}`;
    if (seen.has(pageKey)) {
      throw new BusScheduleParseError("invalid-document", "The document repeats a schedule page.");
    }
    seen.add(pageKey);

    const lines: BusLineSchedule[] = [];

    for (const row of linesValue) {
      if (typeof row !== "object" || row === null || Array.isArray(row)) {
        throw new BusScheduleParseError("invalid-line", "A line of the document is not valid.");
      }

      const lineNo = (row as { line?: unknown }).line;
      const route = (row as { route?: unknown }).route;
      const operates = (row as { operates?: unknown }).operates;
      const status = (row as { status?: unknown }).status;
      const timesValue = (row as { times?: unknown }).times;

      if (typeof lineNo !== "string" || !/^[0-9]{1,8}$/.test(lineNo)) {
        throw new BusScheduleParseError("invalid-line", "A line of the document is not valid.");
      }

      if (typeof route !== "string" || route.length === 0 || route.length > 255) {
        throw new BusScheduleParseError("invalid-line", "A line of the document is not valid.");
      }

      if (typeof operates !== "boolean") {
        throw new BusScheduleParseError("invalid-line", "A line of the document is not valid.");
      }

      if (status !== undefined && (typeof status !== "string" || status.length === 0 || status.length > 255)) {
        throw new BusScheduleParseError("invalid-line", "A line of the document is not valid.");
      }

      if (!Array.isArray(timesValue) || timesValue.length > 128) {
        throw new BusScheduleParseError("invalid-time", "A line of the document is not valid.");
      }

      const times: string[] = [];
      for (const time of timesValue) {
        if (typeof time !== "string" || !TIME_PATTERN.test(time)) {
          throw new BusScheduleParseError("invalid-time", "A time of the document is not valid.");
        }
        times.push(time);
      }

      if (!operates && status === undefined) {
        throw new BusScheduleParseError("invalid-line", "A line of the document is not valid.");
      }

      lines.push({
        lineNo,
        route,
        times,
        status: typeof status === "string" ? status : undefined,
      });
    }

    ensureDirection(data, direction)[dayType] = lines;
  }

  const directions = Object.keys(directionInfo);
  if (directions.length === 0) {
    throw new BusScheduleParseError("invalid-document", "The document does not include all schedule pages.");
  }
  for (const direction of directions) {
    for (const dayType of BUS_DAY_TYPES) {
      if (!seen.has(`${direction}/${dayType}`)) {
        throw new BusScheduleParseError("invalid-document", "The document does not include all schedule pages.");
      }
    }
  }

  return { data, consultedOn: consultedOnValue, title: titleValue, directionInfo, notes };
}

export function toBusScheduleData(lines: readonly BusScheduleLineRow[]): BusScheduleData {
  const data = emptyScheduleData();

  for (const line of lines) {
    if (typeof line.direction !== "string" || line.direction.trim().length === 0 || line.direction.length > 64)
      continue;
    if (line.dayType !== "weekday" && line.dayType !== "saturday" && line.dayType !== "sunday") continue;
    const dayType = line.dayType as BusDayType;

    const departures = [...line.departures]
      .sort((a, b) => a.position - b.position)
      .map((departure) => departure.time);

    ensureDirection(data, line.direction)[dayType].push({
      lineNo: line.lineNo,
      route: line.route,
      times: departures,
      status: line.status ?? undefined,
    });
  }

  for (const direction of Object.keys(data)) {
    for (const dayType of BUS_DAY_TYPES) {
      data[direction][dayType].sort((a, b) => a.lineNo.localeCompare(b.lineNo, undefined, { numeric: true }));
    }
  }

  return data;
}

export function toBusLineCreates(data: BusScheduleData): BusLineCreate[] {
  const creates: BusLineCreate[] = [];

  for (const direction of Object.keys(data)) {
    for (const dayType of BUS_DAY_TYPES) {
      for (const line of data[direction][dayType]) {
        creates.push({
          direction,
          dayType,
          lineNo: line.lineNo,
          route: line.route,
          status: line.status ?? null,
          departures: line.times.map((time, position) => ({ time, position })),
        });
      }
    }
  }

  return creates;
}

export function countBusLines(data: BusScheduleData): number {
  let count = 0;
  for (const direction of Object.keys(data)) {
    for (const dayType of BUS_DAY_TYPES) {
      count += data[direction][dayType].length;
    }
  }
  return count;
}
