import { CourseStatus, ImportType, LessonStatus, LessonType, OfferType, UpsellDiscountType } from "@prisma/client";
import { z } from "zod";
import type { SalesPageSectionKey } from "@/types";

function normalizeIframeSrc(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const iframeSrcMatch = trimmed.match(/(?:src|data-src)=["']([^"']+)["']/i);
  const extracted = iframeSrcMatch?.[1]?.trim() || trimmed;
  const decoded = extracted
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .trim();

  if (decoded.startsWith("//")) {
    return `https:${decoded}`;
  }

  if (/^www\./i.test(decoded)) {
    return `https://${decoded}`;
  }

  return decoded;
}

const optionalUrl = z.preprocess(normalizeIframeSrc, z.string().url().optional().or(z.literal("")));
const optionalDateString = z.string().optional().or(z.literal(""));
const blankToUndefined = (value: unknown) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
};
const moneyToNumber = (value: unknown) => {
  const normalized = blankToUndefined(value);

  if (typeof normalized !== "string") {
    return normalized;
  }

  const cleaned = normalized.trim().replace(/,/g, "");
  if (!cleaned) {
    return undefined;
  }

  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : normalized;
};
const optionalPositiveCsvInt = z.preprocess(blankToUndefined, z.coerce.number().int().min(1).optional());
const optionalCsvRating = z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(5).optional());
const csvMoney = z.preprocess(moneyToNumber, z.coerce.number().min(0).default(0));
const optionalCsvMoney = z.preprocess(moneyToNumber, z.coerce.number().min(0).optional());
const csvCurrency = z.preprocess((value) => {
  const normalized = blankToUndefined(value);
  if (typeof normalized === "string") {
    return normalized.trim().toUpperCase();
  }

  return normalized;
}, z.string().length(3).default("USD"));
const csvBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n", ""].includes(normalized)) return false;
  }

  return value;
}, z.boolean());
const csvCourseStatus = z.preprocess((value) => (typeof value === "string" ? value.trim().toUpperCase() : value), z.nativeEnum(CourseStatus));
const csvLessonStatus = z.preprocess((value) => (typeof value === "string" ? value.trim().toUpperCase() : value), z.nativeEnum(LessonStatus));
const csvOfferType = z.preprocess((value) => (typeof value === "string" ? value.trim().toUpperCase().replace(/[\s-]+/g, "_") : value), z.nativeEnum(OfferType));
const csvLessonType = z.preprocess((value) => (typeof value === "string" ? value.trim().toUpperCase().replace(/[\s-]+/g, "_") : value), z.nativeEnum(LessonType));
const csvPackageLessonType = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");

  if (!normalized) {
    return undefined;
  }

  if (["LESSON", "CHALLENGE", "CONTACT", "REVIEW", "COMMUNITY"].includes(normalized)) {
    return LessonType.VIDEO;
  }

  return normalized;
}, z.nativeEnum(LessonType).optional());
const optionalCsvLessonStatus = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toUpperCase();
  return normalized || undefined;
}, z.nativeEnum(LessonStatus).optional());
const salesPageSectionKeySchema = z.enum([
  "description",
  "gallery",
  "highlights",
  "curriculum",
  "included-courses",
  "instructor",
  "testimonials",
  "faqs",
  "pricing",
] satisfies [SalesPageSectionKey, ...SalesPageSectionKey[]]);

export const salesPageConfigSchema = z.object({
  heroMetadataLine: z.string().optional(),
  primaryCtaLabel: z.string().optional(),
  secondaryCtaLabel: z.string().optional(),
  sectionOrder: z.array(salesPageSectionKeySchema).default([]),
  hiddenSections: z.array(salesPageSectionKeySchema).default([]),
  galleryImageUrls: z.array(z.string().url()).default([]),
  galleryHidden: z.boolean().optional(),
  galleryEyebrow: z.string().optional(),
  galleryTitle: z.string().optional(),
  pricingBadge: z.string().optional(),
  pricingHeadline: z.string().optional(),
  pricingBody: z.string().optional(),
  finalCtaLabel: z.string().optional(),
  finalCtaBody: z.string().optional(),
  thankYouEyebrow: z.string().optional(),
  thankYouHeadline: z.string().optional(),
  thankYouBody: z.string().optional(),
  thankYouSignedInLabel: z.string().optional(),
  thankYouSignedOutLabel: z.string().optional(),
});

