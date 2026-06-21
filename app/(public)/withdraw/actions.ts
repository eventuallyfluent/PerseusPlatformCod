"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { submitContractWithdrawal } from "@/lib/payments/contract-withdrawals";

const withdrawalSchema = z.object({
  orderId: z.string().min(1),
  consumerName: z.string().trim().min(1).max(200),
  acknowledgementEmail: z.string().trim().email().max(320),
});

export async function confirmContractWithdrawalAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect("/login?returnTo=/withdraw");
  }

  const parsed = withdrawalSchema.safeParse({
    orderId: formData.get("orderId"),
    consumerName: formData.get("consumerName"),
    acknowledgementEmail: formData.get("acknowledgementEmail"),
  });

  if (!parsed.success) {
    const orderId = String(formData.get("orderId") ?? "");
    redirect(`/withdraw?order=${encodeURIComponent(orderId)}&error=details`);
  }

  let withdrawalId: string;
  try {
    const withdrawal = await submitContractWithdrawal({
      ...parsed.data,
      userId: session.user.id,
    });
    withdrawalId = withdrawal.id;
  } catch {
    redirect(`/withdraw?order=${encodeURIComponent(parsed.data.orderId)}&error=ineligible`);
  }

  redirect(`/withdraw?submitted=${encodeURIComponent(withdrawalId)}`);
}
