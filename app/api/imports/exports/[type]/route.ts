import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

function csvEscape(value: unknown) {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function csvRow(values: unknown[]) {
  return `${values.map(csvEscape).join(",")}\n`;
}

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json({ error: "Course is required" }, { status: 400 });
  }

  if (type === "course-package") {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: true,
        modules: {
          orderBy: { position: "asc" },
          include: {
            lessons: {
              orderBy: { position: "asc" },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const rows: string[] = [];
    rows.push(
      csvRow([
        "legacy_course_id",
        "slug",
        "legacy_slug",
        "legacy_url",
        "title",
        "subtitle",
        "short_description",
        "long_description",
        "learning_outcomes",
        "who_its_for",
        "includes",
        "hero_image_url",
        "sales_video_url",
        "instructor_slug",
        "seo_title",
        "seo_description",
        "status",
        "module_position",
        "module_title",
        "lesson_position",
        "lesson_slug",
        "lesson_title",
        "lesson_type",
        "lesson_content",
        "video_url",
        "download_url",
        "is_preview",
        "drip_days",
        "duration_label",
        "lesson_status",
      ]),
    );

    const baseFields = [
      course.legacyCourseId ?? "",
      course.slug,
      course.legacySlug ?? "",
      course.legacyUrl ?? "",
      course.title,
      course.subtitle ?? "",
      course.shortDescription ?? "",
      course.longDescription ?? "",
      Array.isArray(course.learningOutcomes) ? course.learningOutcomes.join("|") : "",
      Array.isArray(course.whoItsFor) ? course.whoItsFor.join("|") : "",
      Array.isArray(course.includes) ? course.includes.join("|") : "",
      course.heroImageUrl ?? "",
      course.salesVideoUrl ?? "",
      course.instructor.slug,
      course.seoTitle ?? "",
      course.seoDescription ?? "",
      course.status,
    ];

    for (const courseModule of course.modules) {
      if (courseModule.lessons.length === 0) {
        rows.push(
          csvRow([
            ...baseFields,
            courseModule.position,
            courseModule.title,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ]),
        );
        continue;
      }

      for (const lesson of courseModule.lessons) {
        rows.push(
          csvRow([
            ...baseFields,
            courseModule.position,
            courseModule.title,
            lesson.position,
            lesson.slug,
            lesson.title,
            lesson.type,
            lesson.content ?? "",
            lesson.videoUrl ?? "",
            lesson.downloadUrl ?? "",
            lesson.isPreview,
            lesson.dripDays ?? "",
            lesson.durationLabel ?? "",
            lesson.status,
          ]),
        );
      }
    }

    return new NextResponse(rows.join(""), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${course.slug}-course-package.csv"`,
      },
    });
  }

  if (type === "course-students") {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        slug: true,
        enrollments: {
          orderBy: { enrolledAt: "asc" },
          include: {
            user: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const rows = [
      csvRow(["email", "name", "enrolled_at"]),
      ...course.enrollments.map((enrollment) =>
        csvRow([enrollment.user.email, enrollment.user.name ?? "", enrollment.enrolledAt.toISOString()]),
      ),
    ];

    return new NextResponse(rows.join(""), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${course.slug}-students.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Export type not found" }, { status: 404 });
}
