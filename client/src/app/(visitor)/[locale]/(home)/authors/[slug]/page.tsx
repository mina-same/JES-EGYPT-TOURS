import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Col, Container, Row } from 'react-bootstrap';
import { Camera, CheckCircle, Clock, Compass, Landmark, Map, Search, Ticket, Users } from 'lucide-react';
import { API_URL } from '@/config/api';
import { getLocalizedValue } from '@/lib/localize';
import TopbarOne from '@/components/common/TopbarOne/TopbarOne';
import HeaderOne from '@/components/layout/HeaderOne/HeaderOne';
import HeaderOneCloned from '@/components/layout/HeaderOneCloned/HeaderOneCloned';
import Layout from '@/components/layout/Layout/Layout';
import FooterOne from '@/components/layout/FooterOne/FooterOne';
import DynamicBlogGrid from '@/components/sections/DynamicBlogGrid/DynamicBlogGrid';
import AuthorPhoto from '@/components/common/AuthorPhoto/AuthorPhoto';
import type { BlogPost } from '@/lib/api/blog';
import {
  getLocalizedStaticPath,
  getSeoBaseUrl,
  getStrictLocalizedSlug,
  normalizeLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from '@/lib/url';
import { getStaticLocaleAlternates } from '@/lib/seo/localeAlternates';
import { getServerTranslation } from '@/lib/i18n-server';
import { ogSiteDefaults } from '@/lib/ogDefaults';
import styles from './AuthorPage.module.css';

/*
 * THE author route — one page, any author, all four languages.
 *
 * Everything the page shows about a person is author DATA (see
 * server/src/seeds/defaultEditorialAuthor.ts): role, the hero introduction,
 * the biography, the topic chips, the areas of expertise, how they work.
 * Nothing about Madonna is written into this file, so a second author is
 * content rather than code, and every section renders only when that author
 * actually has the field.
 *
 * The house chrome — section eyebrows, headings, button text, the labels on
 * the profile card — comes from the server-only `authors` i18n namespace.
 *
 * No `"use client"`: the whole page is static content, so it ships no
 * JavaScript of its own. The only interactive part is the article grid, which
 * is already a client component of its own.
 */

/** The lucide glyphs an author's cards may name. */
const CARD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  map: Map,
  compass: Compass,
  landmark: Landmark,
  ticket: Ticket,
  search: Search,
  users: Users,
  clock: Clock,
  'check-circle': CheckCircle,
  camera: Camera,
};

/** How many of the newest articles are promoted above the rest. */
const FEATURED_COUNT = 3;
/** Cards per page in the paginated remainder — one full 4-up row per row. */
const PAGE_SIZE = 8;

