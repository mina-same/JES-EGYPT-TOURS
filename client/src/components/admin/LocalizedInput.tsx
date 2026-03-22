"use client";

import React, { useState } from "react";
import { GB, DE, IT, ES } from "country-flag-icons/react/3x2";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AdminLanguage } from "./AdminLanguageTabs";

const FLAG_COMPONENTS: Record<AdminLanguage, any> = {
  en: GB,
  de: DE,
  it: IT,
  es: ES,
};

const LANGUAGES: { id: AdminLanguage; label: string }[] = [
  { id: "en", label: "English" },
  { id: "de", label: "German" },
  { id: "it", label: "Italian" },
  { id: "es", label: "Spanish" },
];

interface LocalizedInputProps {
  value: any;
  onChange: (value: any) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  type?: string;
  "data-field"?: string;
}

const LocalizedInput: React.FC<LocalizedInputProps> = ({
  value,
  onChange,
  label,
  placeholder,
  className = "",
  type = "text",
  "data-field": dataField,
}) => {
  const [activeLang, setActiveLang] = useState<AdminLanguage>("en");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      [activeLang]: e.target.value,
    });
  };

  return (
    <div className={cn("space-y-2.5", className)} data-field={dataField}>
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {label && <label className="text-sm font-medium whitespace-nowrap">{label}</label>}
        <div className="flex gap-1 bg-muted p-1 rounded-md border text-[10px] shadow-sm">
          {LANGUAGES.map(({ id, label: langLabel }) => {
            const isActive = activeLang === id;
            const Flag = FLAG_COMPONENTS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveLang(id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-2.5 py-1 rounded-sm transition-all uppercase font-bold min-w-[38px] justify-center",
                  isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                )}
                title={langLabel}
              >
                {/* Green dot indicator for content */}
                {value[id] && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-background z-10" />
                )}
                <Flag className="w-3 h-2 rounded-[0.5px]" />
                {id}
              </button>
            );
          })}
        </div>
      </div>
      <Input
        type={type}
        value={value[activeLang] || ""}
        onChange={handleInputChange}
        placeholder={placeholder ? `${placeholder} (${activeLang})` : `Enter value in ${activeLang}`}
        className="h-10 transition-all focus:ring-1 focus:ring-[#b79c5c]"
      />
    </div>
  );
};

export default LocalizedInput;
