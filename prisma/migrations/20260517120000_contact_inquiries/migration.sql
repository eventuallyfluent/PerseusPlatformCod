CREATE TYPE "ContactInquiryStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

CREATE TABLE "ContactInquiry" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sourcePath" TEXT,
    "status" "ContactInquiryStatus" NOT NULL DEFAULT 'UNREAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactInquiry_courseId_idx" ON "ContactInquiry"("courseId");
CREATE INDEX "ContactInquiry_status_createdAt_idx" ON "ContactInquiry"("status", "createdAt");
CREATE INDEX "ContactInquiry_email_idx" ON "ContactInquiry"("email");

ALTER TABLE "ContactInquiry"
ADD CONSTRAINT "ContactInquiry_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
