"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { AdminLanguage } from "./AdminLanguageTabs";
import LocalizedField from "./LocalizedField";
import { cn } from "@/lib/utils";

interface LocalizedTagsInputProps {
  value: any; // Record<string, string[]>
  onChange: (value: any, lang: AdminLanguage) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  activeLanguage?: AdminLanguage;
  error?: boolean;
}

const LocalizedTagsInput: React.FC<LocalizedTagsInputProps> = ({
  value = { en: [], de: [], it: [], es: [] },
  onChange,
  label,
  placeholder = "Type and press Enter...",
  className = "",
  activeLanguage,
  error,
}) => {
  const [inputValue, setInputValue] = useState("");

  const safeValue = (lang: AdminLanguage) => {
    return Array.isArray(value?.[lang]) ? value[lang] : [];
  };

  const addTag = (lang: AdminLanguage, tag: string) => {
    if (!tag.trim()) return;
    
    // Split by comma or newline to support pasting lists or bulk entry
    const parts = tag.split(/[,\n\r]+/).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return;
    
    const currentTags = safeValue(lang);
    const newTags = [...currentTags];
    let changed = false;

    parts.forEach(trimmed => {
      if (!newTags.includes(trimmed)) {
        newTags.push(trimmed);
        changed = true;
      }
    });

    if (changed) {
      onChange({
        ...value,
        [lang]: newTags,
      }, lang);
    }
    setInputValue("");
  };

  const removeTag = (lang: AdminLanguage, tagToRemove: string) => {
    const currentTags = safeValue(lang);
    onChange({
      ...value,
      [lang]: currentTags.filter((t: string) => t !== tagToRemove),
    }, lang);
  };

  return (
    <LocalizedField
      label={label}
      value={value}
      globalLanguage={activeLanguage}
      className={className}
      onChange={() => {}} // Not used as we handle updates inside
    >
      {(lang, currentValue, _handleLang) => {
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(lang, inputValue);
          } else if (e.key === "Backspace" && !inputValue && safeValue(lang).length > 0) {
            removeTag(lang, safeValue(lang)[safeValue(lang).length - 1]);
          }
        };

        return (
          <div className={cn(
            "flex flex-wrap gap-2 p-2 min-h-[42px] rounded-md border bg-background focus-within:ring-1 focus-within:ring-[#b79c5c]",
            error ? "border-red-500 ring-red-500" : ""
          )}>
            {safeValue(lang).map((tag: string) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="flex items-center gap-1.5 px-2 py-0.5 animate-in fade-in zoom-in duration-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(lang, tag)}
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
              onBlur={() => addTag(lang, inputValue)}
              placeholder={safeValue(lang).length === 0 ? placeholder : ""}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
            />
          </div>
        );
      }}
    </LocalizedField>
  );
};

export default LocalizedTagsInput;
