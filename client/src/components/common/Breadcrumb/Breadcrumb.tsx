import Link from "next/link";
import { getSeoBaseUrl } from "@/lib/url";
import { serializeJsonLd } from "@/lib/seo/serializeJsonLd";

/**
 * The site's breadcrumb trail — one implementation, used everywhere.
 *
 * It lived inside PageHeader, which is fine until a page wants the trail
 * WITHOUT the rest of that component (the full-bleed photographic banner and
 * the <h1> it draws). The author page needed exactly that and got a
 * hand-copied list instead — which promptly
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
 * ── One look ──
 * The trail is a glass capsule: a rounded, blurred bar with "/" separators,
 * which stays readable over any hero photograph. There used to be a second
 * skin, the theme's chevron trail in bright gold set straight on the photo,
 * under the page banners; every page now draws the capsule. `onLight` changes
 * its colours only, for the one hero that is pale rather than a photograph.
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
  /**
   * The capsule sits on a pale background (the travel-trade hero) instead of
   * a photograph: dark text, and a dark tint in place of the white glass,
   * which would vanish on white. Same shape and layout.
   */
  onLight?: boolean;
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
  onLight = false,
}) => {
  const list = Array.isArray(items) ? items : [];

  /*
   * Only the LAST unlinked item is the page being viewed. An unlinked item
   * earlier in the trail ("Authors", which has no index page) is a step, not
   * the current page, so it must not announce itself as one.
   */
  const isCurrent = (item: BreadcrumbItem, index: number) =>
    !item.href && index === list.length - 1;

  /*
   * The schema is a SIBLING of the <nav>, not a child of it.
   *
   * A <script> inside the landmark is valid and invisible, but it lands in the
   * element's textContent — so anything reading the trail as text (a test, a
   * scraper, a future component) gets a wall of JSON before the first crumb.
   */
  const schema = jsonLd ? (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(
          buildBreadcrumbJsonLd(`${getSeoBaseUrl()}/${locale}`, homeLabel, list, currentUrl)
        ),
      }}
    />
  ) : null;

  // Every crumb is one line that ends in "…" when its column is narrower than
  // its text. `leading-6` is the "/" separator's line height: without it a
  // trail of Home alone, which has no separator, made a capsule 4px shorter
  // than every other page's.
  const crumbClass = "min-w-0 truncate text-sm leading-6";

  // Colours only; every class is written out whole so Tailwind can find it.
  // The current page's dark bronze on the pale capsule keeps the gold idea
  // at 4.5:1 contrast, which the photo capsule's lighter gold could not.
  const colors = onLight
    ? {
        capsule: "bg-[#0f2433]/[0.04] border-[#0f2433]/[0.12]",
        link: "text-[#4f5b63] hover:text-[#0f2433]",
        step: "text-[#4f5b63]",
        separator: "text-[#0f2433]/30",
        current: "text-[#7a5e24]",
      }
    : {
        capsule: "bg-white/10 border-white/20",
        link: "text-white/80 hover:text-white",
        step: "text-white/80",
        separator: "text-white/40",
        current: "text-[#b79c5c]",
      };
  const linkClass = `${crumbClass} ${colors.link} transition-colors`;

  return (
    <>
      {schema}
      {/* A one-row grid rather than a list: the "/" separators are content
          between the items.

          ── Why a grid ──
          The columns alternate crumb, separator, crumb… A crumb's column is
          `minmax(0, max-content)`: on a wide screen every crumb is as wide
          as its text and the capsule hugs them. When the row is too narrow,
          the space is dealt out EQUALLY, each crumb taking its share until
          its text fits — short crumbs stay whole and the long ones split
          what is left. As a flex row the links never shrank, so on a phone
          the article title got only the leftovers: one clipped letter, or
          nothing, and a fixed 350px cap cut it on a desktop with room to
          spare.

          ── `border-[1px]` and `px-[1rem]`, not `border` and `px-4` ──
          Bootstrap is loaded too, and its `.border` and `.px-4` are
          `!important`: they turned the 20%-white border into an opaque grey
          one and the 16px padding into 24px. The arbitrary-value classes
          say the same thing under names Bootstrap does not have. */}
      <nav
        aria-label={ariaLabel || "Breadcrumb"}
        className={`inline-grid grid-flow-col auto-cols-[minmax(0,max-content)_max-content] items-center gap-2 px-[1rem] py-2 rounded-full backdrop-blur-md border-[1px] ${colors.capsule} max-w-full overflow-hidden whitespace-nowrap ${className}`.trim()}
      >
        <Link href={`/${locale}`} className={linkClass}>
          {homeLabel}
        </Link>
        {list.map((item, index) => (
          <span key={`${item.label}-${index}`} className="contents">
            {/* Decoration: without aria-hidden a screen reader says "slash"
                between every two crumbs. */}
            <span aria-hidden="true" className={colors.separator}>/</span>
            {item.href ? (
              <Link href={item.href} className={linkClass} title={item.label}>
                {item.label}
              </Link>
            ) : isCurrent(item, index) ? (
              // The current page: gold and bold.
              <span
                className={`${crumbClass} font-bold ${colors.current}`}
                title={item.label}
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              // A step with no page to link to: drawn like the links around
              // it, not like the current page.
              <span className={`${crumbClass} ${colors.step}`} title={item.label}>
                {item.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
};

export default Breadcrumb;
