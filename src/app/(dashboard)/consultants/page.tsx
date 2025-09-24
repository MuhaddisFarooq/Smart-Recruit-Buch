import { redirect } from "next/navigation";

export default function ConsultantsIndex() {
  // Always send the "View" menu hit to the actual list page
  redirect("/consultants/view");
}
