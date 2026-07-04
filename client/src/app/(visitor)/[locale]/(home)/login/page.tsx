import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import LoginSection from "@/components/sections/LoginSection/LoginSection";
import HeaderInner from "@/components/layout/HeaderInner/HeaderInner";
import HeaderInnerCloned from "@/components/layout/HeaderInnerCloned/HeaderInnerCloned";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata = {
  title: "Sign In | JES Egypt Tours",
  description:
    "Sign in to your JES Egypt Tours account to manage your bookings and wishlist.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

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
