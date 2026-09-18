"use client";
import React from 'react';
import { FAQ } from '@/services/faqService';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/localize';
import { getLocaleFromPath, normalizeLocale } from '@/lib/url';
import { stripHtml } from '@/lib/seo/tourJsonLd';

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

const BASE_URL = 'https://www.jesegypttours.com';

export const FaqStructuredData: React.FC<FaqStructuredDataProps> = ({ 
  faqs, 
  title, 
  description 
}) => {
  const { i18n } = useTranslation();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname, normalizeLocale(i18n.language));
  const faqPageUrl = `${BASE_URL}/${locale}/faq`;

  // JSON-LD text is plain text. The answers are stored as sanitized HTML, so
  // `&` arrives as `&amp;` and paragraphs as adjacent <p> tags: stripHtml
  // decodes the entities and keeps a space where each tag was, where the old
  // bare regex published "&amp;" literally and glued paragraphs together.
  // An answer that is only markup (an empty `<p><br></p>`) passes the
  // server's non-empty check but cleans to "", so it is dropped here.
  const mainEntity = faqs
    .map(faq => {
      const rawQ = getLocalizedValue(faq.question, locale);
      const rawA = getLocalizedValue(faq.answer, locale);
      return {
        q: stripHtml(typeof rawQ === 'string' ? rawQ : ''),
        a: stripHtml(typeof rawA === 'string' ? rawA : ''),
      };
    })
    .filter(({ q, a }) => q && a)
    .map(({ q, a }) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": a
      }
    }));

  // An empty FAQPage is invalid structured data — this is what a failed FAQ
  // request used to publish, since the page still renders with `faqs = []`.
  if (mainEntity.length === 0) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "url": faqPageUrl,
    "name": title,
    "description": description,
    "mainEntity": mainEntity
  };

  // stripHtml turns `&lt;` back into "<", and JSON.stringify leaves "<"
  // alone — so an answer containing the text "</script>" would end this
  // element early. `\u003c` is the same character to a JSON parser.
  const json = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
};

export const FaqBreadcrumbStructuredData: React.FC<BreadcrumbStructuredDataProps> = ({ 
  category 
}) => {
  const { i18n } = useTranslation();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname, normalizeLocale(i18n.language));
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
    "image": "https://www.jesegypttours.com/images/how-to-egypt-travel.jpg",
    "totalTime": "PT10M",
    "supply": [],
    "tool": [],
    "step": [
      {
        "@type": "HowToStep",
        "name": "Follow this guide",
        "text": answer.replace(/<[^>]*>/g, ''),
        "image": "https://www.jesegypttours.com/images/egypt-travel-step.jpg"
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
