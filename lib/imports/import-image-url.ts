export function isVideoThumbnailImageUrl(value: string | null | undefined) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return false;
  }

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const path = url.pathname.toLowerCase();

    return (
      host === "i.ytimg.com" ||
      host.endsWith(".ytimg.com") ||
      host === "youtube.com" ||
      host === "youtube-nocookie.com" ||
      path.includes("/vi/") ||
      path.includes("/vi_webp/")
    );
  } catch {
    return false;
  }
}

export function isCourseHeroImageCandidate(value: string | null | undefined) {
  const raw = String(value ?? "").trim();

  return Boolean(raw) && !isVideoThumbnailImageUrl(raw);
}

export function pickCourseHeroImageUrl(values: Array<string | null | undefined>) {
  return values.map((value) => String(value ?? "").trim()).find(isCourseHeroImageCandidate) ?? "";
}
