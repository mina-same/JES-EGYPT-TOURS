"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, Send, MessageCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_ENDPOINTS } from "@/config/api";

interface TourQuestionModalProps {
  open: boolean;
  onClose: () => void;
  tourName: string;
  tourSlug: string;
  locale: string;
  /** Optional: shows a secondary "Ask on WhatsApp" action when provided. */
  whatsappHref?: string;
}

interface Values {
  name: string;
  email: string;
  phone: string;
  message: string;
  preferredDate: string;
}

const EMPTY: Values = { name: "", email: "", phone: "", message: "", preferredDate: "" };

/**
 * The quick question asked from a tour page.
 *
 * A modal rather than a link to /contact: the visitor is already inside a
 * specific tour, and sending them to a blank contact page throws that context
 * away and makes them describe the tour from memory.
 *
 * Deliberately NOT a second booking form. Party size, nationality, package and
 * dates all live in the booking form in the rail beside it; repeating them here
 * would turn a one-minute question into a booking flow. Name, email and the
 * question are the only required fields.
 */
const TourQuestionModal: React.FC<TourQuestionModalProps> = ({
  open,
  onClose,
  tourName,
  tourSlug,
  locale,
  whatsappHref,
}) => {
  const { t } = useTranslation("tours");
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  // Where focus was before the dialog opened, so it can be handed back.
  const openerRef = useRef<HTMLElement | null>(null);

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const close = useCallback(() => {
    onClose();
    // Hand focus back to whatever opened the dialog.
    openerRef.current?.focus?.();
  }, [onClose]);

  // Remember the opener, move focus in, and lock the page behind the overlay.
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.setTimeout(() => firstFieldRef.current?.focus(), 60);
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Escape closes; Tab is kept inside the dialog while it is open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, close]);

  // A fresh dialog each time it is opened, so a previous send is not still on
  // screen when someone comes back with a second question.
  useEffect(() => {
    if (open) {
      setValues(EMPTY);
      setErrors({});
      setSent(false);
      setFailure(null);
    }
  }, [open]);

  if (!open) return null;

  const validate = (): boolean => {
    const next: Partial<Record<keyof Values, string>> = {};
    if (values.name.trim().length < 2) {
      next.name = t("tourDetails.askModal.errorName", "Please enter your name");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
      next.email = t("tourDetails.askModal.errorEmail", "Please enter a valid email");
    }
    if (!values.message.trim()) {
      next.message = t("tourDetails.askModal.errorMessage", "Please tell us what you'd like to know");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    setFailure(null);
    try {
      const response = await fetch(API_ENDPOINTS.CONTACT.TOUR_QUESTION, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Locale": locale },
        body: JSON.stringify({
          source: "tour-question",
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          message: values.message.trim(),
          preferredDate: values.preferredDate.trim(),
          tourName,
          tourSlug,
          locale,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.success) {
        setFailure(body?.error || t("tourDetails.askModal.failed", "Something went wrong. Please try again."));
        return;
      }
      setSent(true);
    } catch {
      setFailure(t("tourDetails.askModal.failed", "Something went wrong. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="tour-ask-overlay"
      onMouseDown={(e) => {
        // Only a click that both starts and ends on the backdrop closes it, so
        // a drag that finishes outside the dialog does not dismiss the form.
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="tour-ask"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-ask-title"
        ref={dialogRef}
      >
        <button
          type="button"
          className="tour-ask__close"
          onClick={close}
          aria-label={t("tourDetails.askModal.close", "Close")}
        >
          <X size={18} />
        </button>

        {sent ? (
          <div className="tour-ask__done" role="status">
            <span className="tour-ask__done-icon" aria-hidden="true">
              <CheckCircle2 size={26} />
            </span>
            <h2 className="tour-ask__title">
              {t("tourDetails.askModal.sentTitle", "Your question is on its way")}
            </h2>
            <p className="tour-ask__lead">
              {t("tourDetails.askModal.sentText", "We usually reply within 24 hours.")}
            </p>
            <button type="button" className="tour-ask__submit" onClick={close}>
              {t("tourDetails.askModal.doneCta", "Close")}
            </button>
          </div>
        ) : (
          <>
            <h2 className="tour-ask__title" id="tour-ask-title">
              {t("tourDetails.askModal.title", "Ask Us About This Tour")}
            </h2>
            <p className="tour-ask__lead">
              {t(
                "tourDetails.askModal.lead",
                "Have a question about this tour? Send it to us and our team will get back to you."
              )}
            </p>

            {/* The tour is named in the dialog so the visitor can see the
                question will arrive attached to it. */}
            <p className="tour-ask__tour">
              <span className="tour-ask__tour-label">
                {t("tourDetails.askModal.tourLabel", "Tour")}
              </span>
              {tourName}
            </p>

            <form className="tour-ask__form" onSubmit={submit} noValidate>
              <div className="tour-ask__row">
                <label className="tour-ask__field">
                  <span className="tour-ask__label">
                    {t("tourDetails.askModal.name", "Name")} *
                  </span>
                  <input
                    ref={firstFieldRef}
                    type="text"
                    name="name"
                    value={values.name}
                    onChange={set("name")}
                    aria-invalid={!!errors.name}
                    autoComplete="name"
                  />
                  {errors.name && <span className="tour-ask__error">{errors.name}</span>}
                </label>

                <label className="tour-ask__field">
                  <span className="tour-ask__label">
                    {t("tourDetails.askModal.email", "Email")} *
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={set("email")}
                    aria-invalid={!!errors.email}
                    autoComplete="email"
                  />
                  {errors.email && <span className="tour-ask__error">{errors.email}</span>}
                </label>
              </div>

              <div className="tour-ask__row">
                <label className="tour-ask__field">
                  <span className="tour-ask__label">
                    {t("tourDetails.askModal.phone", "WhatsApp / Phone")}
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={values.phone}
                    onChange={set("phone")}
                    autoComplete="tel"
                  />
                </label>

                <label className="tour-ask__field">
                  <span className="tour-ask__label">
                    {t("tourDetails.askModal.date", "Travel Date")}
                    <span className="tour-ask__optional">
                      {t("tourDetails.askModal.optional", "optional")}
                    </span>
                  </span>
                  <input
                    type="text"
                    name="preferredDate"
                    value={values.preferredDate}
                    onChange={set("preferredDate")}
                    placeholder={t("tourDetails.askModal.datePlaceholder", "e.g. March 2027")}
                  />
                </label>
              </div>

              <label className="tour-ask__field">
                <span className="tour-ask__label">
                  {t("tourDetails.askModal.question", "Your Question")} *
                </span>
                <textarea
                  name="message"
                  rows={5}
                  value={values.message}
                  onChange={set("message")}
                  aria-invalid={!!errors.message}
                  placeholder={t(
                    "tourDetails.askModal.questionPlaceholder",
                    "Tell us what you'd like to know about this tour..."
                  )}
                />
                {errors.message && <span className="tour-ask__error">{errors.message}</span>}
              </label>

              {/* Hidden from people, filled by bots. Handled server-side. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="tour-ask__honeypot"
              />

              {failure && (
                <p className="tour-ask__failure" role="alert">
                  {failure}
                </p>
              )}

              <button type="submit" className="tour-ask__submit" disabled={submitting}>
                {submitting ? <Loader2 size={16} className="tour-ask__spin" /> : <Send size={16} />}
                {submitting
                  ? t("tourDetails.askModal.sending", "Sending...")
                  : t("tourDetails.askModal.submit", "Send My Question")}
              </button>

              <p className="tour-ask__reply">
                {t("tourDetails.askModal.replyTime", "We usually reply within 24 hours.")}
              </p>

              {whatsappHref && (
                <a
                  className="tour-ask__whatsapp"
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={15} />
                  {t("tourDetails.askModal.whatsapp", "Ask on WhatsApp")}
                </a>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default TourQuestionModal;
