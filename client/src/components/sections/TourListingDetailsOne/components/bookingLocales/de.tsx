"use client";

import { de as dateLocale } from "date-fns/locale/de";
import phoneLabels from "react-phone-number-input/locale/de";
import { BookingForm, type BookingFormProps } from "../BookingForm";

/** BookingForm with the German calendar and country names — see ./en.tsx. */
export default function BookingFormDe(props: BookingFormProps) {
  return <BookingForm {...props} dateLocale={dateLocale} phoneLabels={phoneLabels as Record<string, string>} />;
}
