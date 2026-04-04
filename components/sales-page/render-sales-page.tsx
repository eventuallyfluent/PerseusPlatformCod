import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StreamableEmbed } from "@/components/ui/streamable-embed";
import type { GeneratedSalesPagePayload } from "@/types";

export function RenderSalesPage({ payload }: { payload: GeneratedSalesPagePayload }) {
  return (
    <div className="space-y-20">
      <section className="relative overflow-hidden px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(143,44,255,0.13),transparent_24%),radial-gradient(circle_at_70%_30%,rgba(212,168,70,0.12),transparent_22%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 rounded-[40px] border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-8 py-10 shadow-[var(--shadow-soft)] lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:px-12 lg:py-12">
          <div className="space-y-7">
            <div className="flex flex-wrap gap-3">
              <Badge variant="accent">Perseus course</Badge>
              <Badge variant="premium">Instant access</Badge>
            </div>
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-[var(--muted)]">Structured curriculum</p>
              <h1 className="max-w-4xl text-6xl leading-[0.9] tracking-[-0.06em] text-[var(--foreground)] sm:text-7xl lg:text-[5.5rem]">
                {payload.hero.title}
              </h1>
              {payload.hero.subtitle ? <p className="max-w-2xl text-xl leading-9 text-[var(--foreground-soft)]">{payload.hero.subtitle}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {payload.pricing.map((price) => (
                <Link key={price.offerId} href={price.checkoutUrl}>
                  <Button className="min-w-[260px]">{payload.hero.ctaLabel} - {price.price} {price.currency}</Button>
                </Link>
              ))}
              <a href="#curriculum">
                <Button variant="secondary" className="min-w-[220px]">
                  View curriculum
                </Button>
              </a>
            </div>
          </div>
          <div className="space-y-5">
            <div
              className="min-h-[520px] rounded-[34px] border border-[rgba(88,97,130,0.12)] bg-cover bg-center"
              style={{
                backgroundImage: payload.hero.imageUrl
                  ? `linear-gradient(180deg, rgba(22, 12, 45, 0.18), rgba(22, 12, 45, 0.46)), url(${payload.hero.imageUrl})`
                  : "linear-gradient(135deg, #1b0c34, #2e175f)",
              }}
            />
            <div className="rounded-[28px] bg-[rgba(24,25,47,0.96)] px-6 py-5 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#b7abd9]">Pricing</p>
                  <p className="mt-2 text-4xl font-semibold">{payload.pricing[0]?.price ?? ""}</p>
                </div>
                <Badge variant="premium">Save now</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <Badge variant="muted">Description</Badge>
          <h2 className="text-5xl leading-none tracking-[-0.05em] text-[var(--foreground)]">What this course opens up.</h2>
          {payload.description.shortDescription ? <p className="max-w-2xl text-xl leading-9 text-[var(--foreground-soft)]">{payload.description.shortDescription}</p> : null}
          {payload.description.longDescription ? <p className="max-w-2xl text-base leading-8 text-[var(--foreground-soft)]">{payload.description.longDescription}</p> : null}
        </div>
        <div className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[var(--shadow-soft)]">
          {payload.video.salesVideoUrl ? <StreamableEmbed url={payload.video.salesVideoUrl} title={`${payload.hero.title} sales video`} /> : <p className="text-sm text-[var(--muted)]">No sales video configured.</p>}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 lg:grid-cols-3">
        <div className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[var(--shadow-soft)]">
          <Badge variant="accent">Outcomes</Badge>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--foreground-soft)]">
            {payload.outcomes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[var(--shadow-soft)]">
          <Badge variant="premium">Who it is for</Badge>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--foreground-soft)]">
            {payload.audience.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[var(--shadow-soft)]">
          <Badge variant="success">Included</Badge>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--foreground-soft)]">
            {payload.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="curriculum" className="mx-auto max-w-7xl space-y-8 px-6">
        <div className="max-w-3xl space-y-4">
          <Badge variant="accent">Curriculum</Badge>
          <h2 className="text-5xl leading-none tracking-[-0.05em] text-[var(--foreground)]">Preview the path before you enter.</h2>
        </div>
        <div className="grid gap-5">
          {payload.curriculum.map((module, index) => (
            <div key={module.moduleTitle} className="grid gap-5 rounded-[34px] border border-[var(--border)] bg-[rgba(21,18,40,0.97)] p-6 text-white shadow-[0_24px_60px_rgba(18,20,41,0.12)] lg:grid-cols-[0.34fr_1fr]">
              <div className="space-y-3">
                <Badge variant="portal">Module {index + 1}</Badge>
                <h3 className="text-3xl leading-none tracking-[-0.03em]">{module.moduleTitle}</h3>
              </div>
              <ul className="grid gap-3">
                {module.lessons.map((lesson) => (
                  <li key={lesson.title} className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm text-[#ddd5f5]">
                    <span>{lesson.title}</span>
                    <Badge variant={lesson.isPreview ? "premium" : "portal"}>{lesson.isPreview ? "Preview" : "Included"}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[34px] border border-[var(--border)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[var(--shadow-soft)]">
          <Badge variant="muted">Instructor</Badge>
          <h3 className="mt-4 text-4xl leading-none tracking-[-0.04em] text-[var(--foreground)]">{payload.instructor.name}</h3>
          {payload.instructor.imageUrl ? (
            <div className="mt-5 h-72 rounded-[28px] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg, rgba(22,12,45,0.08), rgba(22,12,45,0.24)), url(${payload.instructor.imageUrl})` }} />
          ) : null}
          {payload.instructor.shortBio ? <p className="mt-5 text-sm leading-8 text-[var(--foreground-soft)]">{payload.instructor.shortBio}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--foreground-soft)]">
            {payload.instructor.socialLinks.map((social) => (
              <a key={social.label} href={social.url} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--border)] px-4 py-2 transition hover:bg-white/80">
                {social.label}
              </a>
            ))}
          </div>
          <Link href={payload.instructor.pageUrl} className="mt-6 inline-flex text-sm font-semibold text-[var(--foreground)] underline underline-offset-4">
            View instructor page
          </Link>
        </div>
        <div className="space-y-8">
          <div className="space-y-4">
            <Badge variant="accent">Testimonials</Badge>
            <div className="grid gap-4">
              {payload.testimonials.map((testimonial, index) => (
                <blockquote key={`${testimonial.quote}-${index}`} className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[var(--shadow-soft)]">
                  <p className="text-lg leading-8 text-[var(--foreground-soft)]">&ldquo;{testimonial.quote}&rdquo;</p>
                  {testimonial.name ? <footer className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{testimonial.name}</footer> : null}
                </blockquote>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Badge variant="premium">FAQ</Badge>
            <div className="grid gap-4">
              {payload.faqs.map((faq) => (
                <div key={faq.question} className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[var(--shadow-soft)]">
                  <h3 className="text-xl leading-none tracking-[-0.02em] text-[var(--foreground)]">{faq.question}</h3>
                  <p className="mt-3 text-sm leading-8 text-[var(--foreground-soft)]">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="rounded-[38px] bg-[rgba(19,20,40,0.98)] px-8 py-10 text-white shadow-[0_34px_70px_rgba(18,20,41,0.18)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <Badge variant="premium">Pricing CTA</Badge>
              <h2 className="mt-4 max-w-2xl text-5xl leading-none tracking-[-0.05em]">{payload.finalCta.label}</h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-[#bdb3da]">
                One dominant action, one clean buying path, and a clear move into the learner portal after enrollment.
              </p>
            </div>
            <div className="grid gap-3">
              {payload.pricing.map((price) => (
                <Link key={price.offerId} href={price.checkoutUrl} className="flex items-center justify-between rounded-[24px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[rgba(255,255,255,0.08)]">
                  <span>{price.currency}</span>
                  <span>{price.price}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
