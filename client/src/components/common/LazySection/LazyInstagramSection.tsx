"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

const ROOT_MARGIN = "300px";

const placeholderStyle: CSSProperties = {
  minHeight: 520,
};

const InstagramOne = dynamic(
  () => import("@/components/sections/InstagramOne/InstagramOne"),
  {
    ssr: false,
    loading: () => <div aria-hidden="true" style={placeholderStyle} />,
  }
);

export default function LazyInstagramSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) {
      return;
    }

    const section = sectionRef.current;
    if (!section || !("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: ROOT_MARGIN }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={sectionRef}>
      {shouldLoad ? <InstagramOne /> : <div aria-hidden="true" style={placeholderStyle} />}
    </div>
  );
}
