"use client";

import { createComponentSlot } from "@/lib/componentSlot";

/**
 * The mobile drawer, once SiteHeader has loaded it (loadDrawer). HomeClientShell
 * renders it from here. Imported by the layout's shell instead, the drawer's
 * chunk carried its own copy of next/link, next/image and the URL helpers:
 * 10 KB gzip fetched again on every phone page view (lib/componentSlot.ts).
 */
const slot = createComponentSlot();

export const provideDrawer = slot.provide;
export const useDrawerComponent = slot.useComponent;
