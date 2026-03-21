import { Metadata } from 'next';
import { getServerTranslation } from '@/lib/i18n-server';

interface FaqMetadataOptions {
  category?: string;
  totalFaqs?: number;
  baseUrl?: string;
  locale?: string;
}

/**
 * Generate SEO-optimized metadata for FAQ pages
 */
export async function generateFaqMetadata(options: FaqMetadataOptions = {}): Promise<Metadata> {
  const { category, totalFaqs = 0, baseUrl = 'https://jesegypttours.com', locale = 'en' } = options;
  const { t } = await getServerTranslation(locale, 'faq');
  
  if (category) {
    // Category-specific FAQ page metadata
    const categoryTitle = `${category} FAQ | Egypt Travel Questions | JES Egypt Tours`;
    const categoryDescription = `Find answers to frequently asked questions about ${category.toLowerCase()} for Egypt travel. Expert advice on ${category.toLowerCase()} from JES Egypt Tours.`;
    const categoryUrl = `${baseUrl}/${locale}/faq/${category.toLowerCase().replace(/\\s+/g, '-')}`;
    
    return {
      title: categoryTitle,
      description: categoryDescription,
      keywords: getCategoryKeywords(category),
      openGraph: {
        title: categoryTitle,
        description: categoryDescription,
        url: categoryUrl,
        siteName: 'JES Egypt Tours',
        type: 'website',
        locale: locale === 'en' ? 'en_US' : locale,
        images: [
          {
            url: `${baseUrl}/images/faq-${category.toLowerCase().replace(/\\s+/g, '-')}.jpg`,
            width: 1200,
            height: 630,
            alt: `${category} FAQ - JES Egypt Tours`
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        title: categoryTitle,
        description: categoryDescription,
        images: [`${baseUrl}/images/faq-${category.toLowerCase().replace(/\\s+/g, '-')}.jpg`]
      },
      alternates: {
        canonical: categoryUrl
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large' as const,
          'max-snippet': -1
        }
      }
    };
  }
  
  // General FAQ page metadata
  const pageTitle = t('pageTitle');
  const pageDescription = t('pageDescription');
  const urlPath = `/${locale}/faq`;
  
  return {
    title: pageTitle,
    description: pageDescription,
    keywords: 'Egypt travel FAQ, Egypt tours, Cairo tours, Luxor temples, Nile cruise, Egypt visa, Egypt safety, Egypt booking, JES Egypt Tours, Egypt travel guide',
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${baseUrl}${urlPath}`,
      siteName: 'JES Egypt Tours',
      type: 'website',
      locale: locale === 'en' ? 'en_US' : locale,
      images: [
        {
          url: `${baseUrl}/images/egypt-faq.jpg`,
          width: 1200,
          height: 630,
          alt: 'Egypt Travel FAQ - JES Egypt Tours'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [`${baseUrl}/images/egypt-faq.jpg`]
    },
    alternates: {
      canonical: `${baseUrl}${urlPath}`
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1
      }
    }
  };
}

/**
 * Get SEO keywords for specific FAQ categories
 */
function getCategoryKeywords(category: string): string {
  const keywordMap: Record<string, string> = {
    'General': 'Egypt travel, Egypt tourism, JES Egypt Tours, Egypt vacation, Egypt holidays, Egypt travel guide, Egypt trip planning',
    'Booking': 'Egypt tour booking, Egypt reservation, Egypt travel booking, JES Egypt Tours booking, Egypt tour payment, Egypt travel insurance',
    'Tours': 'Egypt tours, Cairo tours, Luxor tours, Aswan tours, Nile cruise, Egypt pyramids, Egypt temples, Egypt sightseeing, Egypt tour packages',
    'Payment': 'Egypt tour payment, Egypt travel payment, JES Egypt Tours payment, Egypt tour cost, Egypt travel budget, Egypt currency',
    'Safety': 'Egypt travel safety, Egypt security, Egypt health, Egypt travel insurance, Egypt emergency, Egypt travel tips, Egypt customs',
    'Accommodation': 'Egypt hotels, Egypt accommodation, Egypt lodging, Nile cruise ships, Egypt resorts, Egypt stay, Egypt hospitality'
  };
  
  return keywordMap[category] || 'Egypt travel, Egypt tourism, JES Egypt Tours, Egypt vacation';
}
