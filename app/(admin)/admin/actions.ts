"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { createCourse } from "@/lib/courses/create-course";
import { updateCourse } from "@/lib/courses/update-course";
import { createBundle } from "@/lib/bundles/create-bundle";
import { updateBundle } from "@/lib/bundles/update-bundle";
import { regenerateCoursePage } from "@/lib/sales-pages/regenerate-course-page";
import { upsertInstructor } from "@/lib/instructors/upsert-instructor";
import { upsertOffer } from "@/lib/offers/upsert-offer";
import { bundleInputSchema, moduleInputSchema, lessonInputSchema } from "@/lib/zod/schemas";
import { getPaymentConnector } from "@/lib/payments/adapter-registry";
import { encryptGatewayCredentialValue, isEncryptedGatewayCredentialValue } from "@/lib/payments/gateway-credentials";
import { getGatewayCredentialMap } from "@/lib/payments/gateway-credential-map";
import { defaultHomepageSections, parseLinkLines, parseLines, type HomepageSectionPayloadMap } from "@/lib/homepage/sections";
import { CourseStatus, type HomepageSectionType } from "@prisma/client";

function toArray(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toStructuredArray(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSalesPageConfig(formData: FormData) {
  return {
    heroMetadataLine: String(formData.get("salesPage.heroMetadataLine") ?? ""),
    primaryCtaLabel: String(formData.get("salesPage.primaryCtaLabel") ?? ""),
    secondaryCtaLabel: String(formData.get("salesPage.secondaryCtaLabel") ?? ""),
    sectionOrder: toStructuredArray(formData.get("salesPage.sectionOrder")),
    hiddenSections: toStructuredArray(formData.get("salesPage.hiddenSections")),
    pricingBadge: String(formData.get("salesPage.pricingBadge") ?? ""),
    pricingHeadline: String(formData.get("salesPage.pricingHeadline") ?? ""),
    pricingBody: String(formData.get("salesPage.pricingBody") ?? ""),
    finalCtaLabel: String(formData.get("salesPage.finalCtaLabel") ?? ""),
    finalCtaBody: String(formData.get("salesPage.finalCtaBody") ?? ""),
  };
}

function getDefaultHomepagePayload(type: HomepageSectionType) {
  return defaultHomepageSections().find((section) => section.type === type)!.payload;
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
      items: [0, 1, 2]
        .map((index) => ({
          eyebrow: String(formData.get(`itemEyebrow:${index}`) ?? ""),
          title: String(formData.get(`itemTitle:${index}`) ?? ""),
          description: String(formData.get(`itemDescription:${index}`) ?? ""),
          tone: String(formData.get(`itemTone:${index}`) ?? "arcane") as "arcane" | "discipline" | "gateway",
          courseSlugs: parseLines(String(formData.get(`itemCourseSlugs:${index}`) ?? "")),
        }))
        .filter((item) => item.title),
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
    };
  } else {
    payload = getDefaultHomepagePayload(type);
  }

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

  revalidatePath("/");
  revalidatePath("/admin/settings");
}

export async function saveCourseAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
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
    legacyCourseId: String(formData.get("legacyCourseId") ?? ""),
    legacySlug: String(formData.get("legacySlug") ?? ""),
    legacyUrl: String(formData.get("legacyUrl") ?? ""),
  };

  const course = id ? await updateCourse(id, payload) : await createCourse(payload);
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${course.id}`);
  redirect(`/admin/courses/${course.id}`);
}

export async function saveBundleAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const payload = bundleInputSchema.parse({
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
    legacyUrl: String(formData.get("legacyUrl") ?? ""),
  });

  const bundle = id ? await updateBundle(id, payload) : await createBundle(payload);
  revalidatePath("/admin/bundles");
  revalidatePath(`/admin/bundles/${bundle.id}`);
  redirect(`/admin/bundles/${bundle.id}`);
}

export async function addModuleAction(formData: FormData) {
  const courseId = String(formData.get("courseId"));
  const moduleId = String(formData.get("moduleId") ?? "");
  const data = moduleInputSchema.parse({
    title: formData.get("title"),
    position: formData.get("position"),
  });

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

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function addLessonAction(formData: FormData) {
  const courseId = String(formData.get("courseId"));
  const moduleId = String(formData.get("moduleId"));
  const lessonId = String(formData.get("lessonId") ?? "");
  const data = lessonInputSchema.parse({
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

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function saveInstructorAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const instructor = await upsertInstructor(
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

  revalidatePath("/admin/instructors");
  redirect(`/admin/instructors/${instructor.id}`);
}

export async function saveOfferAction(formData: FormData) {
  const offerId = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");
  await upsertOffer({
    courseId: courseId || undefined,
    bundleId: bundleId || undefined,
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? "ONE_TIME"),
    price: Number(formData.get("price") ?? 0),
    currency: String(formData.get("currency") ?? "USD"),
    compareAtPrice: formData.get("compareAtPrice") ? Number(formData.get("compareAtPrice")) : undefined,
    isPublished: Boolean(formData.get("isPublished")),
    checkoutPath: String(formData.get("checkoutPath") ?? ""),
  }, offerId || undefined);

  revalidatePath("/admin/offers");
  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}`);
  }
  if (bundleId) {
    revalidatePath(`/admin/bundles/${bundleId}`);
    redirect(`/admin/bundles/${bundleId}`);
  }
}

