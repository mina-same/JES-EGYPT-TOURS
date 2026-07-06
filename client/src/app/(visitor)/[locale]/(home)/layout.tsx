import "@/assets/vendors/fontawesome/css/all.min.css";
import "@/assets/vendors/gotur-icons/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "tiny-slider/dist/tiny-slider.css";
import "photoswipe/dist/photoswipe.css";
import "@/assets/css/gotur.css";
import "@/assets/css/custom.css";
import "./globals.css";

import HomeClientShell from "./HomeClientShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <HomeClientShell>{children}</HomeClientShell>;
}
