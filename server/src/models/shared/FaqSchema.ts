import { Schema } from 'mongoose';

export interface IFAQ {
  question: { en?: string; de?: string; it?: string; es?: string };
  answer: { en?: any; de?: any; it?: any; es?: any };
  isActive?: boolean;
  order?: number;
}

const FAQ_LOCALES = ['en', 'de', 'it', 'es'] as const;

function hasMeaningfulFaqValue(value: unknown): boolean {
  if (value == null) return false;

  if (typeof value === 'string') {
    const text = value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\u00a0/g, ' ')
      .trim();

    return text.length > 0;
  }

  if (Array.isArray(value)) {
    return value.some(hasMeaningfulFaqValue);
  }

  if (typeof value === 'object') {
    return Object.values(value).some(hasMeaningfulFaqValue);
  }

  return Boolean(value);
}

function hasCompleteFaqLocalePair(faq: IFAQ): boolean {
  return FAQ_LOCALES.some(
    locale =>
      hasMeaningfulFaqValue(faq.question?.[locale]) &&
      hasMeaningfulFaqValue(faq.answer?.[locale])
  );
}

// FAQ-specific localized schemas - all locales are optional.
// English is NOT required; each language can have its own FAQs independently.
const FaqLocalizedStringSchema = new Schema(
  {
    en: { type: String, trim: true },
    de: { type: String, trim: true },
    it: { type: String, trim: true },
    es: { type: String, trim: true },
  },
  { _id: false }
);

const FaqLocalizedMixedSchema = new Schema(
  {
    en: { type: Schema.Types.Mixed },
    de: { type: Schema.Types.Mixed },
    it: { type: Schema.Types.Mixed },
    es: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

export const FAQSchema = new Schema<IFAQ>(
  {
    question: { type: FaqLocalizedStringSchema },
    answer: { type: FaqLocalizedMixedSchema },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

FAQSchema.pre('validate', function (next) {
  const faq = this as IFAQ & { invalidate: (path: string, errorMsg: string) => void };

  if (!hasCompleteFaqLocalePair(faq)) {
    faq.invalidate('question', 'FAQ must include a question and answer in at least one language.');
  }

  next();
});
