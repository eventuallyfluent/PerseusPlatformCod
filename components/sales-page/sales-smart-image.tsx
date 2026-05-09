import { cn } from "@/lib/utils";

type SalesSmartImageProps = {
  src?: string | null;
  alt: string;
  priority?: boolean;
  className?: string;
  frameClassName?: string;
  imageClassName?: string;
};

function cssUrl(url: string) {
  return `url("${url.replace(/"/g, "%22")}")`;
}

export function SalesSmartImage({
  src,
  alt,
  priority = false,
  className,
  frameClassName,
  imageClassName,
}: SalesSmartImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[26px] border border-[var(--border)] bg-[linear-gradient(135deg,#160b30,#241848)] shadow-[var(--shadow-panel)]",
        className,
      )}
    >
      {src ? (
        <>
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-55 blur-xl"
            style={{ backgroundImage: cssUrl(src) }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,9,24,0.08),rgba(12,9,24,0.24))]" />
          <div className={cn("absolute inset-3 rounded-[20px] border border-white/10", frameClassName)} />
          <div
            className={cn("absolute inset-4 bg-contain bg-center bg-no-repeat sm:inset-5", priority ? "" : "", imageClassName)}
            style={{ backgroundImage: cssUrl(src) }}
            role="img"
            aria-label={alt}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_42%,rgba(192,132,252,0.34),transparent_24%),linear-gradient(135deg,#160b30,#241848)]" />
      )}
    </div>
  );
}
