"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});

interface TinySliderWrapperProps {
  settings: any;
  children: React.ReactNode;
  className?: string;
  [key: string]: any; // Allow any other props
}

/**
 * A safe wrapper around TinySlider that prevents NoModificationAllowedError
 * by ensuring proper mounting/unmounting lifecycle in Next.js
 */
export const TinySliderWrapper = forwardRef<any, TinySliderWrapperProps>(
  ({ settings, children, className, ...otherProps }, ref) => {
    const [isMounted, setIsMounted] = useState(false);
    const internalRef = useRef<any>(null);

    // Expose the internal ref to parent components
    useImperativeHandle(ref, () => internalRef.current);

    useEffect(() => {
      // Only mount after client-side hydration is complete
      setIsMounted(true);

      return () => {
        // Safely cleanup the slider
        try {
          if (internalRef.current && internalRef.current.slider) {
            const sliderInstance = internalRef.current.slider;
            
            // Check if the slider container still has a parent before destroying
            if (sliderInstance.container && sliderInstance.container.parentNode) {
              sliderInstance.destroy();
            }
          }
        } catch (error) {
          // Silently catch any cleanup errors
          console.debug("TinySlider cleanup handled:", error);
        }
      };
    }, []);

    useEffect(() => {
      if (!isMounted) return;

      let cancelled = false;

      const patchDestroy = () => {
        if (cancelled) return;

        const sliderInstance = internalRef.current?.slider;
        if (!sliderInstance) {
          requestAnimationFrame(patchDestroy);
          return;
        }

        if (sliderInstance.__safeDestroyPatched) return;

        const originalDestroy =
          typeof sliderInstance.destroy === "function"
            ? sliderInstance.destroy.bind(sliderInstance)
            : null;

        if (originalDestroy) {
          sliderInstance.destroy = (...args: any[]) => {
            try {
              if (sliderInstance.container && !sliderInstance.container.parentNode) {
                return;
              }
            } catch {
              return;
            }

            try {
              return originalDestroy(...args);
            } catch {
              return;
            }
          };
        }

        sliderInstance.__safeDestroyPatched = true;
      };

      patchDestroy();

      return () => {
        cancelled = true;
      };
    }, [isMounted]);

    // Don't render anything until client-side hydration is complete
    if (!isMounted) {
      return <div className={className || "tiny-slider-placeholder"}>{children}</div>;
    }

    return (
      <TinySlider 
        ref={internalRef} 
        settings={settings} 
        className={className}
        {...otherProps}
      >
        {children}
      </TinySlider>
    );
  }
);

TinySliderWrapper.displayName = "TinySliderWrapper";

