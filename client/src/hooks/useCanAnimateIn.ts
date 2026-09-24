"use client";

import { useSyncExternalStore } from "react";

// The answer never changes after mount, so there is nothing to subscribe to.
const subscribe = () => () => {};

/**
 * Whether an entrance animation may START from a hidden state.
 *
 * False while React renders on the server and while it hydrates that server
 * HTML; true when the component mounts on the client later — a client-side
 * navigation.
 *
 * ── Why ──
 * framer-motion writes `initial` into the server HTML. `initial={{ opacity: 0 }}`
 * on server-rendered text therefore ships as `style="opacity:0"`, and the text
 * stays invisible until the page's JavaScript has downloaded, hydrated and
 * played the animation; with scripts blocked or turned off it never appears.
 * Measured on the blog pages' <h1>: present in the HTML, invisible without JS.
 *
 * Text the server already painted must start in its final state. Text that
 * mounts on the client was never painted, so it can still animate in:
 *
 *     const animateIn = useCanAnimateIn();
 *     <motion.h1 initial={animateIn ? { opacity: 0 } : false} animate={{ opacity: 1 }} />
 *
 * useSyncExternalStore gives the server render and the hydration render the
 * server snapshot (false) and any later mount the client one (true). React
 * re-renders once after hydrating to reconcile the two — no mismatch — and
 * framer-motion reads `initial` only on mount, so that re-render cannot start
 * an animation on text that is already showing.
 */
export function useCanAnimateIn(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
