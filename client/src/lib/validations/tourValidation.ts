import { TourFormData } from '@/types/tour';
import { FormErrorItem } from '@/lib/parseApiError';

export function validateTourForm(formData: TourFormData): FormErrorItem[] {
  const errors: FormErrorItem[] = [];

  // Internal Name
  if (!formData.name?.trim()) {
    errors.push({ field: 'System Name', message: 'Internal name is required', path: 'name' });
  }

  // Heading (at least English)
  if (!formData.heading?.en?.trim()) {
    errors.push({ field: 'Tour Heading', message: 'English heading is required', path: 'heading.en', lang: 'en' });
  }

  // Subcategory
  if (!formData.subcategory) {
    errors.push({ field: 'Subcategory', message: 'Please select a subcategory', path: 'subcategory' });
  }

  // Description header (at least English)
  if (!formData.description?.header?.en?.trim()) {
    errors.push({ field: 'Description Header', message: 'English header is required', path: 'description.header.en', lang: 'en' });
  }

  // Description text (at least English)
  if (!formData.description?.text?.en?.trim()) {
    errors.push({ field: 'Description Content', message: 'English description content is required', path: 'description.text.en', lang: 'en' });
  }

  // Images (at least one)
  const validImages = formData.images?.filter(img => img.url) || [];
  if (validImages.length === 0) {
    errors.push({ field: 'Media', message: 'At least one main image is required', path: 'media' });
  }

  // Pricing Plans (at least one)
  if (!formData.pricingPlans || formData.pricingPlans.length === 0) {
    errors.push({ field: 'Pricing', message: 'At least one pricing plan is required', path: 'pricing' });
  } else {
    // Validate each plan
    formData.pricingPlans.forEach((plan, pIdx) => {
      if (!plan.planName) {
        errors.push({ field: `Pricing Plan ${pIdx + 1}`, message: 'Plan name is required', path: `pricingPlans.${pIdx}.planName` });
      }
      if (!plan.seasons || plan.seasons.length === 0) {
        errors.push({ field: `Pricing Plan ${pIdx + 1}`, message: 'At least one season is required', path: `pricingPlans.${pIdx}.seasons` });
      } else {
        plan.seasons.forEach((season, sIdx) => {
          if (!season.seasonName) {
            errors.push({ field: `Season ${sIdx + 1}`, message: 'Season name is required', path: `pricingPlans.${pIdx}.seasons.${sIdx}.seasonName` });
          }
          if (!season.prices || (!season.prices.solo && !season.prices.pax_2_4 && !season.prices.pax_5_8 && !season.prices.pax_9_16)) {
             errors.push({ field: `Season ${sIdx + 1} Prices`, message: 'At least one price must be entered', path: `pricingPlans.${pIdx}.seasons.${sIdx}.prices` });
          }
        });
      }
    });
  }

  return errors;
}
