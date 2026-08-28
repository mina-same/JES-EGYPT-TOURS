"use client";

import { useEffect, useState } from "react";

/** Same breakpoint the tour page treats as desktop (CSS: max-width 991px). */
export const DESKTOP_MIN_WIDTH = 992;

export interface LineClampCounts {
  desktop: number;
  mobile: number;
}

const isBlock = (node: Element) => {
  const display = getComputedStyle(node).display;
  return (
    display === "block" ||
    display === "list-item" ||
    display === "flex" ||
    display === "grid" ||
    display === "table"
  );
};

/**
 * Clamps a block of rich text to a number of LINES and reports whether it
 * actually overflowed.
 *
 * The clamp itself is CSS — `.tour-description-wrapper.collapsed` reads the
 * `--desc-clamp` this hook writes — so every word stays in the served HTML and
 * is only clipped visually. Never swap this for slicing the string: the full
 * copy has to remain crawlable, and the internal links inside it have to keep
 * counting.
 *
 * Why measure at all instead of `-webkit-line-clamp`: the content is several
 * paragraphs, and line-clamp only counts lines within a single block. The
 * measurement below walks down to the elements that actually own line boxes and
 * counts across all of them.
 *
 * Overflowing content is still laid out under `overflow: hidden`, so the rects
 * for the clipped lines are available and the element can be measured without
 * expanding it first.
 *
 * @param element  the wrapper carrying `.tour-description-wrapper`; its first
 *                 element child is the content that owns the line boxes
 * @param content  re-measure when this changes
 * @param lines    how many lines survive on each breakpoint
 * @returns        whether the text overflows, i.e. whether to offer "Read more"
 */
export function useLineClamp(
  element: HTMLElement | null,
  content: unknown,
  lines: LineClampCounts
): boolean {
  /* Starts true so the button is part of the SERVER-rendered markup — the clamp
     is CSS-only and therefore already active on first paint, so a button that
     only appeared after hydration would leave the control missing exactly when
     the text is cut. The effect switches it off for text short enough to fit. */
  const [isOverflowing, setIsOverflowing] = useState(true);
  const { desktop, mobile } = lines;

  useEffect(() => {
    const el = element;
    if (!el) return;

    const measure = () => {
      const inner = el.firstElementChild as HTMLElement | null;
      if (!inner) return;

      const visibleLines = window.innerWidth >= DESKTOP_MIN_WIDTH ? desktop : mobile;

      // Collect the elements that actually own line boxes: descend until a node
      // whose children are all inline. Ranging the whole block at once reports
      // the paragraph boxes ALONGSIDE the line boxes, which inflated the count
      // and clamped some tours to fewer lines than asked for.
      const leafBlocks: Element[] = [];
      const collect = (node: Element) => {
        const children = Array.from(node.children);
        if (children.length === 0 || !children.some(isBlock)) {
          leafBlocks.push(node);
          return;
        }
        children.forEach(collect);
      };
      collect(inner);

      // Blocks stack vertically, so de-duplicating by top WITHIN a block folds
      // the several rects of one line (split by inline tags) into a single line.
      const rects: DOMRect[] = [];
      const range = document.createRange();
      for (const block of leafBlocks) {
        range.selectNodeContents(block);
        const seen = new Set<number>();
        for (const rect of Array.from(range.getClientRects())) {
          if (rect.height <= 0 || rect.width <= 0) continue;
          const key = Math.round(rect.top * 10);
          if (seen.has(key)) continue;
          seen.add(key);
          rects.push(rect);
        }
      }
      rects.sort((a, b) => a.top - b.top);

      if (rects.length <= visibleLines) {
        el.style.removeProperty("--desc-clamp");
        el.style.removeProperty("--desc-full");
        setIsOverflowing(false);
        return;
      }

      const lastVisible = rects[visibleLines - 1];
      const lineHeight = parseFloat(getComputedStyle(inner).lineHeight);
      // getClientRects returns the glyph box, which is shorter than the line
      // box. Adding the half-leading back puts the cut on the line boundary
      // instead of shaving the descenders.
      const halfLeading = Number.isFinite(lineHeight)
        ? Math.max(0, (lineHeight - lastVisible.height) / 2)
        : 0;
      const clamp = Math.ceil(
        lastVisible.bottom - el.getBoundingClientRect().top + halfLeading
      );

      el.style.setProperty("--desc-clamp", `${clamp}px`);
      /* The expanded height, so opening can be animated. A transition needs a
         number at BOTH ends: going from the clamp to `max-height: none` is a
         jump, because `none` is not a length and nothing interpolates to it.
         scrollHeight is read while the element is still clipped, which is
         exactly what it reports — the full content height regardless. */
      el.style.setProperty("--desc-full", `${el.scrollHeight}px`);
      setIsOverflowing(true);
    };

    measure();
    window.addEventListener("resize", measure);
    // Web fonts land after first paint and change where the lines break.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
  }, [element, content, desktop, mobile]);

  return isOverflowing;
}
