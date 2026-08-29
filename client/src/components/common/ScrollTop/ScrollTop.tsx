"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ScrollToTop = dynamic(() => import("react-scroll-to-top"), {
  ssr: false,
});

const ScrollTop = () => {
  const [shouldMount, setShouldMount] = useState(false);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    let didMount = false;
    const mount = () => {
      if (didMount) return;
      didMount = true;
      setShouldMount(true);
    };

    const idleId = (window as any).requestIdleCallback
      ? (window as any).requestIdleCallback(mount, { timeout: 1500 })
      : null;
    const mountTimer = setTimeout(mount, 1200);

    const onFirstInteraction = () => {
      mount();
      window.removeEventListener("scroll", onFirstInteraction, true);
      window.removeEventListener("pointerdown", onFirstInteraction, true);
      window.removeEventListener("keydown", onFirstInteraction, true);
      window.removeEventListener("touchstart", onFirstInteraction, true);
    };

    window.addEventListener("scroll", onFirstInteraction, true);
    window.addEventListener("pointerdown", onFirstInteraction, true);
    window.addEventListener("keydown", onFirstInteraction, true);
    window.addEventListener("touchstart", onFirstInteraction, true);

    return () => {
      clearTimeout(mountTimer);
      if (idleId && (window as any).cancelIdleCallback) {
        (window as any).cancelIdleCallback(idleId);
      }
      window.removeEventListener("scroll", onFirstInteraction, true);
      window.removeEventListener("pointerdown", onFirstInteraction, true);
      window.removeEventListener("keydown", onFirstInteraction, true);
      window.removeEventListener("touchstart", onFirstInteraction, true);
    };
  }, []);

  /**
   * The progress ring, updated at most once per frame.
   *
   * This used to call setPercentage on EVERY scroll event — a React render per
   * event on a page this long — and read document.body.scrollHeight each time,
   * which forces a synchronous layout. It also divided by a bodyHeight that is
   * 0 when the page is shorter than the viewport, producing Infinity and then
   * a `conic-gradient(... NaN%)` the browser discards.
   */
  useEffect(() => {
    if (!shouldMount) return;

    let ticking = false;

    const update = () => {
      ticking = false;
      const bodyHeight = document.body.scrollHeight - window.innerHeight;
      // Nothing to scroll: leave the ring where it is rather than dividing by 0.
      if (bodyHeight <= 0) return;

      const next = Math.min(100, (window.scrollY / bodyHeight) * 100);
      // A sub-1% move is invisible on the ring, so it is not worth a render.
      setPercentage((prev) => (Math.abs(prev - next) < 1 ? prev : next));
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    // `passive`: the handler never calls preventDefault, and saying so lets the
    // browser scroll without waiting on it.
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [shouldMount]);

  if (!shouldMount) {
    return null;
  }

  return (
    // Arrow only — a gold circle with a number read like a "% off" promo
    // badge on a tours site. The conic ring still fills as you scroll.
    <ScrollToTop
      smooth
      style={{ background: `conic-gradient(var(--gotur-primary) ${percentage}%, var(--gotur-white) ${percentage}%)` }}
      component={
        <span id="scroll-top-value" className="scroll-top-value">
          <i className="fas fa-arrow-up" aria-hidden="true"></i>
        </span>
      }
    />
  );
};

export default ScrollTop;
