const STALE_PROCESSING_MINUTES = 10;

export function isStaleImportProcessing(updatedAt: Date, now = new Date()) {
  return now.getTime() - updatedAt.getTime() > STALE_PROCESSING_MINUTES * 60 * 1000;
}
