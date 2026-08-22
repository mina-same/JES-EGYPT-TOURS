"use client";

/**
 * The one article card.
 *
 * It replaces five hand-copied versions of the same markup. They had drifted
 * apart in ways nobody would have chosen deliberately — a bare tag icon that
 * was also an unnamed link, an English month on the German pages, a "read
 * more" link that cost every card four tab stops — and each fix only ever
 * reached the copy someone happened to be looking at.
 *
 * Three skins exist because the site genuinely has three: the card used across
 * the marketing sections (`feature`), the compact card in the strip under an
 * article (`bordered`), and the card on the blog listing (`classic`). They
 * share one surface and differ only in density — media height, title size,
 * padding. `minimal` is the image-and-title strip used where a card would
 * shout, and keeps its own layout entirely.
 *
 * ── Reading order ──
 * Image, TITLE, description, meta rows, divider, call to action. The theme put
 * three lines of grey metadata between the image and the headline, which made
 * the title the fourth thing the eye reached on a card whose whole job is to
 * sell a headline. The article's section moved onto the image as a chip: it is
 * a real link to a real page, it was the item that made the meta row wrap, and
 * it reads better as a label on the photo than as the middle of a list. The
 * publication date moved into the meta rows, where it can carry its year — the
 * theme's date badge showed "30 Jun" with no year, in the heaviest element on
 * the card, over the photograph.
 *
 * ── The description has no fallback ──
 * `cardDescription` is written for the card and nothing else. An article whose
 * editor left it blank shows no description here, deliberately: the field it
 * replaced, `excerpt`, is also the article page's sub-title and the fallback
 * for the meta description, so a card could end up showing prose written to
 * rank in a search result. A visible gap is how an editor learns to write one.
 *
 * ── Links ──
 * ONE anchor to the article: the title, stretched over the whole card by a
 * `::after` in the stylesheet, so the image, the description and the empty
 * space all open the article. It replaced two extra anchors to the same URL —
 * an image overlay with no text at all (the first link to the article in the
 * document, which is the one a search engine weighs) and an aria-hidden "Read
 * More". "Read More" is now a span: it looks like the affordance it always
 * was, and costs no tab stop. The category chip is the only other link, lifted
 * above the stretched layer.
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { BlogCardViewModel } from "@/lib/blog/cardViewModel";

export type BlogCardVariant = "feature" | "bordered" | "classic" | "minimal";

interface BlogCardProps {
  post: BlogCardViewModel;
  variant?: BlogCardVariant;
  sizes?: string;
  /** Skips lazy-loading. Only for cards that can be the LCP element. */
  priority?: boolean;
}

/**
 * Grid cards sit 3-up on desktop, 2-up from the `md` breakpoint, full width
 * below it — the Bootstrap columns every listing wraps them in. A carousel
 * turns over at different widths and passes its own `sizes`.
 */
const DEFAULT_SIZES = "(max-width: 768px) 100vw, (max-width: 992px) 50vw, 33vw";

/**
 * The article's section, as a chip on the photograph. Omitted when the post
 * has neither a sub-category nor a tag — an always-rendered chip left an empty
 * pill sitting on the image.
 */
const BlogCardChip = ({ post }: { post: BlogCardViewModel }) => {
  if (!post.category) return null;

  return (
    <Link href={post.categoryLink} className="blog-card-chip">
      {post.category}
    </Link>
  );
};

/**
 * Byline, date and reading time, each behind its own icon.
 *
 * The icons come from the site's own font — the same three the tour cards use
 * — and they are the only gold in this row: gold text as well would make the
 * metadata compete with the headline above it and the button below it. Each
 * entry is omitted when it has nothing to say, and the author is plain text
 * rather than a dead link when that byline has no page of its own.
 *
 * The row's wrap is STRUCTURAL, not incidental. Measured in a 3-up column the
 * three items want 375px of a 310px box, so they always wrapped — and plain
 * `flex-wrap` broke them after the second item, leaving "9 min read" stranded
 * on a line of its own as if by accident. The stylesheet instead puts the
 * byline on its own row and keeps the date and the reading time together
 * underneath, which reads as a decision: who wrote it, then when and how long.
 * A card wide enough for all three takes them back onto one line.
 */
