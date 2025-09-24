import { redirect } from "next/navigation";

export default function CareersIndex() {
  // Forward /careers to the real list page
  redirect("/careers/view");
}
