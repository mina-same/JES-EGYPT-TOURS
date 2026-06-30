import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import styles from "./AuthorPage.module.css";

export const metadata = {
  title: "Madonna Roshdey | Travel Content Editor at Jes Egypt Tours",
  description:
    "Meet Madonna Roshdey, travel content editor at Jes Egypt Tours, focused on practical Egypt travel guides and visitor-focused planning advice.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

const EDITORIAL_FOCUS = [
  {
    icon: "🗺️",
    heading: "Clear travel planning",
    body: "Step-by-step guidance on how to plan an Egypt trip — from entry logistics to day-by-day itinerary structure.",
  },
  {
    icon: "🧭",
    heading: "Practical visitor guidance",
    body: "Honest information about what to expect on the ground: transport, dress codes, tipping, crowds, and timing.",
  },
  {
    icon: "🏛️",
    heading: "Egyptian destinations and cultural sites",
    body: "Coverage of temples, tombs, museums, and lesser-known sites across Upper and Lower Egypt.",
  },
  {
    icon: "🎟️",
    heading: "Tickets, timing, and logistics",
    body: "Ticket prices, opening hours, and booking details — with a note that these details change and should be verified before travel.",
  },
  {
    icon: "🤝",
    heading: "People-first content",
    body: "Writing aimed at real travelers with real questions, not generic marketing copy or inflated superlatives.",
  },
];

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
      <PageHeader
        title="Madonna Roshdey"
        subTitle="Travel Content Editor &mdash; Jes Egypt Tours"
        breadcrumbs={[{ label: "Authors" }]}
        alt="Madonna Roshdey author page header"
      />

      {/* ── Hero / Intro ─────────────────────────────────────────────── */}
      <section className="section-space">
        <Container>
          <Row className="align-items-center gutter-y-40">
            <Col lg={7}>
              <span className={styles.authorIntroRole}>Travel Content Editor</span>
              <h1 className={styles.authorIntroName}>Madonna Roshdey</h1>
              <p className={styles.authorIntroLead}>
                Madonna works on Egypt travel content for Jes Egypt Tours, with
                a focus on helping international visitors plan their trips with
                realistic expectations and practical information. Her aim is to
                make Egypt more accessible to first-time and returning travelers
                alike — without overselling or underselling the experience.
              </p>
              <Link
                href={`/${locale}/blogs`}
                className={`gotur-btn ${styles.authorIntroCta}`}
              >
                Browse travel articles
                <span className="icon">
                  <i className="icon-right"></i>
                </span>
              </Link>
            </Col>
            <Col lg={5}>
              <div className={styles.authorBioCard}>
                <div className={styles.authorBioCardRow}>
                  <span className={styles.authorBioCardLabel}>Role</span>
                  <span className={styles.authorBioCardValue}>
                    Travel Content Editor
                  </span>
                </div>
                <div className={styles.authorBioCardRow}>
                  <span className={styles.authorBioCardLabel}>Organisation</span>
                  <span className={styles.authorBioCardValue}>
                    Jes Egypt Tours
                  </span>
                </div>
                <div className={styles.authorBioCardRow}>
                  <span className={styles.authorBioCardLabel}>Content focus</span>
                  <span className={styles.authorBioCardValue}>
                    Egypt travel planning, visitor guides, cultural sites
                  </span>
                </div>
                <div className={styles.authorBioCardRow}>
                  <span className={styles.authorBioCardLabel}>Languages</span>
                  <span className={styles.authorBioCardValue}>English</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── About ────────────────────────────────────────────────────── */}
      <section className={styles.authorAbout}>
        <Container>
          <Row>
            <Col lg={8} className="mx-auto">
              <div className="section-title text-center mb-5">
                <span className="section-title__tagline">About</span>
                <h2 className="section-title__title">
                  Egypt travel content for real visitors
                </h2>
              </div>
              <p className={styles.authorAboutText}>
                Madonna contributes visitor-focused travel guides, destination
                overviews, and practical planning articles for Jes Egypt Tours.
                The content is written for international travelers — people
                planning a first trip to Egypt or returning visitors who want
                more detail on specific sites, regions, or logistics.
              </p>
              <p className={styles.authorAboutText}>
                The articles cover a range of topics: how to plan a Nile cruise,
                what to see in Luxor in two days, how to visit the Valley of the
                Kings, entry requirements, common questions about safety, and
                destination comparisons that help travelers make informed
                choices. The tone is direct and informative — the goal is
                usefulness, not enthusiasm for its own sake.
              </p>
              <p className={styles.authorAboutText}>
                Where details like prices, opening hours, or permit requirements
                are included, the articles note that these are variable and
                should be confirmed before travel. Egypt&apos;s tourism
                landscape changes frequently enough that current accuracy matters
                more than publishing a specific number.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Editorial Focus ──────────────────────────────────────────── */}
      <section className="section-space">
        <Container>
          <div className="section-title text-center mb-5">
            <span className="section-title__tagline">Editorial focus</span>
            <h2 className="section-title__title">What the content covers</h2>
          </div>
          <Row className="gutter-y-30">
            {EDITORIAL_FOCUS.map(({ icon, heading, body }) => (
              <Col lg={4} md={6} key={heading}>
                <div className={styles.focusCard}>
                  <div className={styles.focusCardIcon} aria-hidden="true">
                    {icon}
                  </div>
                  <h3 className={styles.focusCardHeading}>{heading}</h3>
                  <p className={styles.focusCardBody}>{body}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── Content Standards / Trust ────────────────────────────────── */}
      <section className={styles.authorStandards}>
        <Container>
          <Row>
            <Col lg={8} className="mx-auto">
              <span
                className={`section-title__tagline ${styles.authorStandardsTagline} d-block mb-3`}
              >
                Content standards
              </span>
              <h2 className={styles.standardsBlockHeading}>
                How this content is written
              </h2>
              <p className={styles.standardsBlockText}>
                Articles are reviewed for clarity and factual consistency
                before publication. The aim is to reflect what travelers
                actually encounter in Egypt — not idealized versions of sites
                or experiences. Where there is genuine uncertainty (for
                example, whether a specific tomb is accessible on a given
                day), that uncertainty is named rather than glossed over.
              </p>
              <p className={styles.standardsBlockText}>
                Content is updated when significant changes occur — new entry
                requirements, major site closures, or substantial changes to
                infrastructure. Older articles carry a note if the information
                has not been recently verified. The site does not make claims
                about local expertise beyond the scope of editorial work: the
                content is written to inform, not to replace the advice of a
                licensed guide or official tourism authority.
              </p>
              <div className={styles.standardsBlockTrust}>
                <span className={styles.standardsBlockTrustLabel}>
                  Published by
                </span>
                <span className={styles.standardsBlockTrustValue}>
                  Jes Egypt Tours — Egypt travel specialists since 2009
                </span>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Related Content ──────────────────────────────────────────── */}
      <section className="section-space">
        <Container>
          <div className="section-title text-center mb-5">
            <span className="section-title__tagline">Related content</span>
            <h2 className="section-title__title">Egypt travel articles</h2>
          </div>
          <Row>
            <Col lg={8} className="mx-auto text-center">
              <p className={styles.authorArticlesNote}>
                Articles written and edited by Madonna Roshdey are published in
                the Jes Egypt Tours travel blog. The blog covers destinations,
                itineraries, cultural guidance, and practical planning topics
                for travelers visiting Egypt.
              </p>
              <div className={styles.authorArticlesActions}>
                <Link href={`/${locale}/blogs`} className="gotur-btn">
                  Browse all travel articles
                  <span className="icon">
                    <i className="icon-right"></i>
                  </span>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <FooterOne />
    </Layout>
  );
}
