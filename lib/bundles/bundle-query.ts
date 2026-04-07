export const bundleInclude = {
  upsellCourse: {
    include: {
      instructor: true,
      offers: {
        include: {
          prices: true,
        },
      },
    },
  },
  upsellBundle: {
    include: {
      courses: {
        include: {
          course: {
            include: {
              instructor: true,
              offers: {
                include: {
                  prices: true,
                },
              },
            },
          },
        },
        orderBy: {
          position: "asc" as const,
        },
      },
      offers: {
        include: {
          prices: true,
        },
      },
    },
  },
  courses: {
    include: {
      course: {
        include: {
          instructor: true,
          offers: {
            include: {
              prices: true,
            },
          },
        },
      },
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
