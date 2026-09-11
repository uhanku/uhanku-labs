import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BusSchedule } from "@/components/bus/BusSchedule";
import { MEDIA_SESSION_COOKIE, verifyMediaSessionToken } from "@/lib/auth";
import {
  toBusScheduleData,
  type BusDirectionInfo,
} from "@/lib/bus-schedule";
import { prisma } from "@/lib/prisma";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

async function requireBusSession() {
  const cookieStore = await cookies();
  let session: ReturnType<typeof verifyMediaSessionToken> = null;

  try {
    session = verifyMediaSessionToken(cookieStore.get(MEDIA_SESSION_COOKIE)?.value);
  } catch {
    redirect("/?error=unavailable");
  }

  if (!session) redirect("/");

  return session;
}

export async function generateMetadata(): Promise<Metadata> {
  await requireBusSession();

  let title: string | null = null;

  try {
    const schedule = await prisma.busSchedule.findFirst({
      where: { active: true },
      orderBy: { importedAt: "desc" },
      select: { title: true },
    });
    title = schedule?.title ?? null;
  } catch (error) {
    console.error("Failed to load the active bus schedule title.", error);
  }

  return {
    title: "Upcoming Buses",
    description: title ? `${title}: the next hour.` : "Upcoming buses: the next hour.",
  };
}

async function loadActiveSchedule() {
  try {
    const schedule = await prisma.busSchedule.findFirst({
      where: { active: true },
      orderBy: { importedAt: "desc" },
      include: {
        lines: {
          orderBy: { lineNo: "asc" },
          include: {
            departures: { orderBy: { position: "asc" } },
          },
        },
        directions: true,
      },
    });

    if (!schedule) return null;

    const directions: Record<string, BusDirectionInfo> = {};
    for (const info of schedule.directions) {
      if (typeof info.direction !== "string" || info.direction.length === 0) continue;
      directions[info.direction] = {
        heading: info.heading,
        location: info.location,
        howToRead: info.howToRead,
      };
    }

    return {
      data: toBusScheduleData(schedule.lines),
      meta: {
        consultedOn: schedule.consultedOn,
        source: schedule.source,
        importedAt: schedule.importedAt.toISOString(),
      },
      title: schedule.title,
      directions,
    };
  } catch (error) {
    console.error("Failed to load the active bus schedule.", error);
    return null;
  }
}

function formatConsultedOn(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

export default async function BusPage() {
  await requireBusSession();

  const schedule = await loadActiveSchedule();

  return (
    <main className={styles.page}>
      <BusSchedule
        initialData={schedule?.data ?? null}
        initialMeta={schedule?.meta ?? null}
        initialDirections={schedule?.directions ?? null}
      />

      <footer className={`${styles.footer} arcade-reveal arcade-reveal--2`}>
        <p>
          On circular lines, 00:xx and 01:xx times belong to the early morning
          immediately after the service day.
        </p>
        <p>
          Lines 8028 and 8029 are circular — check the destination display on
          the bus for the indicated route.
        </p>
        <p className={styles.meta}>
          {schedule
            ? `Planned schedules · data checked on ${formatConsultedOn(schedule.meta.consultedOn)} · confirm real-time changes on UNIR / Q.Horas`
            : "Planned schedules · confirm real-time changes on UNIR / Q.Horas"}
        </p>
      </footer>
    </main>
  );
}
