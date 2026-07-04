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

  useEffect(() => {
    if (!shouldMount) return;

    const handleScroll = () => {
      const bodyHeight = document.body.scrollHeight - window.innerHeight;
      const scrollPos = window.scrollY;
      let percentage = (scrollPos / bodyHeight) * 100;
      if (percentage > 100) {
        percentage = 100;
      }
      setPercentage(percentage);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [shouldMount]);

  if (!shouldMount) {
    return null;
  }

  return (
     <ScrollToTop
     smooth
     // className="scroll-top"
     // id="scroll-top"
     style={{ background: `conic-gradient(var(--gotur-primary) ${percentage}%, var(--gotur-white) ${percentage}%)`}}
     component={
       
        <span id="scroll-top-value" className="scroll-top-value">
       {percentage === 100 ? (
          <i className="fas fa-arrow-up"></i> // Show the up arrow icon at 100%
        ) : (
          `${Math.round(percentage)}%`
         )}
       </span>
    
     
     }
   />
//     <div
//       id="scroll-top"
//       className="scroll-top active"
//       style={{
//         background: `conic-gradient(var(--gotur-primary) ${percentage}%, var(--gotur-white) ${percentage}%)`
//       }}
//     >
//       <span id="scroll-top-value" className="scroll-top-value">
//       {percentage === 100 ? (
//           <i className="fas fa-arrow-up"></i> // Show the up arrow icon at 100%
//         ) : (
//           `${Math.round(percentage)}%`
//         )}
//       </span>
//     </div>
  );
};

export default ScrollTop;