const BlogCardMeta = ({ post }: { post: BlogCardViewModel }) => {
  const { t } = useTranslation("blogs");

  return (
    <ul className="list-unstyled blog-card-meta">
      <li className="blog-card-meta__item">
        <i className="icon-user blog-card-meta__icon" aria-hidden="true"></i>
        {post.authorLink ? (
          <Link href={post.authorLink}>
            {t("by")} {post.author}
          </Link>
        ) : (
          <span>
            {t("by")} {post.author}
          </span>
        )}
      </li>
      {post.iso && post.dateLabel && (
        <li className="blog-card-meta__item">
          <i
            className="icon-calendar blog-card-meta__icon"
            aria-hidden="true"
          ></i>
          {/* The badge this replaced showed a day and a month with no year. */}
          <time dateTime={post.iso}>{post.dateLabel}</time>
        </li>
      )}
      {post.readingTime > 0 && (
        <li className="blog-card-meta__item">
          <i className="icon-clock blog-card-meta__icon" aria-hidden="true"></i>
          <span>
            {t("minRead", {
              minutes: post.readingTime,
              defaultValue: "{{minutes}} min read",
            })}
          </span>
        </li>
      )}
    </ul>
  );
};

const BlogCard = ({
  post,
  variant = "feature",
  sizes = DEFAULT_SIZES,
  priority = false,
}: BlogCardProps) => {
  const { t } = useTranslation("blogs");

  if (variant === "minimal") {
    return (
      <Link href={post.link} className="group block no-underline">
        <div className="blog-card-minimal">
          <div className="blog-card-minimal__media">
            <Image
              src={post.image}
              alt={post.imageAlt}
              title={post.imageTitle || undefined}
              fill
              sizes={sizes}
              priority={priority}
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="blog-card-minimal__veil" />
          </div>
          {post.day && post.month && (
            <time
              className="blog-card-minimal__date"
              dateTime={post.iso}
              aria-label={post.dateLabel}
            >
              {post.day} {post.month}
            </time>
          )}
          <h3 className="blog-card-minimal__title">{post.title}</h3>
        </div>
      </Link>
    );
  }

  const block = variant === "classic" ? "blog-card" : "blog-card-two";
  const skin =
    variant === "feature"
      ? "blog-card-two blog-card-two--one"
      : variant === "bordered"
      ? "blog-card-two blog-card-two--compact"
      : "blog-card";
  const mediaHeight =
    variant === "feature" ? "tall" : variant === "classic" ? "medium" : "short";

  return (
    <article className={skin}>
      <div
        className={`${block}__image blog-card-media blog-card-media--${mediaHeight}`}
      >
        <Image
          src={post.image}
          alt={post.imageAlt}
          title={post.imageTitle || undefined}
          className="img-fluid"
          width={600}
          height={450}
          sizes={sizes}
          priority={priority}
        />
        <BlogCardChip post={post} />
      </div>
      <div className={`${block}__content`}>
        {/* The one link to the article. The stylesheet stretches it over the
            whole card, which is what makes the card clickable. */}
        <h3 className={`${block}__title`}>
          <Link href={post.link}>{post.title}</Link>
        </h3>
        {/* No fallback on purpose — see the note at the top of this file. */}
        {post.cardDescription && (
          <p className={`${block}__text blog-card-text`}>
            {post.cardDescription}
          </p>
        )}
        <BlogCardMeta post={post} />
        {/* The footer carries the divider so the rule spans the content width
            while the button keeps its own. `margin-top: auto` on it is what
            holds every card's button on one line across a row. */}
        <div className="blog-card-foot">
          {/* Not a link. The title above already covers the whole card, so an
              anchor here would be a third route to one URL and a tab stop that
              goes where the previous one went. */}
          <span className="blog-card-cta" aria-hidden="true">
            <span>{t("readMore")}</span>
            <span className="blog-card-cta__icon">
              {/* An SVG rather than the icon font's arrow: the font's glyph
                  has one fixed weight, and at this size a lighter stroke is
                  what keeps the button from reading as a booking CTA. */}
              <ArrowRight size={13} strokeWidth={1.75} aria-hidden="true" />
            </span>
          </span>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
