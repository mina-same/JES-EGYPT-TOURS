import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Col, Container, Row } from 'react-bootstrap';
import { API_URL } from '@/config/api';
import { getLocalizedValue } from '@/lib/localize';
import TopbarOne from '@/components/common/TopbarOne/TopbarOne';
import HeaderOne from '@/components/layout/HeaderOne/HeaderOne';
import HeaderOneCloned from '@/components/layout/HeaderOneCloned/HeaderOneCloned';
import Layout from '@/components/layout/Layout/Layout';
import PageHeader from '@/components/sections/PageHeader/PageHeader';
import FooterOne from '@/components/layout/FooterOne/FooterOne';
import DynamicBlogGrid from '@/components/sections/DynamicBlogGrid/DynamicBlogGrid';
import type { BlogPost } from '@/lib/api/blog';
import {
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
 * THE author route. There is no per-author page any more.
 *
 * `madonna-roshdey` used to have a route folder of its own, 300 lines of JSX
 * with every sentence written in English inside the markup. It shadowed this
 * route (a literal segment wins over `[slug]`), so the localized, data-driven
 * page was unreachable for the only author that existed, and /de /it /es served
 * English.
 *
 * Everything that page hard-coded is author DATA now — role, bio, the About
 * narrative, the fact rows, the editorial-focus cards, the articles note — and
 * every section below renders only if the author has that field. Adding an
 * author is therefore content, not code: fill in as much as is written and the
 * page adapts. What stays in the `authors` i18n namespace is only house
 * chrome: section labels, button text, and the content-standards block, which
 * describes how the SITE works rather than who the author is.
 */

/**
 * Absolute URL for an image the API returned.
 *
 * `image.url` is a plain string with no shape enforced, so it is a site-relative
 * path today and could be a CDN URL tomorrow. Blindly prefixing the origin turns
 * the second kind into `https://www.jesegypttours.comhttps://cdn…`, which breaks
 * both the OG image and the Person image.
 */
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

/** A localized list, dropping the entries this locale has no text for. */
function localizedList(value: unknown, locale: string): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => localizedText(entry, locale))
    .filter((entry): entry is string => Boolean(entry));
}

