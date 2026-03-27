"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { AdminLanguage } from "./AdminLanguageTabs";
import LocalizedField from "./LocalizedField";

interface LocalizedInputProps {
  value: any;
  onChange: (value: any) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  type?: string;
  "data-field"?: string;
  activeLanguage?: AdminLanguage;
}

const LocalizedInput: React.FC<LocalizedInputProps> = ({
  value = { en: "", de: "", it: "", es: "" },
  onChange,
  label,
  placeholder,
  className = "",
  type = "text",
  "data-field": dataField,
  activeLanguage,
}) => {
  return (
    <LocalizedField
      label={label}
      value={value}
      globalLanguage={activeLanguage}
      className={className}
      onChange={(lang, val) => onChange({ ...value, [lang]: val })}
    >
      {(lang, currentValue, handleLang) => (
        <Input
          type={type}
          value={currentValue || ""}
          onChange={(e) => handleLang(e.target.value)}
          placeholder={placeholder ? `${placeholder} (${lang.toUpperCase()})` : `Enter value in ${lang.toUpperCase()}`}
          className="h-10 transition-all focus:ring-1 focus:ring-[#b79c5c]"
          data-field={dataField}
        />
      )}
    </LocalizedField>
  );
};

export default LocalizedInput;
