import { useState, type CSSProperties } from "react";
import { useCanAnimateIn } from "@/hooks/useCanAnimateIn";
import "./Entrance.css";

/**
 * Entrance animations without Framer Motion.
 *
 * The blog and destination views used `motion.*` elements for nothing but
 * entrances — fade, slide, scale, once on mount or when scrolled into view —
 * and that shipped framer-motion's runtime with every blog and destination
 * page. These helpers reproduce those entrances with CSS keyframes (Entrance.css)
 * and, for the scroll-triggered ones, one shared IntersectionObserver.
 *
 * ── Nothing starts hidden in the server HTML ──
 * `entrance()` only writes the start values as custom properties. An element
 * is hidden solely through `data-entrance-state="pending"`, which only script
 * sets — so with JavaScript off, or before it runs, everything is visible in
 * its final state. The one exception is `entrance(true, …)` without `inView`:
 * a CSS animation that plays at first paint, JavaScript or not, and ends in
 * the final state (the hero background zoom, the sub-category chips).
 *
 * ── When an entrance plays — the `enter` argument ──
 * Each call site keeps the behaviour its Framer Motion version had on a
 * server-rendered page; on a client-side navigation they all animate in.
 *  - `true` (a client-side navigation mounted the component): mount entrances
 *    play at once, in-view entrances hide until the element enters the view.
 *  - `"below-fold"` (server HTML; the Framer version started hidden and
 *    animated in when seen): content already on screen when the page hydrated
 *    is left alone; an element still entirely below the fold is armed and
 *    plays its entrance when it scrolls into view — as TextAnimation does.
 *  - `false` (server HTML; the Framer version was gated by useCanAnimateIn
 *    and started in its final state): nothing — except that a `"repeat"`
 *    in-view entrance, as in Framer, hides once it has left the view and
 *    plays when it comes back.
 * Reduced motion, or no IntersectionObserver: never armed, and the stylesheet
 * applies no state at all under `prefers-reduced-motion: reduce`.
 *
 * ── Timing parity ──
 * The values mirror the old props one to one (`initial` → x/y/scale/opacity,
 * `transition.delay` / `transition.duration`). Without a duration Framer used
 * its default transitions — a 0.3 s tween for opacity and physical springs for
 * x/y and scale — which Entrance.css reproduces as `linear()` easings; with a
 * duration it used an `easeOut` tween for every value.
 */

export interface EntranceOptions {
  /** Start offset in px (Framer `initial.x` / `initial.y`). */
  x?: number;
  y?: number;
  /** Start scale (Framer `initial.scale`). */
  scale?: number;
  /** Start opacity; 0 unless given (every converted entrance faded in but the hero zoom). */
  opacity?: number;
  /** Seconds, as Framer's `transition.delay`. */
  delay?: number;
  /** Seconds, as Framer's `transition.duration` — switches to an easeOut tween. */
  duration?: number;
  /** Play when scrolled into view (Framer `whileInView`); "repeat" replays on every re-entry (no `viewport.once`). */
  inView?: "once" | "repeat";
}

type EntranceRef = (el: HTMLElement | null) => (() => void) | undefined;

export interface EntranceProps {
  "data-entrance"?: "spring" | "spring-scale" | "tween";
  "data-entrance-view"?: "once" | "repeat";
  "data-entrance-state"?: "in";
  ref?: EntranceRef;
  style?: CSSProperties;
}

/** See "When an entrance plays" above. */
export type EntranceMode = boolean | "below-fold";

/**
 * `true` when a client-side navigation mounted the component; otherwise
 * `onHydration` (default `false`). Captured once, because useCanAnimateIn
 * turns true right after hydration and an entrance must not then start on
 * content that is already showing.
 */
export function useEntranceOnMount(onHydration: EntranceMode = false): EntranceMode {
  const animateIn = useCanAnimateIn();
  const [enter] = useState<EntranceMode>(animateIn || onHydration);
  return enter;
}

/**
 * Props for an element with an entrance: `enter` is useEntranceOnMount()'s
 * answer, or `true` for a CSS entrance that plays at first paint on every load.
 */
export function entrance(enter: EntranceMode, options: EntranceOptions, style?: CSSProperties): EntranceProps {
  const { x, y, scale, opacity, delay, duration, inView } = options;
  // On hydrated server HTML a mount entrance has nothing left to do, an in-view
  // one is only armed below the fold when the call site asks for it, and a
  // repeating one is only watched for its next exit.
  if (enter !== true && !inView) return { style };
  if (enter === false && inView !== "repeat") return { style };

  const vars: Record<string, string | number> = {};
  if (x) vars["--entrance-x"] = `${x}px`;
  if (y) vars["--entrance-y"] = `${y}px`;
  if (scale !== undefined) vars["--entrance-scale"] = scale;
  if (opacity !== undefined) vars["--entrance-opacity"] = opacity;
  if (delay) vars["--entrance-delay"] = `${delay}s`;
  if (duration) vars["--entrance-duration"] = `${duration}s`;

  return {
    "data-entrance": duration ? "tween" : scale !== undefined ? "spring-scale" : "spring",
    "data-entrance-view": inView,
    "data-entrance-state": inView ? undefined : "in",
    ref: inView ? (enter === true ? armOnClientMount : enter === "below-fold" ? armBelowFold : watch) : undefined,
    style: { ...vars, ...style } as CSSProperties,
  };
}

// ── Scroll-triggered entrances ───────────────────────────────────────────────

let observer: IntersectionObserver | null = null;
// Repeating entrances that have been in view at least once.
const seen = new WeakSet<Element>();

function canAnimate(): boolean {
  return typeof IntersectionObserver !== "undefined" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Framer's whileInView defaults: the viewport, any visible pixel.
function getObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      const el = target as HTMLElement;
      const repeat = el.dataset.entranceView === "repeat";
      if (isIntersecting) {
        if (el.dataset.entranceState === "pending") el.dataset.entranceState = "in";
        if (repeat) seen.add(el);
        else observer?.unobserve(el);
      } else if (repeat && seen.has(el)) {
        // Framer returned a repeating element to its start values once it had
        // left the viewport, so the entrance played again on the way back.
        el.dataset.entranceState = "pending";
      }
    }
  });
  return observer;
}

function observe(el: HTMLElement): () => void {
  const io = getObserver();
  io.observe(el);
  return () => io.unobserve(el);
}

/** Hydrated server HTML: arm only what is still entirely below the fold. */
function armBelowFold(el: HTMLElement | null) {
  if (!el || !canAnimate()) return undefined;
  if (el.getBoundingClientRect().top >= window.innerHeight) {
    el.dataset.entranceState = "pending";
  } else if (el.dataset.entranceView !== "repeat") {
    return undefined;
  }
  return observe(el);
}

/** Hydrated server HTML, repeating entrance: shown as is; the observer hides it after it leaves. */
function watch(el: HTMLElement | null) {
  if (!el || !canAnimate()) return undefined;
  return observe(el);
}

/**
 * Client-side mount: hide before the first paint, let the observer start it.
 * Not measured here — the router restores the scroll position only after this
 * commit, and the observer reports against the final one.
 */
function armOnClientMount(el: HTMLElement | null) {
  if (!el || !canAnimate()) return undefined;
  el.dataset.entranceState = "pending";
  return observe(el);
}
