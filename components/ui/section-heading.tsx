export function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-stone-500">{eyebrow}</p>
      <h2 className="text-4xl tracking-[-0.03em] text-stone-950 sm:text-5xl">{title}</h2>
      {body ? <p className="max-w-2xl text-base leading-8 text-stone-600">{body}</p> : null}
    </div>
  );
}
