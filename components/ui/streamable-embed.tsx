type StreamableEmbedProps = {
  url: string;
  title: string;
};

function resolveStreamableEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const streamId = segments.at(-1);

    if (!streamId) {
      return null;
    }

    if (!parsed.hostname.includes("streamable.com")) {
      return null;
    }

    return `https://streamable.com/e/${streamId}`;
  } catch {
    return null;
  }
}

export function StreamableEmbed({ url, title }: StreamableEmbedProps) {
  const embedUrl = resolveStreamableEmbedUrl(url);

  if (!embedUrl) {
    return (
      <a className="text-sm font-medium text-stone-950 underline" href={url} target="_blank" rel="noreferrer">
        Open video
      </a>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-stone-200 bg-black">
      <iframe
        src={embedUrl}
        title={title}
        allow="autoplay; fullscreen"
        allowFullScreen
        className="aspect-video w-full"
      />
    </div>
  );
}
