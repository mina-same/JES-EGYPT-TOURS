import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Bus,
  Check,
  CheckCircle2,
  Compass,
  Globe2,
  Handshake,
  Headphones,
  Hotel,
  Landmark,
  Languages,
  LifeBuoy,
  MapPin,
  MapPinned,
  MessageSquareText,
  PlaneTakeoff,
  Route,
  ShieldCheck,
  ShipWheel,
  UserRoundSearch,
  Users,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { footerOneData } from "@/data/footerOneData";
import { localizeInternalUrl, type SupportedLocale } from "@/lib/url";
import enStrings from "@/i18n/locales/en/travelTrade.json";
import TravelTradeCtaButton from "./TravelTradeCtaButton";
import TravelTradeFaq from "./TravelTradeFaq";
import TravelTradeInquiryForm from "./TravelTradeInquiryForm";
import { TRAVEL_TRADE_SERVICES_ID } from "./types";
import styles from "../TravelTradePage.module.css";

type TravelTradeDictionary = typeof enStrings;

interface TravelTradeContentProps {
  dictionary: TravelTradeDictionary;
  locale: SupportedLocale;
}

const audienceIcons: LucideIcon[] = [
  Building2,
  Bus,
  UserRoundSearch,
  Users,
  BriefcaseBusiness,
  Globe2,
];

const serviceIcons: LucideIcon[] = [PlaneTakeoff, Compass, Hotel, Workflow];

const benefitIcons: LucideIcon[] = [
  MapPinned,
  Route,
  MessageSquareText,
  UsersRound,
  Languages,
  LifeBuoy,
];

const hubIcons: LucideIcon[] = [Compass, Landmark, ShipWheel];

const hubLinkPaths: Record<
  string,
  Record<SupportedLocale, string>
> = {
  privateTours: {
    en: "/en/luxury-egypt-tours",
    de: "/de/luxusreisen-aegypten",
    it: "/it/tour-lusso-egitto",
    es: "/es/viajes-lujo-egipto",
  },
  tourPackages: {
    en: "/en/egypt-tour-packages",
    de: "/de/aegypten-rundreise",
    it: "/it/viaggi-egitto",
    es: "/es/viajes-a-egipto",
  },
  customItineraries: {
    en: "/en/tailor-made",
    de: "/de/individualreise-aegypten",
    it: "/it/viaggio-su-misura",
    es: "/es/viaje-a-medida",
  },
  groupTours: {
    en: "/en/egypt-classic-tours",
    de: "/de/aegypten-klassische-rundreisen",
    it: "/it/tour-egitto-classico",
    es: "/es/viaje-clasico-egipto",
  },
  cairoTours: {
    en: "/en/cairo-day-tours",
    de: "/de/kairo-tagestouren",
    it: "/it/tour-al-cairo",
    es: "/es/tours-el-cairo",
  },
  gizaTours: {
    en: "/en/giza",
    de: "/de/gizeh",
    it: "/it/giza",
    es: "/es/guiza",
  },
  luxorTours: {
    en: "/en/luxor",
    de: "/de/luxor",
    it: "/it/luxor",
    es: "/es/luxor",
  },
  aswanTours: {
    en: "/en/aswan-tours",
    de: "/de/aswan-touren",
    it: "/it/tour-di-aswan",
    es: "/es/tours-en-asuan",
  },
  nileCruises: {
    en: "/en/egypt-nile-cruises",
    de: "/de/nilkreuzfahrt-aegypten",
    it: "/it/crociera-sul-nilo-egitto",
    es: "/es/crucero-por-el-nilo-egipto",
  },
  alexandriaTours: {
    en: "/en/alexandria",
    de: "/de/alexandria",
    it: "/it/alessandria",
    es: "/es/alejandria",
  },
  redSeaTours: {
    en: "/en/hurghada",
    de: "/de/hurghada",
    it: "/it/hurghada",
    es: "/es/hurghada",
  },
  airportTransfers: {
    en: "/en/contact?service=airport-transfers",
    de: "/de/kontakt?service=airport-transfers",
    it: "/it/contatti?service=airport-transfers",
    es: "/es/contacto?service=airport-transfers",
  },
};

