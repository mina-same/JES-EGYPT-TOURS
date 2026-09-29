"use client";

import { enUS as dateLocale } from "date-fns/locale/en-US";
import phoneLabels from "react-phone-number-input/locale/en";
import { BookingForm, type BookingFormProps } from "../BookingForm";

/**
 * BookingForm with the English calendar and country names.
 *
 * There is one entry like this per site locale, and each imports only its own
 * language's date-fns locale and phone-country names. BookingFormLazy loads
 * the entry for the route locale, so a tour page downloads one language's data
 * instead of all four; BookingForm used to import every language itself.
 *
 * English costs nothing extra: date-fns already carries en-US as its built-in
 * default, and BookingForm keeps the English country names for its
 * nationality list and as the fallback for missing names.
 */
export default function BookingFormEn(props: BookingFormProps) {
  return <BookingForm {...props} dateLocale={dateLocale} phoneLabels={phoneLabels as Record<string, string>} />;
}
