"use client";
import React from 'react';
import { FAQ } from '@/services/faqService';

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

export const FaqStructuredData: React.FC<FaqStructuredDataProps> = ({ 
  faqs, 
  title, 
  description 
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer.replace(/<[^>]*>/g, '') // Strip HTML for schema
      }
    }))
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
  const breadcrumbs = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://jesegypttours.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "FAQ",
      "item": "https://jesegypttours.com/faq"
    }
  ];

  if (category) {
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 3,
      "name": category,
      "item": `https://jesegypttours.com/faq/${category.toLowerCase().replace(/\s+/g, '-')}`
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
