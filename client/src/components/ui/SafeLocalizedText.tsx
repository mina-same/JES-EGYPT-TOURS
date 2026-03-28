import React from "react";
import { ILocalizedString } from "@/types/tour";

interface SafeLocalizedTextProps {
  textObj: ILocalizedString | string | undefined | null;
  locale: string;
  as?: React.ElementType;
  className?: string;
}

/**
 * Renders localized text safely for SEO.
 * If the current language exists, it renders normally.
 * If a fallback to English is needed, it wraps the text in a tag with the lang="en" attribute.
 */
export function SafeLocalizedText({ 
  textObj, 
  locale, 
  as: Component = "span",
  className 
}: SafeLocalizedTextProps) {
  if (!textObj) return null;

  // If it's just a regular string, render it natively assuming it matches current locale
  if (typeof textObj === "string") {
    return <Component className={className}>{textObj}</Component>;
  }

  // Cast to record to access dynamic keys safely
  const data = textObj as Record<string, string>;

  // Try current locale first
  if (data[locale] && data[locale].trim() !== "") {
    return <Component className={className}>{data[locale]}</Component>;
  }

  // Fallback to English with proper lang attribute for SEO
  if (data.en && data.en.trim() !== "") {
    return (
      <Component className={className} lang="en" dir="ltr">
        {data.en}
      </Component>
    );
  }

  // Fallback to any other language (less ideal, but better than nothing)
  const fallbackKey = Object.keys(data).find(key => data[key] && data[key].trim() !== "");
  if (fallbackKey) {
    return (
      <Component className={className} lang={fallbackKey}>
        {data[fallbackKey]}
      </Component>
    );
  }

  return null;
}
