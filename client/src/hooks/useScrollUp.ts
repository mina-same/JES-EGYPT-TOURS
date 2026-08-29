'use client';
import { useEffect, useRef, useState } from "react";

/**
 * True while the visitor is scrolling UP, past `scrollSize` pixels.
 *
 * Drives the sticky header. It used to call setScrollTop on every scroll
 * event, and because the sticky header renders the whole navigation, that was
 * a full re-render of twenty-odd links per event. The state only ever holds a
 * boolean, so the vast majority of those renders changed nothing.
 *
 * Now the reading is coalesced into one animation frame and the state is only
 * written when the boolean actually flips.
 */
const useScrollUp = (scrollSize: number = 0): boolean => {
    const [scrollTop, setScrollTop] = useState<boolean>(false);
    const lastScrollTop = useRef<number>(0);

    useEffect(() => {
        let ticking = false;

        const update = () => {
            ticking = false;
            const current = window.scrollY;
            const next = current > scrollSize && current <= lastScrollTop.current;
            lastScrollTop.current = current;
            // Only a change of direction is worth a render.
            setScrollTop((prev) => (prev === next ? prev : next));
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        };

        // `passive`: the handler never calls preventDefault, and saying so lets
        // the browser scroll without waiting on it.
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [scrollSize]);

    return scrollTop;
};

export default useScrollUp;