/**
 * The author document as the API returns it for ONE locale: `localizePreservingSlugs`
 * has already flattened `role`, `bio` and the rest to plain strings.
 */
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
 * which is the same rule /faq already follows for a language with no questions.
 *
 * Asking for the raw (`bypass`) document is the only way to see all four
 * languages at once — the localized response has already collapsed to one. On
 * any failure this falls back to English alone, which advertises less than the
 * truth rather than more.
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
   * "Madonna Roshdey | Travel Specialist at Jes Egypt Tours" — not
   * "… at Jes Egypt Tours — Jes Egypt Tours".
   *
   * An author's role is usually written with the employer in it ("Travel
   * Specialist AT Jes Egypt Tours", "Reisespezialistin BEI Jes Egypt Tours"),
   * so appending the brand again says it twice in one title and eats the
   * character budget that Google actually displays. The suffix is only added
   * when the role has not already named the site.
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
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const author = await getAuthor(slug, locale);
  if (!author) notFound();

  const canonicalSlug = typeof author.slug === 'string' ? author.slug : slug;

  // A language this author has no bio in gets no page, rather than the English
  // bio served under a localized URL that claims to be that language.
  const servedLocales = await getServedLocales(canonicalSlug);
  if (!servedLocales.includes(normalizeLocale(locale))) notFound();

  const { t } = await getServerTranslation(locale, 'authors');

  const role = localizedText(author.role, locale);
  const bio = localizedText(author.bio, locale);
  const imageAlt = localizedText(author.image?.alt, locale) || author.name;
  const organisation = localizedText(author.organisation, locale);
  const contentFocus = localizedText(author.contentFocus, locale);
  const languages = localizedText(author.languages, locale);
  const aboutTitle = localizedText(author.aboutTitle, locale);
  const aboutParagraphs = localizedList(author.about, locale);
  const articlesNote = localizedText(author.articlesNote, locale);

  const focusCards = (Array.isArray(author.editorialFocus) ? author.editorialFocus : [])
    .map((card: any) => ({
      icon: typeof card?.icon === 'string' ? card.icon : '',
      heading: localizedText(card?.heading, locale),
      body: localizedText(card?.body, locale),
    }))
    // A card with no heading in this language has nothing to show; an empty
    // tile in a grid reads as a rendering fault, not as untranslated copy.
    .filter((card: { heading: string | null }) => Boolean(card.heading));

  // Fact rows are built as a list so a row with no value simply does not
  // appear, instead of printing a label above a blank.
  const facts = [
    { label: t('facts.roleLabel'), value: role },
    { label: t('facts.organisationLabel'), value: organisation },
    { label: t('facts.focusLabel'), value: contentFocus },
    { label: t('facts.languagesLabel'), value: languages },
  ].filter((fact) => Boolean(fact.value));

  const articles: BlogPost[] = Array.isArray(author.articles) ? author.articles : [];
  const visibleArticles = articles
    .filter((article) => getStrictLocalizedSlug(article.slug, locale as SupportedLocale))
    .slice(0, 4);

  const baseUrl = getSeoBaseUrl();
  const pageUrl = `${baseUrl}/${normalizeLocale(locale)}/authors/${canonicalSlug}`;
  const personImage = toAbsoluteImageUrl(author.image?.url);

  /*
   * `@id` is what ties this page to the bylines: article pages emit
   * `BlogPosting.author` with this same id, so every article and this page
   * resolve to ONE person in the graph rather than a fresh anonymous Person
   * per article.
   *
   * Every claim here is visible on the page too — jobTitle, description and
   * knowsAbout are the same strings rendered below — because structured data
   * that asserts more than the page shows is the kind Google discounts.
   */
  const profileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${pageUrl}#profilepage`,
    url: pageUrl,
    inLanguage: normalizeLocale(locale),
    mainEntity: {
      '@type': 'Person',
      '@id': `${pageUrl}#person`,
      name: author.name,
      url: pageUrl,
      ...(role ? { jobTitle: role } : {}),
      ...(bio ? { description: bio } : {}),
      ...(personImage ? { image: personImage } : {}),
      ...(focusCards.length > 0
        ? { knowsAbout: focusCards.map((card: { heading: string | null }) => card.heading) }
        : {}),
      worksFor: { '@id': `${baseUrl}/#travelagency` },
    },
  };

  // The visible breadcrumb shows an "Authors" step, but there is no /authors
  // index for it to link to, and every ListItem but the last needs an `item`
  // URL to be valid — so the trail here is Home → the author.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/${normalizeLocale(locale)}` },
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
      {/* The header background is the site's stock banner, not a picture of
          this author — the author's own portrait is in the section below. It
          carries nothing a screen reader needs, so it is marked decorative. */}
      <PageHeader
        title={author.name}
        subTitle={role || undefined}
        breadcrumbs={[{ label: t('breadcrumb') }]}
        decorativeBackground
      />

      {/* ── Portrait, intro and facts ────────────────────────────────── */}
      <section className="section-space">
        <Container>
          <Row className="align-items-center gutter-y-40">
            <Col lg={5}>
              {author.image?.url && (
                <Image
                  src={author.image.url}
                  alt={imageAlt}
                  title={imageAlt}
                  width={640}
                  height={640}
                  // The portrait is the largest element above the fold here, so
                  // it is the LCP candidate and must not be lazy.
                  priority
                  sizes="(max-width: 992px) 100vw, 40vw"
                  className={styles.authorPortrait}
                />
              )}
              {facts.length > 0 && (
                <div className={`${styles.authorBioCard} ${styles.authorBioCardUnderPortrait}`}>
                  {facts.map((fact) => (
                    <div className={styles.authorBioCardRow} key={fact.label}>
                      <span className={styles.authorBioCardLabel}>{fact.label}</span>
                      <span className={styles.authorBioCardValue}>{fact.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </Col>
            <Col lg={7}>
              {role && <span className={styles.authorIntroRole}>{role}</span>}
              {/* PageHeader already renders this page's <h1> with the author's
                  name; a second one here gave every locale two competing h1s
                  saying the same thing. */}
              <p className={styles.authorIntroName}>{author.name}</p>
              {bio && <p className={styles.authorIntroLead}>{bio}</p>}
              <Link href={`/${locale}/blogs`} className={`gotur-btn ${styles.authorIntroCta}`}>
                {t('intro.cta')}
                <span className="icon">
                  <i className="icon-right"></i>
                </span>
              </Link>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── About ────────────────────────────────────────────────────── */}
      {aboutParagraphs.length > 0 && (
        <section className={styles.authorAbout}>
          <Container>
            <Row>
              <Col lg={8} className="mx-auto">
                <div className="section-title text-center mb-5">
                  <span className="section-title__tagline">{t('about.tagline')}</span>
                  {aboutTitle && <h2 className="section-title__title">{aboutTitle}</h2>}
                </div>
                {aboutParagraphs.map((paragraph, index) => (
                  <p className={styles.authorAboutText} key={index}>
                    {paragraph}
                  </p>
                ))}
              </Col>
            </Row>
          </Container>
        </section>
      )}

      {/* ── Editorial focus ──────────────────────────────────────────── */}
      {focusCards.length > 0 && (
        <section className="section-space">
          <Container>
            <div className="section-title text-center mb-5">
              <span className="section-title__tagline">{t('focus.tagline')}</span>
              <h2 className="section-title__title">{t('focus.title')}</h2>
            </div>
            <Row className="gutter-y-30">
              {focusCards.map((card: { icon: string; heading: string | null; body: string | null }) => (
                <Col lg={4} md={6} key={card.heading as string}>
                  <div className={styles.focusCard}>
                    {card.icon && (
                      <div className={styles.focusCardIcon} aria-hidden="true">
                        {card.icon}
                      </div>
                    )}
                    <h3 className={styles.focusCardHeading}>{card.heading}</h3>
                    {card.body && <p className={styles.focusCardBody}>{card.body}</p>}
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* ── Content standards ────────────────────────────────────────────
          House policy, not author data: it describes how the site's editorial
          process works, so it is identical for every author and lives in the
          i18n namespace. */}
      <section className={styles.authorStandards}>
        <Container>
          <Row>
            <Col lg={8} className="mx-auto">
              <span className={`section-title__tagline ${styles.authorStandardsTagline} d-block mb-3`}>
                {t('standards.tagline')}
              </span>
              <h2 className={styles.standardsBlockHeading}>{t('standards.title')}</h2>
              <p className={styles.standardsBlockText}>{t('standards.p1')}</p>
              <p className={styles.standardsBlockText}>{t('standards.p2')}</p>
              <div className={styles.standardsBlockTrust}>
                <span className={styles.standardsBlockTrustLabel}>{t('standards.publishedByLabel')}</span>
                <span className={styles.standardsBlockTrustValue}>{t('standards.publishedByValue')}</span>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Related content ──────────────────────────────────────────── */}
      <section className="section-space">
        <Container>
          <div className="section-title text-center mb-5">
            <span className="section-title__tagline">{t('related.tagline')}</span>
            <h2 className="section-title__title">
              {t('related.articlesByPrefix')} {author.name}
            </h2>
          </div>
          {visibleArticles.length > 0 && (
            <div className="mb-5">
              <DynamicBlogGrid blogs={visibleArticles} variant="featured" />
            </div>
          )}
          <Row>
            <Col lg={8} className="mx-auto text-center">
              {articlesNote && <p className={styles.authorArticlesNote}>{articlesNote}</p>}
              <div className={styles.authorArticlesActions}>
                <Link href={`/${locale}/blogs`} className="gotur-btn">
                  {t('related.cta')}
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
