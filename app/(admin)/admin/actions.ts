"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { createCourse } from "@/lib/courses/create-course";
import { updateCourse } from "@/lib/courses/update-course";
import { bundleInclude } from "@/lib/bundles/bundle-query";
import { createBundle } from "@/lib/bundles/create-bundle";
import { persistGeneratedBundlePage } from "@/lib/bundles/persist-generated-bundle-page";
import { updateBundle } from "@/lib/bundles/update-bundle";
import { regenerateCoursePage } from "@/lib/sales-pages/regenerate-course-page";
import { upsertInstructor } from "@/lib/instructors/upsert-instructor";
import { upsertOffer } from "@/lib/offers/upsert-offer";
import { bundleInputSchema, moduleInputSchema, lessonInputSchema } from "@/lib/zod/schemas";
import { findPaymentConnector } from "@/lib/payments/adapter-registry";
import { encryptGatewayCredentialValue, isEncryptedGatewayCredentialValue } from "@/lib/payments/gateway-credentials";
import { getGatewayCredentialMap } from "@/lib/payments/gateway-credential-map";
import { resolveGatewayDefinition } from "@/lib/payments/gateway-definition";
import { evaluateGatewayOperationalReadiness } from "@/lib/payments/readiness";
import { confirmManualPayment, failManualPayment } from "@/lib/payments/manual-payment";
import { defaultHomepageSections, parseLinkLines, parseLines, type HomepageSectionPayloadMap } from "@/lib/homepage/sections";
import { syncAccessProduct } from "@/lib/access-products/sync-access-product";
import { syncProductOffer } from "@/lib/offers/sync-product-offer";
import { normalizePublicThemeFamily, PUBLIC_THEME_FAMILY_SETTING_KEY } from "@/lib/theme/public-theme";
import { CouponScope, CourseStatus, type HomepageSectionType } from "@prisma/client";
import type { GatewayCapabilities, GatewayCheckoutModel, GatewayKind, GatewaySettlementBehavior, GatewayTaxModel } from "@/types";

function toArray(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSalesPageConfig(formData: FormData) {
  return {
    thankYouEyebrow: String(formData.get("salesPage.thankYouEyebrow") ?? ""),
    thankYouHeadline: String(formData.get("salesPage.thankYouHeadline") ?? ""),
    thankYouBody: String(formData.get("salesPage.thankYouBody") ?? ""),
    thankYouSignedInLabel: String(formData.get("salesPage.thankYouSignedInLabel") ?? ""),
    thankYouSignedOutLabel: String(formData.get("salesPage.thankYouSignedOutLabel") ?? ""),
  };
}

function parseUpsellSelection(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return {
      upsellCourseId: null,
      upsellBundleId: null,
    };
  }

  const [kind, id] = raw.split(":");

  return {
    upsellCourseId: kind === "course" ? id : null,
    upsellBundleId: kind === "bundle" ? id : null,
  };
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw ? Number(raw) : undefined;
}

function parseBooleanField(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function slugifyProvider(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCredentialTextarea(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex <= 0) {
        return null;
      }

      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();

      if (!key || !rawValue) {
        return null;
      }

      return [key, rawValue] as const;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry));
}

function getGatewayDefaults(kind: GatewayKind): {
  checkoutModel: GatewayCheckoutModel;
  taxModel: GatewayTaxModel;
  settlementBehavior: GatewaySettlementBehavior;
  capabilities: Pick<
    GatewayCapabilities,
    | "supportsSubscriptions"
    | "supportsRefunds"
    | "supportsPaymentPlans"
    | "supportsHostedCheckout"
    | "supportsTaxCalculation"
    | "supportsHostedTaxCollection"
    | "taxRequiresExternalConfiguration"
    | "actsAsMerchantOfRecord"
    | "requiresBillingAddress"
    | "requiresShippingAddress"
    | "requiresBusinessIdentity"
    | "mayRequireManualReview"
    | "suitableForHighRisk"
    | "supportsManualConfirmation"
  >;
  instructionsMarkdown?: string;
} {
  if (kind === "bank_transfer") {
    return {
      checkoutModel: "manual_instructions",
      taxModel: "external_tax_service",
      settlementBehavior: "manual_confirmation",
      capabilities: {
        supportsSubscriptions: false,
        supportsRefunds: true,
        supportsPaymentPlans: false,
        supportsHostedCheckout: false,
        supportsTaxCalculation: false,
        supportsHostedTaxCollection: false,
        taxRequiresExternalConfiguration: true,
        actsAsMerchantOfRecord: false,
        requiresBillingAddress: true,
        requiresShippingAddress: false,
        requiresBusinessIdentity: false,
        mayRequireManualReview: true,
        suitableForHighRisk: true,
        supportsManualConfirmation: true,
      },
      instructionsMarkdown:
        "Send the transfer using the bank details below and include the order reference exactly as shown. Access is granted after the payment is confirmed.",
    };
  }

  return {
    checkoutModel: "hosted_redirect",
    taxModel: "external_tax_service",
    settlementBehavior: "asynchronous",
    capabilities: {
      supportsSubscriptions: false,
      supportsRefunds: true,
      supportsPaymentPlans: false,
      supportsHostedCheckout: true,
      supportsTaxCalculation: false,
      supportsHostedTaxCollection: false,
      taxRequiresExternalConfiguration: true,
      actsAsMerchantOfRecord: false,
      requiresBillingAddress: true,
      requiresShippingAddress: false,
      requiresBusinessIdentity: false,
      mayRequireManualReview: true,
      suitableForHighRisk: true,
      supportsManualConfirmation: true,
    },
  };
}

function getDefaultHomepagePayload(type: HomepageSectionType) {
  return defaultHomepageSections().find((section) => section.type === type)!.payload;
}

