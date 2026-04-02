import { CourseStatus, ImportType, LessonStatus, LessonType, OfferType } from "@prisma/client";
import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

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
  instructorId: z.string().min(1),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
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
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
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
  isPreview: z.coerce.boolean().default(false),
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
  isPublished: z.coerce.boolean().default(false),
  checkoutPath: z.string().optional(),
});

export const checkoutSessionSchema = z.object({
  offerId: z.string().min(1),
  couponCode: z.string().optional(),
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
  instructor_slug: z.string().min(1),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
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
  lesson_type: z.nativeEnum(LessonType),
  lesson_content: z.string().optional(),
  video_url: optionalUrl,
  download_url: optionalUrl,
  is_preview: z.coerce.boolean(),
  drip_days: z.coerce.number().int().min(0).optional(),
  duration_label: z.string().optional(),
  status: z.nativeEnum(LessonStatus).default(LessonStatus.DRAFT),
});

export const offerCsvRowSchema = z.object({
  legacy_course_id: z.string().min(1),
  offer_name: z.string().min(1),
  price: z.coerce.number().min(0),
  type: z.nativeEnum(OfferType),
  currency: z.string().min(3).max(3),
});

export const importRequestSchema = z.object({
  type: z.nativeEnum(ImportType),
  dryRun: z.coerce.boolean().default(true),
});
