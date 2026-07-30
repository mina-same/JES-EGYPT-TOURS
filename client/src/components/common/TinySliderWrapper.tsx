"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";
import type { TinySliderInfo, TinySliderInstance, TinySliderSettings } from "tiny-slider";

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});

type TinySliderEventCallback = (info: TinySliderInfo) => void;

export interface TinySliderHandle {
  readonly slider: TinySliderInstance | null;
}

interface TinySliderWrapperProps {
  settings: TinySliderSettings | Record<string, unknown>;
  children: React.ReactNode;
  className?: string;
  placeholderClassName?: string;
  placeholderStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  onClick?: (...args: unknown[]) => void;
  onInit?: (initialized: boolean) => void;
  onIndexChanged?: TinySliderEventCallback;
  onTransitionStart?: TinySliderEventCallback;
  onTransitionEnd?: TinySliderEventCallback;
  onTouchStart?: TinySliderEventCallback;
  onTouchMove?: TinySliderEventCallback;
  onTouchEnd?: TinySliderEventCallback;
}

type SafeTinySliderInstance = TinySliderInstance & {
  __safeDestroyPatched?: boolean;
};

const isDestroyRaceError = (error: unknown) => {
  if (error instanceof DOMException && error.name === "NoModificationAllowedError") {
    return true;
  }

  return (
    error instanceof Error &&
    /outerHTML|element has no parent node|NoModificationAllowedError/i.test(error.message)
  );
};

/**
 * A safe wrapper around TinySlider that prevents NoModificationAllowedError
 * by ensuring proper mounting/unmounting lifecycle in Next.js
 */
export const TinySliderWrapper = forwardRef<TinySliderHandle, TinySliderWrapperProps>(
  ({ settings, children, className, placeholderClassName, placeholderStyle, ...otherProps }, ref) => {
    const [isMounted, setIsMounted] = useState(false);
    const internalRef = useRef<TinySliderHandle | null>(null);

    // Expose the internal ref to parent components
    useImperativeHandle(
      ref,
      () => ({
        get slider() {
          return internalRef.current?.slider ?? null;
        },
      }),
      []
    );

    useEffect(() => {
      // Only mount after client-side hydration is complete
      setIsMounted(true);
    }, []);

    useEffect(() => {
      if (!isMounted) return;

      let cancelled = false;
      let frameId: number | undefined;
      let attempts = 0;

      const patchDestroy = () => {
        if (cancelled) return;

        const sliderInstance = internalRef.current?.slider as SafeTinySliderInstance | null;
        if (!sliderInstance) {
          if (attempts < 120) {
            attempts += 1;
            frameId = window.requestAnimationFrame(patchDestroy);
          }
          return;
        }

        if (sliderInstance.__safeDestroyPatched) return;

        const originalDestroy = sliderInstance.destroy.bind(sliderInstance);

        sliderInstance.destroy = () => {
          try {
            const container = sliderInstance.getInfo().container;
            if (container && !container.parentNode) {
              return;
            }
          } catch (error) {
            if (isDestroyRaceError(error)) return;
            throw error;
          }

          try {
            originalDestroy();
          } catch (error) {
            if (!isDestroyRaceError(error)) throw error;
          }
        };

        sliderInstance.__safeDestroyPatched = true;
      };

      patchDestroy();

      return () => {
        cancelled = true;
        if (frameId !== undefined) {
          window.cancelAnimationFrame(frameId);
        }
      };
    }, [isMounted]);

    // Don't render anything until client-side hydration is complete
    if (!isMounted) {
      return (
        <div
          className={placeholderClassName || className || "tiny-slider-placeholder"}
          style={placeholderStyle}
        >
          {children}
        </div>
      );
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