export const instructorInputSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  imageUrl: optionalUrl,
  shortBio: z.string().optional(),
  longBio: z.string().optional(),
  websiteUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  instagramUrl: optionalUrl,
  xUrl: optionalUrl,
  facebookUrl: optionalUrl,
  discordUrl: optionalUrl,
  telegramUrl: optionalUrl,
  links: z.array(z.object({
    label: z.string().min(1),
    url: z.string().url(),
  })).default([]),
});

export const courseInputSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  learningOutcomes: z.array(z.string()).default([]),
  whoItsFor: z.array(z.string()).default([]),
  includes: z.array(z.string()).default([]),
  heroImageUrl: optionalUrl,
  salesVideoUrl: optionalUrl,
  salesPageConfig: salesPageConfigSchema.optional(),
  instructorId: z.string().min(1),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
  price: z.coerce.number().min(0).default(0),
  currency: z.string().min(3).max(3).default("USD"),
  compareAtPrice: z.coerce.number().min(0).optional(),
  upsellCourseId: z.string().nullable().optional(),
  upsellBundleId: z.string().nullable().optional(),
  upsellDiscountType: z.nativeEnum(UpsellDiscountType).default(UpsellDiscountType.NONE),
  upsellDiscountValue: z.coerce.number().min(0.01).optional(),
  upsellHeadline: z.string().optional(),
  upsellBody: z.string().optional(),
  legacyCourseId: z.string().optional(),
  legacySlug: z.string().optional(),
  legacyUrl: z.string().optional(),
});

export const bundleInputSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  learningOutcomes: z.array(z.string()).default([]),
  whoItsFor: z.array(z.string()).default([]),
  includes: z.array(z.string()).default([]),
  heroImageUrl: optionalUrl,
  salesVideoUrl: optionalUrl,
  salesPageConfig: salesPageConfigSchema.optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
  price: z.coerce.number().min(0).default(0),
  currency: z.string().min(3).max(3).default("USD"),
  compareAtPrice: z.coerce.number().min(0).optional(),
  upsellCourseId: z.string().nullable().optional(),
  upsellBundleId: z.string().nullable().optional(),
  upsellDiscountType: z.nativeEnum(UpsellDiscountType).default(UpsellDiscountType.NONE),
  upsellDiscountValue: z.coerce.number().min(0.01).optional(),
  upsellHeadline: z.string().optional(),
  upsellBody: z.string().optional(),
  legacyUrl: z.string().optional(),
});

export const moduleInputSchema = z.object({
  title: z.string().min(1),
  position: z.coerce.number().int().min(1),
});

export const lessonInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  position: z.coerce.number().int().min(1),
  type: z.nativeEnum(LessonType),
  status: z.nativeEnum(LessonStatus).default(LessonStatus.DRAFT),
  content: z.string().optional(),
  videoUrl: optionalUrl,
  downloadUrl: optionalUrl,
  isPreview: csvBoolean.default(false),
  dripDays: z.coerce.number().int().min(0).optional(),
  durationLabel: z.string().optional(),
});

export const offerInputSchema = z.object({
  courseId: z.string().optional(),
  bundleId: z.string().optional(),
  name: z.string().min(1),
  type: z.nativeEnum(OfferType),
  price: z.coerce.number().min(0),
  currency: z.string().min(3).max(3),
  compareAtPrice: z.coerce.number().min(0).optional(),
  isPublished: csvBoolean.default(false),
  isDefault: csvBoolean.default(false),
  checkoutPath: z.string().optional(),
  billingInterval: z.enum(["month", "year"]).optional(),
});

export const checkoutSessionSchema = z.object({
  offerId: z.string().min(1),
  couponCode: z.string().optional(),
  upsellFromOfferId: z.string().optional(),
});

