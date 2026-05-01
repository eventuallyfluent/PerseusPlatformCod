"use client";

import { useRef } from "react";

type StreamableEmbedProps = {
  url: string;
  title: string;
  focus?: boolean;
};

function resolveEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname.includes("streamable.com")) {
      const streamId = segments.at(-1);
      return streamId ? `https://streamable.com/e/${streamId}` : null;
    }

    if (hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (hostname.includes("youtu.be")) {
      const videoId = segments.at(-1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (hostname.includes("vimeo.com")) {
      const videoId = segments.at(-1);
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function StreamableEmbed({ url, title, focus = false }: StreamableEmbedProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const embedUrl = resolveEmbedUrl(url);

  if (!embedUrl) {
    return (
      <a className="text-sm font-medium text-stone-950 underline" href={url} target="_blank" rel="noreferrer">
        Open video
      </a>
    );
  }

  const enterFullscreen = () => {
    void wrapperRef.current?.requestFullscreen?.();
  };

  return (
    <div ref={wrapperRef} className={`${focus ? "h-full" : ""} group relative overflow-hidden rounded-[24px] border border-stone-200 bg-black`}>
      <iframe
        src={embedUrl}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className={`${focus ? "h-full min-h-[72svh]" : "aspect-video"} w-full`}
      />
      <button
        type="button"
        className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white opacity-0 shadow-lg transition hover:bg-black/90 group-hover:opacity-100 focus:opacity-100"
        onClick={enterFullscreen}
      >
        Fullscreen
      </button>
    </div>
  );
}
