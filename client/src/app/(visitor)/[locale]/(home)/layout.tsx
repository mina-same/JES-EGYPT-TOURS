import "@/assets/vendors/fontawesome/css/all.min.css";
import "@/assets/vendors/gotur-icons/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "tiny-slider/dist/tiny-slider.css";
import "photoswipe/dist/photoswipe.css";
import "@/assets/css/gotur.css";
import "@/assets/css/custom.css";
import "./globals.css";

import HomeClientShell from "./HomeClientShell";
import { HeaderMenuProvider } from "@/contexts/HeaderMenuContext";
import { API_URL } from "@/config/api";
import type { Menu } from "@/services/menuService";

// Server-fetch the header navigation so its links are part of the initial
// HTML (SEO: crawlers see the nav without executing JavaScript). Revalidated
// every 5 minutes — pages stay static/fast while admin menu edits still roll
// out quickly.
async function getHeaderMenu(): Promise<Menu | null> {
  try {
    const res = await fetch(`${API_URL}/menus/header-main`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success ? (json.data as Menu) : null;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerMenu = await getHeaderMenu();

  return (
    <HomeClientShell>
      <HeaderMenuProvider menu={headerMenu}>{children}</HeaderMenuProvider>
    </HomeClientShell>
  );
}
