"use client";
import React, { useEffect, useRef, useState } from "react";
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
import { waHref } from "@/config/contact";

/** Mirrors `contactSubmissionValidation` in server/src/middleware/validation.ts
 *  so length rejections surface as localized inline errors instead of the
 *  server's English-only message in a toast. */
const NAME_MIN = 2;
const NAME_MAX = 100;
const PHONE_MAX = 40;
const MESSAGE_MAX = 5000;

const STEP_INDEXES = [0, 1, 2] as const;

type FieldName = "name" | "email" | "phone" | "message";
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

  /** Held in a ref so a pending cooldown can be cancelled on unmount and
   *  replaced (never stacked) when a visitor submits again. */
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Clearing the timer on unmount is not enough on its own: a request still in
   *  flight settles later and would schedule a fresh timer after cleanup had
   *  already run. This lets that path opt out instead. */
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  const whatsappHref = waHref(t("form.aside.whatsappMessage"));

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

    const phone = data.phone?.trim() ?? "";
    if (!phone) {
      errors.phone = t("form.errors.phoneRequired");
    } else if (phone.length > PHONE_MAX) {
      errors.phone = t("form.errors.phoneTooLong");
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

    // Drop any cooldown still pending from a previous attempt, so it cannot
    // fire mid-flight and clear the guard for the attempt now starting.
    if (cooldownTimer.current) {
      clearTimeout(cooldownTimer.current);
      cooldownTimer.current = null;
    }

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
        // NOT "send failed": nothing was sent, the visitor never left the form.
        toast({
          title: t("form.errors.checkFields"),
          description: errors[firstInvalid]!,
          variant: "destructive",
        });
        form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      }
      setIsSubmitting(false);
      setSubmittedOnce(false);
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.CONTACT.BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Locale": locale,
        },
        body: JSON.stringify({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          message: data.message || "",
          // So the team knows which language to answer in.
          locale,
          // The honeypot travels to the server, which owns the decision. The
          // client used to short-circuit here and never forward it, which left
          // the server's check unreachable AND silently binned any enquiry an
          // over-eager password manager had filled in.
          website: data.website || "",
        }),
      });

      // The server's own strings are English-only, and the rate limiter answers
      // with plain text rather than JSON — so the outcome is derived from the
      // status code and always spoken in the visitor's language.
      if (!res.ok) {
        const errMsg =
          res.status === 429
            ? t("form.errors.tooManyRequests")
            : res.status === 400
            ? t("form.errors.invalidSubmission")
            : t("form.errors.failedMessage");

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

      const okMsg = t("form.success.sentMessage");
      setStatus({ type: "success", message: okMsg });
      toast({
        title: t("form.success.sentTitle"),
        description: okMsg,
      });
      // Use the stored form reference to reset
      form.reset();

      // Cooldown ONLY after a message actually went through — it exists to stop
      // a double-click sending the same enquiry twice. After a failure the
      // visitor is meant to correct something and try again straight away, so
      // the error paths below release the guard immediately instead.
      if (isMounted.current) {
        cooldownTimer.current = setTimeout(() => setSubmittedOnce(false), 2000);
      }
    } catch (_err: any) {
      console.error("ContactPage: Catch block error:", _err);
      // `_err.message` is browser-generated English ("Failed to fetch") — never
      // show it to a visitor reading the page in another language.
      const errMsg = t("form.errors.failedMessage");
      setStatus({ type: "error", message: errMsg });
      toast({
        title: t("form.errors.sendFailed"),
        description: errMsg,
        variant: "destructive",
      });
      // Nothing was delivered — let them retry at once.
      setSubmittedOnce(false);
    } finally {
      setIsSubmitting(false);
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
        {/* ── Panel ─────────────────────────────────────────────
            DOM order is heading → form → steps, which is exactly the order the
            phone layout paints. The previous markup kept both navy blocks in
            one <aside> and reordered them with CSS, so keyboard and screen
            reader users met the steps BEFORE the form while seeing the
            opposite. The navy gradient now lives on `.panel` itself, so the
            two blocks still read as one continuous column on desktop without
            needing to be siblings inside a wrapper. */}
        <div className={styles.panel}>
          {/* Names the section (see aria-labelledby above). */}
          <div className={styles.asideTop}>
            <h2 id='contact-panel-title' className={styles.asideTitle}>
              {t("form.title")}
            </h2>
            <p className={styles.asideText}>{t("form.text")}</p>
          </div>

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

                <div className={styles.field}>
                  <label className={styles.label} htmlFor='phone'>
                    {t("form.fields.phoneLabel")}{" "}
                    <span className={styles.requiredMark} aria-hidden='true'>
                      *
                    </span>
                  </label>
                  <input
                    className={controlClass("phone", styles.input)}
                    type='tel'
                    name='phone'
                    id='phone'
                    autoComplete='tel'
                    inputMode='tel'
                    placeholder={t("form.fields.phonePlaceholder")}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={describedBy("phone")}
                    onInput={() => clearFieldError("phone")}
                    required
                  />
                  {fieldErrors.phone && (
                    <span id='phone-error' className={styles.fieldError}>
                      {fieldErrors.phone}
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

          {/* ── Reassurance ───────────────────────────────────
              Deliberately NOT a repeat of the email/phone cards above: this
              sets expectations about what happens after sending, and offers the
              low-friction alternatives for anyone not ready to write yet. */}
          <aside className={styles.asideBottom}>
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
              <span className={styles.srOnly}> {t("form.newTab")}</span>
            </a>

            {/* Somewhere to go for a visitor who is not ready to write yet —
                otherwise this page is a dead end with no onward route. */}
            <div className={styles.asideLinks}>
              <span className={styles.asideLinksLabel}>
                {t("form.aside.linksLabel")}
              </span>
              <Link
                className={styles.asideLink}
                href={localizeInternalUrl("/tailor-made", locale)}
              >
                {t("form.aside.tailorMadeLabel")}
                <ArrowRight size={15} aria-hidden='true' />
              </Link>
              <Link
                className={styles.asideLink}
                href={localizeInternalUrl("/special-offers", locale)}
              >
                {t("form.aside.offersLabel")}
                <ArrowRight size={15} aria-hidden='true' />
              </Link>
            </div>
          </aside>
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
              <span className={styles.srOnly}> {t("form.newTab")}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
