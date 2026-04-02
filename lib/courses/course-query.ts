export const courseInclude = {
  instructor: true,
  modules: {
    include: {
      lessons: true,
    },
    orderBy: {
      position: "asc" as const,
    },
  },
  faqs: {
    orderBy: {
      position: "asc" as const,
    },
  },
  testimonials: {
    orderBy: {
      position: "asc" as const,
    },
  },
  offers: {
    include: {
      prices: true,
    },
  },
  pages: true,
};
