ALTER TABLE "Course"
ADD COLUMN "upsellCourseId" TEXT,
ADD COLUMN "upsellBundleId" TEXT;

ALTER TABLE "Bundle"
ADD COLUMN "upsellCourseId" TEXT,
ADD COLUMN "upsellBundleId" TEXT;

CREATE TABLE "LessonCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonCompletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LessonCompletion_userId_lessonId_key" ON "LessonCompletion"("userId", "lessonId");

ALTER TABLE "Course" ADD CONSTRAINT "Course_upsellCourseId_fkey" FOREIGN KEY ("upsellCourseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_upsellBundleId_fkey" FOREIGN KEY ("upsellBundleId") REFERENCES "Bundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_upsellCourseId_fkey" FOREIGN KEY ("upsellCourseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_upsellBundleId_fkey" FOREIGN KEY ("upsellBundleId") REFERENCES "Bundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LessonCompletion" ADD CONSTRAINT "LessonCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonCompletion" ADD CONSTRAINT "LessonCompletion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
