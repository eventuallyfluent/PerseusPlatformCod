import Image from "next/image";
import { cn } from "@/lib/utils";

type SalesSmartImageProps = {
  src?: string | null;
  alt: string;
  priority?: boolean;
  variant?: "hero" | "feature" | "gallery" | "card" | "avatar";
  fit?: "contain" | "cover";
  sizes?: string;
  className?: string;
  frameClassName?: string;
  imageClassName?: string;
};

const variantFrameClasses = {
  hero: "rounded-[20px]",
  feature: "rounded-[20px]",
  gallery: "rounded-[18px]",
  card: "rounded-[14px]",
  avatar: "rounded-[14px]",
};

const variantImageShellClasses = {
  hero: "inset-3 sm:inset-4",
  feature: "inset-4 sm:inset-5",
  gallery: "inset-3 sm:inset-4",
  card: "inset-3",
  avatar: "inset-0",
};

const variantInnerClasses = {
  hero: "max-w-[390px] sm:max-w-[430px] lg:max-w-[460px]",
  feature: "max-w-[760px]",
  gallery: "max-w-[680px]",
  card: "max-w-[420px]",
  avatar: "max-w-none",
};

function imageSizes(variant: NonNullable<SalesSmartImageProps["variant"]>, sizes?: string) {
  if (sizes) return sizes;

  if (variant === "hero") return "(min-width: 1024px) 42vw, 92vw";
  if (variant === "card") return "(min-width: 768px) 45vw, 92vw";
  if (variant === "avatar") return "220px";

  return "(min-width: 1024px) 70vw, 92vw";
}

export function SalesSmartImage({
  src,
  alt,
  priority = false,
  variant = "feature",
  fit = "contain",
  sizes,
  className,
  frameClassName,
  imageClassName,
}: SalesSmartImageProps) {
  const roundedClass = variantFrameClasses[variant];
  const imageShellClass = variantImageShellClasses[variant];
  const innerClass = variantInnerClasses[variant];
  const foregroundFitClass = fit === "cover" ? "object-cover" : "object-contain";

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden border border-[var(--border)] bg-[linear-gradient(135deg,#160b30,#241848)] shadow-[var(--shadow-panel)]",
        roundedClass,
        className,
      )}
    >
      {src ? (
        <>
          <Image
            src={src}
            alt=""
            fill
            priority={priority}
            sizes={imageSizes(variant, sizes)}
            className="absolute inset-0 scale-105 object-cover opacity-25 blur-lg saturate-[0.86]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,9,24,0.02),rgba(12,9,24,0.18))]" />
          <div className={cn("absolute inset-2 border border-[var(--border)]", roundedClass, frameClassName)} />
          <div className={cn("absolute flex items-center justify-center", imageShellClass)}>
            <div className={cn("relative h-full w-full", innerClass, imageClassName)}>
              <Image
                src={src}
                alt={alt}
                fill
                priority={priority}
                sizes={imageSizes(variant, sizes)}
                className={cn("object-center drop-shadow-[0_14px_30px_rgba(0,0,0,0.24)]", foregroundFitClass)}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_42%,rgba(192,132,252,0.34),transparent_24%),linear-gradient(135deg,#160b30,#241848)]" />
      )}
    </div>
  );
}
