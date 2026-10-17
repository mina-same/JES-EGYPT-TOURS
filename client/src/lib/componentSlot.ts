"use client";

import { useSyncExternalStore, type ComponentType } from "react";

/**
 * A place where the code that loads a component leaves it for the code that
 * renders it.
 *
 * The shell in the (home) layout renders the mobile drawer and the language &
 * currency sheet, but must not import them itself: a dynamic import can only
 * count on what its own part of the app has loaded, and the layout's part has
 * none of next/link, next/image, the URL helpers or the language logic, so
 * each chunk carried a second copy of what every page had already downloaded.
 * The header imports them instead and provides them here (Drawer/drawerSlot.ts,
 * SitePreferences/sheetSlot.ts). Filled once; null until then, and on the server.
 */
export function createComponentSlot() {
  let component: ComponentType | null = null;
  const listeners = new Set<() => void>();

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const getSnapshot = () => component;
  const getServerSnapshot = () => null;

  function provide(next: ComponentType): void {
    if (component) return;
    component = next;
    listeners.forEach((listener) => listener());
  }

  function useComponent(): ComponentType | null {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }

  return { provide, useComponent };
}
