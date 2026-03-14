import { redirect } from "next/navigation";

export const metadata = {
  title: "All Tours || Gotur || Travel & Tour NextJS Template",
  description: "View all our tours.",
};

export default function AllToursPage() {
  redirect("/search");
}
