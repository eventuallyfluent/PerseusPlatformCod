import { prisma } from "@/lib/db/prisma";
import {
  defaultHomepageSections,
  HOMEPAGE_SECTION_ORDER,
  type HomepageFooterPayload,
  type HomepageHeroPayload,
  type HomepageSectionRecord,
} from "@/lib/homepage/sections";

export async function getHomepageSections(): Promise<HomepageSectionRecord[]> {
  const sections = await prisma.homepageSection.findMany({
    orderBy: { position: "asc" },
  });

  if (sections.length === 0) {
    return defaultHomepageSections();
  }

  const byType = new Map(sections.map((section) => [section.type, section]));
  const defaults = defaultHomepageSections();

  return HOMEPAGE_SECTION_ORDER.map((type) => {
    const existing = byType.get(type);
    const fallback = defaults.find((section) => section.type === type)!;

    if (type === "HERO" && existing) {
      const payload = existing.payload as HomepageHeroPayload;
      const usesLegacyCurriculumCta =
        payload.secondaryCtaLabel === "View Curriculum" && payload.secondaryCtaHref === "/bundle/ritual-library-bundle";
      const usesSingleCoursePrimaryCta = payload.primaryCtaLabel === "Explore Courses" && payload.primaryCtaHref === "/course/meta-magick-tarot";

      if (usesLegacyCurriculumCta || usesSingleCoursePrimaryCta) {
        return {
          type,
          enabled: existing.enabled,
          position: existing.position,
          payload: {
            ...payload,
            primaryCtaLabel: "Explore Courses",
            primaryCtaHref: "/courses",
            secondaryCtaLabel: "See Instructors",
            secondaryCtaHref: "/instructors",
          },
        };
      }
    }

    if (type === "FOOTER" && existing) {
      const payload = existing.payload as HomepageFooterPayload;
      const normalizedLinks = payload.platformLinks.map((link) =>
        link.label === "Courses" && link.href.startsWith("/course/")
          ? { ...link, href: "/courses" }
          : link,
      );

      return {
        type,
        enabled: existing.enabled,
        position: existing.position,
        payload: {
          ...payload,
          platformLinks: normalizedLinks,
        },
      };
    }

    return existing
      ? {
          type,
          enabled: existing.enabled,
          position: existing.position,
          payload: existing.payload as typeof fallback.payload,
        }
      : fallback;
  }).sort((left, right) => left.position - right.position);
}
