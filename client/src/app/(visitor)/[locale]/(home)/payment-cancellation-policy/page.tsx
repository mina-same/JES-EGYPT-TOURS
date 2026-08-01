import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgePercent,
  Banknote,
  Building2,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  Check,
  CreditCard,
  FileCheck2,
  HelpCircle,
  Info,
  Landmark,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import Layout from "@/components/layout/Layout/Layout";
import BannerCTA from "@/components/sections/BannerCTA/BannerCTA";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import {
  getStaticLocaleAlternates,
  SEO_BASE_URL,
} from "@/lib/seo/localeAlternates";
import {
  localizeInternalUrl,
  normalizeLocale,
} from "@/lib/url";
import styles from "./PaymentCancellationPolicy.module.css";

const POLICY = {
  lastUpdated: {
    iso: "2026-08-01",
    label: "August 1, 2026",
  },
  standardDeposit: "35%",
  dayTourCancellationWindow: "24 hours",
  cashCurrencies: "USD or EUR",
} as const;

const PAGE_TITLE = "Payment & Cancellation Policy";
const META_TITLE = "Payment & Cancellation Policy | JES Egypt Tours";
const META_DESCRIPTION =
  "Read the JES Egypt Tours payment and cancellation policy, including deposits, final payments, booking changes, supplier costs, refunds, and no-show conditions.";

const NAV_ITEMS = [
  { id: "booking-confirmation", label: "Booking Confirmation" },
  { id: "deposit", label: "Deposit" },
  { id: "final-payment", label: "Final Payment" },
  { id: "payment-methods", label: "Payment Methods" },
  { id: "price-changes", label: "Price Changes" },
  { id: "guest-amendments", label: "Guest Amendments" },
  { id: "cancellation", label: "Cancellation" },
  { id: "non-refundable-costs", label: "Non-Refundable Costs" },
  { id: "no-show", label: "No-Show & Missed Services" },
  { id: "refunds", label: "Refunds & Travel Credit" },
  { id: "payment-faqs", label: "Frequently Asked Questions" },
  { id: "policy-acceptance", label: "Acceptance & Contact" },
] as const;

const SUMMARY_ITEMS = [
  {
    icon: FileCheck2,
    title: "Written confirmation",
    text: "Your booking is confirmed only after the required payment and written confirmation from our team.",
  },
  {
    icon: BadgePercent,
    title: "Deposit requirements",
    text: `A standard ${POLICY.standardDeposit} deposit may apply, but supplier commitments can require a different amount.`,
  },
  {
    icon: CalendarClock,
    title: "Final payment",
    text: "The balance deadline is the date shown in your quotation or booking confirmation.",
  },
  {
    icon: Building2,
    title: "Supplier costs",
    text: "Confirmed flights, hotels, cruises, tickets, and other supplier services may be non-refundable.",
  },
] as const;

const NON_REFUNDABLE_ITEMS = [
  "Domestic and international flight tickets",
  "Nile cruise cabins and hotel rooms",
  "Train, attraction, and special-event tickets",
  "Permits and visa-related services, where applicable",
  "Special transportation and private activities",
  "Peak-season and other restricted reservations",
] as const;

