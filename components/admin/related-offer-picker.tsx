"use client";

import { useMemo, useState } from "react";

type RelatedOfferOption = {
  value: string;
  label: string;
  kind: "course" | "bundle";
};

type RelatedOfferPickerProps = {
  name?: string;
  options: RelatedOfferOption[];
  selectedValue?: string;
};

export function RelatedOfferPicker({
  name = "upsellTarget",
  options,
  selectedValue = "",
}: RelatedOfferPickerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(selectedValue);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => `${option.kind} ${option.label}`.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  const selectedOption = options.find((option) => option.value === selected) ?? null;

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={selected} />
      <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Current selection</p>
            <p className="text-sm text-stone-700">{selectedOption ? `${selectedOption.kind === "course" ? "Course" : "Bundle"}: ${selectedOption.label}` : "No related offer"}</p>
          </div>
          <label className="block md:w-[320px]">
            <span className="sr-only">Search offers</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses and bundles"
              className="w-full rounded-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm outline-none transition focus:border-stone-400"
            />
          </label>
        </div>
      </div>

      <div className="max-h-[22rem] overflow-y-auto rounded-[24px] border border-stone-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => setSelected("")}
            className={`flex w-full items-center justify-between gap-4 rounded-[20px] border px-4 py-4 text-left transition ${
              selected === ""
                ? "border-stone-900 bg-stone-950 text-stone-50 shadow-[0_12px_24px_rgba(28,25,23,0.14)]"
                : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-400 hover:bg-white"
            }`}
            aria-pressed={selected === ""}
          >
            <span>
              <span className={`block font-semibold ${selected === "" ? "text-stone-50" : "text-stone-950"}`}>No related offer</span>
              <span className={`mt-1 block text-sm ${selected === "" ? "text-stone-300" : "text-stone-600"}`}>Do not show a follow-up recommendation after purchase.</span>
            </span>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                selected === ""
                  ? "border-stone-700 bg-stone-800 text-stone-100"
                  : "border-stone-300 bg-white text-stone-600"
              }`}
            >
              {selected === "" ? "Selected" : "Clear"}
            </span>
          </button>

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = selected === option.value;
              const kindLabel = option.kind === "course" ? "Course" : "Bundle";

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelected(option.value)}
                  className={`flex w-full items-center justify-between gap-4 rounded-[20px] border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-stone-900 bg-stone-950 text-stone-50 shadow-[0_12px_24px_rgba(28,25,23,0.14)]"
                      : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-400 hover:bg-white"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span>
                    <span className={`block text-xs font-semibold uppercase tracking-[0.18em] ${isSelected ? "text-stone-300" : "text-stone-500"}`}>{kindLabel}</span>
                    <span className={`mt-1 block font-semibold ${isSelected ? "text-stone-50" : "text-stone-950"}`}>{option.label}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      isSelected
                        ? "border-stone-700 bg-stone-800 text-stone-100"
                        : "border-stone-300 bg-white text-stone-600"
                    }`}
                  >
                    {isSelected ? "Selected" : "Choose"}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="rounded-[20px] border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-sm text-stone-600">
              No matching courses or bundles found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