export default function TravelTradeContent({
  dictionary: copy,
  locale,
}: TravelTradeContentProps) {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="travel-trade-title">
        <div className="container">
          <nav className={styles.breadcrumb} aria-label={copy.breadcrumb.ariaLabel}>
            <ol>
              <li>
                <Link href={`/${locale}`}>{copy.breadcrumb.home}</Link>
              </li>
              <li aria-current="page">{copy.breadcrumb.current}</li>
            </ol>
          </nav>

          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <span className={styles.eyebrow}>{copy.hero.eyebrow}</span>
              <h1 id="travel-trade-title">{copy.hero.title}</h1>
              <p className={styles.heroLead}>{copy.hero.text}</p>

              <div className={styles.heroActions}>
                <TravelTradeCtaButton
                  intent="b2b-rates"
                  label={copy.hero.primaryCta}
                  className={styles.primaryButton}
                />
                <TravelTradeCtaButton
                  targetId={TRAVEL_TRADE_SERVICES_ID}
                  label={copy.hero.secondaryCta}
                  className={styles.secondaryButton}
                />
              </div>

              <ul className={styles.trustPoints}>
                {copy.hero.trustPoints.map((point) => (
                  <li key={point}>
                    <CheckCircle2 size={17} aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.heroImage}>
                <Image
                  src="/images/travel-trade/happy-travelers-jumping-at-giza-pyramids-egypt.webp"
                  alt={copy.hero.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 991px) 100vw, 44vw"
                />
              </div>
              <div className={styles.operationsCard}>
                <span className={styles.operationsIcon}>
                  <Headphones size={22} aria-hidden="true" />
                </span>
                <div>
                  <strong>{copy.hero.cardTitle}</strong>
                  <span>{copy.hero.cardText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="trade-audience-title">
        <div className="container">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>{copy.audience.eyebrow}</span>
            <h2 id="trade-audience-title">{copy.audience.title}</h2>
            <p>{copy.audience.intro}</p>
          </div>
          <div className={styles.audienceGrid}>
            {copy.audience.items.map((item, index) => {
              const Icon = audienceIcons[index] ?? Building2;
              return (
                <article className={styles.audienceCard} key={item.title}>
                  <span className={styles.cardIcon}>
                    <Icon size={24} aria-hidden="true" />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id={TRAVEL_TRADE_SERVICES_ID}
        className={`${styles.section} ${styles.servicesSection}`}
        aria-labelledby="trade-services-title"
      >
        <div className="container">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>{copy.services.eyebrow}</span>
            <h2 id="trade-services-title">{copy.services.title}</h2>
            <p>{copy.services.intro}</p>
          </div>
          <div className={styles.servicesGrid}>
            {copy.services.categories.map((category, index) => {
              const Icon = serviceIcons[index] ?? Workflow;
              return (
                <article className={styles.serviceCard} key={category.title}>
                  <div className={styles.serviceCardHeader}>
                    <span>
                      <Icon size={23} aria-hidden="true" />
                    </span>
                    <h3>{category.title}</h3>
                  </div>
                  <ul>
                    {category.items.map((item) => (
                      <li key={item}>
                        <Check size={16} aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="trade-benefits-title">
        <div className="container">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>{copy.benefits.eyebrow}</span>
            <h2 id="trade-benefits-title">{copy.benefits.title}</h2>
          </div>
          <div className={styles.benefitsGrid}>
            {copy.benefits.items.map((item, index) => {
              const Icon = benefitIcons[index] ?? BadgeCheck;
              return (
                <article className={styles.benefitItem} key={item.title}>
                  <span className={styles.benefitIcon}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.protectionSection}`}
        aria-labelledby="client-protection-title"
      >
        <div className="container">
          <div className={styles.protectionGrid}>
            <div>
              <span className={styles.darkEyebrow}>{copy.protection.eyebrow}</span>
              <h2 id="client-protection-title">{copy.protection.title}</h2>
              <p>{copy.protection.text}</p>
              <p className={styles.protectionNote}>{copy.protection.note}</p>
            </div>
            <div className={styles.protectionCard}>
              <span className={styles.shieldIcon}>
                <ShieldCheck size={30} aria-hidden="true" />
              </span>
              <ul>
                {copy.protection.points.map((point) => (
                  <li key={point}>
                    <Check size={17} aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="trade-process-title">
        <div className="container">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>{copy.process.eyebrow}</span>
            <h2 id="trade-process-title">{copy.process.title}</h2>
          </div>
          <ol className={styles.processList}>
            {copy.process.steps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.capabilitiesSection}`}
        aria-labelledby="trade-capabilities-title"
      >
        <div className="container">
          <div className={styles.capabilitiesGrid}>
            <div className={styles.capabilitiesIntro}>
              <span className={styles.eyebrow}>{copy.capabilities.eyebrow}</span>
              <h2 id="trade-capabilities-title">{copy.capabilities.title}</h2>
              <p>{copy.capabilities.intro}</p>
              <div className={styles.rateNote}>
                <Handshake size={23} aria-hidden="true" />
                <p>{copy.capabilities.note}</p>
              </div>
            </div>
            <ul className={styles.capabilitiesList}>
              {copy.capabilities.items.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={19} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="trade-coverage-title">
        <div className="container">
          <div className={styles.sectionHeading}>
            <span className={styles.eyebrow}>{copy.coverage.eyebrow}</span>
            <h2 id="trade-coverage-title">{copy.coverage.title}</h2>
            <p>{copy.coverage.intro}</p>
          </div>
          <ul className={styles.destinationList}>
            {copy.coverage.destinations.map((destination) => (
              <li key={destination}>
                <MapPin size={17} aria-hidden="true" />
                <span>{destination}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.hubSection}`}
        aria-labelledby="dmc-journey-hub-title"
      >
        <div className="container">
          <div className={`${styles.sectionHeading} ${styles.hubHeading}`}>
            <span className={styles.darkEyebrow}>{copy.journeyHub.eyebrow}</span>
            <h2 id="dmc-journey-hub-title">{copy.journeyHub.title}</h2>
            <p>{copy.journeyHub.intro}</p>
          </div>

          <div className={styles.hubGrid}>
            {copy.journeyHub.groups.map((group, index) => {
              const Icon = hubIcons[index] ?? Compass;

              return (
                <article className={styles.hubCard} key={group.title}>
                  <span className={styles.hubIcon}>
                    <Icon size={25} aria-hidden="true" />
                  </span>
                  <h3>{group.title}</h3>
                  <p>{group.text}</p>
                  <nav aria-label={group.title}>
                    <ul className={styles.hubLinks}>
                      {group.links.map((link) => (
                        <li key={link.key}>
                          <Link
                            href={
                              hubLinkPaths[link.key]?.[locale] ??
                              localizeInternalUrl("/", locale)
                            }
                          >
                            <span>{link.label}</span>
                            <ArrowUpRight size={16} aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <TravelTradeInquiryForm
        copy={copy.inquiry}
        locale={locale}
        contactEmail={footerOneData.contact.email}
        contactPhone={footerOneData.contact.phone}
      />

      <TravelTradeFaq copy={copy.faq} />

      <section className={styles.finalCta} aria-labelledby="travel-trade-final-title">
        <div className="container">
          <div className={styles.finalCtaInner}>
            <div>
              <span className={styles.darkEyebrow}>{copy.finalCta.eyebrow}</span>
              <h2 id="travel-trade-final-title">{copy.finalCta.title}</h2>
              <p>{copy.finalCta.text}</p>
            </div>
            <TravelTradeCtaButton
              intent="b2b-rates"
              label={copy.finalCta.button}
              className={styles.finalCtaButton}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
