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
 * Three skins exist because the site genuinely has three: the grey panel used
 * across the marketing sections (`feature`), the bordered compact card under
 * an article (`bordered`), and the white shadowed card on the blog listing
 * (`classic`, which puts the date beside the meta instead of over the image).
 * `minimal` is the image-and-title strip used where a card would shout.
 *
 * Link structure is deliberate and shared by every skin: the title is the one
 * focusable link to the article, while the image overlay and the "Read More"
 * button are aria-hidden and out of the tab order — they point at the same
 * place, and left focusable they made a nine-card listing 36 tab stops to
 * cross. "Read More" still carries the article title in a clipped span, so a
 * crawler reading the link text alone learns where it goes.
 */

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import type { BlogCardViewModel } from "@/lib/blog/cardViewModel";

export type BlogCardVariant = "feature" | "bordered" | "classic" | "minimal";

interface BlogCardProps {
  post: BlogCardViewModel;
  variant?: BlogCardVariant;
  showExcerpt?: boolean;
  /** Position in the list — drives the staggered reveal only. */
  index?: number;
  animate?: boolean;
  sizes?: string;
  priority?: boolean;
}

/**
 * Grid cards sit 3-up on desktop, 2-up from the `md` breakpoint, full width
 * below it — the Bootstrap columns every listing wraps them in. A carousel
 * turns over at different widths and passes its own `sizes`.
 */
const DEFAULT_SIZES = "(max-width: 768px) 100vw, (max-width: 992px) 50vw, 33vw";

/**
 * The date badge, as a real <time>. Rendered as a <div> it told a crawler and
 * a screen reader nothing: `dateTime` makes the publication date machine
 * readable, and the label supplies the year that the two-line badge omits.
 */
const BlogCardDate = ({
  post,
  block,
}: {
  post: BlogCardViewModel;
  block: string;
}) => {
  if (!post.day || !post.month) return null;

  return (
    <time
      className={`${block}__date`}
      dateTime={post.iso}
      aria-label={post.dateLabel}
      title={post.dateLabel}
    >
      <span className={`${block}__date__day`}>{post.day}</span>
      <span className={`${block}__date__month`}>{post.month}</span>
    </time>
  );
};

/**
 * Author, section and reading time. Each entry is omitted when it has nothing
 * to say — an always-rendered category left a lone icon that was also a link
 * with no accessible name — and the author is plain text, not a dead link,
 * when that byline has no page of its own.
 */
const BlogCardMeta = ({
  post,
  block,
}: {
  post: BlogCardViewModel;
  block: string;
}) => {
  const { t } = useTranslation("blogs");

  const authorLabel = (
    <>
      <span className={`${block}__meta__icon`}>
        <i className="icon-user" aria-hidden="true"></i>
      </span>{" "}
      {t("by")} {post.author}
    </>
  );

  return (
    <ul className={`list-unstyled ${block}__meta blog-card-meta`}>
      <li>
        {post.authorLink ? (
          <Link href={post.authorLink}>{authorLabel}</Link>
        ) : (
          <span className="blog-card-meta__item">{authorLabel}</span>
        )}
      </li>
      {post.category && (
        <li>
          <Link href={post.categoryLink}>
            <span className={`${block}__meta__icon`}>
              <i className="icon-price-tag" aria-hidden="true"></i>
            </span>{" "}
            {post.category}
          </Link>
        </li>
      )}
      {post.readingTime > 0 && (
        <li>
          <span className="blog-card-meta__item">
            <span className={`${block}__meta__icon`}>
              <i className="icon-clock" aria-hidden="true"></i>
            </span>{" "}
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

/**
 * The visible call to action. Out of the tab order and hidden from assistive
 * tech because the title above is the same destination, but its text still
 * names the article for anything reading links in isolation.
 */
const BlogCardReadMore = ({
  post,
  block,
}: {
  post: BlogCardViewModel;
  block: string;
}) => {
  const { t } = useTranslation("blogs");

  return (
    <Link
      href={post.link}
      className={`${block}__content__btn`}
      aria-hidden="true"
      tabIndex={-1}
    >
      {t("readMore")}
      {post.title && <span className="sr-only"> — {post.title}</span>}{" "}
      <i className="icon-arrow-right" aria-hidden="true"></i>
    </Link>
  );
};

const BlogCard = ({
  post,
  variant = "feature",
  showExcerpt = false,
  index = 0,
  animate = true,
  sizes = DEFAULT_SIZES,
  priority = false,
}: BlogCardProps) => {
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
    <div
      className={`${skin}${animate ? " wow fadeInUp" : ""}`}
      data-wow-duration="1500ms"
      data-wow-delay={`${100 * (index + 1)}ms`}
    >
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
        {/* The date sits over the image on the two card skins that have room
            for it; `classic` puts it beside the meta row instead. */}
        {variant !== "classic" && <BlogCardDate post={post} block={block} />}
        {/* Still clickable with a mouse, skipped by keyboard and screen
            readers — the title link below is the same target. */}
        <Link
          href={post.link}
          className={`${block}__image__link`}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
      <div className={`${block}__content`}>
        {variant === "classic" ? (
          <div className={`${block}__content__top`}>
            <BlogCardDate post={post} block={block} />
            <BlogCardMeta post={post} block={block} />
          </div>
        ) : (
          <BlogCardMeta post={post} block={block} />
        )}
        <h3 className={`${block}__title`}>
          <Link href={post.link}>{post.title}</Link>
        </h3>
        {showExcerpt && post.excerpt && (
          <p className={`${block}__text blog-card-excerpt`}>{post.excerpt}</p>
        )}
        <BlogCardReadMore post={post} block={block} />
      </div>
    </div>
  );
};

export default BlogCard;
