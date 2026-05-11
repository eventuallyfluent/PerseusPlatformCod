import { AccessGrantSourceType, CourseStatus, LessonType, OfferType, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../lib/db/prisma";
import { calculatePlatformTax } from "../lib/taxes/tax-calculation";
import { grantCourseAccess, revokeSubscriptionAccess } from "../lib/access/course-access-grants";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const suffix = `verify-${Date.now()}`;
  const previousSettings = await prisma.taxSetting.findUnique({ where: { id: "global" } });
  let instructorId: string | null = null;
  let userId: string | null = null;
  let gatewayId: string | null = null;

  try {
    await prisma.courseAccessGrant.deleteMany({ where: { user: { email: { contains: "verify-" } } } });
    await prisma.subscription.deleteMany({ where: { gateway: { provider: { startsWith: "verify-" } } } });
    await prisma.order.deleteMany({ where: { user: { email: { contains: "verify-" } } } });
    await prisma.gateway.deleteMany({ where: { provider: { startsWith: "verify-" } } });
    await prisma.user.deleteMany({ where: { email: { contains: "verify-" } } });
    await prisma.course.deleteMany({ where: { slug: { contains: "verify-" } } });
    await prisma.instructor.deleteMany({ where: { slug: { contains: "verify-" } } });
    await prisma.taxSetting.upsert({
      where: { id: "global" },
      create: { id: "global", enabled: false },
      update: { enabled: false, pricesIncludeTax: false, requireTaxLocation: false, collectForAllCountries: false },
    });
    await prisma.taxRate.deleteMany({ where: { label: { startsWith: "Verify " } } });

    const instructor = await prisma.instructor.create({
      data: { slug: `${suffix}-instructor`, name: "Verify Instructor" },
    });
    instructorId = instructor.id;
    const course = await prisma.course.create({
      data: {
        slug: `${suffix}-course`,
        title: "Verify Course",
        status: CourseStatus.PUBLISHED,
        price: 100,
        currency: "USD",
        instructorId: instructor.id,
        modules: {
          create: {
            title: "Module",
            position: 1,
            lessons: { create: { slug: "lesson", title: "Lesson", position: 1, type: LessonType.TEXT } },
          },
        },
      },
    });
    const offer = await prisma.offer.create({
      data: {
        courseId: course.id,
        name: "Verify offer",
        type: OfferType.ONE_TIME,
        price: 100,
        currency: "USD",
        isPublished: true,
        isDefault: true,
      },
    });
    const subscriptionOffer = await prisma.offer.create({
      data: {
        courseId: course.id,
        name: "Verify subscription",
        type: OfferType.SUBSCRIPTION,
        price: 100,
        currency: "USD",
        isPublished: true,
      },
    });

    let tax = await calculatePlatformTax({ amountAfterDiscount: 100, offer, location: { country: "ZZ" } });
    assert(tax.taxAmount === 0 && tax.totalAmount === 100, "tax disabled should not collect tax");

    await prisma.taxSetting.update({ where: { id: "global" }, data: { enabled: true, pricesIncludeTax: false } });
    await prisma.taxRate.create({ data: { country: "ZZ", label: "Verify Country Tax", ratePercent: 10 } });
    tax = await calculatePlatformTax({ amountAfterDiscount: 100, offer, location: { country: "ZZ" } });
    assert(tax.taxAmount === 10 && tax.totalAmount === 110, "country tax should add 10%");

    await prisma.taxRate.create({ data: { country: "US", region: "ZZ", label: "Verify US State Tax", ratePercent: 7 } });
    tax = await calculatePlatformTax({ amountAfterDiscount: 100, offer, location: { country: "US", region: "ZZ" } });
    assert(tax.taxAmount === 7, "US state override should apply");

    await prisma.taxRate.create({ data: { country: "US", region: "ZZ", postalCode: "99999", label: "Verify US Zip Tax", ratePercent: 3 } });
    tax = await calculatePlatformTax({ amountAfterDiscount: 100, offer, location: { country: "US", region: "ZZ", postalCode: "99999" } });
    assert(tax.taxAmount === 3, "US postal override should apply");

    await prisma.taxRate.create({ data: { country: "CA", region: "ZZ", label: "Verify Canada Province Tax", ratePercent: 13 } });
    tax = await calculatePlatformTax({ amountAfterDiscount: 100, offer, location: { country: "CA", region: "ZZ" } });
    assert(tax.taxAmount === 13, "Canada province tax should apply");

    await prisma.taxSetting.update({ where: { id: "global" }, data: { pricesIncludeTax: true } });
    tax = await calculatePlatformTax({ amountAfterDiscount: 110, offer, location: { country: "ZZ" } });
    assert(tax.taxAmount === 10 && tax.totalAmount === 110, "included tax should split tax from total");

    await prisma.taxRate.create({
      data: { country: "XY", label: "Verify No Subscription Tax", ratePercent: 20, appliesToSubscriptions: false },
    });
    tax = await calculatePlatformTax({ amountAfterDiscount: 100, offer: subscriptionOffer, location: { country: "XY" } });
    assert(tax.taxAmount === 0, "subscription applicability should exclude subscription offers");

    const user = await prisma.user.create({ data: { email: `${suffix}@example.com` } });
    userId = user.id;
    const gateway = await prisma.gateway.create({
      data: {
        provider: `verify-${suffix}`,
        displayName: "Verify Gateway",
        kind: "bank_transfer",
        checkoutModel: "manual_instructions",
        settlementBehavior: "manual_confirmation",
      },
    });
    gatewayId = gateway.id;
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        offerId: subscriptionOffer.id,
        subtotalAmount: 100,
        totalAmount: 100,
        currency: "USD",
        subscription: { create: { gatewayId: gateway.id, status: SubscriptionStatus.ACTIVE } },
      },
      include: { subscription: true },
    });
    await grantCourseAccess({
      userId: user.id,
      courseIds: [course.id],
      orderId: order.id,
      subscriptionId: order.subscription!.id,
      sourceType: AccessGrantSourceType.SUBSCRIPTION,
    });
    assert((await prisma.enrollment.count({ where: { userId: user.id, courseId: course.id } })) === 1, "subscription should enroll user");
    await revokeSubscriptionAccess({ subscriptionId: order.subscription!.id });
    assert((await prisma.enrollment.count({ where: { userId: user.id, courseId: course.id } })) === 0, "subscription-only access should be removed");

    const manual = await prisma.enrollment.create({ data: { userId: user.id, courseId: course.id } });
    await grantCourseAccess({
      userId: user.id,
      courseIds: [course.id],
      orderId: order.id,
      subscriptionId: order.subscription!.id,
      sourceType: AccessGrantSourceType.SUBSCRIPTION,
    });
    await revokeSubscriptionAccess({ subscriptionId: order.subscription!.id });
    assert(manual.id && (await prisma.enrollment.count({ where: { userId: user.id, courseId: course.id } })) === 1, "manual enrollment should remain");

    console.log(JSON.stringify({ ok: true, checks: ["tax", "subscription_access"] }, null, 2));
  } finally {
    await prisma.taxRate.deleteMany({ where: { label: { startsWith: "Verify " } } });
    if (userId) await prisma.order.deleteMany({ where: { userId } });
    if (gatewayId) await prisma.subscription.deleteMany({ where: { gatewayId } });
    if (gatewayId) await prisma.gateway.deleteMany({ where: { id: gatewayId } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    if (instructorId) await prisma.course.deleteMany({ where: { instructorId } });
    if (instructorId) await prisma.instructor.deleteMany({ where: { id: instructorId } });
    if (previousSettings) {
      const restoreSettings = {
        enabled: previousSettings.enabled,
        pricesIncludeTax: previousSettings.pricesIncludeTax,
        requireTaxLocation: previousSettings.requireTaxLocation,
        collectForAllCountries: previousSettings.collectForAllCountries,
        defaultTaxName: previousSettings.defaultTaxName,
      };
      await prisma.taxSetting.upsert({ where: { id: "global" }, create: { id: "global", ...restoreSettings }, update: restoreSettings });
    } else {
      await prisma.taxSetting.upsert({
        where: { id: "global" },
        create: { id: "global" },
        update: { enabled: false, pricesIncludeTax: false, requireTaxLocation: false, collectForAllCountries: false, defaultTaxName: "Tax" },
      });
    }
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
