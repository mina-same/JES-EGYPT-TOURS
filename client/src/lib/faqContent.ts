import { getLocalizedValue } from "@/lib/localize";

/**
 * The question and answer a FAQ row shows in one language.
 *
 * Each visible FAQ list and its FAQPage structured data read their rows through
 * the same function below, so the markup cannot list a question the visitor
 * does not see, or word it differently. `answer` is the stored rich text
 * (HTML). The schema builder turns it into plain text.
 */
export interface FaqContent {
  question: string;
  answer: string;
}

type LocalizedFaq = { question?: unknown; answer?: unknown } | null | undefined;

/**
 * A home-page FAQ as HomeFAQ prints it. The API has already narrowed the rows
 * to the page language, and getLocalizedValue reads that language.
 */
export function homeFaqContent(faq: LocalizedFaq, locale: string): FaqContent {
  return {
    question: String(getLocalizedValue(faq?.question as never, locale) || ""),
    answer: String(getLocalizedValue(faq?.answer as never, locale) || ""),
  };
}

/**
 * The FAQs a listing page (tour category, sub-category, …) prints, through
 * ListingFaqs. The lookup is strict: no fallback to English, so a German-only
 * FAQ never appears on the English page. A row missing either half is dropped.
 */
export function listingFaqContent(faqs: LocalizedFaq[] | null | undefined, locale: string): FaqContent[] {
  if (!Array.isArray(faqs)) return [];
  return faqs
    .map((faq) => {
      const question = (faq?.question as Record<string, unknown> | undefined)?.[locale];
      const answer = (faq?.answer as Record<string, unknown> | undefined)?.[locale];
      return {
        question: typeof question === "string" ? question : "",
        answer: typeof answer === "string" ? answer : "",
      };
    })
    .filter((faq) => faq.question && faq.answer);
}
