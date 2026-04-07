"use client";

type FocusModeButtonProps = {
  active: boolean;
  onToggle: () => void;
};

export function FocusModeButton({ active, onToggle }: FocusModeButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center rounded-full border border-white/15 bg-[rgba(13,15,29,0.78)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-[rgba(13,15,29,0.92)]"
      onClick={onToggle}
    >
      {active ? "Exit focus mode" : "Focus mode"}
    </button>
  );
}
