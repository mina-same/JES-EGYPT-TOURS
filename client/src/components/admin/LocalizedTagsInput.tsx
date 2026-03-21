"use client";

import React, { useState } from "react";
import { GB, DE, IT, ES } from "country-flag-icons/react/3x2";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
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

interface LocalizedTagsInputProps {
  value: any; // Record<string, string[]>
  onChange: (value: any) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const LocalizedTagsInput: React.FC<LocalizedTagsInputProps> = ({
  value = { en: [], de: [], it: [], es: [] },
  onChange,
  label,
  placeholder = "Type and press Enter...",
  className = "",
}) => {
  const [activeLang, setActiveLang] = useState<AdminLanguage>("en");
  const [inputValue, setInputValue] = useState("");

  const safeValue = (lang: AdminLanguage) => {
    return Array.isArray(value[lang]) ? value[lang] : [];
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().replace(/,$/, "");
    if (!trimmed) return;
    
    const currentTags = safeValue(activeLang);
    if (!currentTags.includes(trimmed)) {
      onChange({
        ...value,
        [activeLang]: [...currentTags, trimmed],
      });
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = safeValue(activeLang);
    onChange({
      ...value,
      [activeLang]: currentTags.filter((t: string) => t !== tagToRemove),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && safeValue(activeLang).length > 0) {
      removeTag(safeValue(activeLang)[safeValue(activeLang).length - 1]);
    }
  };

  return (
    <div className={cn("space-y-2.5", className)}>
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
                {safeValue(id).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-background z-10" />
                )}
                <Flag className="w-3 h-2 rounded-[0.5px]" />
                {id}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 p-2 min-h-[42px] rounded-md border bg-background focus-within:ring-1 focus-within:ring-[#b79c5c]">
        {safeValue(activeLang).map((tag: string) => (
          <Badge 
            key={tag} 
            variant="secondary" 
            className="flex items-center gap-1.5 px-2 py-0.5 animate-in fade-in zoom-in duration-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(inputValue)}
          placeholder={safeValue(activeLang).length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
        />
      </div>
    </div>
  );
};

export default LocalizedTagsInput;
