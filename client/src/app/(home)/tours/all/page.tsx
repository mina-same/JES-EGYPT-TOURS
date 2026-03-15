import { redirect } from "next/navigation";

export const metadata = {
  title: "All Tours | JES Egypt Tours",
  description: "Explore all our Egypt tours and experiences.",
};

export default function AllToursPage() {
  redirect("/search");
}
