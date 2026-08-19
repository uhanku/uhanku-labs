import { NextResponse, type NextRequest } from "next/server";

import { getMediaSessionFromRequest } from "@/lib/media-auth";
import {
  deleteMediaFiles,
  deleteMediaTarget,
  MediaManagerError,
} from "@/lib/media-manager";
import { isAllowedMediaMutationRequest, redirectToMediaPath } from "@/lib/media-host";
import { normalizeMediaRelativePath } from "@/lib/media-storage";

export const runtime = "nodejs";

function redirectToAdmin(path: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  if (path) searchParams.set("path", path);

  return redirectToMediaPath(`/media-admin?${searchParams.toString()}`);
}

export async function POST(request: NextRequest) {
  if (!isAllowedMediaMutationRequest(request)) {
    return new NextResponse(null, { status: 404 });
  }

  let session;
  try {
    session = getMediaSessionFromRequest(request);
  } catch (error) {
    console.error("Media session validation failed.", error);
    return redirectToAdmin("", { error: "auth-unavailable" });
  }

  if (!session) {
    return redirectToMediaPath("/media-admin/login");
  }

  let currentPath = "";

  try {
    const formData = await request.formData();
    const currentPathValue = formData.get("currentPath");
    const normalizedCurrentPath = typeof currentPathValue === "string"
      ? normalizeMediaRelativePath(currentPathValue)
      : "";

    if (normalizedCurrentPath === null) {
      return redirectToAdmin("", { error: "invalid-path" });
    }
    currentPath = normalizedCurrentPath;

    const mode = formData.get("mode");

    if (mode === "bulk") {
      const targets = formData
        .getAll("targets")
        .filter((value): value is string => typeof value === "string");
      const deletedCount = await deleteMediaFiles(targets);

      return redirectToAdmin(currentPath, { deleted: String(deletedCount) });
    }

    if (mode === "single") {
      const targetValue = formData.get("target");
      const recursive = formData.get("recursive") === "true";

      if (typeof targetValue !== "string") {
        return redirectToAdmin(currentPath, { error: "invalid-delete" });
      }

      await deleteMediaTarget(targetValue, recursive);
      return redirectToAdmin(currentPath, { deleted: "1" });
    }

    return redirectToAdmin(currentPath, { error: "invalid-delete" });
  } catch (error) {
    if (error instanceof MediaManagerError) {
      return redirectToAdmin(currentPath, { error: error.code });
    }

    console.error("Unexpected media deletion failure.", error);
    return redirectToAdmin(currentPath, { error: "storage" });
  }
}
