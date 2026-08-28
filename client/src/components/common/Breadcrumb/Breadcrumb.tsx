import Link from "next/link";
import { getSeoBaseUrl } from "@/lib/url";

/**
 * The site's breadcrumb trail — one implementation, used everywhere.
 *
 * It lived inside PageHeader, which is fine until a page wants the trail
 * WITHOUT the rest of that component (the full-bleed photographic banner and
 * the <h1> it draws). The author page needed exactly that and got a
 * hand-copied `<ul className="gotur-breadcrumb">` instead — which promptly
 * drifted: the copy hard-coded the English word "Home" and so printed it on
 * the German and Spanish pages too, where the site says "Startseite" and
 * "Inicio". One trail, one place to fix it.
 *
 * ── No hooks on purpose ──
 * PageHeader is a client component; the author page is a Server Component.
 * Taking `homeLabel` and `locale` as props instead of reading them from
 * `useTranslation`/`useParams` lets both render this without the server page
 * having to pull in client JavaScript for a list of three links.
 *
 * ── The trail and its schema come from the same array ──
 * `BreadcrumbList` used to be hand-written next to the markup on the handful
 * of pages that bothered — five, against eighteen using PageHeader — so the
 * two could disagree about the very same trail. Emitting it from the items
 * being rendered means they cannot, and every page with a trail gets the
 * markup for free.
 *
 * ── Styling ──
 * `.gotur-breadcrumb` in gotur.css remains the single source: white links, the
 * gold current page, and the "\e917" icomoon chevron between items. Nothing is
 * restyled here — a caller that needs different alignment or scale passes
 * `className` and overrides that one property.
 */

export type BreadcrumbItem = {
  label: string;
  /** Omit for the current page, which renders as text rather than a link. */
  href?: string;
};

interface BreadcrumbProps {
  /** Locale prefix for the Home link. A bare "/" 307s and can drop the visitor's language. */
  locale: string;
  /** Localized label for the first item — `t("home")` from the `common` namespace. */
  homeLabel: string;
  items?: BreadcrumbItem[];
  /** Localized name for the landmark, e.g. `t("breadcrumb")`. */
  ariaLabel?: string;
  /** Applied to the <nav>, for alignment or scale overrides. */
  className?: string;
  /** Absolute URL of the current page, for the last schema entry. Optional. */
  currentUrl?: string;
  /** Opt out where the page already publishes its own BreadcrumbList. */
  jsonLd?: boolean;
}

/**
 * Google needs an `item` URL on every entry except the last. An entry with no
 * href in the middle of the trail therefore cannot be expressed, so it is
 * dropped from the SCHEMA (it stays in the visible trail): "Authors" is a real
 * step for a reader even though this site has no authors index to link to.
 */
function buildBreadcrumbJsonLd(
  homeUrl: string,
  homeLabel: string,
  items: BreadcrumbItem[],
  currentUrl?: string
) {
  const trail: { name: string; url?: string }[] = [
    { name: homeLabel, url: homeUrl },
    ...items.map((item, index) => ({
      name: item.label,
      url: item.href
        ? `${getSeoBaseUrl()}${item.href.startsWith("/") ? item.href : `/${item.href}`}`
        : index === items.length - 1
          ? currentUrl
          : undefined,
    })),
  ];

  const usable = trail.filter((entry, index) => entry.url || index === trail.length - 1);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: usable.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      ...(entry.url ? { item: entry.url } : {}),
    })),
  };
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  locale,
  homeLabel,
  items,
  ariaLabel,
  className = "",
  currentUrl,
  jsonLd = true,
}) => (
  // The landmark goes on a <nav> wrapping the list, not on the <ul> itself:
  // role="navigation" there would strip the list semantics its <li> children
  // depend on.
  <nav aria-label={ariaLabel || "Breadcrumb"} className={className}>
    {jsonLd && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbJsonLd(
              `${getSeoBaseUrl()}/${locale}`,
              homeLabel,
              Array.isArray(items) ? items : [],
              currentUrl
            )
          ),
        }}
      />
    )}
    <ul className="gotur-breadcrumb list-unstyled">
      <li>
        <Link href={`/${locale}`}>{homeLabel}</Link>
      </li>
      {Array.isArray(items)
        ? items.map((item, index) => (
            <li key={`${item.label}-${index}`}>
              {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
            </li>
          ))
        : null}
    </ul>
  </nav>
);

export default Breadcrumb;
