import Image from "next/image";
import { Camera } from "lucide-react";

/**
 * One photograph slot on an author page — the real picture when the author has
 * one, a reserved space in the site's own surface treatment when they do not.
 *
 * ── Why a component and not just <Image> ──
 * The author's photographs are being supplied after the page was built, and
 * they have to land without anyone touching the layout again. Every slot on
 * the page therefore goes through here, and each one declares its own aspect
 * ratio: the box is drawn at the right shape and size before any file exists,
 * so adding the real photograph later changes the pixels inside the frame and
 * nothing around it. No reflow, no second pass over the CSS, no layout shift
 * when the image decodes.
 *
 * ── The empty state ──
 * Not a grey developer placeholder. It is the same faint gold-tinted panel and
 * hairline border the tour page's trust band uses, with one small stroked
 * lucide glyph — so a page with no photographs yet still looks finished rather
 * than broken, and looks like this site rather than like a wireframe.
 *
 * There is deliberately no stock photograph and no generated face standing in
 * for a real person: a placeholder is honest about being empty, a stock
 * portrait is not.
 */

export type AuthorPhotoRatio = "portrait" | "landscape" | "square";

const RATIO_CLASS: Record<AuthorPhotoRatio, string> = {
  portrait: "author-photo--portrait",
  landscape: "author-photo--landscape",
  square: "author-photo--square",
};

interface AuthorPhotoProps {
  /** Absent or empty renders the reserved placeholder instead. */
  src?: string | null;
  /** Required whenever `src` is set; describes the person, not the page. */
  alt?: string;
  ratio?: AuthorPhotoRatio;
  /** Only for a slot that can be the LCP element — the hero portrait. */
  priority?: boolean;
  sizes?: string;
  className?: string;
  /**
   * Announced to assistive technology in place of the image while the slot is
   * empty. Localized by the caller.
   */
  placeholderLabel?: string;
}

const AuthorPhoto: React.FC<AuthorPhotoProps> = ({
  src,
  alt,
  ratio = "portrait",
  priority = false,
  sizes = "(max-width: 992px) 100vw, 40vw",
  className = "",
  placeholderLabel,
}) => {
  const frameClass = `author-photo ${RATIO_CLASS[ratio]} ${className}`.trim();

  if (!src) {
    return (
      <div
        className={`${frameClass} author-photo--empty`}
        role="img"
        aria-label={placeholderLabel || undefined}
      >
        <Camera className="author-photo__glyph" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={frameClass}>
      {/* `fill` rather than width/height: the frame already reserves the box
          through its aspect-ratio, so the image only has to cover it. */}
      <Image
        src={src}
        alt={alt || ""}
        title={alt || undefined}
        fill
        priority={priority}
        sizes={sizes}
        className="author-photo__img"
      />
    </div>
  );
};

export default AuthorPhoto;
