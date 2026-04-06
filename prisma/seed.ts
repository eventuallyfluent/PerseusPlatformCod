import { CourseStatus, LessonStatus, LessonType, OfferType, PrismaClient } from "@prisma/client";
import { encryptGatewayCredentialValue } from "@/lib/payments/gateway-credentials";
import { defaultHomepageSections } from "@/lib/homepage/sections";

const prisma = new PrismaClient();

async function main() {
  const instructor = await prisma.instructor.upsert({
    where: { slug: "peter-example" },
    update: {},
    create: {
      slug: "peter-example",
      name: "Peter Example",
      imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
      shortBio: "Tarot teacher and symbolic systems guide.",
      longBio:
        "Peter Example teaches symbolic reasoning, tarot frameworks, and ritual design with a focus on clarity and practical use.",
      websiteUrl: "https://example.com",
      xUrl: "https://x.com/example",
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: "meta-magick-tarot" },
    update: {},
    create: {
      slug: "meta-magick-tarot",
      title: "Meta Magick Tarot",
      subtitle: "A structured tarot system for modern occult study.",
      shortDescription: "Learn a practical framework for reading tarot with symbolic precision.",
      longDescription:
        "This course walks through core card systems, spreads, interpretation frameworks, and study rituals in a progressive format.",
      learningOutcomes: ["Read tarot with consistent structure", "Build repeatable spread analysis", "Develop symbolic confidence"],
      whoItsFor: ["Beginners who want structure", "Readers refining technique"],
      includes: ["12 lessons", "Reference downloads", "Preview lessons"],
      heroImageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
      salesVideoUrl: "https://streamable.com/e/example",
      status: CourseStatus.PUBLISHED,
      legacyCourseId: "abc123",
      legacyUrl: "/b/OWFpo",
      publicPath: "/b/OWFpo",
      seoTitle: "Meta Magick Tarot Course",
      seoDescription: "A production-ready sample tarot course migrated into Perseus Platform.",
      instructorId: instructor.id,
      faqs: {
        create: [
          {
            question: "Is this beginner friendly?",
            answer: "Yes. The curriculum starts with foundations and then layers interpretation structure.",
            position: 1,
          },
        ],
      },
      testimonials: {
        create: [
          {
            name: "A. Reader",
            quote: "The most structured tarot course I have taken.",
            position: 1,
            isApproved: true,
          },
        ],
      },
      modules: {
        create: [
          {
            title: "Introduction",
            position: 1,
            lessons: {
              create: [
                {
                  slug: "welcome",
                  title: "Welcome",
                  position: 1,
                  status: LessonStatus.PUBLISHED,
                  type: LessonType.VIDEO,
                  content: "Welcome to the course.",
                  videoUrl: "https://streamable.com/e/example",
                  isPreview: true,
                  dripDays: 0,
                  durationLabel: "12 min",
                },
                {
                  slug: "symbols-and-structure",
                  title: "Symbols and Structure",
                  position: 2,
                  status: LessonStatus.PUBLISHED,
                  type: LessonType.TEXT,
                  content: "This lesson covers the symbolic architecture of the deck.",
                  isPreview: false,
                  dripDays: 3,
                  durationLabel: "8 min",
                },
              ],
            },
          },
        ],
      },
      offers: {
        create: [
          {
            name: "Lifetime Access",
            type: OfferType.ONE_TIME,
            price: "149.00",
            currency: "USD",
            isPublished: true,
            checkoutPath: "/checkout/meta-magick-lifetime",
            prices: {
              create: {
                amount: "149.00",
                currency: "USD",
                isDefault: true,
              },
            },
          },
        ],
      },
    },
    include: {
      offers: true,
    },
  });

  const bundle = await prisma.bundle.upsert({
    where: { slug: "ritual-library-bundle" },
    update: {},
    create: {
      slug: "ritual-library-bundle",
      title: "Ritual Library Bundle",
      subtitle: "A single purchase path for the core symbolic study stack.",
      shortDescription: "Unlock the full starter library in one bundle and move through each course at your own pace.",
      longDescription:
        "This bundle combines the foundational symbolic systems material into one clean path, keeping checkout simple while unlocking each included course inside the learner dashboard.",
      learningOutcomes: ["Build a core symbolic study library", "Move through multiple courses with one purchase"],
      whoItsFor: ["Students who want a guided starter library", "Readers who prefer one consolidated purchase"],
      includes: ["Included course access", "Bundle pricing", "Single checkout flow"],
      heroImageUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80",
      salesVideoUrl: "https://streamable.com/e/example",
      status: CourseStatus.PUBLISHED,
      publicPath: "/bundle/ritual-library-bundle",
      seoTitle: "Ritual Library Bundle",
      seoDescription: "A bundle that unlocks multiple Perseus courses through one purchase path.",
      courses: {
        create: [
          {
            courseId: course.id,
            position: 1,
          },
        ],
      },
      faqs: {
        create: [
          {
            question: "Does this unlock all included courses at once?",
            answer: "Yes. Purchasing the bundle creates enrollments for every included course.",
            position: 1,
          },
        ],
      },
      testimonials: {
        create: [
          {
            name: "Bundle Student",
            quote: "The cleanest way to enter the full Perseus study path.",
            position: 1,
            isApproved: true,
          },
        ],
      },
      offers: {
        create: [
          {
            name: "Bundle Access",
            type: OfferType.ONE_TIME,
            price: "199.00",
            currency: "USD",
            isPublished: true,
            checkoutPath: "/checkout/ritual-library-bundle",
            prices: {
              create: {
                amount: "199.00",
                currency: "USD",
                isDefault: true,
              },
            },
          },
        ],
      },
    },
    include: {
      offers: true,
    },
  });

  const gateway = await prisma.gateway.upsert({
    where: { provider: "stripe" },
    update: {},
    create: {
      provider: "stripe",
      displayName: "Stripe",
      isActive: true,
    },
  });

  await prisma.gateway.upsert({
    where: { provider: "paypal" },
    update: {},
    create: {
      provider: "paypal",
      displayName: "PayPal",
      isActive: false,
    },
  });

  await prisma.gateway.upsert({
    where: { provider: "creem" },
    update: {},
    create: {
      provider: "creem",
      displayName: "Creem",
      isActive: false,
    },
  });

  await prisma.generatedPage.upsert({
    where: { path: "/b/OWFpo" },
    update: {},
    create: {
      courseId: course.id,
      pageType: "sales",
      path: "/b/OWFpo",
      templateVersion: "v1",
      generatedPayload: {
        hero: {
          title: course.title,
          subtitle: course.subtitle,
          imageUrl: course.heroImageUrl,
          ctaLabel: "Enroll now",
        },
        video: { salesVideoUrl: course.salesVideoUrl },
        description: {
          shortDescription: course.shortDescription,
          longDescription: course.longDescription,
        },
        outcomes: course.learningOutcomes,
        audience: course.whoItsFor,
        includes: course.includes,
        curriculum: [
          {
            moduleTitle: "Introduction",
            lessons: [
              { title: "Welcome", isPreview: true },
              { title: "Symbols and Structure", isPreview: false },
            ],
          },
        ],
        instructor: {
          name: instructor.name,
          imageUrl: instructor.imageUrl,
          shortBio: instructor.shortBio,
          socialLinks: [{ label: "Website", url: instructor.websiteUrl }],
          pageUrl: `/instructors/${instructor.slug}`,
        },
        testimonials: [{ name: "A. Reader", quote: "The most structured tarot course I have taken." }],
        faqs: [
          {
            question: "Is this beginner friendly?",
            answer: "Yes. The curriculum starts with foundations and then layers interpretation structure.",
          },
        ],
        pricing: [
          {
            offerId: course.offers[0]?.id,
            price: "149.00",
            currency: "USD",
            checkoutUrl: `/checkout/${course.offers[0]?.id}`,
          },
        ],
        finalCta: { label: "Start learning today" },
      },
    },
  });

  await prisma.generatedPage.upsert({
    where: { path: "/bundle/ritual-library-bundle" },
    update: {},
    create: {
      bundleId: bundle.id,
      pageType: "bundle-sales",
      path: "/bundle/ritual-library-bundle",
      templateVersion: "v1",
      generatedPayload: {
        hero: {
          title: bundle.title,
          subtitle: bundle.subtitle,
          imageUrl: bundle.heroImageUrl,
          ctaLabel: "Get the bundle",
        },
        video: { salesVideoUrl: bundle.salesVideoUrl },
        description: {
          shortDescription: bundle.shortDescription,
          longDescription: bundle.longDescription,
        },
        outcomes: bundle.learningOutcomes,
        audience: bundle.whoItsFor,
        includes: bundle.includes,
        includedCourses: [
          {
            title: course.title,
            subtitle: course.subtitle,
            instructorName: instructor.name,
            courseUrl: course.publicPath ?? `/course/${course.slug}`,
          },
        ],
        testimonials: [{ name: "Bundle Student", quote: "The cleanest way to enter the full Perseus study path." }],
        faqs: [
          {
            question: "Does this unlock all included courses at once?",
            answer: "Yes. Purchasing the bundle creates enrollments for every included course.",
          },
        ],
        pricing: [
          {
            offerId: bundle.offers[0]?.id,
            price: "199.00",
            currency: "USD",
            checkoutUrl: `/checkout/${bundle.offers[0]?.id}`,
          },
        ],
        finalCta: { label: "Unlock the full bundle" },
      },
    },
  });

  await prisma.gatewayCredential.upsert({
    where: {
      gatewayId_key: {
        gatewayId: gateway.id,
        key: "publishable_key",
      },
    },
    update: {
      valueEncrypted: encryptGatewayCredentialValue("pk_test_placeholder"),
    },
    create: {
      gatewayId: gateway.id,
      key: "publishable_key",
      valueEncrypted: encryptGatewayCredentialValue("pk_test_placeholder"),
    },
  });

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {
      percentOff: 10,
      isActive: true,
    },
    create: {
      code: "WELCOME10",
      percentOff: 10,
      isActive: true,
    },
  });

  for (const section of defaultHomepageSections()) {
    await prisma.homepageSection.upsert({
      where: { type: section.type },
      update: {
        enabled: section.enabled,
        position: section.position,
        payload: JSON.parse(JSON.stringify(section.payload)),
      },
      create: {
        type: section.type,
        enabled: section.enabled,
        position: section.position,
        payload: JSON.parse(JSON.stringify(section.payload)),
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
