import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MEDIA_SESSION_COOKIE, verifyMediaSessionToken } from "@/lib/auth";
import {
  loadActiveBusinesses,
} from "@/lib/businesses";

import { BusinessesImportControl } from "./BusinessesImportControl";
import { BusinessesExplorer } from "./Businesses";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Businesses",
  description:
    "The cleaned and merged local business directory for a chosen area.",
  robots: { index: false, follow: false },
};

async function requireSession() {
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

export default async function BusinessesPage() {
  const session = await requireSession();

  let dataset: Awaited<ReturnType<typeof loadActiveBusinesses>>;
  try {
    dataset = await loadActiveBusinesses();
  } catch (error) {
    console.error("Failed to load the active businesses dataset.", error);
    dataset = null;
  }

  if (!dataset) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.headerRow}>
            <div>
              <p className={styles.eyebrow}>BUSINESSES</p>
              <h1 className={styles.title}>No data yet.</h1>
              <p className={styles.intro}>Import the cleaned local business dataset to open the directory.</p>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className={`${styles.button} ${styles.buttonSecondary}`} type="submit">SIGN OUT</button>
            </form>
          </div>
          <BusinessesImportControl />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.headerRow}>
          <div>
            <p className={styles.eyebrow}>BUSINESSES</p>
            <h1 className={styles.title}>Local directory.</h1>
            <p className={styles.intro}>
              Signed in as <strong>{session.username}</strong>. Browse the
              cleaned and merged business directory for {dataset.metadata.area}.
              Click a row to preview the full record.
            </p>
          </div>

          <form action="/api/auth/logout" method="post">
            <button className={`${styles.button} ${styles.buttonSecondary}`} type="submit">
              SIGN OUT
            </button>
          </form>
        </div>

        <BusinessesImportControl />
        <BusinessesExplorer dataset={dataset} />
      </div>
    </main>
  );
}
