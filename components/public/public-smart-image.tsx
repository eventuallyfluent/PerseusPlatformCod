import Image from "next/image";
import { cn } from "@/lib/utils";

type PublicSmartImageProps = {
  src?: string | null;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  imageClassName?: string;
  variant?: "hero" | "card" | "portrait" | "thumb";
};

const fallbackByVariant = {
  hero: "bg-[radial-gradient(circle_at_52%_42%,rgba(192,132,252,0.34),transparent_24%),linear-gradient(135deg,#140a2c,#2d1854)]",
  card: "bg-[linear-gradient(135deg,#1c1534,#302555)]",
  portrait: "bg-[linear-gradient(135deg,#25123f,#513083)]",
  thumb: "bg-[linear-gradient(135deg,#24143f,#3a2560)]",
};

export function PublicSmartImage({
  src,
  alt,
  priority = false,
  sizes,
  className,
  imageClassName,
  variant = "card",
}: PublicSmartImageProps) {
  return (
    <div className={cn("relative isolate overflow-hidden bg-[var(--surface-panel-strong)]", fallbackByVariant[variant], className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes ?? "(min-width: 1024px) 42vw, 92vw"}
          className={cn("object-cover object-center transition duration-700", imageClassName)}
        />
      ) : null}
    </div>
  );
}
