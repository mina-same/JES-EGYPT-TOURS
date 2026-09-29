"use client";

import { es as dateLocale } from "date-fns/locale/es";
import phoneLabels from "react-phone-number-input/locale/es";
import { BookingForm, type BookingFormProps } from "../BookingForm";

/** BookingForm with the Spanish calendar and country names — see ./en.tsx. */
export default function BookingFormEs(props: BookingFormProps) {
  return <BookingForm {...props} dateLocale={dateLocale} phoneLabels={phoneLabels as Record<string, string>} />;
}
