import { Plus_Jakarta_Sans, Just_Another_Hand } from "next/font/google";
import "@/assets/vendors/fontawesome/css/all.min.css";
import "@/assets/vendors/gotur-icons/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "tiny-slider/dist/tiny-slider.css";
import "photoswipe/dist/photoswipe.css";
import "@/assets/css/gotur.css";
import "@/assets/css/custom.css";
import "./globals.css";

import HomeClientShell from "./HomeClientShell";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const justAnotherHand = Just_Another_Hand({
  variable: "--font-just-another-hand",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <HomeClientShell>{children}</HomeClientShell>;
}
