"use client";
import React, { useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { googleMapUrl, googleMapDirectionsUrl } from "@/data/contactData";
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { localizeInternalUrl } from "@/lib/url";
import styles from "./ContactPage.module.css";

/** Same number as the floating button, the drawer, tailor-made and OffersCta. */
const WHATSAPP_NUMBER = "201007437271";

/** Mirrors `contactSubmissionValidation` in server/src/middleware/validation.ts
 *  so length rejections surface as localized inline errors instead of the
 *  server's English-only message in a toast. */
const NAME_MIN = 2;
const NAME_MAX = 100;
const MESSAGE_MAX = 5000;

const STEP_INDEXES = [0, 1, 2] as const;

type FieldName = "name" | "email" | "message";
type FieldErrors = Partial<Record<FieldName, string>>;

const ContactPage: React.FC<{ locale: string }> = ({ locale }) => {
  const { t } = useTranslation("contact");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    t("form.aside.whatsappMessage")
  )}`;

  /** Clear a field's error as soon as the visitor starts fixing it. */
  const clearFieldError = (field: FieldName) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  /** All three fields at once — the old version stopped at the first failure,
   *  which cannot drive per-field messages. */
  const validate = (data: Record<string, string>): FieldErrors => {
    const errors: FieldErrors = {};

    const name = data.name?.trim() ?? "";
    if (!name) {
      errors.name = t("form.errors.nameRequired");
    } else if (name.length < NAME_MIN) {
      errors.name = t("form.errors.nameTooShort");
    } else if (name.length > NAME_MAX) {
      errors.name = t("form.errors.nameTooLong");
    }

    const email = data.email?.trim() ?? "";
    // NOTE: a regex LITERAL must use single backslashes — the previous
    // double-escaped version (/^\\S+@\\S+\\.\\S+$/) matched literal
    // backslashes, so every real email failed and the form never submitted.
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email) {
      errors.email = t("form.errors.emailRequired");
    } else if (!emailRegex.test(email)) {
      errors.email = t("form.errors.invalidEmail");
    }

    const message = data.message?.trim() ?? "";
    if (!message) {
      errors.message = t("form.errors.messageRequired");
    } else if (message.length > MESSAGE_MAX) {
      errors.message = t("form.errors.messageTooLong");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.nativeEvent as any)?.stopImmediatePropagation?.();

    if (isSubmitting || submittedOnce) return;
    setIsSubmitting(true);
    setSubmittedOnce(true);
    setStatus({ type: null, message: "" });
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget; // Store reference to form element
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Honeypot: invisible to humans — bots that fill it get a silent no-op.
    if (data.website) {
      setStatus({ type: "success", message: t("form.success.sentMessage") });
      form.reset();
      setIsSubmitting(false);
      // Previously omitted, which left `submittedOnce` true forever and
      // permanently disabled the form for anyone who tripped the honeypot.
      setSubmittedOnce(false);
      return;
    }

    const errors = validate(data);
    if (Object.keys(errors).length > 0) {
      // flushSync so the error nodes (and therefore the aria-describedby
      // targets) exist in the DOM before focus moves — otherwise a screen
      // reader announces the field without its message.
      flushSync(() => setFieldErrors(errors));
      const firstInvalid = (["name", "email", "message"] as const).find(
        (field) => errors[field]
      );
      if (firstInvalid) {
        toast({
          title: t("form.errors.sendFailed"),
          description: errors[firstInvalid]!,
          variant: "destructive",
        });
        form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      }
      setIsSubmitting(false);
      setSubmittedOnce(false);
      return;
    }

    let successOccurred = false;
    try {
      const res = await fetch(API_ENDPOINTS.CONTACT.BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name || "",
          email: data.email || "",
          message: data.message || "",
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const errMsg = json?.error || t("form.errors.failedMessage");
        setStatus({ type: "error", message: errMsg });
        toast({
          title: t("form.errors.sendFailed"),
          description: errMsg,
          variant: "destructive",
        });
        setIsSubmitting(false);
        setSubmittedOnce(false);
        return;
      }

      successOccurred = true;
      const okMsg = json?.message || t("form.success.sentMessage");
      setStatus({ type: "success", message: okMsg });
      toast({
        title: t("form.success.sentTitle"),
        description: okMsg,
      });
      // Use the stored form reference to reset
      form.reset();
    } catch (_err: any) {
      console.error("ContactPage: Catch block error:", _err);
      if (!successOccurred) {
        const errMsg = _err.message || t("form.errors.failedMessage");
        setStatus({ type: "error", message: errMsg });
        toast({
          title: t("form.errors.sendFailed"),
          description: errMsg,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
      // Reset submittedOnce after a short delay to allow re-submit if needed
      setTimeout(() => setSubmittedOnce(false), 2000);
    }
  };

  const describedBy = (field: FieldName) =>
    fieldErrors[field] ? `${field}-error` : undefined;

  const controlClass = (field: FieldName, base: string) =>
    fieldErrors[field] ? `${base} ${styles.inputInvalid}` : base;

  return (
    <section
      className={`${styles.section} section-space-bottom`}
      aria-labelledby='contact-panel-title'
    >
      <div className='container'>
        <div className={styles.panel}>
          {/* ── Reassurance aside ─────────────────────────────
              Deliberately NOT a repeat of the address/email/phone cards in
              ContactTop directly above: this sets expectations about what
              happens after sending, and offers the low-friction alternative. */}
          {/* Split into two blocks so the panel grid can reorder them below
              992px: the heading stays above the form (it names the section),
              while the steps and WhatsApp drop BELOW it — otherwise ~400px of
              aside pushed the first field off a phone screen. */}
          <aside className={styles.aside}>
            <div className={styles.asideTop}>
              <div className={styles.asideInner}>
                <h2 id='contact-panel-title' className={styles.asideTitle}>
                  {t("form.title")}
                </h2>
                <p className={styles.asideText}>{t("form.text")}</p>
              </div>
            </div>

            <div className={styles.asideBottom}>
              <span className={styles.stepsLabel}>
                {t("form.aside.stepsLabel")}
              </span>
              <ol className={styles.steps}>
                {STEP_INDEXES.map((index) => (
                  <li key={index} className={styles.step}>
                    <span className={styles.stepNumber} aria-hidden='true'>
                      {index + 1}
                    </span>
                    <span>
                      <strong className={styles.stepTitle}>
                        {t(`form.aside.steps.${index}.title`)}
                      </strong>
                      <span className={styles.stepText}>
                        {t(`form.aside.steps.${index}.text`)}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>

              <a
                className={styles.whatsapp}
                href={whatsappHref}
                target='_blank'
                rel='noreferrer noopener'
              >
                <MessageCircle size={18} aria-hidden='true' />
                {t("form.aside.whatsappLabel")}
              </a>
            </div>
          </aside>

          {/* ── The form ─────────────────────────────────────── */}
          <div className={styles.formColumn}>
            <h3 className={styles.formHeading}>{t("form.formHeading")}</h3>
            <p className={styles.formSubheading}>{t("form.formSubheading")}</p>

            {/* noValidate: let the localized JS validation speak instead of
                the browser's native (unlocalized) required-field bubbles */}
            <form onSubmit={handleSubmit} noValidate>
              <div className={styles.grid}>
                {/* Honeypot — hidden from humans, tempting for bots */}
                <input
                  type='text'
                  name='website'
                  tabIndex={-1}
                  autoComplete='off'
                  aria-hidden='true'
                  className={styles.honeypot}
                />

                {/* The toast already announces these to assistive tech, so these
                    persistent visual panels deliberately carry no live-region
                    role — otherwise every outcome is announced twice. */}
                {status.type === "success" && (
                  <div
                    className={`${styles.fieldFull} ${styles.alert} ${styles.alertSuccess}`}
                  >
                    <CheckCircle2 size={17} aria-hidden='true' />
                    <span>{status.message}</span>
                  </div>
                )}
                {status.type === "error" && (
                  <div
                    className={`${styles.fieldFull} ${styles.alert} ${styles.alertError}`}
                  >
                    <AlertCircle size={17} aria-hidden='true' />
                    <span>{status.message}</span>
                  </div>
                )}

                <div className={styles.field}>
                  <label className={styles.label} htmlFor='name'>
                    {t("form.fields.nameLabel")}{" "}
                    <span className={styles.requiredMark} aria-hidden='true'>
                      *
                    </span>
                  </label>
                  <input
                    className={controlClass("name", styles.input)}
                    type='text'
                    name='name'
                    id='name'
                    autoComplete='name'
                    placeholder={t("form.fields.namePlaceholder")}
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={describedBy("name")}
                    onInput={() => clearFieldError("name")}
                    required
                  />
                  {fieldErrors.name && (
                    <span id='name-error' className={styles.fieldError}>
                      {fieldErrors.name}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor='email'>
                    {t("form.fields.emailLabel")}{" "}
                    <span className={styles.requiredMark} aria-hidden='true'>
                      *
                    </span>
                  </label>
                  <input
                    className={controlClass("email", styles.input)}
                    type='email'
                    name='email'
                    id='email'
                    autoComplete='email'
                    inputMode='email'
                    placeholder={t("form.fields.emailPlaceholder")}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={describedBy("email")}
                    onInput={() => clearFieldError("email")}
                    required
                  />
                  {fieldErrors.email && (
                    <span id='email-error' className={styles.fieldError}>
                      {fieldErrors.email}
                    </span>
                  )}
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor='message'>
                    {t("form.fields.messageLabel")}{" "}
                    <span className={styles.requiredMark} aria-hidden='true'>
                      *
                    </span>
                  </label>
                  <textarea
                    className={controlClass("message", styles.textarea)}
                    name='message'
                    id='message'
                    placeholder={t("form.fields.messagePlaceholder")}
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={describedBy("message")}
                    onInput={() => clearFieldError("message")}
                    required
                  ></textarea>
                  {fieldErrors.message && (
                    <span id='message-error' className={styles.fieldError}>
                      {fieldErrors.message}
                    </span>
                  )}
                </div>

                <div className={styles.fieldFull}>
                  <button
                    type='submit'
                    className={styles.submit}
                    disabled={isSubmitting || submittedOnce}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2
                          size={18}
                          className={styles.spinner}
                          aria-hidden='true'
                        />
                        {t("form.buttons.sending")}
                      </>
                    ) : (
                      <>
                        {t("form.buttons.send")}
                        <ArrowRight size={18} aria-hidden='true' />
                      </>
                    )}
                  </button>
                  <p className={styles.privacy}>
                    {t("form.privacyNote")}{" "}
                    <Link
                      className={styles.privacyLink}
                      href={localizeInternalUrl("/privacy-policy", locale)}
                    >
                      {t("form.privacyLinkLabel")}
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ── Map ───────────────────────────────────────────── */}
        <div className={styles.mapCard}>
          <iframe
            title={t("top.mapTitle")}
            src={googleMapUrl}
            className={styles.mapFrame}
            loading='lazy'
            referrerPolicy='no-referrer-when-downgrade'
            allowFullScreen
          ></iframe>
          <div className={styles.mapBar}>
            <p className={styles.mapAddress}>
              <MapPin size={16} aria-hidden='true' />
              {t("top.addressText")}
            </p>
            <a
              className={styles.mapLink}
              href={googleMapDirectionsUrl}
              target='_blank'
              rel='noreferrer noopener'
            >
              {t("form.mapCta")}
              <ExternalLink size={14} aria-hidden='true' />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
