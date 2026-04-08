import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await prisma.collection.findUnique({
    where: { slug },
    select: { slug: true },
  });

  if (!collection) {
    notFound();
  }

  redirect(`/courses?collection=${encodeURIComponent(collection.slug)}`);
}
