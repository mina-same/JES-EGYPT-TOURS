import React from 'react';

interface SEOProviderProps {
  locale: string;
}

const SEOProvider: React.FC<SEOProviderProps> = ({ locale }) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://jesegypttours.com';
  
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${baseUrl}/#travelagency`,
    'name': 'JES Egypt Tours',
    'url': baseUrl,
    'logo': {
      '@type': 'ImageObject',
      'url': `${baseUrl}/images/logo-dark.png`,
      'width': 632,
      'height': 180,
    },
    'image': `${baseUrl}/about-1-1.jpg`,
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
      'telephone': '+20 100 743 7271',
      'contactType': 'customer service',
      'email': 'info@jesegypttours.com',
      'availableLanguage': ['English', 'German', 'Italian', 'Spanish']
    },
    'sameAs': [
      'https://facebook.com/jesegypttours',
      'https://twitter.com/jesegypttours',
      'https://instagram.com/jesegypttours'
    ]
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    'url': `${baseUrl}`,
    'name': 'JES Egypt Tours',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${baseUrl}/${locale}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
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
