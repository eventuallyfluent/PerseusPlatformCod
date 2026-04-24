function cleanPathname(pathname: string) {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, "/");

  if (collapsed.length > 1 && collapsed.endsWith("/")) {
    return collapsed.slice(0, -1);
  }

  return collapsed;
}

export function normalizePublicPathInput(value?: string | null) {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    return cleanPathname(trimmed.split(/[?#]/, 1)[0] ?? "/");
  }

  if (trimmed.startsWith("//")) {
    try {
      return cleanPathname(new URL(`https:${trimmed}`).pathname);
    } catch {
      return null;
    }
  }

  if (/^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed) || /^[a-z0-9.-]+\.[a-z]{2,}(?:\/|$)/i.test(trimmed)) {
    try {
      const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      return cleanPathname(new URL(candidate).pathname);
    } catch {
      return null;
    }
  }

  if (!trimmed.includes(" ")) {
    return cleanPathname(trimmed.split(/[?#]/, 1)[0] ?? trimmed);
  }

  return null;
}
