import { NextResponse, type NextRequest } from "next/server";

import { getMediaSessionFromRequest } from "@/lib/media-auth";
import { createMediaDirectory, MediaManagerError } from "@/lib/media-manager";
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

  let parent = "";

  try {
    const formData = await request.formData();
    const parentValue = formData.get("parent");
    const nameValue = formData.get("name");
    const normalizedParent = typeof parentValue === "string"
      ? normalizeMediaRelativePath(parentValue)
      : "";

    if (normalizedParent === null || typeof nameValue !== "string") {
      return redirectToAdmin("", { error: "invalid-path" });
    }
    parent = normalizedParent;

    const created = await createMediaDirectory(parent, nameValue);
    return redirectToAdmin(parent, { created });
  } catch (error) {
    if (error instanceof MediaManagerError) {
      return redirectToAdmin(parent, { error: error.code });
    }

    console.error("Unexpected media folder creation failure.", error);
    return redirectToAdmin(parent, { error: "storage" });
  }
}
