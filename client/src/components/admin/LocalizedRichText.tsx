"use client";

import React from "react";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { AdminLanguage } from "./AdminLanguageTabs";
import LocalizedField from "./LocalizedField";

interface LocalizedRichTextProps {
  value: any;
  onChange: (value: any, lang: AdminLanguage) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  activeLanguage?: AdminLanguage;
}

const LocalizedRichText: React.FC<LocalizedRichTextProps> = ({
  value = { en: "", de: "", it: "", es: "" },
  onChange,
  label,
  placeholder,
  className = "",
  activeLanguage,
}) => {
  return (
    <LocalizedField
      label={label}
      value={value}
      globalLanguage={activeLanguage}
      className={className}
      onChange={(lang, val) => onChange({ ...(value || {}), [lang]: val }, lang)}
    >
      {(lang, currentValue, handleLang) => (
        <RichTextEditor
          key={lang}
          value={currentValue || ""}
          onChange={handleLang}
          placeholder={placeholder ? `${placeholder} (${lang.toUpperCase()})` : `Enter content in ${lang.toUpperCase()}`}
        />
      )}
    </LocalizedField>
  );
};

export default LocalizedRichText;