export async function savePublicThemeFamilyAction(formData: FormData) {
  const family = normalizePublicThemeFamily(String(formData.get("family") ?? ""));

  try {
    await prisma.siteSetting.upsert({
      where: { key: PUBLIC_THEME_FAMILY_SETTING_KEY },
      update: {
        value: { family },
      },
      create: {
        key: PUBLIC_THEME_FAMILY_SETTING_KEY,
        value: { family },
      },
    });
  } catch {
    try {
      const footerDefault = defaultHomepageSections().find((section) => section.type === "FOOTER")!;
      const existingFooter = await prisma.homepageSection.findUnique({
        where: { type: "FOOTER" },
      });

      const currentPayload =
        existingFooter && typeof existingFooter.payload === "object" && existingFooter.payload !== null
          ? (existingFooter.payload as HomepageSectionPayloadMap["FOOTER"])
          : footerDefault.payload;

      await prisma.homepageSection.upsert({
        where: { type: "FOOTER" },
        update: {
          enabled: existingFooter?.enabled ?? footerDefault.enabled,
          position: existingFooter?.position ?? footerDefault.position,
          payload: JSON.parse(
            JSON.stringify({
              ...currentPayload,
              themeFamily: family,
            }),
          ),
        },
        create: {
          type: "FOOTER",
          enabled: footerDefault.enabled,
          position: footerDefault.position,
          payload: JSON.parse(
            JSON.stringify({
              ...(footerDefault.payload as HomepageSectionPayloadMap["FOOTER"]),
              themeFamily: family,
            }),
          ),
        },
      });
    } catch {
      redirect("/admin/settings?error=theme");
    }
  }

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=theme");
}

