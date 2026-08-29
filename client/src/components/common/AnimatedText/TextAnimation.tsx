"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface TextAnimationProps {
  text: string;
  animationType: "fade" | "right" | "left" | "up" | "down" | "scale";
  semantic?: boolean;
}

const variants = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  right: { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 } },
  left: { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } },
  up: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
  down: { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } },
  scale: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } },
} as const;

/**
 * A heading that reveals as it scrolls into view.
 *
 * ── One motion component per WORD, not per character ──
 * This used to split every heading into individual letters and render a
 * <motion.span> for each one. The homepage uses this component in ~15 places,
 * so a page of ordinary headings mounted several hundred independent animated
 * components during hydration — a direct cost to Interaction to Next Paint for
 * an effect nobody reads letter by letter. Per word the visual result is
 * near-identical at roughly a fifth of the components.
 *
 * ── It animates once ──
 * `isVisible` used to track `entry.isIntersecting` in both directions, so the
 * heading faded back out and replayed on every scroll past. The observer now
 * disconnects on the first intersection.
 *
 * ── Reduced motion ──
 * There was none, although the stylesheet honours the preference in fifteen
 * other places. With the preference set the text renders in its final state
 * immediately: headings must never be stuck at opacity 0 waiting for an
 * animation the visitor has asked not to see.
 */
const TextAnimation: React.FC<TextAnimationProps> = ({
  text,
  animationType,
  semantic = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  // Derived, not stored: the old component seeded state from `text` and then
  // re-derived the identical value in an effect on mount, costing a render.
  const words = useMemo(() => (text ? text.split(" ") : []), [text]);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const node = containerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  const animate = isVisible || prefersReducedMotion ? "animate" : "initial";

  /**
   * @param spaced the inline (`semantic`) variant flows as text, so each word
   *   carries its own trailing space. The block variant is a flex row whose
   *   `gap` in globals.css already separates the words — adding a space there
   *   too would double it.
   */
  const renderWords = (spaced: boolean) =>
    words.map((word, index) => (
      <motion.span
        key={index}
        variants={variants[animationType]}
        initial='initial'
        animate={animate}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { delay: index * 0.06, duration: 0.6, ease: "easeOut" }
        }
        style={{ display: "inline-block", whiteSpace: "pre" }}
      >
        {spaced && index < words.length - 1 ? `${word} ` : word}
      </motion.span>
    ));

  if (semantic) {
    return (
      <span
        ref={containerRef as React.RefObject<HTMLSpanElement>}
        className='text-animation'
        style={{ display: "inline" }}
        suppressHydrationWarning
      >
        {renderWords(true)}
      </span>
    );
  }

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className='text-animation'
      suppressHydrationWarning
    >
      {renderWords(false)}
    </div>
  );
};

export default TextAnimation;