function toAbsoluteImageUrl(url: unknown): string | undefined {
  if (typeof url !== 'string' || !url.trim()) return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `${getSeoBaseUrl()}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

/** Localized text, or null when this author has nothing for this locale. */
function localizedText(value: unknown, locale: string): string | null {
  const text = getLocalizedValue(value as any, locale);
  return typeof text === 'string' && text.trim() ? text : null;
}

function localizedList(value: unknown, locale: string): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => localizedText(entry, locale))
    .filter((entry): entry is string => Boolean(entry));
}

/** Cards whose heading is missing in this locale are dropped, not left blank. */
function localizedCards(value: unknown, locale: string) {
  if (!Array.isArray(value)) return [];
  return value
    .map((card: any) => ({
      icon: typeof card?.icon === 'string' ? card.icon : '',
      heading: localizedText(card?.heading, locale),
      body: localizedText(card?.body, locale),
    }))
    .filter((card): card is { icon: string; heading: string; body: string | null } =>
      Boolean(card.heading)
    );
}

/**
 * The name to use mid-sentence: "About Madonna", "How Madonna works".
 *
 * Repeating the full name in every heading is the tic that made the old page
 * read like a directory entry — it appeared six times before the first
 * article. The full name belongs in the h1 and in the article-section
 * heading, where it states the author-to-content relationship; everywhere
 * else the given name is what a person would actually write.
 */
function givenName(fullName: string): string {
  return typeof fullName === 'string' ? fullName.trim().split(/\s+/)[0] : '';
}

async function getAuthor(slug: string, locale: string) {
  const response = await fetch(`${API_URL}/blog/authors/${encodeURIComponent(slug)}`, {
    // Uncached, like every other visitor route here: there is no revalidation
    // hook on publish, so a timed cache would keep serving a deactivated author
    // or an unpublished article's card until the window expired.
    cache: 'no-store',
    headers: { 'X-Locale': locale },
  });
  if (!response.ok) return null;
  const payload = await response.json();
  return payload?.data ?? null;
}

/**
 * The languages this author actually has a bio in.
 *
 * Only `en` is required by LocalizedStringSchema, so an author added with no
 * German translation has no German page to offer. This gates BOTH the hreflang
 * map and the route itself — a locale that is not served 404s rather than
 * quietly rendering the English bio under a German URL with a German canonical,
 * the same rule /faq already follows for a language with no questions.
 */
async function getServedLocales(slug: string): Promise<SupportedLocale[]> {
  try {
    const response = await fetch(`${API_URL}/blog/authors/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
      headers: { 'X-Locale': 'bypass' },
    });
    if (!response.ok) return ['en'];
    const payload = await response.json();
    const bio = payload?.data?.bio;
    const served = SUPPORTED_LOCALES.filter(
      (locale) => typeof bio?.[locale] === 'string' && bio[locale].trim().length > 0
    );
    return served.length > 0 ? served : ['en'];
  } catch {
    return ['en'];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const author = await getAuthor(slug, locale);
  if (!author) return {};

  const { t } = await getServerTranslation(locale, 'authors');
  const role = localizedText(author.role, locale);
  const bio = localizedText(author.bio, locale);

  // The API lowercases the slug it looked up, so the canonical is built from
  // the document's own slug — a request for /Authors/Madonna-Roshdey must not
  // canonicalise to that casing.
  const canonicalSlug = typeof author.slug === 'string' ? author.slug : slug;
  const authorPath = `authors/${canonicalSlug}`;
  const pageUrl = `${getSeoBaseUrl()}/${normalizeLocale(locale)}/${authorPath}`;

  const servedLocales = await getServedLocales(canonicalSlug);
  // The page itself 404s for a locale it does not serve, so its metadata must
  // not describe one either.
  if (!servedLocales.includes(normalizeLocale(locale))) return {};

  /*
   * "Madonna Roshdey | Travel Content Editor at Jes Egypt Tours" — not
   * "… at Jes Egypt Tours — Jes Egypt Tours". An author's role is usually
   * written with the employer in it, so appending the brand again says it
   * twice and eats the characters Google actually displays.
   */
  const brand = t('meta.titleSuffix');
  const roleNamesBrand = Boolean(role && role.toLowerCase().includes(brand.toLowerCase()));
  const title = role
    ? `${author.name} | ${role}${roleNamesBrand ? '' : ` — ${brand}`}`
    : `${author.name} | ${brand}`;
  const imageUrl = toAbsoluteImageUrl(author.image?.url);
  const imageAlt = localizedText(author.image?.alt, locale) || author.name;

  return {
    title,
    description: bio || undefined,
    icons: { icon: '/favicon-32x32.png' },
    alternates: getStaticLocaleAlternates(locale, authorPath, servedLocales),
    openGraph: {
      ...ogSiteDefaults(locale),
      type: 'profile',
      title,
      description: bio || undefined,
      url: pageUrl,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: imageAlt }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: bio || undefined,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function EditorialAuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, slug } = await params;
  const author = await getAuthor(slug, locale);
  if (!author) notFound();

  const canonicalSlug = typeof author.slug === 'string' ? author.slug : slug;
  const servedLocales = await getServedLocales(canonicalSlug);
  if (!servedLocales.includes(normalizeLocale(locale))) notFound();

  const { t } = await getServerTranslation(locale, 'authors');
  const first = givenName(author.name);

  const role = localizedText(author.role, locale);
  const bio = localizedText(author.bio, locale);
  const portraitAlt = localizedText(author.image?.alt, locale) || author.name;
  const organisation = localizedText(author.organisation, locale);
  const contentFocus = localizedText(author.contentFocus, locale);
  const languages = localizedText(author.languages, locale);
  const topics = localizedList(author.topics, locale);
  const aboutParagraphs = localizedList(author.about, locale);
  const expertise = localizedCards(author.expertise, locale);
  const approach = localizedCards(author.approach, locale);

  // Two at most. An author page is not a photo gallery — the cap is the point.
  const contextPhotos: { url?: string; alt: string; caption: string | null }[] = (
    Array.isArray(author.contextImages) ? author.contextImages : []
  )
    .slice(0, 2)
    .map((photo: any) => ({
      url: photo?.url as string | undefined,
      alt: localizedText(photo?.alt, locale) || portraitAlt,
      caption: localizedText(photo?.caption, locale),
    }))
    .filter((photo: { url?: string }) => Boolean(photo.url));

  // Fact rows are a list so a row with no value disappears instead of printing
  // a label above a blank.
  const facts = [
    { label: t('facts.roleLabel'), value: role },
    { label: t('facts.organisationLabel'), value: organisation },
    { label: t('facts.focusLabel'), value: contentFocus },
    { label: t('facts.languagesLabel'), value: languages },
  ].filter((fact) => Boolean(fact.value));

  /*
   * Articles, split into the promoted ones and a paginated remainder.
   *
   * The page showed four cards and a link to the whole blog, which sent the
   * reader away from the author's own work — the opposite of what an author
   * page is for. All of it is reachable here now, through the same `?page=`
   * pager every other listing on the site uses, so there is no "browse all
   * articles" escape hatch to add.
   *
   * "Featured" is the editor's own `isFeatured` flag, not the newest three
   * dressed up as a selection. If nothing is flagged, the section does not
   * render and everything falls into one list — which is honest, where
   * promoting three arbitrary articles under a "selected work" heading would
   * be a small editorial lie.
   */
  const allArticles: BlogPost[] = (Array.isArray(author.articles) ? author.articles : []).filter(
    (article: BlogPost) => getStrictLocalizedSlug(article.slug, locale as SupportedLocale)
  );
  const featured = allArticles
    .filter((article: any) => article?.isFeatured === true)
    .slice(0, FEATURED_COUNT);
  const featuredIds = new Set(featured.map((article: any) => article._id));
  const remainder = allArticles.filter((article: any) => !featuredIds.has(article._id));

  const { page: pageParam } = await searchParams;
  const totalPages = Math.max(1, Math.ceil(remainder.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(pageParam ?? '1', 10);
  const currentPage = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages
  );
  const pagedRemainder = remainder.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const baseUrl = getSeoBaseUrl();
  const currentLocale = normalizeLocale(locale);
  const pageUrl = `${baseUrl}/${currentLocale}/authors/${canonicalSlug}`;
  const personImage = toAbsoluteImageUrl(author.image?.url);
  const aboutPagePath = getLocalizedStaticPath('about', currentLocale);

  /*
   * ProfilePage → mainEntity → Person, in the site's existing JSON-LD style:
   * hand-built objects serialised into a <script>, the same as the tour and
   * article pages, and pointing at the same `#travelagency` organisation node
   * SEOProvider publishes. No second schema system.
   *
   * `@id` is the load-bearing part: article pages emit `BlogPosting.author`
   * with this exact id, so every byline on the site and this page resolve to
   * ONE person rather than a fresh anonymous Person per article.
   *
   * There is no `sameAs`: no social profile for this author exists anywhere in
   * the project, and inventing one would be a fabricated identity claim.
   * `knowsAbout` is the visible expertise headings, nothing more.
   */
  const profileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${pageUrl}#profilepage`,
    url: pageUrl,
    inLanguage: currentLocale,
    mainEntity: {
      '@type': 'Person',
      '@id': `${pageUrl}#person`,
      name: author.name,
      url: pageUrl,
      ...(role ? { jobTitle: role } : {}),
      ...(bio ? { description: bio } : {}),
      ...(personImage ? { image: personImage } : {}),
      ...(expertise.length > 0 ? { knowsAbout: expertise.map((card) => card.heading) } : {}),
      worksFor: { '@id': `${baseUrl}/#travelagency` },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/${currentLocale}` },
      { '@type': 'ListItem', position: 2, name: author.name, item: pageUrl },
    ],
  };

  return (
    <Layout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />

      {/* ── Hero ───────────────────────────────────────────────────────
          Replaces the site's stock banner on this page. That banner put a
          full-bleed photograph of a temple behind the author's name, which
          made the biggest thing on a page about a person a picture of
          somewhere she is not — and pushed her portrait below the fold. */}
      <section className={styles.authorHero}>
        <Container>
          <nav className={styles.authorHeroCrumb} aria-label="Breadcrumb">
            <ul className="gotur-breadcrumb list-unstyled">
              <li>
                <Link href={`/${currentLocale}`}>Home</Link>
              </li>
              <li>
                <span>{t('breadcrumb')}</span>
              </li>
              <li>
                <span>{author.name}</span>
              </li>
            </ul>
          </nav>
          <Row className="align-items-center gutter-y-40">
            <Col lg={7}>
              {role && <span className={styles.authorHeroRole}>{role}</span>}
              <h1 className={styles.authorHeroName}>{author.name}</h1>
              {bio && <p className={styles.authorHeroLead}>{bio}</p>}
              {topics.length > 0 && (
                <ul className={styles.authorTopics}>
                  {topics.map((topic) => (
                    <li className={styles.authorTopic} key={topic}>
                      {topic}
                    </li>
                  ))}
                </ul>
              )}
            </Col>
            <Col lg={5} className={styles.authorHeroMedia}>
              <AuthorPhoto
                src={author.image?.url}
                alt={portraitAlt}
                ratio="portrait"
                priority
                sizes="(max-width: 992px) 320px, 40vw"
                className={styles.authorHeroPortrait}
                placeholderLabel={t('hero.portraitPending')}
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── About ──────────────────────────────────────────────────────
          Biography left, quick-profile card right. The old page repeated the
          role and the name here, immediately under a hero that had just said
          both. */}
      {aboutParagraphs.length > 0 && (
        <section className={styles.authorAbout}>
          <Container>
            <Row className="gutter-y-40">
              <Col lg={7}>
                <div className="section-title mb-4">
                  <h2 className="section-title__title">
                    {t('about.headingPrefix')} {first}
                  </h2>
                </div>
                {aboutParagraphs.map((paragraph, index) => (
                  <p className={styles.authorAboutText} key={index}>
                    {paragraph}
                  </p>
                ))}
              </Col>
              <Col lg={5}>
                {facts.length > 0 && (
                  <div className={styles.authorFactsCard}>
                    <h3 className={styles.authorFactsHeading}>{t('facts.heading')}</h3>
                    {facts.map((fact) => (
                      <div className={styles.authorFactsRow} key={fact.label}>
                        <span className={styles.authorFactsLabel}>{fact.label}</span>
                        <span className={styles.authorFactsValue}>{fact.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Col>
            </Row>
          </Container>
        </section>
      )}

      {/* ── Areas of expertise ─────────────────────────────────────────
          Four cards, so the row closes. The previous five left a hole in the
          last column, and the fifth was "People-first content" — an editorial
          stance, not a subject. It moved into the approach section below. */}
      {expertise.length > 0 && (
        <section className="section-space">
          <Container>
            <div className="section-title text-center mb-5">
              <span className="sec-title__tagline">{t('expertise.tagline')}</span>
              <h2 className="section-title__title">{t('expertise.title')}</h2>
            </div>
            <Row className="gutter-y-30">
              {expertise.map((card) => {
                const Icon = CARD_ICONS[card.icon];
                return (
                  <Col lg={3} md={6} key={card.heading}>
                    <div className={styles.expertiseCard}>
                      {Icon && (
                        <span className={styles.expertiseCardIcon} aria-hidden="true">
                          <Icon />
                        </span>
                      )}
                      <h3 className={styles.expertiseCardHeading}>{card.heading}</h3>
                      {card.body && <p className={styles.expertiseCardBody}>{card.body}</p>}
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Container>
        </section>
      )}

      {/* ── Behind the content ─────────────────────────────────────────
          Two photographs, each captioned to say why it is here. The section
          disappears entirely for an author who has none, rather than holding
          open empty frames on a finished page. */}
      {contextPhotos.length > 0 && (
        <section className="section-space pt-0">
          <Container>
            <div className="section-title text-center mb-5">
              <span className="sec-title__tagline">{t('context.tagline')}</span>
              <h2 className="section-title__title">{t('context.title')}</h2>
            </div>
            <Row className="gutter-y-30 justify-content-center">
              {contextPhotos.map((photo) => (
                <Col lg={5} md={6} key={photo.url}>
                  {/* <figure>/<figcaption> rather than a div and a p: the
                      caption is tied to the image in the document, which is
                      what a screen reader and an image crawler both read. */}
                  <figure className={styles.contextFigure}>
                    <AuthorPhoto
                      src={photo.url}
                      alt={photo.alt}
                      ratio="portrait"
                      sizes="(max-width: 768px) 100vw, (max-width: 992px) 50vw, 40vw"
                    />
                    {photo.caption && (
                      <figcaption className={styles.contextCaption}>{photo.caption}</figcaption>
                    )}
                  </figure>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* ── How she works ──────────────────────────────────────────────
          The navy block the page already had. Its surface is unchanged; its
          subject moved from the site's editorial policy to this author's
          working method, which is what belongs on a page about a person. */}
      {approach.length > 0 && (
        <section className={styles.authorApproach}>
          <Container>
            <Row>
              <Col lg={10} className="mx-auto">
                <span className={`sec-title__tagline ${styles.authorApproachTagline} d-block mb-3`}>
                  {t('approach.tagline')}
                </span>
                <h2 className={styles.authorApproachHeading}>
                  {[t('approach.headingPrefix'), first, t('approach.headingSuffix')]
                    .filter(Boolean)
                    .join(' ')}
                </h2>
                <p className={styles.authorApproachLead}>{t('approach.lead')}</p>
                <Row className="gutter-y-0">
                  {approach.map((item) => {
                    const Icon = CARD_ICONS[item.icon];
                    return (
                      <Col lg={6} key={item.heading}>
                        <div className={styles.approachItem}>
                          {Icon && (
                            <span className={styles.approachItemIcon} aria-hidden="true">
                              <Icon />
                            </span>
                          )}
                          <div>
                            <h3 className={styles.approachItemHeading}>{item.heading}</h3>
                            {item.body && <p className={styles.approachItemBody}>{item.body}</p>}
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </Col>
            </Row>
          </Container>
        </section>
      )}

      {/* ── Featured articles ──────────────────────────────────────────
          Named for the relationship: these are HERS. The heading used to read
          "Related content / Egypt travel articles", which said nothing an
          author page exists to say. */}
      {featured.length > 0 && (
        <section className="section-space">
          <Container>
            <div className="section-title text-center mb-5">
              <span className="sec-title__tagline">{t('articles.featuredTagline')}</span>
              <h2 className="section-title__title">
                {t('articles.allPrefix')} {author.name}
              </h2>
            </div>
          </Container>
          {/* The full card, not the reduced `featured` skin. That skin is an
              image and a title, which made the promoted articles read as LESS
              important than the ordinary ones below them — the hierarchy
              upside down. Both rows use the site's standard blog card now, so
              they share one image ratio, date treatment and hover. */}
          <DynamicBlogGrid blogs={featured} variant="standard" />
        </section>
      )}

      {/* ── Everything else, paginated ─────────────────────────────────
          The site's own listing component and its own `?page=` pager, so this
          page IS the author's archive. */}
      {remainder.length > 0 && (
        <section className="section-space pt-0">
          <Container>
            <div className="section-title text-center mb-5">
              <span className="sec-title__tagline">{t('articles.latestTagline')}</span>
              <h2 className="section-title__title">
                {t('articles.latestPrefix')} {first}
              </h2>
            </div>
          </Container>
          <DynamicBlogGrid
            blogs={pagedRemainder}
            variant="standard"
            basePath={`/${currentLocale}/authors/${canonicalSlug}`}
            pagination={{
              page: currentPage,
              limit: PAGE_SIZE,
              total: remainder.length,
              pages: totalPages,
            }}
          />
        </section>
      )}

      {/* ── Publisher ──────────────────────────────────────────────────
          One line. It used to be a panel with a gold label and a company
          strapline, closing a page about a person with a note about the
          company. */}
      <section className={styles.authorPublisher}>
        <Container>
          <p className={styles.authorPublisherText}>
            {t('publisher.text')} <Link href={aboutPagePath}>{t('publisher.aboutLink')}</Link>
          </p>
        </Container>
      </section>

      <FooterOne />
    </Layout>
  );
}
