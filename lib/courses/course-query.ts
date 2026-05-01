export const courseInclude = {
  instructor: true,
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
  modules: {
    include: {
      lessons: {
        orderBy: {
          position: "asc" as const,
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
  accessProduct: {
    include: {
      grants: {
        include: {
          course: true,
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
  pages: true,
};
