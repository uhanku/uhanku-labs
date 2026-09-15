import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

// yes
import { MEDIA_SESSION_COOKIE, verifyMediaSessionToken } from "@/lib/auth";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Uhanku Labs",
  robots: { index: false, follow: false },
};

interface RouteLink {
  href: string;
  path: string;
  title: string;
  description: string;
  access: "private" | "public";
}

const appRoutes: readonly RouteLink[] = [
  {
    href: "/media-admin",
    path: "/media-admin",
    title: "Media Manager",
    description:
      "Browse the server media directory, upload into the current folder, preview supported files, and safely remove media.",
    access: "private",
  },
  {
    href: "/apps/bus",
    path: "/apps/bus",
    title: "Upcoming Buses",
    description: "The active schedule and the buses leaving in the next hour.",
    access: "private",
  },
];

const experimentRoutes: readonly RouteLink[] = [
  {
    href: "/ex/ai-swe-stats",
    path: "/ex/ai-swe-stats",
    title: "AI in the Developer Workflow",
    description:
      "A minimal visual summary of AI adoption, daily use, learning, and verification habits among developers.",
    access: "public",
  },
  {
    href: "/ex/aie-2020-2026",
    path: "/ex/aie-2020-2026",
    title: "AI Progress 2020–2026",
    description:
      "An interactive visual history of AI progress, from GAN photorealism and diffusion to multimodal agents and robotics.",
    access: "public",
  },
];

const messages: Record<string, string> = {
  invalid: "Invalid username or password.",
  "rate-limited": "Too many failed attempts. Try again later.",
  unavailable: "Media authentication is not configured correctly.",
};

function RouteCard({ route }: { route: RouteLink }) {
  return (
    <Link className={styles.card} href={route.href}>
      <div className={styles.cardTop}>
        <span className={styles.cardPath}>{route.path}</span>
        <span
          className={`${styles.tag} ${route.access === "public" ? styles.tagPublic : ""}`}
        >
          {route.access === "public" ? "PUBLIC" : "PRIVATE"}
        </span>
      </div>
      <h2 className={styles.cardTitle}>{route.title}</h2>
      <p className={styles.cardDesc}>{route.description}</p>
    </Link>
  );
}

function HomeHub({ username }: { username: string }) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.headerRow}>
          <div>
            <p className={styles.eyebrow}>UHANKU LABS / HOME</p>
            <h1 className={styles.title}>Pick a route.</h1>
            <p className={styles.intro}>
              Signed in as <strong>{username}</strong>. Everything built so far
              lives here.
            </p>
          </div>

          <form action="/api/auth/logout" method="post">
            <button
              className={`${styles.button} ${styles.buttonSecondary}`}
              type="submit"
            >
              SIGN OUT
            </button>
          </form>
        </div>

        <p className={styles.sectionLabel}>APPS</p>
        <div className={styles.cardGrid}>
          {appRoutes.map((route) => (
            <RouteCard key={route.href} route={route} />
          ))}
        </div>

        <p className={styles.sectionLabel}>EXPERIMENTS</p>
        <div className={styles.cardGrid}>
          {experimentRoutes.map((route) => (
            <RouteCard key={route.href} route={route} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  let session: ReturnType<typeof verifyMediaSessionToken> = null;

  try {
    session = verifyMediaSessionToken(
      cookieStore.get(MEDIA_SESSION_COOKIE)?.value,
    );
  } catch {
    // Keep the login form visible when the server is not configured yet.
  }

  if (session) return <HomeHub username={session.username} />;

  const { error } = await searchParams;
  const message = error ? messages[error] : undefined;

  return (
    <main className={styles.page}>
      <div className={`${styles.shell} ${styles.authShell}`}>
        <p className={styles.eyebrow}>MEDIA / AUTHENTICATION</p>
        <h1 className={styles.title}>Sign in to manage.</h1>
        <p className={styles.intro}>
          Media management is restricted to the configured Uhanku Labs account.
        </p>

        <section className={styles.panel} aria-label="Media login">
          <form className={styles.form} action="/api/auth/login" method="post">
            <div className={styles.field}>
              <label htmlFor="username">USERNAME</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                maxLength={255}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">PASSWORD</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            <div className={styles.actions}>
              <button className={styles.button} type="submit">
                SIGN IN
              </button>
            </div>
          </form>
        </section>

        {message ? <p className={styles.message}>{message}</p> : null}
      </div>
    </main>
  );
}
