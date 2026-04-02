import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export const dynamic = "force-dynamic";

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

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
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
