CREATE TYPE "MailingListSubscriptionStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED');

CREATE TABLE "MailingListSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "status" "MailingListSubscriptionStatus" NOT NULL DEFAULT 'SUBSCRIBED',
    "source" TEXT NOT NULL,
    "sourcePath" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailingListSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MailingListSubscription_email_key" ON "MailingListSubscription"("email");
CREATE INDEX "MailingListSubscription_status_subscribedAt_idx" ON "MailingListSubscription"("status", "subscribedAt");
CREATE INDEX "MailingListSubscription_userId_idx" ON "MailingListSubscription"("userId");

ALTER TABLE "MailingListSubscription"
ADD CONSTRAINT "MailingListSubscription_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
