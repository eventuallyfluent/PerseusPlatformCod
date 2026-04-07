export function getPublicReviewName(name?: string | null) {
  const normalized = String(name ?? "").trim();

  if (!normalized) {
    return "Student";
  }

  const first = normalized.split(/\s+/).find(Boolean);
  return first || "Student";
}
