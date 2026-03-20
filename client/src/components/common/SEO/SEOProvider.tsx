import React from 'react';

interface SEOProviderProps {
  locale: string;
}

const SEOProvider: React.FC<SEOProviderProps> = ({ locale }) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://jesegypttours.com';
  
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${baseUrl}/#organization`,
    'name': 'JES Egypt Tours',
    'url': baseUrl,
    'logo': `${baseUrl}/logo-dark.png`,
    'image': `${baseUrl}/about-1-1.jpg`,
    'description': 'JES Egypt Tours is a premium travel agency offering unique and authentic Egyptian experiences.',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': '184 Main Collins Street',
      'addressLocality': 'Victoria',
      'postalCode': '8007',
      'addressCountry': 'AU', // Note: Placeholder from topbar was Victoria 8007
    },
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': '+6108-666-0112',
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
    '@id': `${baseUrl}/${locale}/#website`,
    'url': `${baseUrl}/${locale}`,
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
