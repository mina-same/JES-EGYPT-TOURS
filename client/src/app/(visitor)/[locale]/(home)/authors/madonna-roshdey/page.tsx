import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FooterOne from "@/components/layout/FooterOne/FooterOne";

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
      <section className="author-intro section-space">
        <Container>
          <Row className="align-items-center gutter-y-40">
            <Col lg={7}>
              <span className="author-intro__role">Travel Content Editor</span>
              <h1 className="author-intro__name">Madonna Roshdey</h1>
              <p className="author-intro__lead">
                Madonna works on Egypt travel content for Jes Egypt Tours, with
                a focus on helping international visitors plan their trips with
                realistic expectations and practical information. Her aim is to
                make Egypt more accessible to first-time and returning travelers
                alike — without overselling or underselling the experience.
              </p>
              <Link
                href={`/${locale}/blogs`}
                className="gotur-btn author-intro__cta"
              >
                Browse travel articles
                <span className="icon">
                  <i className="icon-right"></i>
                </span>
              </Link>
            </Col>
            <Col lg={5}>
              <div className="author-bio-card">
                <div className="author-bio-card__row">
                  <span className="author-bio-card__label">Role</span>
                  <span className="author-bio-card__value">
                    Travel Content Editor
                  </span>
                </div>
                <div className="author-bio-card__row">
                  <span className="author-bio-card__label">Organisation</span>
                  <span className="author-bio-card__value">
                    Jes Egypt Tours
                  </span>
                </div>
                <div className="author-bio-card__row">
                  <span className="author-bio-card__label">Content focus</span>
                  <span className="author-bio-card__value">
                    Egypt travel planning, visitor guides, cultural sites
                  </span>
                </div>
                <div className="author-bio-card__row">
                  <span className="author-bio-card__label">Languages</span>
                  <span className="author-bio-card__value">English</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── About ────────────────────────────────────────────────────── */}
      <section className="author-about">
        <Container>
          <Row>
            <Col lg={8} className="mx-auto">
              <div className="section-title text-center mb-5">
                <span className="section-title__tagline">About</span>
                <h2 className="section-title__title">
                  Egypt travel content for real visitors
                </h2>
              </div>
              <p className="author-about__text">
                Madonna contributes visitor-focused travel guides, destination
                overviews, and practical planning articles for Jes Egypt Tours.
                The content is written for international travelers — people
                planning a first trip to Egypt or returning visitors who want
                more detail on specific sites, regions, or logistics.
              </p>
              <p className="author-about__text">
                The articles cover a range of topics: how to plan a Nile cruise,
                what to see in Luxor in two days, how to visit the Valley of the
                Kings, entry requirements, common questions about safety, and
                destination comparisons that help travelers make informed
                choices. The tone is direct and informative — the goal is
                usefulness, not enthusiasm for its own sake.
              </p>
              <p className="author-about__text">
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
      <section className="author-focus section-space">
        <Container>
          <div className="section-title text-center mb-5">
            <span className="section-title__tagline">Editorial focus</span>
            <h2 className="section-title__title">What the content covers</h2>
          </div>
          <Row className="gutter-y-30">
            {EDITORIAL_FOCUS.map(({ icon, heading, body }) => (
              <Col lg={4} md={6} key={heading}>
                <div className="focus-card">
                  <div className="focus-card__icon" aria-hidden="true">
                    {icon}
                  </div>
                  <h3 className="focus-card__heading">{heading}</h3>
                  <p className="focus-card__body">{body}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── Content Standards / Trust ────────────────────────────────── */}
      <section className="author-standards">
        <Container>
          <Row>
            <Col lg={8} className="mx-auto">
              <div className="standards-block">
                <span className="section-title__tagline author-standards__tagline d-block mb-3">
                  Content standards
                </span>
                <h2 className="standards-block__heading">
                  How this content is written
                </h2>
                <p className="standards-block__text">
                  Articles are reviewed for clarity and factual consistency
                  before publication. The aim is to reflect what travelers
                  actually encounter in Egypt — not idealized versions of sites
                  or experiences. Where there is genuine uncertainty (for
                  example, whether a specific tomb is accessible on a given
                  day), that uncertainty is named rather than glossed over.
                </p>
                <p className="standards-block__text">
                  Content is updated when significant changes occur — new entry
                  requirements, major site closures, or substantial changes to
                  infrastructure. Older articles carry a note if the information
                  has not been recently verified. The site does not make claims
                  about local expertise beyond the scope of editorial work: the
                  content is written to inform, not to replace the advice of a
                  licensed guide or official tourism authority.
                </p>
                <div className="standards-block__trust">
                  <span className="standards-block__trust-label">
                    Published by
                  </span>
                  <span className="standards-block__trust-value">
                    Jes Egypt Tours — Egypt travel specialists since 2009
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Related Content ──────────────────────────────────────────── */}
      <section className="author-articles section-space">
        <Container>
          <div className="section-title text-center mb-5">
            <span className="section-title__tagline">Related content</span>
            <h2 className="section-title__title">Egypt travel articles</h2>
          </div>
          <Row>
            <Col lg={8} className="mx-auto text-center">
              <p className="author-articles__note">
                Articles written and edited by Madonna Roshdey are published in
                the Jes Egypt Tours travel blog. The blog covers destinations,
                itineraries, cultural guidance, and practical planning topics
                for travelers visiting Egypt.
              </p>
              <div className="author-articles__actions">
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

      {/* ── Styles ───────────────────────────────────────────────────── */}
      <style jsx global>{`
        /* ── Intro ─────────────────────────────── */
        .author-intro__role {
          display: inline-block;
          color: #b79c5c;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .author-intro__name {
          font-size: clamp(2.2rem, 4.5vw, 3.4rem);
          font-weight: 800;
          color: #0f2433;
          line-height: 1.15;
          margin-bottom: 22px;
        }

        .author-intro__lead {
          font-size: 1.1rem;
          color: #4b5563;
          line-height: 1.8;
          margin-bottom: 32px;
          max-width: 560px;
        }

        .author-intro__cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        /* ── Bio card ──────────────────────────── */
        .author-bio-card {
          background: #f8f6f2;
          border-radius: 20px;
          padding: 36px 40px;
          border: 1px solid #ede9e0;
        }

        .author-bio-card__row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px 0;
          border-bottom: 1px solid #e8e4da;
        }

        .author-bio-card__row:first-child {
          padding-top: 0;
        }

        .author-bio-card__row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .author-bio-card__label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #b79c5c;
        }

        .author-bio-card__value {
          font-size: 15px;
          color: #1a1a1a;
          font-weight: 500;
          line-height: 1.5;
        }

        /* ── About ─────────────────────────────── */
        .author-about {
          background: #f8f6f2;
          padding: 80px 0;
        }

        .author-about__text {
          font-size: 16px;
          color: #4b5563;
          line-height: 1.85;
          margin-bottom: 22px;
        }

        .author-about__text:last-child {
          margin-bottom: 0;
        }

        /* ── Focus cards ───────────────────────── */
        .focus-card {
          background: #f8f6f2;
          border-radius: 16px;
          padding: 34px 30px;
          height: 100%;
          border: 1px solid transparent;
          transition: all 0.3s ease;
        }

        .focus-card:hover {
          background: #ffffff;
          border-color: #ede9e0;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
          transform: translateY(-4px);
        }

        .focus-card__icon {
          font-size: 28px;
          margin-bottom: 16px;
          display: block;
        }

        .focus-card__heading {
          font-size: 18px;
          font-weight: 700;
          color: #0f2433;
          margin-bottom: 12px;
        }

        .focus-card__body {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.75;
          margin: 0;
        }

        /* ── Standards ─────────────────────────── */
        .author-standards {
          background: #0f2433;
          padding: 80px 0;
        }

        .author-standards__tagline {
          color: #b79c5c !important;
        }

        .standards-block__heading {
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 28px;
          line-height: 1.3;
        }

        .standards-block__text {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.85;
          margin-bottom: 20px;
        }

        .standards-block__text:last-of-type {
          margin-bottom: 32px;
        }

        .standards-block__trust {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }

        .standards-block__trust-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #b79c5c;
        }

        .standards-block__trust-value {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 500;
        }

        /* ── Related articles ──────────────────── */
        .author-articles__note {
          font-size: 16px;
          color: #4b5563;
          line-height: 1.8;
          margin-bottom: 36px;
          max-width: 580px;
          margin-left: auto;
          margin-right: auto;
        }

        .author-articles__actions {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        /* ── Mobile ────────────────────────────── */
        @media (max-width: 767px) {
          .author-bio-card {
            padding: 28px 24px;
          }

          .author-about,
          .author-standards {
            padding: 60px 0;
          }
        }
      `}</style>

      <FooterOne />
    </Layout>
  );
}
