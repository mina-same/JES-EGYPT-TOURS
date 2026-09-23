"use client";

import { useEffect, useMemo, useRef } from "react";

interface TextAnimationProps {
  text: string;
  animationType: "fade" | "right" | "left" | "up" | "down" | "scale";
  semantic?: boolean;
}

/**
 * A heading that reveals as it scrolls into view — as an enhancement, never as
 * a precondition for reading it.
 *
 * ── Visible by default ──
 * This used to render each word as a Framer Motion component seeded with an
 * `initial` variant, which serialises into the server HTML as
 * `style="opacity:0;transform:translateX(20px)"`. The words only became
 * readable once JavaScript hydrated AND an IntersectionObserver fired, so with
 * scripting unavailable every heading built on this component — About, Why
 * Choose Us, Featured Tours, both Offers, Testimonials, the FAQ — stayed
 * invisible forever, while still being announced by a screen reader. The text
 * was in the HTML the whole time; only the CSS hid it.
 *
 * Now the markup carries no hidden state at all. Words render in their final
 * form, styled by `.text-animation` in globals.css, and script may *opt them
 * in* to an entrance afterwards by setting `data-reveal`.
 *
 * ── It only arms text nobody has seen ──
 * On mount the component measures itself. If any part of it is already on
 * screen — or the visitor scrolled past it before hydration — it is left
 * alone permanently: hiding words someone may already have read, in order to
 * animate them back in, would just move the original defect later in the page
 * lifecycle. Only a heading still fully below the fold is armed, and arming
 * touches opacity and transform only, so nothing reflows.
 *
 * ── One observer per heading, not per word ──
 * The observer watches the wrapper and disconnects on the first intersection,
 * so the entrance plays once. Per-word staggering is a CSS `transition-delay`
 * driven by a custom property, which is why the words are plain spans: a page
 * of ordinary headings used to mount several hundred independent animated
 * components during hydration, a direct cost to Interaction to Next Paint for
 * an effect nobody reads word by word.
 *
 * ── Reduced motion ──
 * Never armed, and the stylesheet neutralises the armed state too, so the
 * final frame is all there is.
 *
 * The DOM contract is unchanged — `.text-animation` wrapper, one `<span>` per
 * word — because `gotur.css` styles `.sec-title__title .text-animation span`
 * and `globals.css` lays the block variant out as a flex row.
 */
const TextAnimation: React.FC<TextAnimationProps> = ({
  text,
  animationType,
  semantic = false,
}) => {
  const words = useMemo(() => (text ? text.split(" ") : []), [text]);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Anything at or above the fold may already have been read. Leave it.
    if (node.getBoundingClientRect().top < window.innerHeight) return;

    node.dataset.reveal = "pending";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.dataset.reveal = "in";
        observer.disconnect();
      },
      // Fires just BEFORE the heading reaches the viewport rather than once a
      // tenth of it is already showing: a heading caught at the very edge by
      // the old threshold could sit there visibly blank until the visitor
      // scrolled further. Starting early means the entrance is already under
      // way by the time it is properly on screen.
      { rootMargin: "0px 0px 15% 0px", threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /**
   * @param spaced the inline (`semantic`) variant flows as text, so each word
   *   carries its own trailing space. The block variant is a flex row whose
   *   `gap` in globals.css already separates the words — adding a space there
   *   too would double it.
   */
  const renderWords = (spaced: boolean) =>
    words.map((word, index) => (
      <span
        key={index}
        style={{ "--word-index": index } as React.CSSProperties}
      >
        {spaced && index < words.length - 1 ? `${word} ` : word}
      </span>
    ));

  if (semantic) {
    return (
      <span
        ref={containerRef as React.RefObject<HTMLSpanElement>}
        className='text-animation'
        data-anim={animationType}
        style={{ display: "inline" }}
      >
        {renderWords(true)}
      </span>
    );
  }

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className='text-animation'
      data-anim={animationType}
    >
      {renderWords(false)}
    </div>
  );
};

export default TextAnimation;
