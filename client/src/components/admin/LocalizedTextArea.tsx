"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { AdminLanguage } from "./AdminLanguageTabs";
import LocalizedField from "./LocalizedField";

interface LocalizedTextAreaProps {
  value: any;
  onChange: (value: any, lang: AdminLanguage) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  rows?: number;
  activeLanguage?: AdminLanguage;
}

const LocalizedTextArea: React.FC<LocalizedTextAreaProps> = ({
  value = { en: "", de: "", it: "", es: "" },
  onChange,
  label,
  placeholder,
  className = "",
  rows = 4,
  activeLanguage,
}) => {
  return (
    <LocalizedField
      label={label}
      value={value}
      globalLanguage={activeLanguage}
      className={className}
      onChange={(lang, val) => onChange({ ...value, [lang]: val }, lang)}
    >
      {(lang, currentValue, handleLang) => (
        <Textarea
          value={currentValue || ""}
          onChange={(e) => handleLang(e.target.value)}
          placeholder={placeholder ? `${placeholder} (${lang.toUpperCase()})` : `Enter value in ${lang.toUpperCase()}`}
          rows={rows}
          className="transition-all focus:ring-1 focus:ring-[#b79c5c]"
        />
      )}
    </LocalizedField>
  );
};

export default LocalizedTextArea;
