import { NextResponse } from "next/server";

const templates: Record<string, string> = {
  instructors: "slug,name,image_url,short_bio,long_bio,website_url,youtube_url,instagram_url,x_url,facebook_url,discord_url,telegram_url\n",
  courses:
    "legacy_course_id,slug,legacy_url,title,subtitle,short_description,long_description,learning_outcomes,who_its_for,includes,hero_image_url,sales_video_url,instructor_slug,instructor_name,seo_title,seo_description,status,price,currency,compare_at_price\n",
  lessons:
    "legacy_course_id,module_position,module_title,lesson_position,lesson_slug,lesson_title,lesson_type,lesson_content,video_url,download_url,is_preview,drip_days,duration_label,status\n",
  offers: "legacy_course_id,offer_name,price,type,currency\n",
  "course-package":
    "legacy_course_id,slug,legacy_slug,legacy_url,title,subtitle,short_description,long_description,learning_outcomes,who_its_for,includes,hero_image_url,sales_video_url,instructor_slug,instructor_name,seo_title,seo_description,status,price,currency,compare_at_price,testimonial_name,testimonial_email,testimonial_quote,testimonial_rating,testimonial_position,module_position,module_title,lesson_position,lesson_slug,lesson_title,lesson_type,lesson_content,video_url,download_url,is_preview,drip_days,duration_label,lesson_status\n",
  "course-students": "email,name,enrolled_at\n",
};

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const template = templates[type];

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return new NextResponse(template, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${type}-template.csv"`,
    },
  });
}
