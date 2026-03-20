"use client";

import React from "react";
import { GB, DE, IT, ES } from "country-flag-icons/react/3x2";
import { cn } from "@/lib/utils";

export type AdminLanguage = "en" | "de" | "it" | "es";

interface AdminLanguageTabsProps {
  activeLanguage: AdminLanguage;
  onLanguageChange: (lang: AdminLanguage) => void;
  className?: string;
}

const LANGUAGES: { id: AdminLanguage; label: string; Icon: any }[] = [
  { id: "en", label: "English", Icon: GB },
  { id: "de", label: "German", Icon: DE },
  { id: "it", label: "Italian", Icon: IT },
  { id: "es", label: "Spanish", Icon: ES },
];

const AdminLanguageTabs: React.FC<AdminLanguageTabsProps> = ({
  activeLanguage,
  onLanguageChange,
  className = "",
}) => {
  return (
    <div className={cn("flex items-center gap-3 p-2 bg-muted/30 rounded-lg border border-dashed", className)}>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
        Language:
      </span>
      <div className="flex gap-1 bg-muted p-1 rounded-md border shadow-sm">
        {LANGUAGES.map(({ id, label, Icon }) => {
          const isActive = activeLanguage === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onLanguageChange(id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium transition-all",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
              title={label}
            >
              <Icon className="w-4 h-3 rounded-[1px]" />
              <span className="uppercase">{id}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminLanguageTabs;