export async function saveHomepageSectionAction(formData: FormData) {
  const type = String(formData.get("type") ?? "") as HomepageSectionType;
  const enabled = String(formData.get("enabled") ?? "") === "true";
  const position = Number(formData.get("position") ?? 1);

  let payload: HomepageSectionPayloadMap[HomepageSectionType];

  if (type === "HERO") {
    payload = {
      eyebrow: String(formData.get("eyebrow") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      primaryCtaLabel: String(formData.get("primaryCtaLabel") ?? ""),
      primaryCtaHref: String(formData.get("primaryCtaHref") ?? ""),
      secondaryCtaLabel: String(formData.get("secondaryCtaLabel") ?? ""),
      secondaryCtaHref: String(formData.get("secondaryCtaHref") ?? ""),
    };
  } else if (type === "COLLECTIONS") {
    payload = {
      eyebrow: String(formData.get("eyebrow") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      featuredCollectionIds: formData
        .getAll("featuredCollectionIds")
        .map((value) => String(value).trim())
        .filter(Boolean),
    };
  } else if (type === "TESTIMONIES") {
    payload = {
      eyebrow: String(formData.get("eyebrow") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      sourceMode: String(formData.get("sourceMode") ?? "selected") === "latest-approved" ? "latest-approved" : "selected",
      selectedTestimonialIds: formData
        .getAll("selectedTestimonialIds")
        .map((value) => String(value))
        .filter(Boolean),
    };
  } else if (type === "EMAIL_SIGNUP") {
    payload = {
      eyebrow: String(formData.get("eyebrow") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      inputPlaceholder: String(formData.get("inputPlaceholder") ?? ""),
      buttonLabel: String(formData.get("buttonLabel") ?? ""),
      formActionUrl: String(formData.get("formActionUrl") ?? ""),
      legalText: String(formData.get("legalText") ?? ""),
    };
  } else if (type === "FOOTER") {
    const existingFooter = await prisma.homepageSection.findUnique({
      where: { type: "FOOTER" },
      select: { payload: true },
    });
    const currentThemeFamily =
      existingFooter && typeof existingFooter.payload === "object" && existingFooter.payload !== null
        ? (existingFooter.payload as HomepageSectionPayloadMap["FOOTER"]).themeFamily
        : undefined;

    payload = {
      brandTitle: String(formData.get("brandTitle") ?? ""),
      brandSubtitle: String(formData.get("brandSubtitle") ?? ""),
      brandDescription: String(formData.get("brandDescription") ?? ""),
      platformHeading: String(formData.get("platformHeading") ?? ""),
      platformLinks: parseLinkLines(String(formData.get("platformLinks") ?? "")),
      legalHeading: String(formData.get("legalHeading") ?? ""),
      legalLinks: parseLinkLines(String(formData.get("legalLinks") ?? "")),
      socialLabels: parseLines(String(formData.get("socialLabels") ?? "")),
      bottomLeftText: String(formData.get("bottomLeftText") ?? ""),
      bottomRightText: String(formData.get("bottomRightText") ?? ""),
      themeFamily: currentThemeFamily,
    };
  } else {
    payload = getDefaultHomepagePayload(type);
  }

  try {
    await prisma.homepageSection.upsert({
      where: { type },
      update: {
        enabled,
        position,
        payload: JSON.parse(JSON.stringify(payload)),
      },
      create: {
        type,
        enabled,
        position,
        payload: JSON.parse(JSON.stringify(payload)),
      },
    });
  } catch {
    redirect(`/admin/settings?error=${type.toLowerCase()}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  redirect(`/admin/settings?saved=${type.toLowerCase()}`);
}

export async function saveCollectionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const payload = {
    slug: String(formData.get("slug") ?? "").trim(),
    eyebrow: String(formData.get("eyebrow") ?? "").trim() || null,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    tone: String(formData.get("tone") ?? "arcane").trim() || "arcane",
    position: Number(formData.get("position") ?? 1),
  };

  let collection;

  try {
    collection = id
      ? await prisma.collection.update({
          where: { id },
          data: payload,
        })
      : await prisma.collection.create({
          data: payload,
        });
  } catch {
    if (id) {
      redirect(`/admin/collections/${id}?error=details`);
    }

    redirect("/admin/collections/new?error=details");
  }

  revalidatePath("/collections");
  revalidatePath(`/collections/${collection.slug}`);
  revalidatePath("/courses");
  revalidatePath("/");
  revalidatePath("/admin/collections");
  revalidatePath(`/admin/collections/${collection.id}`);
  redirect(`/admin/collections/${collection.id}?saved=details`);
}

export async function saveCollectionCoursesAction(formData: FormData) {
  const collectionId = String(formData.get("collectionId") ?? "");
  const courseIds = formData
    .getAll("courseIds")
    .map((value) => String(value))
    .filter(Boolean);

  try {
    await prisma.collectionCourse.deleteMany({
      where: { collectionId },
    });

    if (courseIds.length > 0) {
      await prisma.collectionCourse.createMany({
        data: courseIds.map((courseId, index) => ({
          collectionId,
          courseId,
          position: index + 1,
        })),
      });
    }
  } catch {
    redirect(`/admin/collections/${collectionId}?error=courses`);
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { slug: true },
  });

  if (!collection) {
    redirect("/admin/collections");
  }

  revalidatePath("/collections");
  revalidatePath(`/collections/${collection.slug}`);
  revalidatePath("/courses");
  revalidatePath("/");
  revalidatePath(`/admin/collections/${collectionId}`);
  redirect(`/admin/collections/${collectionId}?saved=courses`);
}

export async function deleteCollectionAction(formData: FormData) {
  const collectionId = String(formData.get("collectionId") ?? "");

  try {
    await prisma.collection.delete({
      where: { id: collectionId },
    });
  } catch {
    redirect(`/admin/collections/${collectionId}?error=details`);
  }

  revalidatePath("/collections");
  revalidatePath("/courses");
  revalidatePath("/");
  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}

export async function saveCourseAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const upsell = parseUpsellSelection(formData.get("upsellTarget"));
  const payload = {
    slug: String(formData.get("slug") ?? ""),
    title: String(formData.get("title") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    longDescription: String(formData.get("longDescription") ?? ""),
    learningOutcomes: toArray(formData.get("learningOutcomes")),
    whoItsFor: toArray(formData.get("whoItsFor")),
    includes: toArray(formData.get("includes")),
    heroImageUrl: String(formData.get("heroImageUrl") ?? ""),
    salesVideoUrl: String(formData.get("salesVideoUrl") ?? ""),
    salesPageConfig: parseSalesPageConfig(formData),
    instructorId: String(formData.get("instructorId") ?? ""),
    seoTitle: String(formData.get("seoTitle") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
    status: String(formData.get("status") ?? "DRAFT"),
    ...upsell,
    upsellDiscountType: String(formData.get("upsellDiscountType") ?? "NONE"),
    upsellDiscountValue: parseOptionalNumber(formData.get("upsellDiscountValue")),
    upsellHeadline: String(formData.get("upsellHeadline") ?? ""),
    upsellBody: String(formData.get("upsellBody") ?? ""),
    legacyCourseId: String(formData.get("legacyCourseId") ?? ""),
    legacySlug: String(formData.get("legacySlug") ?? ""),
    legacyUrl: String(formData.get("legacyUrl") ?? ""),
  };

  if (formData.has("price")) {
    Object.assign(payload, {
      price: Number(formData.get("price") ?? 0),
      currency: String(formData.get("currency") ?? "USD"),
      compareAtPrice: formData.get("compareAtPrice") ? Number(formData.get("compareAtPrice")) : undefined,
    });
  }

  let course;

  try {
    course = id ? await updateCourse(id, payload) : await createCourse(payload);
  } catch {
    if (id) {
      redirect(`/admin/courses/${id}?error=details`);
    }

    redirect("/admin/courses/new/course?error=details");
  }

  revalidatePath("/admin/courses");
  revalidatePath("/admin/products");
  revalidatePath("/courses");
  revalidatePath("/");
  revalidatePath(`/admin/courses/${course.id}`);
  revalidatePath(`/course/${course.slug}`);
  redirect(`/admin/courses/${course.id}?saved=details`);
}

export async function saveBundleAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const courseIds = formData
    .getAll("courseIds")
    .map((value) => String(value))
    .filter(Boolean);
  const upsell = parseUpsellSelection(formData.get("upsellTarget"));
  const parsed = bundleInputSchema.safeParse({
    slug: String(formData.get("slug") ?? ""),
    title: String(formData.get("title") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    longDescription: String(formData.get("longDescription") ?? ""),
    learningOutcomes: toArray(formData.get("learningOutcomes")),
    whoItsFor: toArray(formData.get("whoItsFor")),
    includes: toArray(formData.get("includes")),
    heroImageUrl: String(formData.get("heroImageUrl") ?? ""),
    salesVideoUrl: String(formData.get("salesVideoUrl") ?? ""),
    salesPageConfig: parseSalesPageConfig(formData),
    seoTitle: String(formData.get("seoTitle") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
    status: String(formData.get("status") ?? "DRAFT"),
    ...upsell,
    upsellDiscountType: String(formData.get("upsellDiscountType") ?? "NONE"),
    upsellDiscountValue: parseOptionalNumber(formData.get("upsellDiscountValue")),
    upsellHeadline: String(formData.get("upsellHeadline") ?? ""),
    upsellBody: String(formData.get("upsellBody") ?? ""),
    legacyUrl: String(formData.get("legacyUrl") ?? ""),
    ...(formData.has("price")
      ? {
          price: Number(formData.get("price") ?? 0),
          currency: String(formData.get("currency") ?? "USD"),
          compareAtPrice: formData.get("compareAtPrice") ? Number(formData.get("compareAtPrice")) : undefined,
        }
      : {}),
  });

  if (!parsed.success) {
    if (id) {
      redirect(`/admin/bundles/${id}?error=details`);
    }

    redirect("/admin/bundles/new?error=details");
  }

  const payload = parsed.data;
  let bundle: Awaited<ReturnType<typeof createBundle>> | Awaited<ReturnType<typeof updateBundle>>;

  try {
    bundle = id ? await updateBundle(id, payload) : await createBundle(payload);

    if (!id) {
      if (courseIds.length > 0) {
        await prisma.bundleCourse.createMany({
          data: courseIds.map((courseId, index) => ({
            bundleId: bundle.id,
            courseId,
            position: index + 1,
          })),
        });
      }

      const refreshedBundle = await prisma.bundle.findUnique({
        where: { id: bundle.id },
        include: bundleInclude,
      });

      if (refreshedBundle) {
        await persistGeneratedBundlePage(refreshedBundle);
      }
    }
  } catch {
    if (id) {
      redirect(`/admin/bundles/${id}?error=details`);
    }

    redirect("/admin/bundles/new?error=details");
  }

  revalidatePath("/admin/bundles");
  revalidatePath("/admin/products");
  revalidatePath("/courses");
  revalidatePath("/");
  revalidatePath(`/bundle/${bundle.slug}`);
  revalidatePath("/admin/bundles");
  revalidatePath(`/admin/bundles/${bundle.id}`);
  redirect(`/admin/bundles/${bundle.id}?saved=details`);
}

export async function addModuleAction(formData: FormData) {
  const courseId = String(formData.get("courseId"));
  const moduleId = String(formData.get("moduleId") ?? "");
  const parsed = moduleInputSchema.safeParse({
    title: formData.get("title"),
    position: formData.get("position"),
  });

  if (!parsed.success) {
    redirect(`/admin/courses/${courseId}?error=curriculum`);
  }

  const data = parsed.data;

  try {
    if (moduleId) {
      await prisma.module.update({
        where: { id: moduleId },
        data: {
          title: data.title,
          position: data.position,
        },
      });
    } else {
      await prisma.module.create({
        data: {
          courseId,
          title: data.title,
          position: data.position,
        },
      });
    }
  } catch {
    redirect(`/admin/courses/${courseId}?error=curriculum`);
  }

  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}?saved=curriculum`);
}

export async function addLessonAction(formData: FormData) {
  const courseId = String(formData.get("courseId"));
  const moduleId = String(formData.get("moduleId"));
  const lessonId = String(formData.get("lessonId") ?? "");
  const parsed = lessonInputSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    position: formData.get("position"),
    type: formData.get("type"),
    status: formData.get("status"),
    content: formData.get("content"),
    videoUrl: formData.get("videoUrl"),
    downloadUrl: formData.get("downloadUrl"),
    isPreview: formData.get("isPreview"),
    dripDays: formData.get("dripDays"),
    durationLabel: formData.get("durationLabel"),
  });

  if (!parsed.success) {
    redirect(`/admin/courses/${courseId}?error=lesson`);
  }

  const data = parsed.data;

  try {
    if (lessonId) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: {
          ...data,
          videoUrl: data.videoUrl || null,
          downloadUrl: data.downloadUrl || null,
        },
      });
    } else {
      await prisma.lesson.create({
        data: {
          moduleId,
          ...data,
          videoUrl: data.videoUrl || null,
          downloadUrl: data.downloadUrl || null,
        },
      });
    }
  } catch {
    redirect(`/admin/courses/${courseId}?error=lesson`);
  }

  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}?saved=curriculum`);
}

export async function saveInstructorAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  let instructor;

  try {
    instructor = await upsertInstructor(
      {
        slug: String(formData.get("slug") ?? ""),
        name: String(formData.get("name") ?? ""),
        imageUrl: String(formData.get("imageUrl") ?? ""),
        shortBio: String(formData.get("shortBio") ?? ""),
        longBio: String(formData.get("longBio") ?? ""),
        websiteUrl: String(formData.get("websiteUrl") ?? ""),
        youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
        instagramUrl: String(formData.get("instagramUrl") ?? ""),
        xUrl: String(formData.get("xUrl") ?? ""),
        facebookUrl: String(formData.get("facebookUrl") ?? ""),
        discordUrl: String(formData.get("discordUrl") ?? ""),
        telegramUrl: String(formData.get("telegramUrl") ?? ""),
      },
      id || undefined,
    );
  } catch {
    if (id) {
      redirect(`/admin/instructors/${id}?error=details`);
    }

    redirect("/admin/instructors/new?error=details");
  }

  revalidatePath("/admin/instructors");
  revalidatePath("/instructors");
  revalidatePath(`/instructors/${instructor.slug}`);
  revalidatePath("/courses");
  revalidatePath("/");
  redirect(`/admin/instructors/${instructor.id}?saved=details`);
}

export async function saveOfferAction(formData: FormData) {
  const offerId = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  try {
    await upsertOffer(
      {
        courseId: courseId || undefined,
        bundleId: bundleId || undefined,
        name: String(formData.get("name") ?? ""),
        type: String(formData.get("type") ?? "ONE_TIME"),
        price: Number(formData.get("price") ?? 0),
        currency: String(formData.get("currency") ?? "USD"),
        compareAtPrice: formData.get("compareAtPrice") ? Number(formData.get("compareAtPrice")) : undefined,
        isPublished: Boolean(formData.get("isPublished")),
        checkoutPath: String(formData.get("checkoutPath") ?? ""),
      },
      offerId || undefined,
    );
  } catch {
    if (productId) {
      redirect(`/admin/products/${productId}?error=offer`);
    }
    if (courseId) {
      redirect(`/admin/courses/${courseId}?error=offer`);
    }
    if (bundleId) {
      redirect(`/admin/bundles/${bundleId}?error=offer`);
    }
    redirect("/admin/coupons?error=offer");
  }

  revalidatePath("/admin/offers");
  if (productId) {
    revalidatePath(`/admin/products/${productId}`);
    redirect(`/admin/products/${productId}?saved=offer`);
  }
  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}?saved=offer`);
  }
  if (bundleId) {
    revalidatePath(`/admin/bundles/${bundleId}`);
    redirect(`/admin/bundles/${bundleId}?saved=offer`);
  }
  redirect("/admin/coupons?saved=offer");
}

