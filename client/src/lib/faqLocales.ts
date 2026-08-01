import { faqService } from '@/services/faqService';
import { SUPPORTED_LOCALES } from '@/lib/url';

/**
 * Which languages actually have FAQs of their own.
 *
 * The API returns only the rows that carry a question AND an answer in the
 * requested language — no fallback to English — so "this locale has FAQs" is
 * simply "the API returned something".
 *
 * One source of truth for three places that must agree:
 *   - the /faq page renders, or 404s when the language has nothing;
 *   - the sitemap lists /faq only for the languages that answer 200;
 *   - hreflang points only at those same languages.
 * If they disagree, the sitemap advertises URLs that 404 — worse for search
 * than the thin, English-duplicating page this rule replaces.
 */
/**
 * Returns the locale's FAQs, or `null` when the request itself failed.
 *
 * The distinction matters: an empty array is an ANSWER ("this language has no
 * FAQs") and justifies a 404, while a failure is the absence of an answer. A
 * single API hiccup must never un-publish a live page, so callers have to treat
 * the two differently instead of collapsing both into "empty".
 */
export async function getFaqsForLocale(locale: string): Promise<any[] | null> {
  try {
    const response = await faqService.getAllFaqs({
      isActive: true,
      // A question lives in ONE place: the homepage short list, or this page.
      // Filtering at the source keeps the payload small and — more importantly —
      // makes the count below mean "what the page will actually render", which
      // is what the 404 rule has to be measured against.
      displayOnHome: false,
      sort: 'category,order',
      limit: 200,
      locale,
    });
    if (!response.success || !Array.isArray(response.data)) return null;
    return response.data;
  } catch (error) {
    console.error(`Error fetching FAQs for "${locale}":`, error);
    return null;
  }
}

/**
 * The locales whose /faq page is worth listing.
 *
 * Deliberately asymmetric with the page itself: a locale we could not resolve is
 * left OUT of the sitemap (never advertise a URL that might 404) while the page
 * for that locale still renders (never 404 a page that might be live). Each side
 * errs toward the harm that is easier to recover from.
 */
export async function getLocalesWithFaqs(): Promise<string[]> {
  const results = await Promise.all(
    SUPPORTED_LOCALES.map(async (locale) => ({
      locale,
      faqs: await getFaqsForLocale(locale),
    }))
  );
  return results.filter((r) => (r.faqs?.length ?? 0) > 0).map((r) => r.locale);
}
