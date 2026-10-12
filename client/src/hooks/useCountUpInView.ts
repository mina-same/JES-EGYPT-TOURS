"use client";

import { useEffect, useRef } from "react";

interface CountUpInViewOptions {
  /** Milliseconds from 0 to `end`. */
  duration?: number;
  /** Share of the section that has to be on screen for the count to run. */
  threshold?: number;
}

/** countup.js's default curve, so the count decelerates the way it did. */
const easeOutExpo = (progress: number) =>
  (1 - Math.pow(2, -10 * progress)) * (1024 / 1023);

/**
 * Counts a whole number up from 0 while its section is on screen, and again
 * each time the section comes back.
 *
 * Replaces react-countup + react-intersection-observer (about 13 KB of
 * JavaScript, before compression, for one two-digit number) with the two
 * browser APIs those packages wrap.
 *
 * The number is rendered by React at its FINAL value, in `valueRef`, so it is
 * in the server HTML: that is what a visitor without JavaScript, a crawler and
 * a screen reader get. The count never rewrites it. It runs in a second,
 * `aria-hidden` element laid over the first (`tickerRef`) while the real one
 * is made transparent — still in the accessibility tree, and still holding its
 * box, so nothing beside the number moves as the digits change.
 *
 * Kept from the old pair: the count runs when `threshold` of the section is
 * visible, takes `duration` on countup.js's own easing curve, and below the
 * threshold the number is blank, so coming back plays it again from 0.
 *
 * Two cases leave the server-rendered number alone: a reduced-motion
 * preference (the final value, immediately), and a browser without
 * IntersectionObserver.
 *
 *     const { sectionRef, valueRef, tickerRef } = useCountUpInView(30);
 *     <section ref={sectionRef}>
 *       <span style={{ position: "relative" }}>
 *         <span ref={valueRef}>30</span>
 *         <span ref={tickerRef} aria-hidden="true" style={{ position: "absolute", top: 0, right: 0 }} />
 *       </span>
 *     </section>
 */
export function useCountUpInView<Section extends Element = HTMLElement>(
  end: number,
  { duration = 2000, threshold = 0.5 }: CountUpInViewOptions = {}
) {
  const sectionRef = useRef<Section>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const tickerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const value = valueRef.current;
    const ticker = tickerRef.current;
    if (!section || !value || !ticker) return;
    if (typeof IntersectionObserver === "undefined") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    // The server-rendered state: the real number showing, nothing over it.
    const showFinal = () => {
      cancelAnimationFrame(frame);
      ticker.textContent = "";
      value.style.opacity = "";
    };

    // Off screen: blank, as the unmounted counter was, ready to start from 0.
    const hide = () => {
      cancelAnimationFrame(frame);
      ticker.textContent = "";
      value.style.opacity = "0";
    };

    const count = () => {
      cancelAnimationFrame(frame);
      value.style.opacity = "0";
      ticker.textContent = "0";

      let startedAt: number | null = null;
      const tick = (now: number) => {
        startedAt ??= now;
        const progress = (now - startedAt) / duration;
        if (progress >= 1) {
          showFinal();
          return;
        }
        ticker.textContent = String(Math.round(end * easeOutExpo(progress)));
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (reducedMotion.matches) showFinal();
        else if (entry.isIntersecting && entry.intersectionRatio >= threshold) count();
        else hide();
      },
      { threshold }
    );
    observer.observe(section);

    // Turned on while the number is blank off screen: it must not stay blank
    // until the section next crosses the threshold.
    const onMotionPreference = () => {
      if (reducedMotion.matches) showFinal();
    };
    reducedMotion.addEventListener("change", onMotionPreference);

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener("change", onMotionPreference);
      showFinal();
    };
  }, [end, duration, threshold]);

  return { sectionRef, valueRef, tickerRef };
}