export const gatewayConnectionSchema = z.object({
  provider: z.string().min(1),
  apiKey: z.string().min(1),
  webhookSecret: z.string().min(1),
});

export const courseCsvRowSchema = z.object({
  legacy_course_id: z.string().optional(),
  slug: z.string().min(1),
  legacy_url: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  short_description: z.string().optional(),
  long_description: z.string().optional(),
  learning_outcomes: z.string().optional(),
  who_its_for: z.string().optional(),
  includes: z.string().optional(),
  hero_image_url: optionalUrl,
  sales_video_url: optionalUrl,
  sales_image_urls: z.string().optional(),
  instructor_slug: z.string().min(1),
  instructor_name: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  status: csvCourseStatus.default(CourseStatus.DRAFT),
  price: csvMoney,
  price_text: z.string().optional(),
  offer_options: z.string().optional(),
  currency: csvCurrency,
  compare_at_price: optionalCsvMoney,
});

export const instructorCsvRowSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  image_url: optionalUrl,
  short_bio: z.string().optional(),
  long_bio: z.string().optional(),
  website_url: optionalUrl,
  youtube_url: optionalUrl,
  instagram_url: optionalUrl,
  x_url: optionalUrl,
  facebook_url: optionalUrl,
  discord_url: optionalUrl,
  telegram_url: optionalUrl,
});

export const lessonCsvRowSchema = z.object({
  legacy_course_id: z.string().min(1),
  module_position: z.coerce.number().int().min(1),
  module_title: z.string().min(1),
  lesson_position: z.coerce.number().int().min(1),
  lesson_slug: z.string().min(1),
  lesson_title: z.string().min(1),
  lesson_type: csvLessonType,
  lesson_content: z.string().optional(),
  video_url: optionalUrl,
  download_url: optionalUrl,
  is_preview: csvBoolean,
  drip_days: z.coerce.number().int().min(0).optional(),
  duration_label: z.string().optional(),
  status: csvLessonStatus.default(LessonStatus.DRAFT),
});

export const offerCsvRowSchema = z.object({
  legacy_course_id: z.string().min(1),
  offer_name: z.string().min(1),
  price: z.coerce.number().min(0),
  type: csvOfferType,
  currency: z.string().min(3).max(3),
});

export const coursePackageCsvRowSchema = z.object({
  legacy_course_id: z.string().optional(),
  slug: z.string().min(1),
  legacy_slug: z.string().optional(),
  legacy_url: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  short_description: z.string().optional(),
  long_description: z.string().optional(),
  learning_outcomes: z.string().optional(),
  who_its_for: z.string().optional(),
  includes: z.string().optional(),
  hero_image_url: optionalUrl,
  sales_video_url: optionalUrl,
  sales_image_urls: z.string().optional(),
  instructor_slug: z.string().min(1),
  instructor_name: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  status: csvCourseStatus.default(CourseStatus.DRAFT),
  price: csvMoney,
  price_text: z.string().optional(),
  offer_options: z.string().optional(),
  currency: csvCurrency,
  compare_at_price: optionalCsvMoney,
  testimonial_name: z.string().optional(),
  testimonial_email: z.string().email().optional().or(z.literal("")),
  testimonial_quote: z.string().optional(),
  testimonial_rating: optionalCsvRating,
  testimonial_position: optionalPositiveCsvInt,
  module_position: optionalPositiveCsvInt,
  module_title: z.string().optional(),
  lesson_position: optionalPositiveCsvInt,
  lesson_slug: z.string().optional(),
  lesson_title: z.string().optional(),
  lesson_type: csvPackageLessonType,
  lesson_content: z.string().optional(),
  video_url: optionalUrl,
  download_url: optionalUrl,
  is_preview: csvBoolean.default(false),
  drip_days: z.coerce.number().int().min(0).optional(),
  duration_label: z.string().optional(),
  lesson_status: optionalCsvLessonStatus.default(LessonStatus.DRAFT),
});

export const courseStudentCsvRowSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  enrolled_at: optionalDateString,
});

export const importRequestSchema = z.object({
  type: z.nativeEnum(ImportType),
  dryRun: csvBoolean.default(true),
});