export async function deleteOfferAction(formData: FormData) {
  const offerId = String(formData.get("offerId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");

  try {
    await prisma.offer.delete({
      where: { id: offerId },
    });
  } catch {
    if (courseId) {
      redirect(`/admin/courses/${courseId}?error=offer`);
    }
    if (bundleId) {
      redirect(`/admin/bundles/${bundleId}?error=offer`);
    }
    redirect("/admin/coupons?error=offer");
  }

  revalidatePath("/admin/offers");
  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}?saved=offer`);
  }
  if (bundleId) {
    revalidatePath(`/admin/bundles/${bundleId}`);
    redirect(`/admin/bundles/${bundleId}?saved=offer`);
  }
  redirect("/admin/coupons?saved=offer");
}

export async function saveCouponAction(formData: FormData) {
  const couponId = String(formData.get("couponId") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const scope = String(formData.get("scope") ?? "TOTAL_ORDER").trim();
  const productTarget = String(formData.get("productTarget") ?? "").trim();
  const collectionId = String(formData.get("collectionId") ?? "").trim();
  const discountType = String(formData.get("discountType") ?? "").trim();
  const amountOffRaw = String(formData.get("amountOff") ?? "").trim();
  const percentOffRaw = String(formData.get("percentOff") ?? "").trim();
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
  const redirectBase = `/admin/coupons${couponId ? "?saved=updated" : "?saved=created"}`;

  if (!code) {
    redirect("/admin/coupons?error=code");
  }

  if (!["TOTAL_ORDER", "PRODUCT", "COLLECTION"].includes(scope)) {
    redirect("/admin/coupons?error=scope");
  }

  if (discountType !== "amount" && discountType !== "percent") {
    redirect("/admin/coupons?error=discountType");
  }

  const amountOff = amountOffRaw ? Number(amountOffRaw) : null;
  const percentOff = percentOffRaw ? Number(percentOffRaw) : null;

  if (discountType === "amount" && (!amountOff || amountOff <= 0)) {
    redirect("/admin/coupons?error=amount");
  }

  if (discountType === "percent" && (!percentOff || percentOff < 1 || percentOff > 100)) {
    redirect("/admin/coupons?error=percent");
  }

  let courseId: string | null = null;
  let bundleId: string | null = null;

  if (scope === "PRODUCT") {
    const [kind, id] = productTarget.split(":");

    if (!id || (kind !== "course" && kind !== "bundle")) {
      redirect("/admin/coupons?error=product");
    }

    courseId = kind === "course" ? id : null;
    bundleId = kind === "bundle" ? id : null;
  }

  if (scope === "COLLECTION" && !collectionId) {
    redirect("/admin/coupons?error=collection");
  }

  const payload = {
      code,
      scope: scope as CouponScope,
      courseId,
      bundleId,
      collectionId: scope === "COLLECTION" ? collectionId : null,
      amountOff: discountType === "amount" ? amountOff : null,
      percentOff: discountType === "percent" ? percentOff : null,
      isActive: Boolean(formData.get("isActive")),
      expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
    };

  try {
    if (couponId) {
      await prisma.coupon.update({
        where: { id: couponId },
        data: payload,
      });
    } else {
      await prisma.coupon.create({
        data: payload,
      });
    }
  } catch {
    redirect("/admin/coupons?error=save");
  }

  revalidatePath("/admin/coupons");
  redirect(redirectBase);
}

export async function deleteCouponAction(formData: FormData) {
  const couponId = String(formData.get("couponId") ?? "");
  try {
    await prisma.coupon.delete({
      where: { id: couponId },
    });
  } catch {
    redirect("/admin/coupons?error=delete");
  }
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons?saved=deleted");
}

export async function saveFaqAction(formData: FormData) {
  const faqId = String(formData.get("faqId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");
  const payload = {
    courseId: courseId || null,
    bundleId: bundleId || null,
    question: String(formData.get("question") ?? ""),
    answer: String(formData.get("answer") ?? ""),
    position: Number(formData.get("position") ?? 1),
  };

  try {
    if (faqId) {
      await prisma.fAQ.update({
        where: { id: faqId },
        data: payload,
      });
    } else {
      await prisma.fAQ.create({
        data: payload,
      });
    }
  } catch {
    if (courseId) {
      redirect(`/admin/courses/${courseId}?error=faq`);
    }
    if (bundleId) {
      redirect(`/admin/bundles/${bundleId}?error=faq`);
    }
  }

  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}?saved=faq`);
  }
  if (bundleId) {
    revalidatePath(`/admin/bundles/${bundleId}`);
    redirect(`/admin/bundles/${bundleId}?saved=faq`);
  }
}

