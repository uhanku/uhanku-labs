import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MEDIA_SESSION_COOKIE, verifyMediaSessionToken } from "@/lib/media-auth";

import styles from "../media-admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Media Manager Login",
  robots: { index: false, follow: false },
};

const messages: Record<string, string> = {
  invalid: "Invalid username or password.",
  "rate-limited": "Too many failed attempts. Try again later.",
  unavailable: "Media authentication is not configured correctly.",
};

export default async function MediaLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  let session: ReturnType<typeof verifyMediaSessionToken> = null;

  try {
    session = verifyMediaSessionToken(cookieStore.get(MEDIA_SESSION_COOKIE)?.value);
  } catch {
    // Keep the login form visible when the server is not configured yet.
  }

  if (session) redirect("/media-admin");

  const { error } = await searchParams;
  const message = error ? messages[error] : undefined;

  return (
    <main className={styles.page}>
      <div className={`${styles.shell} ${styles.authShell}`}>
        <p className={styles.eyebrow}>MEDIA / AUTHENTICATION</p>
        <h1 className={styles.title}>Sign in to manage media.</h1>
        <p className={styles.intro}>
          Media management is restricted to the configured Uhanku Labs account.
        </p>

        <section className={styles.panel} aria-label="Media login">
          <form className={styles.form} action="/api/media-auth/login" method="post">
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
