"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { type AdminLanguage } from "./AdminLanguageTabs";

interface LocalizedFieldProps {
  /** The localized data object e.g. { en: 'hello', de: 'hallo', it: 'ciao' } */
  value: Record<AdminLanguage, string> | any;
  /** Called when the active language's value changes (for plain inputs/textareas) */
  onChange?: (lang: AdminLanguage, value: string) => void;
  /** Label for the field */
  label?: string;
  /** If provided, syncs the active language with the global page language */
  globalLanguage?: AdminLanguage;
  /** Additional class for the wrapper */
  className?: string;
  /** Render the actual input/textarea/editor as a function-child, receiving the active language value and a change handler */
  children: (
    activeLang: AdminLanguage,
    currentValue: string,
    handleChange: (val: string) => void
  ) => React.ReactNode;
}

const LANGS: AdminLanguage[] = ["en", "de", "it", "es"];
const LANG_LABELS: Record<AdminLanguage, string> = {
  en: "EN",
  de: "DE",
  it: "IT",
  es: "ES",
};

/**
 * Wraps any input or rich text editor with per-field language tabs.
 * Shows EN | DE | IT badges above the field. Clicking one switches the field
 * to that language's value without affecting other fields on the page.
 */
export function LocalizedField({
  value,
  onChange,
  label,
  globalLanguage,
  className,
  children,
}: LocalizedFieldProps) {
  const [activeLang, setActiveLang] = useState<AdminLanguage>(
    globalLanguage || "en"
  );

  // Sync with global language tab if provided
  React.useEffect(() => {
    if (globalLanguage) {
      setActiveLang(globalLanguage);
    }
  }, [globalLanguage]);

  const safeValue = value || {};
  const currentValue =
    typeof safeValue === "object" ? safeValue[activeLang] || "" : "";

  const hasContent = (lang: AdminLanguage) => {
    if (!safeValue || typeof safeValue !== "object") return false;
    const v = safeValue[lang];
    return typeof v === "string" ? v.trim().length > 0 : false;
  };

  const handleChange = (val: string) => {
    if (onChange) onChange(activeLang, val);
  };

  return (
    <div className={cn("space-y-1", className)}>
      {/* Language tab strip */}
      <div className="flex items-center gap-1">
        {label && (
          <span className="text-xs text-muted-foreground font-medium mr-1 flex-1">
            {label}
          </span>
        )}
        <div className="flex items-center gap-0.5 rounded border bg-muted/40 px-0.5 py-0.5 ml-auto">
          {LANGS.map((lang) => {
            const isActive = activeLang === lang;
            const filled = hasContent(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLang(lang)}
                className={cn(
                  "relative px-2 py-0.5 text-[10px] font-bold rounded transition-all uppercase tracking-wide",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                )}
                title={`Edit ${lang.toUpperCase()} version`}
              >
                {lang.toUpperCase()}
                {/* Dot indicator for content presence */}
                {filled && !isActive && (
                  <span className="absolute top-0 right-0 w-1 h-1 rounded-full bg-emerald-400 translate-x-0.5 -translate-y-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* The actual input wrapped by parent */}
      {children(activeLang, currentValue, handleChange)}
    </div>
  );
}

export default LocalizedField;