export async function deleteFaqAction(formData: FormData) {
  const faqId = String(formData.get("faqId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");

  try {
    await prisma.fAQ.delete({
      where: { id: faqId },
    });
  } catch {
    if (courseId) {
      redirect(`/admin/courses/${courseId}?error=faq`);
    }
    if (bundleId) {
      redirect(`/admin/bundles/${bundleId}?error=faq`);
    }
  }

  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}?saved=faq`);
  }
  if (bundleId) {
    revalidatePath(`/admin/bundles/${bundleId}`);
    redirect(`/admin/bundles/${bundleId}?saved=faq`);
  }
}

export async function saveTestimonialAction(formData: FormData) {
  const testimonialId = String(formData.get("testimonialId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");
  const rating = Number(formData.get("rating") ?? 5);
  const payload = {
    courseId: courseId || null,
    bundleId: bundleId || null,
    name: String(formData.get("name") ?? "") || null,
    quote: String(formData.get("quote") ?? ""),
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 5,
    position: Number(formData.get("position") ?? 1),
    isApproved: Boolean(formData.get("isApproved")),
  };

  try {
    if (testimonialId) {
      await prisma.testimonial.update({
        where: { id: testimonialId },
        data: payload,
      });
    } else {
      await prisma.testimonial.create({
        data: payload,
      });
    }
  } catch {
    if (courseId) {
      redirect(`/admin/courses/${courseId}?error=reviews`);
    }
    if (bundleId) {
      redirect(`/admin/bundles/${bundleId}?error=reviews`);
    }
  }

  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}?saved=reviews`);
  }
  if (bundleId) {
    revalidatePath(`/admin/bundles/${bundleId}`);
    redirect(`/admin/bundles/${bundleId}?saved=reviews`);
  }
}

