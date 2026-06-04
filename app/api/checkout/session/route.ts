import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCheckoutSession } from "@/lib/payments/create-checkout-session";
import { checkoutSessionSchema } from "@/lib/zod/schemas";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const json = await request.json();
    const input = checkoutSessionSchema.parse(json);

    if (!session?.user?.id || !session.user.email) {
      const returnToParams = new URLSearchParams();
      if (input.couponCode) returnToParams.set("coupon", input.couponCode);
      if (input.upsellFromOfferId) returnToParams.set("upsellFrom", input.upsellFromOfferId);

      const returnTo = `/checkout/${input.offerId}${returnToParams.size ? `?${returnToParams.toString()}` : ""}`;
      const loginParams = new URLSearchParams({ returnTo });

      return NextResponse.json({
        checkoutUrl: `/login?${loginParams.toString()}`,
        requiresLogin: true,
      });
    }

    const checkout = await createCheckoutSession({
      offerId: input.offerId,
      userId: session.user.id,
      customerEmail: session.user.email,
      couponCode: input.couponCode,
      upsellFromOfferId: input.upsellFromOfferId,
      taxLocation: {
        country: input.taxCountry,
        region: input.taxRegion,
        postalCode: input.taxPostalCode,
      },
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
