"use client";

import { it as dateLocale } from "date-fns/locale/it";
import phoneLabels from "react-phone-number-input/locale/it";
import { BookingForm, type BookingFormProps } from "../BookingForm";

/** BookingForm with the Italian calendar and country names — see ./en.tsx. */
export default function BookingFormIt(props: BookingFormProps) {
  return <BookingForm {...props} dateLocale={dateLocale} phoneLabels={phoneLabels as Record<string, string>} />;
}