export async function deleteTestimonialAction(formData: FormData) {
  const testimonialId = String(formData.get("testimonialId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");

  try {
    await prisma.testimonial.delete({
      where: { id: testimonialId },
    });
  } catch {
    if (courseId) {
      redirect(`/admin/courses/${courseId}?error=reviews`);
    }
    if (bundleId) {
      redirect(`/admin/bundles/${bundleId}?error=reviews`);
    }
  }

  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}?saved=reviews`);
  }
  if (bundleId) {
    revalidatePath(`/admin/bundles/${bundleId}`);
    redirect(`/admin/bundles/${bundleId}?saved=reviews`);
  }
}

export async function regeneratePageAction(formData: FormData) {
  const courseId = String(formData.get("courseId"));
  try {
    await regenerateCoursePage(courseId, true);
  } catch {
    redirect(`/admin/courses/${courseId}?error=page`);
  }
  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}?saved=page`);
}

export async function deleteCourseAction(formData: FormData) {
  const courseId = String(formData.get("courseId"));

  try {
    await prisma.course.delete({
      where: { id: courseId },
    });
  } catch {
    redirect(`/admin/courses/${courseId}?error=delete`);
  }

  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

export async function saveBundleCoursesAction(formData: FormData) {
  const bundleId = String(formData.get("bundleId") ?? "");
  const courseIds = formData
    .getAll("courseIds")
    .map((value) => String(value))
    .filter(Boolean);

  try {
    await prisma.bundleCourse.deleteMany({
      where: { bundleId },
    });

    if (courseIds.length > 0) {
      await prisma.bundleCourse.createMany({
        data: courseIds.map((courseId, index) => ({
          bundleId,
          courseId,
          position: index + 1,
        })),
      });
    }

    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        status: true,
      },
    });

    if (bundle) {
      await syncAccessProduct({
        bundleId: bundle.id,
        slug: bundle.slug,
        title: `${bundle.title} access`,
        status: bundle.status,
        description: bundle.shortDescription,
        grantedCourseIds: courseIds,
      });
    }
  } catch {
    redirect(`/admin/bundles/${bundleId}?error=courses`);
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/bundles/${bundleId}`);
  redirect(`/admin/bundles/${bundleId}?saved=courses`);
}

export async function deleteBundleAction(formData: FormData) {
  const bundleId = String(formData.get("bundleId") ?? "");

  try {
    await prisma.bundle.delete({
      where: { id: bundleId },
    });
  } catch {
    redirect(`/admin/bundles/${bundleId}?error=delete`);
  }

  revalidatePath("/admin/bundles");
  redirect("/admin/bundles");
}

export async function deleteInstructorAction(formData: FormData) {
  const instructorId = String(formData.get("instructorId"));
  const courseCount = await prisma.course.count({
    where: { instructorId },
  });

  if (courseCount > 0) {
    redirect(`/admin/instructors/${instructorId}?error=delete`);
  }

  try {
    await prisma.instructor.delete({
      where: { id: instructorId },
    });
  } catch {
    redirect(`/admin/instructors/${instructorId}?error=delete`);
  }

  revalidatePath("/admin/instructors");
  redirect("/admin/instructors");
}

export async function deleteModuleAction(formData: FormData) {
  const courseId = String(formData.get("courseId"));
  const moduleId = String(formData.get("moduleId"));

  try {
    await prisma.module.delete({
      where: { id: moduleId },
    });
  } catch {
    redirect(`/admin/courses/${courseId}?error=curriculum`);
  }

  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}?saved=curriculum`);
}

