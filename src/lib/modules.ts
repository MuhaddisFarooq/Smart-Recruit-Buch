// src/lib/modules.ts
export type ModuleKey =
  | "consultants"
  | "careers"
  | "management_team"
  | "achievements"
  | "insurance"
  | "corporate"
  | "ehc"
  | "popup"
  | "slider"
  | "testimonials"
  | "clinical_study"
  | "publications"
  | "hr_training"
  | "fertility_treatment"
  | "blogs"
  | "pathology"
  | "users";

export const MODULES: { key: ModuleKey; label: string }[] = [
  { key: "consultants",         label: "Consultants" },
  { key: "careers",             label: "Careers" },
  { key: "management_team",     label: "Management Team" },
  { key: "achievements",        label: "Achievements" },
  { key: "insurance",           label: "Insurance" },
  { key: "corporate",           label: "Corporate" },
  { key: "ehc",                 label: "EHC" },
  { key: "popup",               label: "PopUp" },
  { key: "slider",              label: "Slider" },
  { key: "testimonials",        label: "Testimonials" },
  { key: "clinical_study",      label: "Clinical Study" },
  { key: "publications",        label: "Publications" },
  { key: "hr_training",         label: "HR Training" },
  { key: "fertility_treatment", label: "Fertility Treatment" },
  { key: "blogs",               label: "Blogs" },
  { key: "pathology",           label: "Pathology" },
  { key: "users",               label: "Users" },
];
