import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MEDIA_SESSION_COOKIE, verifyMediaSessionToken } from "@/lib/media-auth";
import {
  getMediaDirectorySize,
  getMediaTree,
  listMediaDirectory,
  MediaManagerError,
} from "@/lib/media-manager";
import {
  getMaxMediaUploadBytes,
  normalizeMediaRelativePath,
} from "@/lib/media-storage";
import { cleanupExpiredMediaUploads } from "@/lib/media-chunk-upload";

import MediaFileManager from "./MediaFileManager";
import styles from "./media-admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Media Manager",
  robots: { index: false, follow: false },
};

const mediaErrors: Record<string, string> = {
  missing: "Choose a media file before uploading.",
  "too-large": "That file exceeds the configured upload size limit.",
  unsupported: "That file type is not supported for upload.",
  invalid: "The uploaded file or selected directory did not pass validation.",
  storage: "The media operation failed. Check server storage permissions and try again.",
  "auth-unavailable": "The authentication configuration is unavailable.",
  "invalid-path": "That media path is invalid.",
  "not-found": "The requested media item no longer exists.",
  "not-directory": "That media path is not a directory.",
  "invalid-folder-name": "Use a safe folder name without path separators, hidden segments, or control characters.",
  "folder-exists": "A file or folder with that name already exists.",
  "folder-not-empty": "That folder contains files or subfolders and requires explicit confirmation before deletion.",
  "invalid-delete": "The requested delete operation was rejected.",
  "too-many-targets": "Too many files were selected for one delete operation.",
};

function mediaAdminPath(relativePath: string) {
  if (!relativePath) return "/media-admin";
  return `/media-admin?path=${encodeURIComponent(relativePath)}`;
}

function Breadcrumbs({ currentPath }: { currentPath: string }) {
  const segments = currentPath ? currentPath.split("/") : [];

  return (
    <nav className={styles.breadcrumbs} aria-label="Media directory breadcrumbs">
      <Link href="/media-admin">media</Link>
      {segments.map((segment, index) => {
        const relativePath = segments.slice(0, index + 1).join("/");

        return (
          <span key={relativePath} className={styles.breadcrumbSegment}>
            <span aria-hidden="true">/</span>
            <Link href={mediaAdminPath(relativePath)}>{segment}</Link>
          </span>
        );
      })}
    </nav>
  );
}

export default async function MediaAdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created?: string;
    deleted?: string;
    path?: string;
  }>;
}) {
  const cookieStore = await cookies();
  let session: ReturnType<typeof verifyMediaSessionToken> = null;

  try {
    session = verifyMediaSessionToken(cookieStore.get(MEDIA_SESSION_COOKIE)?.value);
  } catch {
    redirect("/media-admin/login?error=unavailable");
  }

  if (!session) redirect("/media-admin/login");

  const params = await searchParams;
  const normalizedPath = normalizeMediaRelativePath(params.path ?? "");

  if (normalizedPath === null) {
    redirect("/media-admin?error=invalid-path");
  }

  let listing: Awaited<ReturnType<typeof listMediaDirectory>>;
  let tree: Awaited<ReturnType<typeof getMediaTree>>;
  let currentFolderSize: number;

  try {
    await cleanupExpiredMediaUploads();

    [listing, tree, currentFolderSize] = await Promise.all([
      listMediaDirectory(normalizedPath),
      getMediaTree(),
      getMediaDirectorySize(normalizedPath),
    ]);
  } catch (error) {
    if (error instanceof MediaManagerError) {
      redirect(`/media-admin?error=${encodeURIComponent(error.code)}`);
    }

    throw error;
  }

  const maxUploadBytes = getMaxMediaUploadBytes();
  const deletedCount = Number(params.deleted ?? 0);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.headerRow}>
          <div>
            <p className={styles.eyebrow}>MEDIA / MANAGER</p>
            <h1 className={styles.title}>Media explorer.</h1>
            <p className={styles.intro}>
              Signed in as <strong>{session.username}</strong>. Browse the server media directory, upload into the current folder, preview supported files, and safely remove media.
            </p>
          </div>

          <form action="/api/media-auth/logout" method="post">
            <button className={`${styles.button} ${styles.buttonSecondary}`} type="submit">
              SIGN OUT
            </button>
          </form>
        </div>

        <Breadcrumbs currentPath={listing.relativePath} />

        {params.error && mediaErrors[params.error] ? (
          <p className={styles.message} role="alert">{mediaErrors[params.error]}</p>
        ) : null}


        {params.created ? (
          <p className={`${styles.message} ${styles.success}`}>Folder created: <strong>{params.created}</strong></p>
        ) : null}

        {Number.isFinite(deletedCount) && deletedCount > 0 ? (
          <p className={`${styles.message} ${styles.success}`}>
            Deleted {deletedCount} item{deletedCount === 1 ? "" : "s"}.
          </p>
        ) : null}

        <MediaFileManager
          currentPath={listing.relativePath}
          currentFolderSize={currentFolderSize}
          entries={listing.entries}
          maxUploadBytes={maxUploadBytes}
          tree={tree}
        />
      </div>
    </main>
  );
}
