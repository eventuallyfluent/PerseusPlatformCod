"use client";

import { useEffect, useState } from "react";

export function FocusModeButton({ targetId }: { targetId: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      const element = document.getElementById(targetId);
      setActive(Boolean(document.fullscreenElement && element && document.fullscreenElement === element));
    };

    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, [targetId]);

  return (
    <button
      type="button"
      className="inline-flex items-center rounded-full border border-white/15 bg-[rgba(13,15,29,0.78)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-[rgba(13,15,29,0.92)]"
      onClick={async () => {
        const element = document.getElementById(targetId);

        if (!element) {
          return;
        }

        if (!document.fullscreenElement) {
          await element.requestFullscreen?.();
          setActive(true);
          return;
        }

        await document.exitFullscreen?.();
        setActive(false);
      }}
    >
      {active ? "Exit focus mode" : "Focus mode"}
    </button>
  );
}
