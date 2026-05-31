export type LegacySalesPageMedia = {
  heroImageUrl?: string;
  salesVideoUrl?: string;
};

const legacyMediaCache = new Map<string, Promise<LegacySalesPageMedia>>();

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#x2F;", "/")
    .replaceAll("&#47;", "/")
    .replaceAll("&quot;", "\"");
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function isImageUrl(value: string) {
  try {
    const url = new URL(value);
    const text = `${url.hostname}${url.pathname}`.toLowerCase();

    if (text.includes("logo") || text.includes("loading")) {
      return false;
    }

    return (
      /\.(png|jpe?g|webp|gif)$/i.test(url.pathname) ||
      value.includes("/cdn-cgi/image/") ||
      url.hostname.includes("amazonaws.com")
    );
  } catch {
    return false;
  }
}

function pickHeroImageUrl(imageUrls: string[]) {
  return imageUrls.find((url) => /\.(jpe?g|webp)(?:$|\?)/i.test(url)) ?? imageUrls[0];
}

function normalizeYoutubeUrl(value: string | null | undefined) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return undefined;
  }

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/watch?v=${id}` : undefined;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch" && url.searchParams.get("v")) {
        return `https://www.youtube.com/watch?v=${url.searchParams.get("v")}`;
      }

      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/").filter(Boolean)[1];
        return id ? `https://www.youtube.com/watch?v=${id}` : undefined;
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function isPlaceholderSalesVideoUrl(value: string | null | undefined) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return true;
  }

  return !normalizeYoutubeUrl(raw) && /^https?:\/\/(?:www\.)?youtube\.com\/?$/i.test(raw);
}

export function extractLegacySalesPageMedia(html: string): LegacySalesPageMedia {
  const decoded = decodeHtmlEntities(html);
  const urls = unique(decoded.match(/https?:\/\/[^"' <>)\\]+/g) ?? []);
  const imageUrls = urls.filter(isImageUrl);
  const heroImageUrl = pickHeroImageUrl(imageUrls);
  const salesVideoUrl = urls.map(normalizeYoutubeUrl).find(Boolean);

  return {
    heroImageUrl,
    salesVideoUrl,
  };
}

async function fetchLegacySalesPageMediaNow(legacyUrl: string): Promise<LegacySalesPageMedia> {
  const url = String(legacyUrl ?? "").trim();

  if (!url) {
    return {};
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Perseus Importer/1.0",
      },
    });

    if (!response.ok) {
      return {};
    }

    return extractLegacySalesPageMedia(await response.text());
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

export function fetchLegacySalesPageMedia(legacyUrl: string | null | undefined) {
  const url = String(legacyUrl ?? "").trim();

  if (!url) {
    return Promise.resolve({});
  }

  const cached = legacyMediaCache.get(url);

  if (cached) {
    return cached;
  }

  const promise = fetchLegacySalesPageMediaNow(url);
  legacyMediaCache.set(url, promise);
  return promise;
}
