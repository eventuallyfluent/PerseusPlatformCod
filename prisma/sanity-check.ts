import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [instructor, course, offer, bundle, bundleOffer] = await Promise.all([
    prisma.instructor.findUnique({
      where: { slug: "peter-example" },
      select: { id: true, slug: true, name: true },
    }),
    prisma.course.findUnique({
      where: { slug: "meta-magick-tarot" },
      select: {
        id: true,
        slug: true,
        title: true,
        publicPath: true,
        instructorId: true,
      },
    }),
    prisma.offer.findFirst({
      where: { name: "Lifetime Access" },
      select: {
        id: true,
        courseId: true,
        currency: true,
        price: true,
      },
    }),
    prisma.bundle.findUnique({
      where: { slug: "ritual-library-bundle" },
      select: {
        id: true,
        slug: true,
        title: true,
        publicPath: true,
      },
    }),
    prisma.offer.findFirst({
      where: { name: "Bundle Access" },
      select: {
        id: true,
        bundleId: true,
        currency: true,
        price: true,
      },
    }),
  ]);

  if (!instructor || !course || !offer || !bundle || !bundleOffer) {
    throw new Error("Milestone 1 sanity check failed: expected seed records were not found.");
  }

  if (course.instructorId !== instructor.id) {
    throw new Error("Milestone 1 sanity check failed: seeded course is not linked to the seeded instructor.");
  }

  if (offer.courseId !== course.id) {
    throw new Error("Milestone 1 sanity check failed: seeded offer is not linked to the seeded course.");
  }

  if (bundleOffer.bundleId !== bundle.id) {
    throw new Error("Bundle sanity check failed: seeded bundle offer is not linked to the seeded bundle.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        instructor,
        course,
        offer: {
          ...offer,
          price: offer.price.toString(),
        },
        bundle,
        bundleOffer: {
          ...bundleOffer,
          price: bundleOffer.price.toString(),
        },
      },
      null,
      2,
    ),
  );
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
