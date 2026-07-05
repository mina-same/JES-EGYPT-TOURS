"use client";
import React from 'react';
import { FAQ } from '@/services/faqService';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/localize';

interface FaqStructuredDataProps {
  faqs: FAQ[];
  title: string;
  description: string;
}

interface BreadcrumbStructuredDataProps {
  category?: string;
}

interface HowToStructuredDataProps {
  question: string;
  answer: string;
}

interface BreadcrumbItem {
  "@type": "ListItem";
  "position": number;
  "name": string;
  "item"?: string;
}

const BASE_URL = 'https://jesegypttours.com';
const LOCALES = ['en', 'de', 'it', 'es'];

const getLocaleFromPath = (pathname: string | null, fallback: string): string => {
  const pathLocale = (pathname || '/').split('/')[1];
  if (LOCALES.includes(pathLocale)) return pathLocale;
  return LOCALES.includes(fallback) ? fallback : 'en';
};

export const FaqStructuredData: React.FC<FaqStructuredDataProps> = ({ 
  faqs, 
  title, 
  description 
}) => {
  const { i18n } = useTranslation();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname, i18n.language);
  const faqPageUrl = `${BASE_URL}/${locale}/faq`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "url": faqPageUrl,
    "name": title,
    "description": description,
    "mainEntity": faqs.map(faq => {
      const q = getLocalizedValue(faq.question, locale) || '';
      const a = getLocalizedValue(faq.answer, locale) || '';

      return {
        "@type": "Question",
        "name": q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": a.replace(/<[^>]*>/g, '') // Strip HTML for schema
        }
      };
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

export const FaqBreadcrumbStructuredData: React.FC<BreadcrumbStructuredDataProps> = ({ 
  category 
}) => {
  const { i18n } = useTranslation();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname, i18n.language);
  const localeHomeUrl = `${BASE_URL}/${locale}`;
  const faqPageUrl = `${localeHomeUrl}/faq`;

  const breadcrumbs: BreadcrumbItem[] = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": localeHomeUrl
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "FAQ",
      "item": faqPageUrl
    }
  ];

  if (category) {
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 3,
      "name": category
    });
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};

export const HowToStructuredData: React.FC<HowToStructuredDataProps> = ({ 
  question, 
  answer 
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": question,
    "text": answer.replace(/<[^>]*>/g, ''),
    "image": "https://jesegypttours.com/images/how-to-egypt-travel.jpg",
    "totalTime": "PT10M",
    "supply": [],
    "tool": [],
    "step": [
      {
        "@type": "HowToStep",
        "name": "Follow this guide",
        "text": answer.replace(/<[^>]*>/g, ''),
        "image": "https://jesegypttours.com/images/egypt-travel-step.jpg"
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};