const POLICY_FAQS = [
  {
    question: "Is a 35% deposit required for every booking?",
    answer:
      "No. A 35% deposit is a standard starting point, but the amount can be higher or full payment may be required when the booking includes flights, hotels, Nile cruises, tickets, peak-season services, groups, or other non-refundable supplier reservations. Your written quotation will state the amount that applies.",
  },
  {
    question: "When do I need to pay the remaining balance?",
    answer:
      "The balance is due on the date shown in your written booking confirmation. Some private day tours may be paid at the beginning of the tour when agreed in writing, while multi-day packages and supplier-heavy bookings may require earlier payment.",
  },
  {
    question: "Can I cancel a private day tour free of charge?",
    answer: `Where the confirmation does not state otherwise, free cancellation may be available until ${POLICY.dayTourCancellationWindow} before a private day tour starts. This flexibility does not apply when the booking includes prepaid or non-refundable services.`,
  },
  {
    question: "Which booking costs may be non-refundable?",
    answer:
      "Flights, hotel rooms, Nile cruise cabins, train or attraction tickets, permits, special transport, private activities, and peak-season reservations may be partially or fully non-refundable after confirmation, depending on the supplier's rules.",
  },
  {
    question: "How do I request a change or cancellation?",
    answer:
      "Contact JES Egypt Tours in writing as soon as possible. We will check availability, supplier rules, fees, and any price difference. A requested change is confirmed only after you receive written approval from us.",
  },
  {
    question: "How long does an approved refund take?",
    answer:
      "Refund approval and payment processing are separate. Banks, card providers, payment gateways, and travel suppliers may each affect when the amount appears. We therefore do not promise a fixed processing period unless one is confirmed to you in writing.",
  },
  {
    question: "Which payment methods and currencies can I use?",
    answer: `Depending on the booking, secure online card payment, bank transfer, or an agreed cash payment may be available. The invoice will confirm the method, amount, and currency; agreed cash currencies may include ${POLICY.cashCurrencies}.`,
  },
  {
    question: "What should I do if my flight is delayed?",
    answer:
      "Contact our team as soon as possible. We will try to adjust transfers and other arrangements where operationally possible, but missed supplier-controlled services may not be recoverable and replacement services can involve additional costs.",
  },
] as const;

interface PolicyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PolicyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = normalizeLocale(locale);
  const canonicalUrl = `${SEO_BASE_URL}/${lang}/payment-cancellation-policy`;

  return {
    title: META_TITLE,
    description: META_DESCRIPTION,
    alternates: getStaticLocaleAlternates(lang, "payment-cancellation-policy"),
    openGraph: {
      title: META_TITLE,
      description: META_DESCRIPTION,
      type: "website",
      url: canonicalUrl,
      siteName: "JES Egypt Tours",
    },
    twitter: {
      card: "summary",
      title: META_TITLE,
      description: META_DESCRIPTION,
    },
  };
}

