"use client";
import React from 'react';
import bg from '@/assets/images/backgrounds/page-header-bg-1-1.jpg'
import Image from 'next/image';
import { useParams } from 'next/navigation';

import { useTranslation } from 'react-i18next';
import { normalizeLocale } from '@/lib/url';
import Breadcrumb, { type BreadcrumbItem } from '@/components/common/Breadcrumb/Breadcrumb';

interface PageHeaderProps {
  title?: string;
  subTitle?: string;
  bgImage?: string;
  breadcrumbs?: BreadcrumbItem[];
  /**
   * For a page that sits directly under Home: a key in the `common`
   * namespace naming it (`pageNames.about`), translated HERE into the
   * reader's language and shown as the trail's current page. Used when
   * `breadcrumbs` is not given.
   *
   * A key rather than a label because some callers cannot translate: the 404
   * page is not handed the locale, and About and Sign In print a fixed English
   * title. Without a name the trail was "Home" and nothing else.
   */
  breadcrumbLabelKey?: string;
  /**
   * Set false on a page that already publishes its own BreadcrumbList, so the
   * document does not carry two competing trails.
   */
  breadcrumbJsonLd?: boolean;
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
const PageHeader: React.FC<PageHeaderProps> = ({ title, subTitle, bgImage, breadcrumbs, breadcrumbLabelKey, alt, imageTitle, decorativeBackground, breadcrumbJsonLd = true }) => {
  const { t } = useTranslation('common');
  const params = useParams();
  const locale = normalizeLocale(params?.locale);
  const trail = breadcrumbs ?? (breadcrumbLabelKey ? [{ label: t(breadcrumbLabelKey) }] : undefined);
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
          {/* The shared trail. It used to be written out here, which is why the
              author page ended up with a second copy of the same markup when it
              needed the breadcrumb without this component's banner.

              The capsule is an inline grid, so this block's `text-align:
              center` centres it. Its margin is `mb-[20px]`, not `mb-5`:
              Bootstrap owns `mb-0`…`mb-5` with `!important` (`mb-5` is 3rem). */}
          <Breadcrumb
            locale={locale}
            homeLabel={t('home')}
            items={trail}
            ariaLabel={t('breadcrumb')}
            jsonLd={breadcrumbJsonLd}
            className="mb-[20px]"
          />
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
