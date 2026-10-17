"use client";

import { createComponentSlot } from "@/lib/componentSlot";

/**
 * The language & currency sheet, once PreferencesButton has loaded it
 * (loadSheet). HomeClientShell renders it from here, so the sheet's chunk
 * reuses the language code the header already has (lib/componentSlot.ts).
 */
const slot = createComponentSlot();

export const provideSheet = slot.provide;
export const usePreferencesSheet = slot.useComponent;
