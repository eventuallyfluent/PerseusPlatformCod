export function isPreviewLoginEnabled() {
  return process.env.AUTH_PREVIEW_LOGIN === "true" || process.env.NODE_ENV !== "production";
}
