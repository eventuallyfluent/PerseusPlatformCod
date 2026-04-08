import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCheckoutSession } from "@/lib/payments/create-checkout-session";
import { checkoutSessionSchema } from "@/lib/zod/schemas";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const json = await request.json();
    const input = checkoutSessionSchema.parse(json);

    const checkout = await createCheckoutSession({
      offerId: input.offerId,
      userId: session?.user?.id,
      customerEmail: session?.user?.email ?? undefined,
      couponCode: input.couponCode,
      upsellFromOfferId: input.upsellFromOfferId,
    });

    return NextResponse.json(checkout);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Checkout session failed",
      },
      { status: 400 },
    );
  }
}
