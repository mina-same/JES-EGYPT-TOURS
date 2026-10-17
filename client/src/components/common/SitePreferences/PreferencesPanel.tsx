"use client";

import React, { useId } from "react";
import { useTranslation } from "react-i18next";
import { GB } from "country-flag-icons/react/3x2";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { isKeyboardClick } from "@/components/common/LanguageSelector/languageFocus";
import { useLanguageSwitch } from "@/components/common/LanguageSelector/useLanguageSwitch";
import { CURRENCIES, CURRENCY_SYMBOLS, ENDONYMS, FLAGS } from "./preferenceOptions";

interface PreferencesPanelProps {
  /** Called just before the page moves to another language. */
  onLanguageSwitch?: () => void;
  /** Called when a choice is complete without leaving the page: a currency, or the current language. */
  onDone?: () => void;
}

const CheckIcon = () => (
  <svg
    className='site-prefs__check'
    width='16'
    height='16'
    viewBox='0 0 16 16'
    aria-hidden='true'
    focusable='false'
  >
    <path
      d='M3 8.5l3 3 7-7'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

/**
 * Language and currency, every option on screen at once: one tap changes
 * either, with no list to open first. Shared by the bottom sheet the header
 * button opens (PreferencesSheet) and the mobile menu (Drawer).
 *
 * The languages are links to this page in each language, with the same
 * targets, unavailable states and switch as the top bar's LanguageSelector
 * (useLanguageSwitch). The currencies are toggle buttons that apply at once.
 */
const PreferencesPanel: React.FC<PreferencesPanelProps> = ({ onLanguageSwitch, onDone }) => {
  const { t } = useTranslation("common");
  const { options, currentLocale, getTargetUrl, switchLanguage } = useLanguageSwitch();
  const { currency, setCurrency } = useCurrency();
  const languageLabelId = useId();
  const currencyLabelId = useId();

  const handleLanguageClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    locale: string,
    target: string
  ) => {
    // A modified click (new tab, new window, download) is the browser's.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    if (locale === currentLocale) {
      onDone?.();
      return;
    }
    onLanguageSwitch?.();
    switchLanguage(locale, target, isKeyboardClick(event));
  };

  return (
    <div className='site-prefs'>
      <div className='site-prefs__group'>
        <p id={languageLabelId} className='site-prefs__label'>
          {t("language.label")}
        </p>
        <ul className='site-prefs__languages' aria-labelledby={languageLabelId}>
          {options.map((option) => {
            const Flag = FLAGS[option.flag] || GB;
            const isCurrent = option.value === currentLocale;
            const href = option.isDisabled ? null : getTargetUrl(option.value);
            const name = (
              <>
                <Flag aria-hidden='true' className='site-prefs__flag' />
                <span className='site-prefs__name' lang={option.value}>
                  {ENDONYMS[option.value] || option.label}
                </span>
              </>
            );

            return (
              <li key={option.value}>
                {href ? (
                  <a
                    href={href}
                    hrefLang={option.value}
                    className={cn("site-prefs__option site-prefs__language", isCurrent && "is-current")}
                    aria-current={isCurrent ? "page" : undefined}
                    onClick={(event) => handleLanguageClick(event, option.value, href)}
                  >
                    {name}
                    {isCurrent ? <CheckIcon /> : null}
                  </a>
                ) : (
                  // No version of this page in that language: a link that leads nowhere.
                  <a
                    role='link'
                    aria-disabled='true'
                    className='site-prefs__option site-prefs__language is-disabled'
                    title={t("preferences.unavailable")}
                  >
                    {name}
                    <span className='sr-only'> ({t("preferences.unavailable")})</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className='site-prefs__group'>
        <p id={currencyLabelId} className='site-prefs__label'>
          {t("preferences.currency")}
        </p>
        <div className='site-prefs__currencies' role='group' aria-labelledby={currencyLabelId}>
          {CURRENCIES.map((code) => (
            <button
              key={code}
              type='button'
              className='site-prefs__option site-prefs__currency'
              aria-pressed={code === currency}
              onClick={() => {
                setCurrency(code);
                onDone?.();
              }}
            >
              <span className='site-prefs__symbol' aria-hidden='true'>
                {CURRENCY_SYMBOLS[code]}
              </span>
              {code}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreferencesPanel;
