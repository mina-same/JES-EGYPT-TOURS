"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { footerOneData } from "@/data/footerOneData";

const BOOKING_SUPPORT_EMAIL = footerOneData.contact.email.trim();

/**
 * What the card shows in place of a form that cannot load: the sentence the
 * form itself shows when a request cannot be sent, and the address it names.
 */
function BookingFormUnavailable() {
  const { t } = useTranslation('tours');
  return (
    <div className="booking-form-card">
      <div className="booking-message booking-message-error" role="status">
        <div className="booking-message__content">
          <span className="booking-email-fallback">
            {t("tourDetails.bookingForm.emailFallback")}{" "}
            <a href={`mailto:${BOOKING_SUPPORT_EMAIL}`}>{BOOKING_SUPPORT_EMAIL}</a>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Keeps a failure of the booking form inside the booking card.
 *
 * Without it, a form chunk that fails to load — a dropped connection, a deploy
 * that replaced the file — reached the app-wide ErrorBoundary, which answers a
 * ChunkLoadError by showing "Something went wrong" in place of the whole page
 * and reloading it: with the chunk blocked, that was a reload every second,
 * indefinitely. The tour does not depend on the form, so the rest of the page
 * stays as it is and the card offers the office's address instead.
 */
export class BookingFormBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Booking form failed to load:", error);
  }

  render() {
    return this.state.failed ? <BookingFormUnavailable /> : this.props.children;
  }
}
