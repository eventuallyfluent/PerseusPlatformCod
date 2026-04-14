import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveCourseThankYouPath } from "@/lib/urls/resolve-course-path";
import { resolveBundleThankYouPath } from "@/lib/urls/resolve-bundle-path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        offer: {
          include: {
            course: true,
            bundle: true,
          },
        },
      },
    });

    if (order?.offer.course) {
      return NextResponse.redirect(new URL(`${resolveCourseThankYouPath(order.offer.course)}?order=${order.id}`, request.url));
    }

    if (order?.offer.bundle) {
      return NextResponse.redirect(new URL(`${resolveBundleThankYouPath(order.offer.bundle)}?order=${order.id}`, request.url));
    }
  }

  return NextResponse.redirect(new URL(`/dashboard?order=${orderId ?? ""}`, request.url));
}
