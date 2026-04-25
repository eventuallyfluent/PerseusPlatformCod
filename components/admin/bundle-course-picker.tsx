"use client";

import { useMemo, useState } from "react";

type CourseOption = {
  id: string;
  title: string;
  subtitle?: string | null;
};

type BundleCoursePickerProps = {
  courses: CourseOption[];
  name?: string;
  selectedIds?: string[];
  emptyLabel?: string;
};

export function BundleCoursePicker({
  courses,
  name = "courseIds",
  selectedIds = [],
  emptyLabel = "No courses match this search.",
}: BundleCoursePickerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(selectedIds);

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return courses;
    }

    return courses.filter((course) => {
      const haystack = `${course.title} ${course.subtitle ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [courses, query]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggleCourse(courseId: string) {
    setSelected((current) =>
      current.includes(courseId) ? current.filter((id) => id !== courseId) : [...current, courseId],
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Bundle contents</p>
          <p className="text-sm text-stone-700">{selected.length} course{selected.length === 1 ? "" : "s"} selected</p>
        </div>
        <label className="block md:w-[320px]">
          <span className="sr-only">Search courses</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses"
            className="w-full rounded-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm outline-none transition focus:border-stone-400"
          />
        </label>
      </div>

      {selected.map((courseId) => (
        <input key={courseId} type="hidden" name={name} value={courseId} />
      ))}

      <div className="max-h-[28rem] overflow-y-auto rounded-[24px] border border-stone-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => {
              const isSelected = selectedSet.has(course.id);

              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => toggleCourse(course.id)}
                  className={`flex w-full items-start justify-between gap-4 rounded-[20px] border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-stone-900 bg-stone-950 text-stone-50 shadow-[0_12px_24px_rgba(28,25,23,0.14)]"
                      : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-400 hover:bg-white"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="min-w-0">
                    <span className={`block font-semibold ${isSelected ? "text-stone-50" : "text-stone-950"}`}>{course.title}</span>
                    {course.subtitle ? (
                      <span className={`mt-1 block text-sm leading-6 ${isSelected ? "text-stone-300" : "text-stone-600"}`}>{course.subtitle}</span>
                    ) : null}
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      isSelected
                        ? "border-stone-700 bg-stone-800 text-stone-100"
                        : "border-stone-300 bg-white text-stone-600"
                    }`}
                  >
                    {isSelected ? "Included" : "Add"}
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
