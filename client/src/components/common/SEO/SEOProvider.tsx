import React from 'react';
import { PHONE_DISPLAY, getSocialProfiles } from '@/config/contact';
import { footerOneData } from '@/data/footerOneData';

interface SEOProviderProps {
  locale: string;
}

/**
 * Organization + WebSite structured data, emitted on every visitor page.
 *
 * Two of the URLs here pointed at files that do not exist: `/images/logo-dark.png`
 * (the logo is a bundler import from src/assets, never copied to public/) and
 * `/about-1-1.jpg` (that file lives under /images/about/). Google reads
 * `logo` for the knowledge panel, so a 404 there meant no logo was associated
 * with the business at all, and Search Console reported invalid structured
 * data site-wide. The declared size was wrong too — 632x180 for a file the
 * header itself documents as square.
 *
 * `public/favicon-logo.png` is byte-for-byte the same image as
 * src/assets/images/logo-dark.png, so it is referenced directly rather than
 * shipping a second 68 KB copy of the same PNG.
 */
const LOGO_PATH = '/favicon-logo.png';
const LOGO_SIZE = 313; // the file's real dimensions — it is square

/** A real photograph that exists in public/. */
const IMAGE_PATH = '/images/backgrounds/giza-pyramids-sphinx-sunset-panorama-egypt.webp';

const SEOProvider: React.FC<SEOProviderProps> = ({ locale }) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.jesegypttours.com';
  // Same list the footer and the mobile drawer render, so the markup can
  // never claim a profile the page does not link to. A platform with no
  // known account is absent from both.
  const sameAs = getSocialProfiles().map((profile) => profile.href);

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${baseUrl}/#travelagency`,
    'name': 'JES Egypt Tours',
    'url': baseUrl,
    'logo': {
      '@type': 'ImageObject',
      'url': `${baseUrl}${LOGO_PATH}`,
      'width': LOGO_SIZE,
      'height': LOGO_SIZE,
    },
    'image': `${baseUrl}${IMAGE_PATH}`,
    'description': 'JES Egypt Tours is a premium travel agency offering unique and authentic Egyptian experiences.',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': '8 Alshams Building, Dr.Hanem Mohammed Hussein, Kafr Nassar',
      'addressLocality': 'Al Haram, Giza',
      'addressRegion': 'Giza Governorate',
      'addressCountry': 'EG',
    },
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': PHONE_DISPLAY,
      'contactType': 'customer service',
      'email': footerOneData.contact.email,
      'availableLanguage': ['English', 'German', 'Italian', 'Spanish'],
    },
    // Omitted entirely rather than emitted empty — an empty sameAs is a
    // signal Google reads as "no known profiles", which is what it means here.
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    'url': `${baseUrl}`,
    'name': 'JES Egypt Tours',
    'inLanguage': locale,
    'publisher': { '@id': `${baseUrl}/#travelagency` },
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${baseUrl}/${locale}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
};

export default SEOProvider;
