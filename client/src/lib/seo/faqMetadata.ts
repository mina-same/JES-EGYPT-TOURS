import { Metadata } from 'next';

interface FaqMetadataOptions {
  category?: string;
  totalFaqs?: number;
  baseUrl?: string;
}

/**
 * Generate SEO-optimized metadata for FAQ pages
 */
export function generateFaqMetadata(options: FaqMetadataOptions = {}): Metadata {
  const { category, totalFaqs = 0, baseUrl = 'https://jesegypttours.com' } = options;
  
  if (category) {
    // Category-specific FAQ page metadata
    const categoryTitle = `${category} FAQ | Egypt Travel Questions | JES Egypt Tours`;
    const categoryDescription = `Find answers to frequently asked questions about ${category.toLowerCase()} for Egypt travel. Expert advice on ${category.toLowerCase()} from JES Egypt Tours.`;
    const categoryUrl = `${baseUrl}/faq/${category.toLowerCase().replace(/\s+/g, '-')}`;
    
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
        locale: 'en_US',
        images: [
          {
            url: `${baseUrl}/images/faq-${category.toLowerCase().replace(/\s+/g, '-')}.jpg`,
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
        images: [`${baseUrl}/images/faq-${category.toLowerCase().replace(/\s+/g, '-')}.jpg`]
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
  const faqSummary = totalFaqs > 0 
    ? `Browse our comprehensive collection of ${totalFaqs} frequently asked questions`
    : 'Browse our comprehensive collection of frequently asked questions';
  
  return {
    title: 'Egypt Travel FAQ | Expert Answers | JES Egypt Tours',
    description: `${faqSummary} about Egypt travel, tours, booking, safety, and more. Get expert answers from JES Egypt Tours to plan your perfect Egypt adventure.`,
    keywords: 'Egypt travel FAQ, Egypt tours, Cairo tours, Luxor temples, Nile cruise, Egypt visa, Egypt safety, Egypt booking, JES Egypt Tours, Egypt travel guide',
    openGraph: {
      title: 'Egypt Travel FAQ | Expert Answers | JES Egypt Tours',
      description: `${faqSummary} about Egypt travel, tours, booking, safety, and more. Get expert answers from JES Egypt Tours to plan your perfect Egypt adventure.`,
      url: `${baseUrl}/faq`,
      siteName: 'JES Egypt Tours',
      type: 'website',
      locale: 'en_US',
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
      title: 'Egypt Travel FAQ | Expert Answers | JES Egypt Tours',
      description: `${faqSummary} about Egypt travel, tours, booking, safety, and more. Get expert answers from JES Egypt Tours.`,
      images: [`${baseUrl}/images/egypt-faq.jpg`]
    },
    alternates: {
      canonical: `${baseUrl}/faq`
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
