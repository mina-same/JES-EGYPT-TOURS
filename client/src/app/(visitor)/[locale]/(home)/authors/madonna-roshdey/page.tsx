import Link from "next/link";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import Layout from "@/components/layout/Layout/Layout";
import FooterOne from "@/components/layout/FooterOne/FooterOne";

export const metadata = {
  title: "Madonna Roshdey | Travel Specialist at Jes Egypt Tours",
  description: "Author profile for Madonna Roshdey, Travel Specialist at Jes Egypt Tours.",
};

export default async function MadonnaRoshdeyAuthorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <main className="section-space">
        <div className="container">
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <p style={{ color: "#c7a24a", fontWeight: 700, marginBottom: "10px" }}>
              Travel Specialist at Jes Egypt Tours
            </p>
            <h1 style={{ color: "#0f2433", fontSize: "clamp(2.4rem, 5vw, 4rem)", fontWeight: 800, marginBottom: "18px" }}>
              Madonna Roshdey
            </h1>
            <p style={{ color: "#4b5563", fontSize: "1.1rem", lineHeight: 1.8, marginBottom: "28px" }}>
              Author profile coming soon.
            </p>
            <Link href={`/${locale}/blogs`} style={{ color: "#173f63", fontWeight: 700 }}>
              Back to blog
            </Link>
          </div>
        </div>
      </main>
      <FooterOne />
    </Layout>
  );
}
