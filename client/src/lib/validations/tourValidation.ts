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
      /* The server requires English location AND hotels on every accommodation
         row. Without this check, clicking "Add Location" and saving produced a
         server rejection the editor could not point at, so the blank row that
         caused it was invisible. */
      (plan.accommodations || []).forEach((stay, aIdx) => {
        const at = `pricingPlans.${pIdx}.accommodations.${aIdx}`;
        if (!stay?.location?.en?.trim()) {
          errors.push({
            field: `Plan ${pIdx + 1} — accommodation ${aIdx + 1}`,
            message: 'Location (English) is required',
            path: `${at}.location`,
          });
        }
        if (!stay?.hotels?.en?.trim()) {
          errors.push({
            field: `Plan ${pIdx + 1} — accommodation ${aIdx + 1}`,
            message: 'Hotels (English) is required',
            path: `${at}.hotels`,
          });
        }
      });

      if (!plan.seasons || plan.seasons.length === 0) {
        errors.push({ field: `Pricing Plan ${pIdx + 1}`, message: 'At least one season is required', path: `pricingPlans.${pIdx}.seasons` });
      } else {
        plan.seasons.forEach((season, sIdx) => {
          if (!season) return; // Safety check
          
          if (!season.seasonName) {
            errors.push({ field: `Season ${sIdx + 1}`, message: 'Season name is required', path: `pricingPlans.${pIdx}.seasons.${sIdx}.seasonName` });
          }
          
          // Prices are deliberately NOT required. Content staff publish tours
          // before sales have priced them, and requiring a number here is what
          // used to force placeholder zeros into the data — which the public
          // pages then showed as "$0.00". An unpriced season is a valid state:
          // the tour page hides its pricing section and the cards hide their
          // "Start from" line until real amounts exist.
        });
      }
    });
  }

  /* Every day states its meals. Unlike the prices above, this is not a number
     sales has yet to decide — it is a fact the person writing the day already
     knows, and leaving it out is what makes a traveller ask. "None" is one of
     the choices, so there is always a correct answer to give.

     Enforced here rather than in the Mongoose schema: the seeders and every
     tour written before this field existed carry no meals, and a schema-level
     `required` would stop all of them from saving. */
  if (Array.isArray(formData.itinerary?.days)) {
    formData.itinerary.days.forEach((day: any, dayIdx: number) => {
      if (!Array.isArray(day?.meals) || day.meals.length === 0) {
        errors.push({
          field: `Itinerary — Day ${day?.day ?? dayIdx + 1}`,
          message: 'Select the meals included, or None',
          path: `itinerary.days.${dayIdx}.meals`,
        });
      }
    });
  }

  return errors;
}
