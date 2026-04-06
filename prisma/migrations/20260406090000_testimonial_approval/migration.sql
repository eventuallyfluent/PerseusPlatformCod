ALTER TABLE "Testimonial"
ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Testimonial"
SET "isApproved" = true;
