import React from 'react';
import { getServerTranslation } from '@/lib/i18n-server';
import { getSeoBaseUrl } from '@/lib/url';
import { serializeJsonLd } from '@/lib/seo/serializeJsonLd';
import { SITE_DESCRIPTION_KEY, buildSiteJsonLd } from '@/lib/seo/siteJsonLd';

interface SEOProviderProps {
  locale: string;
}

/**
 * The site-wide structured data (TravelAgency + WebSite in one `@graph`),
 * printed on every visitor page by the [locale] layout.
 *
 * The values live in lib/seo/siteJsonLd.ts. This component only adds the
 * page language: the description is SITE-1 from that language's common.json,
 * so /de, /it and /es no longer get an English sentence.
 */
const SEOProvider = async ({ locale }: SEOProviderProps) => {
  const { t } = await getServerTranslation(locale, 'common');
  const description = t(SITE_DESCRIPTION_KEY);
  const siteJsonLd = buildSiteJsonLd({
    baseUrl: getSeoBaseUrl(),
    locale,
    // getServerTranslation returns the key itself when it is missing. That is
    // not a description, so leave the field out rather than publish it.
    description: description !== SITE_DESCRIPTION_KEY ? description : undefined,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteJsonLd) }}
    />
  );
};

export default SEOProvider;
