import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildNoIndexMetadata({
  title: "Register",
  description: "Private learner registration redirect.",
  path: "/register",
});

export default function RegisterPage() {
  redirect("/login");
}
