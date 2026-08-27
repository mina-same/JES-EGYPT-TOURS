"use client";
import React from 'react';
import bg from '@/assets/images/backgrounds/page-header-bg-1-1.jpg'
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';

import { useTranslation } from 'react-i18next';
import { normalizeLocale } from '@/lib/url';

type BreadcrumbItem = {
  label: string;
  href?: string;
};
interface PageHeaderProps {
  title?: string;
  subTitle?: string;
  bgImage?: string;
  breadcrumbs?: BreadcrumbItem[];
  alt?: string;
  imageTitle?: string;
  /**
   * The background carries no information — the stock header photo, not a
   * picture of what the page is about. Such an image takes `alt=""`, which is
   * how a screen reader is told to skip it entirely.
   *
   * This is a separate flag rather than `alt=""` on purpose. Callers like
   * CategoryView pass `getLocalizedValue(image.alt, locale)`, which returns
   * `""` for a language that has no alt text yet — reading that as "the author
   * meant decorative" would silently strip the alt off a real content image in
   * exactly the locales that are already missing one. An empty `alt` stays a
   * missing translation and still falls back to the title.
   */
  decorativeBackground?: boolean;
}
const PageHeader: React.FC<PageHeaderProps> = ({ title, subTitle, bgImage, breadcrumbs, alt, imageTitle, decorativeBackground }) => {
  const { t } = useTranslation('common');
  const params = useParams();
  const locale = normalizeLocale(params?.locale);
  const backgroundImage = bgImage || bg.src;
  const imageAlt = decorativeBackground ? "" : (alt || title || "Page Header");

  return (
    <section className="page-header relative overflow-hidden">
      <div className="page-header__bg-wrapper absolute inset-0 -z-10">
        <Image
          src={backgroundImage}
          alt={imageAlt}
          {...(decorativeBackground && !imageTitle
            ? {}
            : { title: imageTitle || imageAlt || title || "Page Header" })}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      <div className="container relative z-10">
        <div className="page-header__content" style={{ textAlign: 'center' }}>
          <ul className="gotur-breadcrumb list-unstyled mb-3">
            {/* locale-prefixed: bare "/" 307s to /en and leaks non-EN visitors out of their language */}
            <li><Link href={`/${locale}`}>{t('home')}</Link></li>
            {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 ? (
              breadcrumbs.map((item, idx) => (
                <li key={`${item.label}-${idx}`}>
                  {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
                </li>
              ))
            ) : null}
          </ul>
          <h1 className="page-header__title bw-split-in-right">{title}</h1>
          {subTitle && (
            <div
              className="page-header__subtitle html-content"
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '18px',
                marginTop: '15px',
                marginBottom: '20px',
                maxWidth: '950px',
                lineHeight: '1.6',
                fontWeight: '300',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
              dangerouslySetInnerHTML={{ __html: subTitle }}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default PageHeader;
