import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import LoginSection from "@/components/sections/LoginSection/LoginSection";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import { AuthProvider } from "@/contexts/AuthContext";
import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Sign In | JES Egypt Tours",
    description:
      "Sign in to your JES Egypt Tours account to manage your bookings and wishlist.",
    icons: {
      icon: "/favicon-32x32.png",
    },
    alternates: getStaticLocaleAlternates(locale, "login"),
  };
}

export default function SignInPage() {
  return (
    <Layout>
      <TopbarOne/>
      <HeaderOne linkTheme="light"/>
      <HeaderOneCloned />
      <PageHeader title='Sign In' subTitle='Sign In' />
      <AuthProvider>
        <LoginSection />
      </AuthProvider>
      <FooterOne />
    </Layout>
  );
}
