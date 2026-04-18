import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildFaqStructuredData } from "@/lib/seo/structured-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildMetadata({
  title: "FAQ",
  description: "Common public questions about courses, bundles, access, and the Perseus Arcane Academy platform.",
  path: "/faq",
});

export default async function FaqPage() {
  const faqs = await prisma.fAQ.findMany({
    orderBy: [{ courseId: "asc" }, { bundleId: "asc" }, { position: "asc" }],
    take: 20,
    include: {
      course: {
        select: {
          title: true,
        },
      },
      bundle: {
        select: {
          title: true,
        },
      },
    },
  });

  const faqJsonLd = buildFaqStructuredData({
    faqs: faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <SectionHeading eyebrow="FAQ" title="Platform-wide common questions" />
      <div className="space-y-4">
        {faqs.map((faq) => (
          <Card key={faq.id} className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">{faq.course?.title ?? faq.bundle?.title ?? "Perseus"}</p>
            <h2 className="text-lg font-semibold text-stone-950">{faq.question}</h2>
            <p className="text-sm leading-7 text-stone-600">{faq.answer}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