export async function deleteLessonAction(formData: FormData) {
  const courseId = String(formData.get("courseId"));
  const lessonId = String(formData.get("lessonId"));

  try {
    await prisma.lesson.delete({
      where: { id: lessonId },
    });
  } catch {
    redirect(`/admin/courses/${courseId}?error=curriculum`);
  }

  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}?saved=curriculum`);
}

export async function createGatewayProfileAction(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const kind = (String(formData.get("kind") ?? "generic_api").trim() || "generic_api") as GatewayKind;
  const provider = slugifyProvider(String(formData.get("provider") ?? displayName));

  if (!displayName || !provider) {
    redirect("/admin/gateways?connection=failed&message=Gateway%20name%20and%20provider%20slug%20are%20required.");
  }

  try {
    const existing = await prisma.gateway.findUnique({
      where: { provider },
    });

    if (existing) {
      redirect(`/admin/gateways?connection=failed&message=${encodeURIComponent("A gateway with this provider slug already exists.")}`);
    }

    const defaults = getGatewayDefaults(kind === "bank_transfer" ? "bank_transfer" : "generic_api");

    let gateway;

    try {
      gateway = await prisma.gateway.create({
        data: {
          provider,
          displayName,
          kind: kind === "bank_transfer" ? "bank_transfer" : "generic_api",
          isNativeAdapter: false,
          checkoutModel: defaults.checkoutModel,
          taxModel: defaults.taxModel,
          settlementBehavior: defaults.settlementBehavior,
          supportsSubscriptions: defaults.capabilities.supportsSubscriptions,
          supportsRefunds: defaults.capabilities.supportsRefunds,
          supportsPaymentPlans: defaults.capabilities.supportsPaymentPlans,
          supportsHostedCheckout: defaults.capabilities.supportsHostedCheckout,
          supportsTaxCalculation: defaults.capabilities.supportsTaxCalculation,
          supportsHostedTaxCollection: defaults.capabilities.supportsHostedTaxCollection,
          taxRequiresExternalConfiguration: defaults.capabilities.taxRequiresExternalConfiguration,
          actsAsMerchantOfRecord: defaults.capabilities.actsAsMerchantOfRecord,
          requiresBillingAddress: defaults.capabilities.requiresBillingAddress,
          requiresShippingAddress: defaults.capabilities.requiresShippingAddress,
          requiresBusinessIdentity: defaults.capabilities.requiresBusinessIdentity,
          mayRequireManualReview: defaults.capabilities.mayRequireManualReview,
          supportsManualConfirmation: defaults.capabilities.supportsManualConfirmation,
          suitableForHighRisk: defaults.capabilities.suitableForHighRisk,
          instructionsMarkdown: defaults.instructionsMarkdown,
        },
      });
    } catch {
      gateway = await prisma.gateway.create({
        data: {
          provider,
          displayName,
          isActive: false,
        },
      });
    }

    revalidatePath("/admin/gateways");
    redirect(`/admin/gateways/${gateway.id}?connection=created`);
  } catch {
    redirect(
      `/admin/gateways?connection=failed&message=${encodeURIComponent(
        "This environment is not ready to create generic or bank-transfer gateway profiles yet. Apply the latest payment migration, then try again.",
      )}`,
    );
  }
}

export async function saveGatewayConfigurationAction(formData: FormData) {
  const gatewayId = String(formData.get("gatewayId") ?? "").trim();

  if (!gatewayId) {
    redirect("/admin/gateways?connection=failed&message=Gateway%20ID%20is%20required.");
  }

  const gateway = await prisma.gateway.findUnique({
    where: { id: gatewayId },
    include: { credentials: true },
  });

  if (!gateway) {
    redirect("/admin/gateways?connection=missing");
  }

  const connector = findPaymentConnector(gateway.provider);
  const isNativeGateway = gateway.kind === "native" && Boolean(connector);
  const displayName = String(formData.get("displayName") ?? gateway.displayName).trim() || gateway.displayName;
  const nextKind = isNativeGateway ? "native" : ((String(formData.get("kind") ?? gateway.kind) || gateway.kind) as GatewayKind);
  const defaults = getGatewayDefaults(nextKind === "bank_transfer" ? "bank_transfer" : "generic_api");

  const checkoutModel = (String(formData.get("checkoutModel") ?? gateway.checkoutModel).trim() || gateway.checkoutModel) as GatewayCheckoutModel;
  const taxModel = (String(formData.get("taxModel") ?? gateway.taxModel).trim() || gateway.taxModel) as GatewayTaxModel;
  const settlementBehavior = (String(formData.get("settlementBehavior") ?? gateway.settlementBehavior).trim() || gateway.settlementBehavior) as GatewaySettlementBehavior;

  const credentialMap = new Map<string, string>();

  if (connector) {
    for (const field of connector.credentialFields) {
      const value = String(formData.get(`credential:${field.key}`) ?? "").trim();

      if (field.required && !value) {
        redirect(`/admin/gateways/${gateway.id}?connection=failed&message=${encodeURIComponent(`${field.label} is required.`)}`);
      }

      if (value) {
        credentialMap.set(field.key, value);
      }
    }
  }

  for (const [key, value] of parseCredentialTextarea(formData.get("genericCredentials"))) {
    credentialMap.set(key, value);
  }

  const credentialEntries = Array.from(credentialMap.entries());
  const shouldReplaceCredentials = !connector && formData.has("genericCredentials");
  const nextCheckoutModel = nextKind === "bank_transfer" ? "manual_instructions" : checkoutModel;
  const nextSettlementBehavior = nextKind === "bank_transfer" ? "manual_confirmation" : settlementBehavior;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.gateway.update({
        where: { id: gateway.id },
        data: {
          displayName,
          description: String(formData.get("description") ?? "").trim() || null,
          kind: isNativeGateway ? "native" : nextKind,
          isNativeAdapter: isNativeGateway,
          checkoutModel: nextCheckoutModel,
          taxModel: nextKind === "bank_transfer" ? defaults.taxModel : taxModel,
          settlementBehavior: nextSettlementBehavior,
          supportsSubscriptions: isNativeGateway ? connector!.capabilities.supportsSubscriptions : parseBooleanField(formData, "supportsSubscriptions"),
          supportsRefunds: isNativeGateway ? connector!.capabilities.supportsRefunds : parseBooleanField(formData, "supportsRefunds"),
          supportsPaymentPlans: isNativeGateway ? connector!.capabilities.supportsPaymentPlans : parseBooleanField(formData, "supportsPaymentPlans"),
          supportsHostedCheckout: isNativeGateway ? connector!.capabilities.supportsHostedCheckout : nextKind === "bank_transfer" ? false : parseBooleanField(formData, "supportsHostedCheckout"),
          supportsTaxCalculation: isNativeGateway ? connector!.capabilities.supportsTaxCalculation : parseBooleanField(formData, "supportsTaxCalculation"),
          supportsHostedTaxCollection: isNativeGateway ? connector!.capabilities.supportsHostedTaxCollection : parseBooleanField(formData, "supportsHostedTaxCollection"),
          taxRequiresExternalConfiguration: isNativeGateway ? connector!.capabilities.taxRequiresExternalConfiguration : parseBooleanField(formData, "taxRequiresExternalConfiguration"),
          actsAsMerchantOfRecord: isNativeGateway ? connector!.capabilities.actsAsMerchantOfRecord : parseBooleanField(formData, "actsAsMerchantOfRecord"),
          requiresBillingAddress: isNativeGateway ? connector!.capabilities.requiresBillingAddress : parseBooleanField(formData, "requiresBillingAddress"),
          requiresShippingAddress: isNativeGateway ? connector!.capabilities.requiresShippingAddress : parseBooleanField(formData, "requiresShippingAddress"),
          requiresBusinessIdentity: isNativeGateway ? connector!.capabilities.requiresBusinessIdentity : parseBooleanField(formData, "requiresBusinessIdentity"),
          mayRequireManualReview: isNativeGateway ? connector!.capabilities.mayRequireManualReview : nextKind === "bank_transfer" ? true : parseBooleanField(formData, "mayRequireManualReview"),
          supportsManualConfirmation: isNativeGateway ? connector!.capabilities.supportsManualConfirmation : nextKind === "bank_transfer" ? true : parseBooleanField(formData, "supportsManualConfirmation"),
          suitableForHighRisk: isNativeGateway ? connector!.capabilities.suitableForHighRisk : nextKind === "bank_transfer" ? true : parseBooleanField(formData, "suitableForHighRisk"),
          checkoutUrlTemplate:
            nextKind === "bank_transfer" ? null : String(formData.get("checkoutUrlTemplate") ?? "").trim() || null,
          instructionsMarkdown:
            String(formData.get("instructionsMarkdown") ?? "").trim() || (nextKind === "bank_transfer" ? defaults.instructionsMarkdown ?? null : null),
          webhookInstructions: String(formData.get("webhookInstructions") ?? "").trim() || null,
        },
      });

      if (shouldReplaceCredentials) {
        await tx.gatewayCredential.deleteMany({
          where: {
            gatewayId: gateway.id,
            key: {
              notIn: credentialEntries.map(([key]) => key),
            },
          },
        });
      }

      for (const [key, value] of credentialEntries) {
        await tx.gatewayCredential.upsert({
          where: {
            gatewayId_key: {
              gatewayId: gateway.id,
              key,
            },
          },
          update: { valueEncrypted: encryptGatewayCredentialValue(value) },
          create: {
            gatewayId: gateway.id,
            key,
            valueEncrypted: encryptGatewayCredentialValue(value),
          },
        });
      }
    });
  } catch {
    redirect(`/admin/gateways/${gateway.id}?connection=failed&message=Gateway%20configuration%20could%20not%20be%20saved.`);
  }

  revalidatePath("/admin/gateways");
  revalidatePath(`/admin/gateways/${gateway.id}`);
  redirect(`/admin/gateways/${gateway.id}?connection=saved`);
}

export async function saveGatewayCredentialsAction(formData: FormData) {
  return saveGatewayConfigurationAction(formData);
}

export async function testGatewayConnectionAction(formData: FormData) {
  const gatewayId = String(formData.get("gatewayId") ?? "");
  const gateway = await prisma.gateway.findUnique({
    where: { id: gatewayId },
    include: { credentials: true },
  });

  if (!gateway) {
    redirect("/admin/gateways?connection=missing");
  }

  const connector = findPaymentConnector(gateway.provider);

  if (!connector) {
    redirect(`/admin/gateways/${gateway.id}?connection=failed&message=${encodeURIComponent("This gateway uses manual or custom configuration. Automatic connection testing is not available yet.")}`);
  }

  try {
    const credentials = getGatewayCredentialMap(gateway.credentials);

    await connector.testConnection({
      credentials,
    });

    for (const credential of gateway.credentials) {
      if (!isEncryptedGatewayCredentialValue(credential.valueEncrypted)) {
        await prisma.gatewayCredential.update({
          where: { id: credential.id },
          data: {
            valueEncrypted: encryptGatewayCredentialValue(credential.valueEncrypted),
          },
        });
      }
    }

    redirect(`/admin/gateways/${gateway.id}?connection=ok`);
  } catch (error) {
    const message = error instanceof Error ? encodeURIComponent(error.message) : "Connection failed";
    redirect(`/admin/gateways/${gateway.id}?connection=failed&message=${message}`);
  }
}

export async function confirmManualPaymentAction(formData: FormData) {
  const paymentId = String(formData.get("paymentId") ?? "").trim();

  if (!paymentId) {
    redirect("/admin/orders?error=payment");
  }

  try {
    await confirmManualPayment(paymentId);
  } catch {
    redirect("/admin/orders?error=payment");
  }

  revalidatePath("/admin/orders");
  redirect("/admin/orders?saved=payment");
}

export async function failManualPaymentAction(formData: FormData) {
  const paymentId = String(formData.get("paymentId") ?? "").trim();

  if (!paymentId) {
    redirect("/admin/orders?error=payment");
  }

  try {
    await failManualPayment(paymentId);
  } catch {
    redirect("/admin/orders?error=payment");
  }

  revalidatePath("/admin/orders");
  redirect("/admin/orders?saved=payment");
}

export async function setGatewayActiveStateAction(formData: FormData) {
  const gatewayId = String(formData.get("gatewayId") ?? "").trim();
  const makeActive = String(formData.get("makeActive") ?? "false") === "true";

  if (!gatewayId) {
    redirect("/admin/gateways?connection=failed&message=Gateway%20ID%20is%20required.");
  }

  const gateway = await prisma.gateway.findUnique({
    where: { id: gatewayId },
    include: { credentials: true, webhookEvents: true },
  });

  if (!gateway) {
    redirect("/admin/gateways?connection=failed&message=Gateway%20not%20found.");
  }

  if (makeActive) {
    const connector = findPaymentConnector(gateway.provider);
    const definition = resolveGatewayDefinition(gateway, connector);
    const readiness = evaluateGatewayOperationalReadiness({
      gateway: { ...gateway, schemaCompatMode: "current" },
      definition,
      connector,
      credentials: getGatewayCredentialMap(gateway.credentials),
    });
    const blockingIssues = readiness.issues.filter((issue) => issue.tone === "danger");

    if (blockingIssues.length > 0) {
      redirect(
        `/admin/gateways/${gateway.id}?connection=failed&message=${encodeURIComponent(
          `Gateway cannot be activated yet. ${blockingIssues.map((issue) => `${issue.label}: ${issue.detail}`).join(" ")}`,
        )}`,
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    if (makeActive) {
      await tx.gateway.updateMany({
        where: {
          id: {
            not: gateway.id,
          },
        },
        data: {
          isActive: false,
        },
      });
    }

    await tx.gateway.update({
      where: { id: gateway.id },
      data: {
        isActive: makeActive,
      },
    });
  });

  revalidatePath("/admin/gateways");
  revalidatePath(`/admin/gateways/${gateway.id}`);
  redirect(`/admin/gateways?connection=${makeActive ? "saved" : "deactivated"}`);
}

export async function setCourseStatusAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? formData.get("id") ?? "");
  const status = String(formData.get("status") ?? CourseStatus.DRAFT) as CourseStatus;

  try {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: { status },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        status: true,
        price: true,
        currency: true,
        compareAtPrice: true,
      },
    });

    await syncProductOffer({
      courseId: course.id,
      title: course.title,
      price: course.price.toString(),
      currency: course.currency,
      compareAtPrice: course.compareAtPrice?.toString() ?? null,
      status: course.status,
    });

    await syncAccessProduct({
      courseId: course.id,
      slug: course.slug,
      title: `${course.title} access`,
      status: course.status,
      description: course.shortDescription,
      grantedCourseIds: [course.id],
    });
  } catch {
    redirect(`/admin/courses/${courseId}?error=status`);
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin/products");
  redirect(`/admin/courses/${courseId}?saved=status`);
}
