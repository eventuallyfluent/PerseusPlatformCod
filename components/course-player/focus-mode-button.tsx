"use client";

type FocusModeButtonProps = {
  active: boolean;
  onToggle: () => void;
};

export function FocusModeButton({ active, onToggle }: FocusModeButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center rounded-full border border-[var(--focus-overlay-button-border)] bg-[var(--focus-overlay-button-background)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--focus-overlay-text)] transition hover:bg-[var(--focus-overlay-button-hover)]"
      onClick={onToggle}
    >
      {active ? "Exit focus mode" : "Focus mode"}
    </button>
  );
}
