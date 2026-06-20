-- Index the filters, sort orders, and relation lookups used by the admin dashboard and queues.
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

CREATE INDEX "Course_instructorId_idx" ON "Course"("instructorId");
CREATE INDEX "Course_updatedAt_idx" ON "Course"("updatedAt");
CREATE INDEX "Bundle_updatedAt_idx" ON "Bundle"("updatedAt");

CREATE INDEX "Offer_courseId_idx" ON "Offer"("courseId");
CREATE INDEX "Offer_bundleId_idx" ON "Offer"("bundleId");
CREATE INDEX "Offer_accessProductId_idx" ON "Offer"("accessProductId");

CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");
CREATE INDEX "Enrollment_enrolledAt_idx" ON "Enrollment"("enrolledAt");

CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_offerId_idx" ON "Order"("offerId");

CREATE INDEX "Payment_orderId_createdAt_idx" ON "Payment"("orderId", "createdAt");
CREATE INDEX "Payment_gatewayId_idx" ON "Payment"("gatewayId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

CREATE INDEX "Testimonial_courseId_idx" ON "Testimonial"("courseId");
CREATE INDEX "Testimonial_bundleId_idx" ON "Testimonial"("bundleId");
CREATE INDEX "Testimonial_isApproved_position_idx" ON "Testimonial"("isApproved", "position");

CREATE INDEX "ImportBatch_type_createdAt_idx" ON "ImportBatch"("type", "createdAt");
CREATE INDEX "ImportBatch_type_status_idx" ON "ImportBatch"("type", "status");
