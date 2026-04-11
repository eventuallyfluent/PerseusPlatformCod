export function normalizeReturnPath(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function normalizeLearnerReturnPath(value: string | null | undefined, fallback = "/dashboard") {
  const path = normalizeReturnPath(value, fallback);

  if (path === "/admin" || path.startsWith("/admin/")) {
    return fallback;
  }

  return path;
}

export function normalizeAdminReturnPath(value: string | null | undefined, fallback = "/admin") {
  const path = normalizeReturnPath(value, fallback);

  if (path === "/admin" || path.startsWith("/admin/")) {
    return path;
  }

  return fallback;
}
