export type BundleFormValues = {
  title: string;
  slug: string;
  subtitle: string;
  status: string;
  shortDescription: string;
  longDescription: string;
  learningOutcomes: string;
  whoItsFor: string;
  includes: string;
  price: string;
  currency: string;
  compareAtPrice: string;
  heroImageUrl: string;
  salesVideoUrl: string;
  seoTitle: string;
  seoDescription: string;
  legacyUrl: string;
  courseIds: string[];
};

export type BundleFormState = {
  values: BundleFormValues;
  fieldErrors: Partial<Record<keyof BundleFormValues, string>>;
  formError?: string;
};

export const emptyBundleFormState: BundleFormState = {
  values: {
    title: "",
    slug: "",
    subtitle: "",
    status: "DRAFT",
    shortDescription: "",
    longDescription: "",
    learningOutcomes: "",
    whoItsFor: "",
    includes: "",
    price: "0",
    currency: "USD",
    compareAtPrice: "",
    heroImageUrl: "",
    salesVideoUrl: "",
    seoTitle: "",
    seoDescription: "",
    legacyUrl: "",
    courseIds: [],
  },
  fieldErrors: {},
};
