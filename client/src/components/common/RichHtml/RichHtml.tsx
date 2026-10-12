import React from "react";

interface RichHtmlProps {
  /** The markup to set. This string decides whether the element is written
   *  again: two renders with the same string never touch the DOM. */
  html: string;
  /** The element to render. */
  as?: "div" | "span" | "li";
  className?: string;
  /** Pass a constant, never an inline object: a new object on every render
   *  makes the props differ, and the element is rendered again. */
  style?: React.CSSProperties;
}

/**
 * An element whose content is a string of HTML — CMS copy, mostly.
 *
 * React writes `innerHTML` whenever the `dangerouslySetInnerHTML` OBJECT is a
 * new one; it never compares the string inside it. Written inline in a large
 * component, `dangerouslySetInnerHTML={{ __html: text }}` is a new object on
 * every render, so each re-render threw the block's nodes away and parsed the
 * same markup again. On the tour page one change of the active tab did that to
 * about sixty blocks at once, and a scroll through the page to several hundred.
 *
 * Memoised on its props, this renders again only when the markup (or the tag,
 * class or style) really changes; otherwise React leaves the node alone. The
 * output is the same element, with the same attributes, as the inline form.
 */
function RichHtml({ html, as: Tag = "div", className, style }: RichHtmlProps) {
  return (
    <Tag
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default React.memo(RichHtml);
