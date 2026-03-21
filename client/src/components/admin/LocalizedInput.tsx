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
}

const LocalizedInput: React.FC<LocalizedInputProps> = ({
  value,
  onChange,
  label,
  placeholder,
  className = "",
  type = "text",
}) => {
  const [activeLang, setActiveLang] = useState<AdminLanguage>("en");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      [activeLang]: e.target.value,
    });
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        {label && <label className="text-sm font-medium">{label}</label>}
        <div className="flex gap-0.5 bg-muted p-0.5 rounded-md border text-[10px]">
          {LANGUAGES.map(({ id, label: langLabel }) => {
            const isActive = activeLang === id;
            const Flag = FLAG_COMPONENTS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveLang(id)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-sm transition-all uppercase font-bold",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                )}
                title={langLabel}
              >
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
