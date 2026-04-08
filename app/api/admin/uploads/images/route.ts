import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

function sanitizeFilename(name: string) {
  const [base = "image", extension = ""] = name.split(/\.(?=[^.]+$)/);
  const safeBase = base.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return safeExtension ? `${safeBase}.${safeExtension}` : safeBase;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN is not configured. You can still paste an image URL directly." },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? "uploads").trim() || "uploads";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported" }, { status: 400 });
    }

    const blob = await put(`${folder}/${Date.now()}-${sanitizeFilename(file.name)}`, file, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Image upload failed",
      },
      { status: 500 },
    );
  }
}
