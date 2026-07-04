"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import './langusgeSelect.css'
import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { GB, DE, IT, ES } from "country-flag-icons/react/3x2";
import { useSlugs } from "@/contexts/SlugContext";

const FLAG_COMPONENTS: Record<string, any> = {
  en: GB,
  de: DE,
  it: IT,
  es: ES,
};

const STATIC_PATHS = new Set([
  "/",
  "/about",
  "/contact",
  "/faq",
  "/login",
  "/special-offers",
  "/tailor-made",
  "/search",
  "/wishlist",
  "/tours",
  "/tours/all",
  "/blogs",
  "/blogs/all",
  "/404",
]);

function getStrictSlug(value: string | undefined): string | null {
  if (typeof value !== "string") return null;

  const slug = value.trim().replace(/^\/+|\/+$/g, "");
  return slug || null;
}

function hasRealSlugMap(slugs: Record<string, string | undefined> | null): boolean {
  if (!slugs) return false;
  return Object.values(slugs).some((slug) => !!getStrictSlug(slug));
}

function isLikelyDynamicSlugPath(path: string): boolean {
  const normalized = path === "" ? "/" : path;
  if (STATIC_PATHS.has(normalized)) return false;

  const segments = normalized.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  return segments.length === 1;
}

interface LanguageSelectorProps {
  theme?: "light" | "dark";
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ theme = "dark" }) => {
  const { t } = useTranslation("common");
  const { localizedSlugs } = useSlugs();
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
  const currentLocale = (pathLocale || i18n.language || "en").split("-")[0];
  const hasDynamicSlugContext = useMemo(() => hasRealSlugMap(localizedSlugs), [localizedSlugs]);
  const isDynamicSlugPage = hasDynamicSlugContext || isLikelyDynamicSlugPath(normalizedPath);
  const options = useMemo(() => {
    const baseOptions = [
      { value: "en", label: t("language.english"), flag: "en" },
      { value: "de", label: t("language.german"), flag: "de" },
      { value: "it", label: t("language.italian"), flag: "it" },
      { value: "es", label: t("language.spanish"), flag: "es" },
    ];

    return baseOptions.map((option) => {
      const hasTargetSlug = !!getStrictSlug(localizedSlugs?.[option.value]);
      const isCurrentLocale = option.value === currentLocale;
      const isDisabled = isDynamicSlugPage && !isCurrentLocale && !hasTargetSlug;

      return {
        ...option,
        isDisabled,
      };
    });
  }, [currentLocale, isDynamicSlugPage, localizedSlugs, t]);
  const [mounted, setMounted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(options[0]);

  useEffect(() => {
    setMounted(true);
    const found = options.find(o => o.value === currentLocale) || options[0];
    setSelectedOption(found);

    if (isDynamicSlugPage) {
      return;
    }

    // Filter and log user country/timezone
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Automatic Language Detection (only on first visit if no preference is saved)
      const hasPreference = localStorage.getItem("i18nextLng");
      if (!hasPreference) {
          let detectedLocale = 'en'; // Default
          
          // Detection using timezone (as requested)
          const tz = timezone.toLowerCase();
          if (tz.includes('berlin') || tz.includes('zurich') || tz.includes('vienna') || tz.includes('germany') || tz.includes('europe/london') === false && (navigator.language.startsWith('de'))) {
            detectedLocale = 'de';
          } else if (tz.includes('rome') || tz.includes('milan') || tz.includes('venice') || (navigator.language.startsWith('it'))) {
            detectedLocale = 'it';
          } else if (tz.includes('madrid') || tz.includes('barcelona') || tz.includes('sevilla') || (navigator.language.startsWith('es'))) {
            detectedLocale = 'es';
          }

          // If detected non-english and we are currently on default 'en'
          if (detectedLocale !== 'en' && pathLocale === 'en') {
             const target = `/${detectedLocale}${normalizedPath === "/" ? "/" : normalizedPath}`;
             i18n.changeLanguage(detectedLocale);
             localStorage.setItem("i18nextLng", detectedLocale);
             document.cookie = `NEXT_LOCALE=${detectedLocale};path=/`;
             router.push(target);
          }
      }
    } catch (e) {
      console.error("Location/Detection failed", e);
    }
  }, [currentLocale, isDynamicSlugPage, normalizedPath, options, pathLocale, router]);

  if (!mounted) {
    return <div style={{ width: '120px', height: '40px' }} />;
  }

  return (
    <div className={cn("top-one__language-sort", theme === "light" && "light")} suppressHydrationWarning>
      <Select
        classNamePrefix="custom-select"
        value={selectedOption}
        onChange={(option: any) => {
          if (!option) return;
          if (option.isDisabled) return;

          let targetPath = normalizedPath;
          
          // If we have localized slugs, we need to replace the last segment of the path
          if (isDynamicSlugPage) {
            const newSlug = getStrictSlug(localizedSlugs?.[option.value]);
            if (!newSlug && option.value !== currentLocale) {
              return;
            }
            if (newSlug) {
              const pathParts = normalizedPath.split("/");
              // Assuming the slug is the last part of relevant paths (tours/slug, category/slug, etc.)
              if (pathParts.length > 1) {
                pathParts[pathParts.length - 1] = newSlug;
                targetPath = pathParts.join("/");
              }
            }
          }

          setSelectedOption(option);
          i18n.changeLanguage(option.value);
          try {
            localStorage.setItem("i18nextLng", option.value);
          } catch {}
          try {
            document.cookie = `NEXT_LOCALE=${option.value};path=/`;
          } catch {}

          const target = `/${option.value}${targetPath === "/" ? "/" : targetPath}`;
          router.push(target);
        }}
        options={options}
        isSearchable={false}
        isOptionDisabled={(option: any) => !!option.isDisabled}
        components={{
          IndicatorSeparator: () => null,
          Option: (props: any) => {
            const Flag = FLAG_COMPONENTS[props.data.flag] || GB;
            return (
              <div
                {...props.innerProps}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors text-sm",
                  props.isFocused ? "bg-[#b79c5c]/10 text-[#b79c5c]" : (theme === "dark" ? "text-white" : "text-black"),
                  "hover:bg-[#b79c5c]/10 hover:text-[#b79c5c]",
                  props.isSelected ? "bg-[#b79c5c] text-white" : "",
                  props.isDisabled && "opacity-45 cursor-not-allowed hover:bg-transparent hover:text-inherit"
                )}
                aria-disabled={props.isDisabled}
                title={props.isDisabled ? `${props.data.label} unavailable for this page` : props.data.label}
              >
                <Flag className="w-5 h-3.5 rounded-sm object-cover shadow-sm" />
                <span>{props.data.label}</span>
              </div>
            );
          },
          SingleValue: (props: any) => {
            const Flag = FLAG_COMPONENTS[props.data.flag] || GB;
            return (
              <div className={cn("flex items-center gap-2 whitespace-nowrap overflow-visible", theme === "dark" ? "text-white" : "text-black")}>
                <Flag className="w-5 h-3.5 rounded-sm object-cover shadow-sm flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">{props.data.label}</span>
              </div>
            );
          }
        }}
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: 'transparent',
            border: '1px solid rgba(183, 156, 92, 0.3)',
            borderRadius: '8px',
            minHeight: '38px',
            height: '38px',
            display: 'flex !important',
            flexDirection: 'row !important' as any,
            flexWrap: 'nowrap !important' as any,
            alignItems: 'center !important' as any,
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: 'none',
            '&:hover': {
              borderColor: '#b79c5c'
            }
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: theme === "dark" ? '#1a1a1a' : '#fff',
            border: '1px solid rgba(183, 156, 92, 0.2)',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            zIndex: 999
          }),
          valueContainer: (base) => ({
            ...base,
            padding: '0 8px',
            display: 'flex !important',
            flexDirection: 'row !important' as any,
            flexWrap: 'nowrap !important' as any,
            alignItems: 'center !important' as any,
            gap: '8px',
            overflow: 'visible',
            flex: '1',
          }),
          indicatorsContainer: (base) => ({
            ...base,
            height: '38px',
            alignItems: 'center',
            paddingRight: '4px'
          }),
          dropdownIndicator: (base) => ({
            ...base,
            color: '#b79c5c',
            '&:hover': {
              color: '#d4bb7d'
            }
          })
        }}
      />
    </div>
  );
};

export default LanguageSelector;
