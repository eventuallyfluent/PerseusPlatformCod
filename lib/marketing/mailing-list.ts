import "server-only";

import { MailingListSubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type SubscribeToMailingListInput = {
  email: string;
  userId?: string | null;
  source: string;
  sourcePath?: string | null;
};

export async function subscribeToMailingList({ email, userId, source, sourcePath }: SubscribeToMailingListInput) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  return prisma.mailingListSubscription.upsert({
    where: { email: normalizedEmail },
    update: {
      userId: userId ?? undefined,
      status: MailingListSubscriptionStatus.SUBSCRIBED,
      source,
      sourcePath: sourcePath ?? undefined,
      subscribedAt: new Date(),
      unsubscribedAt: null,
    },
    create: {
      email: normalizedEmail,
      userId: userId ?? undefined,
      source,
      sourcePath: sourcePath ?? undefined,
    },
  });
}
