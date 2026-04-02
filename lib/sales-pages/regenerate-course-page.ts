import { getCourseById } from "@/lib/courses/get-course-by-id";
import { persistGeneratedPage } from "@/lib/sales-pages/persist-generated-page";

export async function regenerateCoursePage(courseId: string, force = false) {
  const course = await getCourseById(courseId);

  if (!course) {
    throw new Error("Course not found");
  }

  return persistGeneratedPage(course, force);
}
