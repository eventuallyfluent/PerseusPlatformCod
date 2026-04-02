type LessonAvailabilityInput = {
  enrolledAt: Date;
  dripDays?: number | null;
};

export function isLessonUnlocked(input: LessonAvailabilityInput) {
  if (!input.dripDays || input.dripDays <= 0) {
    return true;
  }

  const unlockAt = new Date(input.enrolledAt);
  unlockAt.setUTCDate(unlockAt.getUTCDate() + input.dripDays);

  return unlockAt.getTime() <= Date.now();
}
