"use client";

import React, {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type {
  TinySliderInfo,
  TinySliderInstance,
  TinySliderSettings,
} from "tiny-slider";

type TinySliderEventCallback = (info: TinySliderInfo) => void;

type TinySliderClickCallback = (
  slide: Element | null,
  info: TinySliderInfo | null,
  event: React.MouseEvent<HTMLDivElement>
) => void;

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
  /**
   * Changes to text, links or other slide content can require a fresh
   * imperative instance even when the React child keys stay the same.
   */
  rebuildKey?: React.Key;
  onClick?: TinySliderClickCallback;
  onInit?: (initialized: boolean) => void;
  onIndexChanged?: TinySliderEventCallback;
  onTransitionStart?: TinySliderEventCallback;
  onTransitionEnd?: TinySliderEventCallback;
  onTouchStart?: TinySliderEventCallback;
  onTouchMove?: TinySliderEventCallback;
  onTouchEnd?: TinySliderEventCallback;
}

type SliderCallbacks = Pick<
  TinySliderWrapperProps,
  | "onClick"
  | "onInit"
  | "onIndexChanged"
  | "onTransitionStart"
  | "onTransitionEnd"
  | "onTouchStart"
  | "onTouchMove"
  | "onTouchEnd"
>;

interface SliderRuntimeProps
  extends Omit<
    TinySliderWrapperProps,
    "placeholderClassName" | "placeholderStyle" | "rebuildKey"
  > {
  callbacksRef: MutableRefObject<SliderCallbacks>;
  instanceRef: MutableRefObject<TinySliderInstance | null>;
}

type TinySliderModule = typeof import("tiny-slider");

let tinySliderModulePromise: Promise<TinySliderModule> | null = null;

const loadTinySlider = () => {
  tinySliderModulePromise ??= import("tiny-slider");
  return tinySliderModulePromise;
};

const getChildrenSignature = (children: React.ReactNode) =>
  Children.toArray(children)
    .map((child, index) =>
      isValidElement(child)
        ? String(child.key ?? index)
        : `${typeof child}:${String(child)}`
    )
    .join("|");

const getSettingsSignature = (
  settings: TinySliderWrapperProps["settings"]
) => {
  try {
    return JSON.stringify(settings, (_key, value) => {
      if (typeof value === "function") return "[function]";
      if (typeof Element !== "undefined" && value instanceof Element) {
        return `[Element:${value.tagName}:${value.id}:${value.className}]`;
      }
      return value;
    });
  } catch {
    return Object.keys(settings).sort().join("|");
  }
};

const createSliderSettings = (
  settings: TinySliderWrapperProps["settings"],
  container: HTMLElement
): TinySliderSettings => {
  const normalized = { ...settings } as Record<string, unknown>;

  // React owns everything outside the host. Passing any of these elements to
  // tiny-slider would let destroy() replace React-owned DOM via outerHTML.
  const externalDomOptions = [
    "controlsContainer",
    "navContainer",
    "prevButton",
    "nextButton",
    "autoplayButton",
  ] as const;
  const unsafeOption = externalDomOptions.find(
    (option) => normalized[option] !== undefined && normalized[option] !== false
  );

  if (unsafeOption) {
    throw new Error(
      `TinySliderWrapper does not accept "${unsafeOption}". Render controls in React and call slider.goTo() instead.`
    );
  }

  externalDomOptions.forEach((option) => delete normalized[option]);
  delete normalized.container;
  delete normalized.onInit;

  return {
    ...(normalized as TinySliderSettings),
    container,
  };
};

const SliderRuntime = ({
  settings,
  children,
  className,
  style,
  callbacksRef,
  instanceRef,
}: SliderRuntimeProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const settingsRef = useRef(settings);

  useLayoutEffect(() => {
    let cancelled = false;
    let instance: TinySliderInstance | null = null;

    void loadTinySlider().then(({ tns }) => {
      if (cancelled || !hostRef.current || !containerRef.current) return;

      instance = tns(
        createSliderSettings(settingsRef.current, containerRef.current)
      );
      instanceRef.current = instance;

      instance.events.on("indexChanged", (info) => {
        callbacksRef.current.onIndexChanged?.(info);
      });
      instance.events.on("transitionStart", (info) => {
        draggingRef.current = true;
        callbacksRef.current.onTransitionStart?.(info);
      });
      instance.events.on("transitionEnd", (info) => {
        draggingRef.current = false;
        callbacksRef.current.onTransitionEnd?.(info);
      });
      instance.events.on("touchStart", (info) => {
        callbacksRef.current.onTouchStart?.(info);
      });
      instance.events.on("touchMove", (info) => {
        callbacksRef.current.onTouchMove?.(info);
      });
      instance.events.on("touchEnd", (info) => {
        callbacksRef.current.onTouchEnd?.(info);
      });

      callbacksRef.current.onInit?.(true);
    });

    return () => {
      cancelled = true;
      draggingRef.current = false;

      if (instanceRef.current === instance) {
        instanceRef.current = null;
      }

      // The keyed runtime owns this instance. It is destroyed exactly once
      // while its stable React-owned host still exists.
      instance?.destroy();
    };
  }, [callbacksRef, instanceRef]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const callback = callbacksRef.current.onClick;
    if (!callback || draggingRef.current) return;

    const instance = instanceRef.current;
    if (!instance) {
      callback(null, null, event);
      return;
    }

    const info = instance.getInfo();
    callback(info.slideItems[info.index] ?? null, info, event);
  };

  return (
    <div
      ref={hostRef}
      className="tiny-slider-host"
      data-tiny-slider-host=""
      onClick={handleClick}
    >
      <div ref={containerRef} className={className} style={style}>
        {children}
      </div>
    </div>
  );
};

/**
 * React/Next.js lifecycle adapter for tiny-slider.
 *
 * The React-owned host is stable while tiny-slider owns only its descendants.
 * A keyed runtime creates one instance and destroys that same instance once;
 * it never calls rebuild() and never patches or suppresses destroy errors.
 */
export const TinySliderWrapper = forwardRef<
  TinySliderHandle,
  TinySliderWrapperProps
>(
  (
    {
      settings,
      children,
      className,
      placeholderClassName,
      placeholderStyle,
      style,
      rebuildKey,
      onClick,
      onInit,
      onIndexChanged,
      onTransitionStart,
      onTransitionEnd,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    ref
  ) => {
    const [isMounted, setIsMounted] = useState(false);
    const instanceRef = useRef<TinySliderInstance | null>(null);
    const callbacksRef = useRef<SliderCallbacks>({});

    callbacksRef.current = {
      onClick,
      onInit,
      onIndexChanged,
      onTransitionStart,
      onTransitionEnd,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    };

    useImperativeHandle(
      ref,
      () => ({
        get slider() {
          return instanceRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      setIsMounted(true);
    }, []);

    const lifecycleKey = [
      getSettingsSignature(settings),
      getChildrenSignature(children),
      String(rebuildKey ?? ""),
      className ?? "",
      JSON.stringify(style ?? {}),
    ].join("::");

    if (!isMounted) {
      return (
        <div className="tiny-slider-host" data-tiny-slider-host="">
          <div
            className={
              placeholderClassName || className || "tiny-slider-placeholder"
            }
            style={placeholderStyle}
          >
            {children}
          </div>
        </div>
      );
    }

    return (
      <SliderRuntime
        key={lifecycleKey}
        settings={settings}
        className={className}
        style={style}
        callbacksRef={callbacksRef}
        instanceRef={instanceRef}
      >
        {children}
      </SliderRuntime>
    );
  }
);

TinySliderWrapper.displayName = "TinySliderWrapper";
