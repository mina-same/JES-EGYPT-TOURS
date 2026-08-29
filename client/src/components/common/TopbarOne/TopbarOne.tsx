"use client";

import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { topbarOne } from "@/data/topbarOne";

import Link from "next/link";
import LanguageSelector from "../LanguageSelector/LanguageSelector";
import CurrencySwitcher from "../CurrencySwitcher/CurrencySwitcher";
import { useTranslation } from "react-i18next";
import { getLocaleFromPath, localizeInternalUrl } from "@/lib/url";
import { usePathname } from "next/navigation";

interface ContactInfoItem {
  type: string;
  iconClass: string;
  label: string;
  href: string;
}
interface ContactInfoItemTwo {
  type: string;
  iconClass: string;
  label: string;
  href: string;
}

interface AddressInfo {
  iconClass: string;
  label: string;
  href: string;
}

interface TopbarOneData {
  contactInfo: ContactInfoItem[];
  contactInfoTwo: ContactInfoItemTwo[];
  address: AddressInfo;
}
interface TopbarOneProps {
  extraClass?: string;
}

type ActiveTopbarDropdown = "language" | "currency" | null;

const TopbarOne: React.FC<TopbarOneProps> = ({ extraClass }) => {
  const { contactInfo, contactInfoTwo, address }: TopbarOneData =
    topbarOne;

  const [mounted, setMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<ActiveTopbarDropdown>(null);
  useEffect(() => {
    setMounted(true);
  }, []);
  const { t } = useTranslation("common");
  const pathname = usePathname();
  // Derived through the shared helper, NOT a locally-listed set of locales.
  // The local list here read ["en", "de", "it"] — Spanish was missing, so on
  // /es these links lost their locale prefix entirely. The middleware then
  // resolved the language from the NEXT_LOCALE cookie instead of the page,
  // and a visitor arriving on /es with no cookie was sent to the ENGLISH
  // About/Contact pages. localizeInternalUrl also translates the static slug
  // (/about -> /es/sobre-nosotros), so the hardcoded "/faq" that sat beside
  // two getLocalizedStaticSlug calls is no longer a separate convention.
  const locale = getLocaleFromPath(pathname);

  return (
    <div className={`top-one ${extraClass || ""}`} suppressHydrationWarning>
      <Container fluid>
        <div className='top-one__inner' suppressHydrationWarning>
          {/* Contact Info */}
          <ul className='list-unstyled top-one__info'>
            {extraClass === "top-one--two"
              ? contactInfo.map((item: ContactInfoItem, index) => (
                  <li className='top-one__info__item special' key={index}>
                    <i className={item.iconClass}></i>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))
              : contactInfoTwo.map((item: ContactInfoItemTwo, index) => (
                  <li className='top-one__info__item' key={index}>
                    <i className={item.iconClass}></i>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
          </ul>

          <div className='top-one__right' suppressHydrationWarning>
            {/* Address Section */}
            {extraClass === "top-one--two" ? (
              <div className='top-one__info__item'>
                <i className={address.iconClass}></i>
                <Link href={address.href}>{address.label}</Link>
              </div>
            ) : (
              mounted ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <CurrencySwitcher
                    isOpen={activeDropdown === "currency"}
                    onOpen={() => setActiveDropdown("currency")}
                    onClose={() => setActiveDropdown((current) => current === "currency" ? null : current)}
                  />
                  <LanguageSelector
                    isOpen={activeDropdown === "language"}
                    onOpen={() => setActiveDropdown("language")}
                    onClose={() => setActiveDropdown((current) => current === "language" ? null : current)}
                  />
                </div>
              ) : <div style={{ width: '220px', height: '40px' }} />
            )}

            {/* Links Section */}
            <div className='top-one__social' suppressHydrationWarning>
              {mounted && (
                <>
                  <Link href={localizeInternalUrl("/faq", locale)}>{t("links.faq")}</Link>
                  <Link href={localizeInternalUrl("/about", locale)}>{t("links.about")}</Link>
                  <Link href={localizeInternalUrl("/contact", locale)}>{t("links.contact")}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default TopbarOne;
