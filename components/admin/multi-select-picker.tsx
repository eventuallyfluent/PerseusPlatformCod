"use client";

import { useMemo, useState } from "react";

type MultiSelectOption = {
  value: string;
  title: string;
  subtitle?: string | null;
  badge?: string;
};

type MultiSelectPickerProps = {
  name: string;
  options: MultiSelectOption[];
  selectedValues?: string[];
  searchPlaceholder?: string;
  headerLabel: string;
  selectedLabel: string;
  emptyLabel?: string;
  actionLabels?: {
    selected: string;
    unselected: string;
  };
};

export function MultiSelectPicker({
  name,
  options,
  selectedValues = [],
  searchPlaceholder = "Search",
  headerLabel,
  selectedLabel,
  emptyLabel = "No matching items found.",
  actionLabels = {
    selected: "Selected",
    unselected: "Add",
  },
}: MultiSelectPickerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(selectedValues);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      `${option.title} ${option.subtitle ?? ""} ${option.badge ?? ""}`.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggleValue(value: string) {
    setSelected((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">{headerLabel}</p>
          <p className="text-sm text-stone-700">
            {selected.length} {selectedLabel}
          </p>
        </div>
        <label className="block md:w-[320px]">
          <span className="sr-only">{searchPlaceholder}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm outline-none transition focus:border-stone-400"
          />
        </label>
      </div>

      {selected.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}

      <div className="max-h-[28rem] overflow-y-auto rounded-[24px] border border-stone-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = selectedSet.has(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleValue(option.value)}
                  className={`flex w-full items-start justify-between gap-4 rounded-[20px] border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-stone-900 bg-stone-950 text-stone-50 shadow-[0_12px_24px_rgba(28,25,23,0.14)]"
                      : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-400 hover:bg-white"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="min-w-0">
                    {option.badge ? (
                      <span className={`block text-xs font-semibold uppercase tracking-[0.18em] ${isSelected ? "text-stone-300" : "text-stone-500"}`}>
                        {option.badge}
                      </span>
                    ) : null}
                    <span className={`block font-semibold ${isSelected ? "text-stone-50" : "text-stone-950"}`}>{option.title}</span>
                    {option.subtitle ? (
                      <span className={`mt-1 block text-sm leading-6 ${isSelected ? "text-stone-300" : "text-stone-600"}`}>{option.subtitle}</span>
                    ) : null}
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      isSelected ? "border-stone-700 bg-stone-800 text-stone-100" : "border-stone-300 bg-white text-stone-600"
                    }`}
                  >
                    {isSelected ? actionLabels.selected : actionLabels.unselected}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="rounded-[20px] border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-sm text-stone-600">
              {emptyLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
