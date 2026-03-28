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

  // Description header - Now optional
  // Note: API stores as 'Description' (capital D), form state uses 'description' (lowercase)
  // We don't push errors here anymore as per the user's request.

  // Availability (English)
  if (!formData.tourAvailability?.en?.trim()) {
    errors.push({ field: 'Availability', message: 'English availability is required', path: 'tourAvailability.en', lang: 'en' });
  }

  // Pickup & Drop-off (English)
  if (!formData.pickupAndDropOff?.en?.trim()) {
    errors.push({ field: 'Pickup & Drop-off', message: 'English pickup & drop-off details are required', path: 'pickupAndDropOff.en', lang: 'en' });
  }

  // Tour Type (English)
  if (!formData.tourType?.en?.trim()) {
    errors.push({ field: 'Tour Type', message: 'English tour type is required', path: 'tourType.en', lang: 'en' });
  }

  // Tour Style (English)
  if (!formData.tourStyle?.en?.trim()) {
    errors.push({ field: 'Tour Style', message: 'English tour style is required', path: 'tourStyle.en', lang: 'en' });
  }

  // Meeting Point (English)
  if (!formData.meetingPoint?.en?.trim()) {
    errors.push({ field: 'Meeting Point', message: 'English meeting point is required', path: 'meetingPoint.en', lang: 'en' });
  }

  // Price Starting From
  if (formData.priceStartingFrom === undefined || formData.priceStartingFrom === null) {
    errors.push({ field: 'Price Starting From', message: 'Starting price is required', path: 'priceStartingFrom' });
  }

  // Cancellation Policy
  if (!formData.cancellationPolicy?.en?.trim()) {
    errors.push({ field: 'Cancellation Policy', message: 'English cancellation policy is required', path: 'cancellationPolicy', lang: 'en' });
  }

  // Images (at least one with a real URL)
  const validImages = formData.images?.filter(img => img.url?.trim()) || [];
  if (validImages.length === 0) {
    errors.push({ field: 'Main Image', message: 'Upload at least one image in the Media tab', path: 'images' });
  }

  // Pricing Plans (at least one)
  if (!formData.pricingPlans || formData.pricingPlans.length === 0) {
    errors.push({ field: 'Pricing Plans', message: 'At least one pricing plan is required', path: 'pricingPlans' });
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
          if (!season) return; // Safety check
          
          if (!season.seasonName) {
            errors.push({ field: `Season ${sIdx + 1}`, message: 'Season name is required', path: `pricingPlans.${pIdx}.seasons.${sIdx}.seasonName` });
          }
          
          // Check if at least one price is entered. We check for typeof 'number' to allow 0.
          const prices = season.prices;
          const hasPrice = prices && (
            (typeof prices.solo === 'number') ||
            (typeof prices.pax_2_4 === 'number') ||
            (typeof prices.pax_5_8 === 'number') ||
            (typeof prices.pax_9_16 === 'number')
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
