"use client";

import { useId, useMemo, useState } from "react";

type GalleryImageFieldProps = {
  name: string;
  label: string;
  defaultUrls?: string[];
  uploadFolder: "courses" | "bundles" | "collections" | "instructors";
  uploadEnabled?: boolean;
  guidance?: string;
};

function normalizeUrls(value: string) {
  return value
    .split(/\r?\n|\|/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function GalleryImageField({
  name,
  label,
  defaultUrls = [],
  uploadFolder,
  uploadEnabled = false,
  guidance = "Manual gallery only. Imported Payhip page images are not auto-added here.",
}: GalleryImageFieldProps) {
  const textareaId = useId();
  const fileId = useId();
  const [value, setValue] = useState(defaultUrls.join("\n"));
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const urls = useMemo(() => normalizeUrls(value), [value]);

  function setUrls(nextUrls: string[]) {
    setValue([...new Set(nextUrls.map((url) => url.trim()).filter(Boolean))].join("\n"));
  }

  return (
    <div className="lg:col-span-2 rounded-[20px] border border-stone-200 bg-stone-50 p-4">
      <label className="space-y-2" htmlFor={textareaId}>
        <span className="text-sm font-medium text-stone-900">{label}</span>
        <textarea
          id={textareaId}
          name={name}
          rows={5}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="One image URL per line"
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label
          htmlFor={fileId}
          className={`inline-flex items-center rounded-full border border-stone-300 px-4 py-3 text-sm font-medium text-stone-800 transition ${
            uploading || !uploadEnabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-stone-100"
          }`}
        >
          {uploading ? "Uploading..." : "Upload image"}
        </label>
        <input
          id={fileId}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={!uploadEnabled}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            setUploading(true);
            setMessage(null);

            try {
              const formData = new FormData();
              formData.append("file", file);
              formData.append("folder", uploadFolder);

              const response = await fetch("/api/admin/uploads/images", {
                method: "POST",
                body: formData,
              });
              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error ?? "Upload failed");
              }

              setUrls([...urls, data.url]);
              setMessage("Upload added. Save the form to keep this gallery image.");
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Upload failed");
            } finally {
              setUploading(false);
              event.target.value = "";
            }
          }}
        />
        <span className="text-sm text-stone-600">{uploadEnabled ? "Paste URLs or upload selected gallery images." : "Paste URLs now. Upload storage is not configured."}</span>
        <span className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600">{guidance}</span>
      </div>
      {message ? <p className="mt-3 text-sm leading-6 text-stone-600">{message}</p> : null}
      {urls.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {urls.map((url) => (
            <div key={url} className="overflow-hidden rounded-[16px] border border-stone-200 bg-white">
              <div
                className="aspect-video bg-stone-100 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(28,25,23,0.08), rgba(28,25,23,0.18)), url(${url})`,
                }}
              />
              <div className="flex items-center justify-between gap-3 p-3">
                <span className="min-w-0 truncate text-xs text-stone-600">{url}</span>
                <button
                  type="button"
                  className="shrink-0 rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                  onClick={() => setUrls(urls.filter((item) => item !== url))}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
