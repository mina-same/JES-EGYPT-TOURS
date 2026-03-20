"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import './langusgeSelect.css'
import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

const LanguageSelector: React.FC = () => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const pathname = usePathname();
  const locales = ["en", "de", "it", "es"];
  const pathLocale = useMemo(() => {
    const seg = (pathname || "/").split("/")[1] || "";
    return locales.includes(seg) ? seg : "";
  }, [pathname]);
  const normalizedPath = useMemo(() => {
    const parts = (pathname || "/").split("/");
    const first = parts[1] || "";
    if (locales.includes(first)) {
      return "/" + parts.slice(2).join("/");
    }
    return pathname || "/";
  }, [pathname]);
  const options = useMemo(() => [
    { value: "en", label: t("language.english") },
    { value: "de", label: t("language.german") },
    { value: "it", label: t("language.italian") },
    { value: "es", label: t("language.spanish") },
  ], [t]);
  const [mounted, setMounted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(options[0]);

  useEffect(() => {
    setMounted(true);
    const current = (pathLocale || i18n.language || "en").split("-")[0];
    const found = options.find(o => o.value === current) || options[0];
    setSelectedOption(found);
  }, [options]);

  if (!mounted) {
    return <div style={{ width: '120px', height: '40px' }} />;
  }

  return (
    <div className="top-one__language-sort" suppressHydrationWarning>
      <Select
        classNamePrefix="custom-select"
        value={selectedOption}
        onChange={(option) => {
          if (!option) return;
          setSelectedOption(option);
          i18n.changeLanguage(option.value);
          try {
            localStorage.setItem("i18nextLng", option.value);
          } catch {}
          try {
            document.cookie = `NEXT_LOCALE=${option.value};path=/`;
          } catch {}
          const target = `/${option.value}${normalizedPath === "/" ? "/" : normalizedPath}`;
          router.push(target);
        }}
        options={options}
        isSearchable={false}
        components={{
          IndicatorSeparator: () => null, // removes the separator
        }}
        
      />
    </div>
  );
};

export default LanguageSelector;
