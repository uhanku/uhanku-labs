import { NextResponse, type NextRequest } from "next/server";

import {
  BusScheduleParseError,
  countBusLines,
  parseBusScheduleDocument,
  toBusLineCreates,
  type BusScheduleParseResult,
} from "@/lib/bus-schedule";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_IMPORT_BYTES = 256 * 1024;

function jsonError(message: string, status: number, code = "import-error") {
  return NextResponse.json({ error: code, message }, { status });
}

function sanitizeFileName(value: unknown) {
  if (typeof value !== "string") return "schedules.json";

  const base = value.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[\u0000-\u001f\u007f]/g, "").trim();

  if (!clean || clean.length > 255) return "schedules.json";
  return clean;
}

export async function POST(request: NextRequest) {
  let text: string;

  try {
    text = await request.text();
  } catch (error) {
    console.error("Failed to read the bus schedule import body.", error);
    return jsonError("Failed to read the file data.", 400, "invalid-json");
  }

  if (text.length > MAX_IMPORT_BYTES) {
    return jsonError("The file exceeds the maximum size of 256 KB.", 413, "too-large");
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return jsonError("The file is not valid JSON.", 400, "invalid-json");
  }

  const payload = body as { fileName?: unknown; document?: unknown };

  let parsed: BusScheduleParseResult;
  try {
    parsed = parseBusScheduleDocument(payload.document);
  } catch (error) {
    if (error instanceof BusScheduleParseError) {
      return jsonError(error.message, 400, error.code);
    }

    console.error("Unexpected bus schedule validation failure.", error);
    return jsonError("The file is not a valid schedule document.", 400, "invalid-document");
  }

  try {
    const schedule = await prisma.$transaction(async (tx) => {
      await tx.busSchedule.updateMany({
        where: { active: true },
        data: { active: false },
      });

      return tx.busSchedule.create({
        data: {
          consultedOn: parsed.consultedOn,
          source: sanitizeFileName(payload.fileName),
          title: parsed.title,
          active: true,
          lines: {
            create: toBusLineCreates(parsed.data).map((line) => ({
              direction: line.direction,
              dayType: line.dayType,
              lineNo: line.lineNo,
              route: line.route,
              status: line.status,
              departures: {
                create: line.departures,
              },
            })),
          },
          directions: {
            create: Object.entries(parsed.directionInfo).map(([direction, info]) => ({
              direction,
              heading: info.heading,
              location: info.location,
              howToRead: info.howToRead,
            })),
          },
        },
      });
    });

    const lineCount = countBusLines(parsed.data);

    return NextResponse.json(
      {
        schedule: {
          id: schedule.id,
          importedAt: schedule.importedAt.toISOString(),
          consultedOn: schedule.consultedOn,
          source: schedule.source,
          title: schedule.title,
          lineCount,
        },
        imported: {
          consultedOn: schedule.consultedOn,
          lineCount,
        },
        directions: Object.entries(parsed.directionInfo).map(([direction, info]) => ({
          direction,
          heading: info.heading,
          location: info.location,
          howToRead: info.howToRead,
        })),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected bus schedule import failure.", error);
    return jsonError("The schedules could not be imported. Try again.", 500);
  }
}