function PolicyNavigation() {
  const links = (
    <ol className={styles.navigationList}>
      {NAV_ITEMS.map((item, index) => (
        <li key={item.id}>
          <a href={`#${item.id}`}>
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            {item.label}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <nav className={styles.navigation} aria-label="Payment policy sections">
      <div className={styles.desktopNavigation}>
        <p className={styles.navigationTitle}>On this page</p>
        {links}
      </div>
      <details className={styles.mobileNavigation}>
        <summary>On this page</summary>
        {links}
      </details>
    </nav>
  );
}

export default async function PaymentCancellationPolicyPage({
  params,
}: PolicyPageProps) {
  const { locale } = await params;
  const lang = normalizeLocale(locale);
  const pageUrl = `${SEO_BASE_URL}/${lang}/payment-cancellation-policy`;
  const homeUrl = `${SEO_BASE_URL}/${lang}`;
  const contactHref = localizeInternalUrl("/contact", lang);
  const tailorMadeHref = localizeInternalUrl("/tailor-made", lang);
  const privacyHref = localizeInternalUrl("/privacy-policy", lang);

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: PAGE_TITLE,
    description: META_DESCRIPTION,
    inLanguage: lang,
    dateModified: POLICY.lastUpdated.iso,
    isPartOf: { "@id": `${SEO_BASE_URL}/#website` },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: PAGE_TITLE,
        item: pageUrl,
      },
    ],
  };

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader
        title={PAGE_TITLE}
        subTitle="How we confirm bookings and handle deposits, final payments, changes, cancellations, and eligible refunds."
        bgImage="/images/backgrounds/jes-egypt-tours-payment-cancellation-policy.webp"
        alt="Payment and travel documents overlooking the Nile and Giza pyramids"
        imageTitle="JES Egypt Tours payment and cancellation policy"
        breadcrumbs={[{ label: PAGE_TITLE }]}
      />

      <main className={styles.page}>
        <section className={styles.summarySection} aria-labelledby="policy-summary-title">
          <div className="container">
            <div className={styles.summaryHeader}>
              <div>
                <span className={styles.eyebrow}>Clear terms before you pay</span>
                <h2 id="policy-summary-title">Quick policy summary</h2>
              </div>
              <p className={styles.lastUpdated}>
                <CalendarDays size={17} aria-hidden="true" />
                <span>Last updated:</span>{" "}
                <time dateTime={POLICY.lastUpdated.iso}>{POLICY.lastUpdated.label}</time>
              </p>
            </div>

            <div className={styles.summaryGrid}>
              {SUMMARY_ITEMS.map(({ icon: Icon, title, text }) => (
                <article className={styles.summaryCard} key={title}>
                  <span className={styles.summaryIcon} aria-hidden="true">
                    <Icon size={21} strokeWidth={2} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>

            <div className={styles.summaryNote}>
              <Info size={20} aria-hidden="true" />
              <p>
                <strong>This is a summary.</strong> Your written quotation and booking
                confirmation will show the exact payment and cancellation terms that
                apply to your reservation.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.policyBody} aria-label="Complete payment and cancellation terms">
          <div className="container">
            <div className={styles.contentLayout}>
              <aside className={styles.sidebar}>
                <PolicyNavigation />
              </aside>

              <article className={styles.article}>
                <section className={styles.policySection} id="booking-confirmation">
                  <span className={styles.sectionNumber}>01</span>
                  <h2>Booking confirmation</h2>
                  <p>
                    A quotation or proposed itinerary does not automatically confirm
                    availability. Your booking becomes confirmed only after you accept
                    the written offer, complete the payment requested for confirmation,
                    and receive written confirmation from JES Egypt Tours.
                  </p>
                  <p>
                    Availability and supplier prices can change before the required
                    payment reaches us. Your booking confirmation should identify the
                    included services, travel dates, travelers, payment schedule, and
                    any important conditions that apply specifically to the reservation.
                  </p>
                  <div className={styles.highlightNote}>
                    <FileCheck2 size={21} aria-hidden="true" />
                    <p>
                      The conditions written in your quotation or booking confirmation
                      apply specifically to your reservation and supplement this general policy.
                    </p>
                  </div>
                </section>

                <section className={styles.policySection} aria-labelledby="payment-schedule-title">
                  <span className={styles.sectionNumber}>02</span>
                  <h2 id="payment-schedule-title">Payment schedule</h2>

                  <div className={styles.subsection} id="deposit">
                    <h3>Deposit requirements</h3>
                    <p>
                      A standard deposit of <strong>{POLICY.standardDeposit}</strong> may be
                      requested to confirm a booking. The required amount can vary according
                      to the services included and the commitments needed to secure them.
                    </p>
                    <p>A larger deposit or full payment may be necessary for:</p>
                    <ul className={styles.twoColumnList}>
                      <li>Domestic flights</li>
                      <li>Nile cruises</li>
                      <li>Hotels</li>
                      <li>Peak travel periods</li>
                      <li>Group bookings</li>
                      <li>Special permits</li>
                      <li>Non-refundable tickets</li>
                      <li>Last-minute bookings</li>
                    </ul>
                    <p>
                      We will confirm the exact deposit amount and payment deadline in
                      writing before you pay.
                    </p>
                  </div>

                  <div className={styles.subsection} id="final-payment">
                    <h3>Final payment</h3>
                    <p>
                      The remaining balance is due on the date stated in your written
                      confirmation. Some private day tours may be paid at the beginning
                      of the tour when this is expressly agreed in writing.
                    </p>
                    <p>
                      Multi-day packages, hotel reservations, cruises, domestic flights,
                      groups, and peak-season bookings may require earlier payment. If a
                      balance is not paid by the agreed deadline, we may need to release
                      services that suppliers can no longer hold. We will contact you before
                      taking that step wherever reasonably possible.
                    </p>
                  </div>
                </section>

                <section className={styles.policySection} id="payment-methods">
                  <span className={styles.sectionNumber}>03</span>
                  <h2>Payment methods, currencies, and fees</h2>
                  <p>
                    The methods available for your booking will be stated in the invoice
                    or confirmation. Accepted methods may include:
                  </p>
                  <div className={styles.methodGrid}>
                    <article className={styles.methodCard}>
                      <CreditCard size={22} aria-hidden="true" />
                      <h3>Online card payment</h3>
                      <p>Secure payment may be available through an official payment link.</p>
                    </article>
                    <article className={styles.methodCard}>
                      <Landmark size={22} aria-hidden="true" />
                      <h3>Bank transfer</h3>
                      <p>The sender must cover charges so the full invoiced amount reaches us.</p>
                    </article>
                    <article className={styles.methodCard}>
                      <Banknote size={22} aria-hidden="true" />
                      <h3>Agreed cash payment</h3>
                      <p>Cash may be accepted in an agreed currency such as {POLICY.cashCurrencies}.</p>
                    </article>
                  </div>
                  <div className={styles.securityPanel}>
                    <ShieldCheck size={24} aria-hidden="true" />
                    <div>
                      <h3>Pay through official channels</h3>
                      <p>
                        JES Egypt Tours will not ask you to send full card details through
                        WhatsApp or email. Payment links must come through official JES Egypt
                        Tours communication channels. Any applicable card-processing, banking,
                        intermediary, or currency-related fee will be disclosed before payment.
                        The invoice or confirmation will state the accepted currency and amount.
                      </p>
                    </div>
                  </div>
                </section>

                <section className={styles.policySection} id="price-changes">
                  <span className={styles.sectionNumber}>04</span>
                  <h2>Price validity and changes</h2>
                  <p>
                    Once services are confirmed and paid according to the agreed schedule,
                    the written price applies to those confirmed services. We do not add
                    undisclosed charges after confirmation.
                  </p>
                  <p>The total price may need to change when:</p>
                  <ul className={styles.changeGrid}>
                    <li>The guest changes the travel date or number of travelers.</li>
                    <li>The itinerary, hotel category, room, or cruise cabin changes.</li>
                    <li>Additional services or upgrades are requested.</li>
                    <li>An airline changes a fare before ticket issuance.</li>
                    <li>A government, attraction, or supplier introduces a mandatory fee.</li>
                    <li>A quoted service has not yet been secured or confirmed.</li>
                  </ul>
                  <p>
                    Any revised price will be communicated to you before the revised service
                    is confirmed.
                  </p>
                </section>

                <section className={styles.policySection} id="guest-amendments">
                  <span className={styles.sectionNumber}>05</span>
                  <h2>Changes requested by the guest</h2>
                  <p>
                    We will try to accommodate reasonable amendment requests, including
                    changes to travel dates, hotels, room categories, cruises, flights,
                    traveler numbers, itineraries, and pickup or drop-off locations.
                  </p>
                  <div className={styles.processList} aria-label="How amendment requests are handled">
                    <div>
                      <span>1</span>
                      <p>Send the request to JES Egypt Tours as early as possible.</p>
                    </div>
                    <div>
                      <span>2</span>
                      <p>We check availability, supplier rules, fees, and price differences.</p>
                    </div>
                    <div>
                      <span>3</span>
                      <p>The change is confirmed only after written approval.</p>
                    </div>
                  </div>
                  <p>
                    If the original suppliers cannot amend the reservation, a substantial
                    change may need to be treated as a cancellation and a new booking.
                  </p>
                </section>

                <section className={styles.policySection} id="cancellation">
                  <span className={styles.sectionNumber}>06</span>
                  <h2>Cancellation by the guest</h2>
                  <p>
                    Cancellation terms depend on the type of booking and the supplier
                    commitments already made. There is no single cancellation percentage
                    schedule that applies to every service.
                  </p>

                  <div className={styles.cancellationGrid}>
                    <article className={`${styles.cancellationCard} ${styles.flexibleCard}`}>
                      <h3>Private day tours without non-refundable services</h3>
                      <p>
                        These bookings may offer more flexible cancellation. Where your
                        booking confirmation does not state otherwise, free cancellation may
                        be available until <strong>{POLICY.dayTourCancellationWindow}</strong> before
                        the scheduled start time. Cancellations within {POLICY.dayTourCancellationWindow}
                        and no-shows may be non-refundable.
                      </p>
                      <p className={styles.cardException}>
                        This does not apply when the booking includes prepaid or
                        non-refundable services.
                      </p>
                    </article>

                    <article className={styles.cancellationCard}>
                      <h3>Multi-day packages</h3>
                      <p>
                        Charges depend on when you cancel and the supplier commitments made.
                        The applicable schedule should be stated in your written quotation or
                        confirmation. Non-refundable supplier payments will be deducted from
                        any eligible refund, and charges may increase closer to arrival.
                      </p>
                    </article>

                    <article className={styles.cancellationCard}>
                      <h3>Flights, hotels, cruises, tickets & special services</h3>
                      <p>
                        These services may follow separate supplier rules and can become
                        partially or fully non-refundable immediately after confirmation.
                        We will disclose these conditions in writing before payment wherever
                        reasonably possible.
                      </p>
                    </article>

                    <article className={styles.cancellationCard}>
                      <h3>Groups and peak periods</h3>
                      <p>
                        Group bookings and high-demand dates—including Christmas, New Year,
                        Easter, and other major travel periods—may have stricter payment and
                        cancellation conditions. The applicable terms will be stated in the quotation.
                      </p>
                    </article>
                  </div>
                </section>

                <section className={`${styles.policySection} ${styles.supplierSection}`} id="non-refundable-costs">
                  <span className={styles.sectionNumber}>07</span>
                  <h2>Non-refundable supplier costs</h2>
                  <div className={styles.supplierIntro}>
                    <ReceiptText size={25} aria-hidden="true" />
                    <p>
                      After confirmation, JES Egypt Tours may pay third-party providers to
                      secure services for your trip. Some of those payments cannot be recovered.
                    </p>
                  </div>
                  <ul className={styles.twoColumnList}>
                    {NON_REFUNDABLE_ITEMS.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <div className={styles.calmWarning}>
                    <TriangleAlert size={21} aria-hidden="true" />
                    <p>
                      If a supplier does not refund JES Egypt Tours, that amount may not be
                      refundable to the guest—even when other parts of the booking qualify
                      for a partial refund. We will provide a reasonable explanation of
                      deductions when processing an eligible refund.
                    </p>
                  </div>
                </section>

                <section className={styles.policySection} id="no-show">
                  <span className={styles.sectionNumber}>08</span>
                  <h2>No-show, late arrival, missed flights, and unused services</h2>
                  <ul className={styles.standardList}>
                    <li>A no-show is normally non-refundable.</li>
                    <li>Services missed because of guest lateness may not be recoverable.</li>
                    <li>Unused accommodation, meals, transfers, tours, or activities are not automatically refundable.</li>
                    <li>New transport, hotel nights, tickets, or supplier costs may require additional payment.</li>
                  </ul>
                  <p>
                    Contact JES Egypt Tours as soon as possible if a flight is delayed or
                    your plans change. We will try to adjust arrangements where operationally
                    possible, but we cannot guarantee recovery of missed services controlled
                    by external suppliers.
                  </p>
                </section>

                <section className={styles.policySection} id="refunds">
                  <span className={styles.sectionNumber}>09</span>
                  <h2>Refunds, postponement, and travel credit</h2>
                  <div className={styles.refundGrid}>
                    <article>
                      <RefreshCcw size={22} aria-hidden="true" />
                      <h3>Eligible refunds</h3>
                      <p>
                        Where possible, an approved refund will be returned through the
                        original payment method. Refund approval and the time needed for a
                        bank, card provider, payment gateway, or supplier to process it are
                        separate. We do not guarantee a fixed processing period.
                      </p>
                    </article>
                    <article>
                      <CalendarClock size={22} aria-hidden="true" />
                      <h3>Postponement or travel credit</h3>
                      <p>
                        You may request a date change or travel credit instead of cancellation.
                        Approval depends on availability and supplier rules. Any validity period,
                        price difference, or non-transferable condition will be confirmed in writing;
                        not every reservation is eligible.
                      </p>
                    </article>
                  </div>
                  <p>
                    Banking, payment-gateway, currency-conversion, or supplier charges already
                    incurred may be deducted where applicable and legally permitted.
                  </p>
                </section>

                <section className={styles.policySection} id="payment-faqs">
                  <span className={styles.sectionNumber}>10</span>
                  <div className={styles.faqHeading}>
                    <span className={styles.faqHeadingIcon} aria-hidden="true">
                      <HelpCircle size={22} strokeWidth={2} />
                    </span>
                    <div>
                      <h2>Frequently asked questions</h2>
                      <p>Quick answers to common questions before confirming a booking.</p>
                    </div>
                  </div>
                  <div className={styles.faqList}>
                    {POLICY_FAQS.map((faq, index) => (
                      <details className={styles.faqItem} key={faq.question}>
                        <summary>
                          <span className={styles.faqNumber} aria-hidden="true">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span>{faq.question}</span>
                          <ChevronDown
                            className={styles.faqChevron}
                            size={19}
                            strokeWidth={2.2}
                            aria-hidden="true"
                          />
                        </summary>
                        <div className={styles.faqAnswer}>
                          <p>{faq.answer}</p>
                        </div>
                      </details>
                    ))}
                  </div>
                </section>

                <section className={`${styles.policySection} ${styles.acceptanceSection}`} id="policy-acceptance">
                  <span className={styles.sectionNumber}>11</span>
                  <h2>Policy acceptance and questions</h2>
                  <p>
                    Payment of the required deposit or balance indicates acceptance of the
                    written quotation, the booking confirmation, this Payment & Cancellation
                    Policy, and any booking-specific supplier conditions disclosed before payment.
                  </p>
                  <ul className={styles.acceptanceList}>
                    {[
                      "Review the traveler names, dates, and included services.",
                      "Check the payment deadlines and accepted currency.",
                      "Ask which supplier items are already non-refundable.",
                      "Request clarification before sending payment if anything is unclear.",
                    ].map((item) => (
                      <li key={item}>
                        <Check size={17} aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className={styles.relatedLinks}>
                    You can also <Link href={contactHref}>contact our Cairo-based team</Link>,
                    request a <Link href={tailorMadeHref}>tailor-made itinerary</Link>, or review
                    our <Link href={privacyHref}>Privacy Policy</Link>. Broader booking conditions,
                    where applicable, will be provided with your written quotation or confirmation.
                  </p>
                </section>
              </article>
            </div>
          </div>
        </section>

        <BannerCTA
          locale={lang}
          showFeatures={false}
          customContent={{
            eyebrow: "Clear answers before payment",
            title: "Questions Before You Confirm?",
            text: "Contact our Cairo-based team before making payment if you need clarification about the deposit, cancellation terms, or supplier conditions attached to your booking.",
            primaryLabel: "Contact Our Team",
            primaryHref: "/contact",
            secondaryLabel: "Plan a Tailor-Made Trip",
            secondaryHref: "/tailor-made",
          }}
        />
      </main>
      <FooterOne />
    </Layout>
  );
}
