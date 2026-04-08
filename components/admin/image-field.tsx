"use client";

import { useId, useState } from "react";

type ImageFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  previewLabel: string;
  uploadFolder: "courses" | "bundles" | "collections" | "instructors";
};

export function ImageField({
  name,
  label,
  defaultValue = "",
  previewLabel,
  uploadFolder,
}: ImageFieldProps) {
  const inputId = useId();
  const fileId = useId();
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="lg:col-span-2 rounded-[24px] border border-stone-200 bg-stone-50 p-4">
      <label className="space-y-2" htmlFor={inputId}>
        <span className="text-sm font-medium text-stone-900">{label}</span>
        <input
          id={inputId}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://..."
        />
      </label>
      <p className="mt-2 text-sm leading-6 text-stone-600">Paste an image URL here or upload one below, then save the main form once.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label
          htmlFor={fileId}
          className={`inline-flex cursor-pointer items-center rounded-full border border-stone-300 px-4 py-3 text-sm font-medium text-stone-800 transition ${
            uploading ? "pointer-events-none opacity-60" : "hover:bg-stone-100"
          }`}
        >
          {uploading ? "Uploading..." : "Upload image"}
        </label>
        <input
          id={fileId}
          type="file"
          accept="image/*"
          className="hidden"
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

              setValue(data.url);
              setMessage("Upload complete. Save the form to keep this image.");
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Upload failed");
            } finally {
              setUploading(false);
              event.target.value = "";
            }
          }}
        />
        <span className="text-sm text-stone-600">Paste a URL or upload directly.</span>
      </div>
      {message ? <p className="mt-3 text-sm leading-6 text-stone-600">{message}</p> : null}
      <div className="mt-4">
        <p className="mb-3 text-sm font-medium text-stone-900">{previewLabel}</p>
        <div
          className="h-48 rounded-[20px] border border-stone-200 bg-stone-100 bg-cover bg-center"
          style={{
            backgroundImage: value
              ? `linear-gradient(180deg, rgba(28,25,23,0.12), rgba(28,25,23,0.42)), url(${value})`
              : "linear-gradient(135deg, #f5f5f4, #e7e5e4)",
          }}
        />
      </div>
    </div>
  );
}
