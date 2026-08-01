import { TourFormData } from '@/types/tour';
import { FormErrorItem } from '@/lib/parseApiError';

export function validateTourForm(formData: TourFormData): FormErrorItem[] {
  const errors: FormErrorItem[] = [];

  const hasSchedule =
    formData.scheduledAt !== undefined && formData.scheduledAt !== null;
  if (hasSchedule) {
    const scheduledAt = new Date(formData.scheduledAt as Date | string);
    if (
      !formData.scheduledAt ||
      Number.isNaN(scheduledAt.getTime()) ||
      scheduledAt.getTime() <= Date.now()
    ) {
      errors.push({
        field: 'Scheduled Date',
        message: 'Choose a valid future date and time',
        path: 'scheduledAt',
      });
    }
  }

  // Internal Name
  if (!formData.name?.trim()) {
    errors.push({ field: 'System Name', message: 'Internal name is required', path: 'name' });
  }

  // Slug (English)
  if (!formData.slug?.en?.trim()) {
    errors.push({ field: 'English Slug', message: 'English slug is required', path: 'slug.en', lang: 'en' });
  }

  // Subcategory
  if (!formData.subcategory) {
    errors.push({ field: 'Subcategory', message: 'Please select a subcategory', path: 'subcategory' });
  }

  // Description header - Now optional
  // Note: API stores as 'Description' (capital D), form state uses 'description' (lowercase)
  // We don't push errors here anymore as per the user's request.

  // Images (at least one with a real URL)
  const validImages = formData.images?.filter(img => img.url?.trim()) || [];
  if (validImages.length === 0) {
    errors.push({ field: 'Main Image', message: 'Upload at least one image in the Media tab', path: 'images' });
  }

  // Pricing plans are optional, but any plan that is added must be complete.
  if (formData.pricingPlans?.length) {
    formData.pricingPlans.forEach((plan, pIdx) => {
      if (!plan.planName) {
        errors.push({ field: `Pricing Plan ${pIdx + 1}`, message: 'Plan name is required', path: `pricingPlans.${pIdx}.planName` });
      }
      if (!plan.seasons || plan.seasons.length === 0) {
        errors.push({ field: `Pricing Plan ${pIdx + 1}`, message: 'At least one season is required', path: `pricingPlans.${pIdx}.seasons` });
      } else {
        plan.seasons.forEach((season, sIdx) => {
          if (!season) return; // Safety check
          
          if (!season.seasonName) {
            errors.push({ field: `Season ${sIdx + 1}`, message: 'Season name is required', path: `pricingPlans.${pIdx}.seasons.${sIdx}.seasonName` });
          }
          
          // Check if at least one price is entered. We check for typeof 'number' to allow 0.
          const prices = season.prices;
          const hasPrice = prices && (
            (typeof prices.solo?.USD === 'number') ||
            (typeof prices.pax_2_4?.USD === 'number') ||
            (typeof prices.pax_5_8?.USD === 'number') ||
            (typeof prices.pax_9_16?.USD === 'number')
          );

          if (!hasPrice) {
             errors.push({ field: `Season ${sIdx + 1} Prices`, message: 'At least one price must be entered', path: `pricingPlans.${pIdx}.seasons.${sIdx}.prices` });
          }
        });
      }
    });
  }

  return errors;
}