export async function deleteOfferAction(formData: FormData) {
  const offerId = String(formData.get("offerId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");

  await prisma.offer.delete({
    where: { id: offerId },
  });

  revalidatePath("/admin/offers");
  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}`);
  }
  if (bundleId) {
    revalidatePath(`/admin/bundles/${bundleId}`);
    redirect(`/admin/bundles/${bundleId}`);
  }
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

  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`);
  }
  if (bundleId) {
    revalidatePath(`/admin/bundles/${bundleId}`);
  }
}

export async function deleteFaqAction(formData: FormData) {
  const faqId = String(formData.get("faqId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");

  await prisma.fAQ.delete({
    where: { id: faqId },
  });

  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`);
  }
  if (bundleId) {
    revalidatePath(`/admin/bundles/${bundleId}`);
  }
}

export async function saveTestimonialAction(formData: FormData) {
  const testimonialId = String(formData.get("testimonialId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");
  const payload = {
    courseId: courseId || null,
    bundleId: bundleId || null,
    name: String(formData.get("name") ?? "") || null,
    quote: String(formData.get("quote") ?? ""),
    position: Number(formData.get("position") ?? 1),
    isApproved: Boolean(formData.get("isApproved")),
  };

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

  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`);
  }
  if (bundleId) {
    revalidatePath(`/admin/bundles/${bundleId}`);
  }
}

export async function deleteTestimonialAction(formData: FormData) {
  const testimonialId = String(formData.get("testimonialId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");

  await prisma.testimonial.delete({
    where: { id: testimonialId },
  });

  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`);
  }
  if (bundleId) {
    revalidatePath(`/admin/bundles/${bundleId}`);
  }
}

export async function regeneratePageAction(formData: FormData) {
  const courseId = String(formData.get("courseId"));
  await regenerateCoursePage(courseId, true);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteCourseAction(formData: FormData) {
  const courseId = String(formData.get("courseId"));

  await prisma.course.delete({
    where: { id: courseId },
  });

  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

export async function saveBundleCoursesAction(formData: FormData) {
  const bundleId = String(formData.get("bundleId") ?? "");
  const courseIds = formData
    .getAll("courseIds")
    .map((value) => String(value))
    .filter(Boolean);

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

  revalidatePath(`/admin/bundles/${bundleId}`);
}

export async function deleteBundleAction(formData: FormData) {
  const bundleId = String(formData.get("bundleId") ?? "");

  await prisma.bundle.delete({
    where: { id: bundleId },
  });

  revalidatePath("/admin/bundles");
  redirect("/admin/bundles");
}

export async function deleteInstructorAction(formData: FormData) {
  const instructorId = String(formData.get("instructorId"));
  const courseCount = await prisma.course.count({
    where: { instructorId },
  });

  if (courseCount > 0) {
    throw new Error("Cannot delete an instructor with linked courses.");
  }

  await prisma.instructor.delete({
    where: { id: instructorId },
  });

  revalidatePath("/admin/instructors");
  redirect("/admin/instructors");
}

export async function deleteModuleAction(formData: FormData) {
  const courseId = String(formData.get("courseId"));
  const moduleId = String(formData.get("moduleId"));

  await prisma.module.delete({
    where: { id: moduleId },
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteLessonAction(formData: FormData) {
  const courseId = String(formData.get("courseId"));
  const lessonId = String(formData.get("lessonId"));

  await prisma.lesson.delete({
    where: { id: lessonId },
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function saveGatewayCredentialsAction(formData: FormData) {
  const provider = String(formData.get("provider") ?? "").trim();

  if (!provider) {
    throw new Error("Provider is required");
  }

  const connector = getPaymentConnector(provider);
  const credentialEntries = connector.credentialFields.map((field) => {
    const value = String(formData.get(`credential:${field.key}`) ?? "").trim();

    if (field.required && !value) {
      throw new Error(`${field.label} is required`);
    }

    return [field.key, value] as const;
  });

  const existingGateway = await prisma.gateway.findUnique({
    where: { provider },
  });

  const gateway = await prisma.gateway.upsert({
    where: { provider },
    update: { isActive: true },
    create: {
      provider,
      displayName: existingGateway?.displayName ?? connector.displayName,
      isActive: true,
    },
  });

  await prisma.$transaction([
    prisma.gateway.updateMany({
      where: {
        id: {
          not: gateway.id,
        },
      },
      data: {
        isActive: false,
      },
    }),
    prisma.gateway.update({
      where: { id: gateway.id },
      data: { isActive: true },
    }),
    ...credentialEntries.map(([key, value]) =>
      prisma.gatewayCredential.upsert({
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
      }),
    ),
  ]);

  revalidatePath("/admin/gateways");
  redirect(`/admin/gateways/${gateway.id}`);
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

  try {
    const connector = getPaymentConnector(gateway.provider);
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

export async function setCourseStatusAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? formData.get("id") ?? "");
  const status = String(formData.get("status") ?? CourseStatus.DRAFT) as CourseStatus;

  await prisma.course.update({
    where: { id: courseId },
    data: { status },
  });

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
}
