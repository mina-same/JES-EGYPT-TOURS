import { redirect } from 'next/navigation';

export const metadata = {
  title: "Page Not Found | JES Egypt Tours",
  description:
    "The page you're looking for could not be found. Explore our Egypt tours and experiences.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export default function GlobalNotFound() {
  redirect('/404');
}
