"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Mail,
  MessageCircle,
  Send,
} from "lucide-react";
import { API_ENDPOINTS } from "@/config/api";
import styles from "../TravelTradePage.module.css";
import {
  TRAVEL_TRADE_INQUIRY_ID,
  TRAVEL_TRADE_INTENT_EVENT,
  type SelectOption,
  type TravelTradeInquiryCopy,
  type TravelTradeIntent,
} from "./types";

interface TravelTradeInquiryFormProps {
  copy: TravelTradeInquiryCopy;
  locale: string;
  contactEmail: string;
  contactPhone: string;
}

interface FormValues {
  inquiryType: TravelTradeIntent | "";
  fullName: string;
  businessEmail: string;
  phone: string;
  companyName: string;
  companyWebsite: string;
  country: string;
  businessType: string;
  primaryMarket: string;
  annualTravelers: string;
  travelDates: string;
  travelers: string;
  destinations: string;
  serviceLanguage: string;
  serviceLevel: string;
  message: string;
  consentGiven: boolean;
  website: string;
}

type FieldName = keyof FormValues;
type FormErrors = Partial<Record<FieldName, string>>;

const INITIAL_VALUES: FormValues = {
  inquiryType: "b2b-rates",
  fullName: "",
  businessEmail: "",
  phone: "",
  companyName: "",
  companyWebsite: "",
  country: "",
  businessType: "",
  primaryMarket: "",
  annualTravelers: "",
  travelDates: "",
  travelers: "",
  destinations: "",
  serviceLanguage: "",
  serviceLevel: "",
  message: "",
  consentGiven: false,
  website: "",
};

const REQUIRED_TEXT_FIELDS: Array<Exclude<FieldName, "consentGiven" | "website">> = [
  "inquiryType",
  "fullName",
  "businessEmail",
  "phone",
  "companyName",
  "companyWebsite",
  "country",
  "businessType",
  "primaryMarket",
  "annualTravelers",
  "travelDates",
  "travelers",
  "destinations",
  "serviceLanguage",
  "serviceLevel",
  "message",
];

function isTravelTradeIntent(value: unknown): value is TravelTradeIntent {
  return (
    value === "b2b-rates" ||
    value === "client-request" ||
    value === "general-partnership"
  );
}

function isValidWebsite(value: string): boolean {
  try {
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const parsed = new URL(normalized);
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

function ErrorMessage({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <span id={id} className={styles.fieldError}>
      {message}
    </span>
  );
}

export default function TravelTradeInquiryForm({
  copy,
  locale,
  contactEmail,
  contactPhone,
}: TravelTradeInquiryFormProps) {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const whatsappNumber = useMemo(
    () => contactPhone.replace(/\D/g, ""),
    [contactPhone]
  );
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    copy.alternative.whatsappMessage
  )}`;

  useEffect(() => {
    const handleIntent = (event: Event) => {
      const detail = (event as CustomEvent<{ intent?: unknown }>).detail;
      if (!isTravelTradeIntent(detail?.intent)) return;

      setValues((current) => ({
        ...current,
        inquiryType: detail.intent as TravelTradeIntent,
      }));
      setErrors((current) => ({ ...current, inquiryType: undefined }));
      setResult(null);
    };

    window.addEventListener(TRAVEL_TRADE_INTENT_EVENT, handleIntent);
    return () =>
      window.removeEventListener(TRAVEL_TRADE_INTENT_EVENT, handleIntent);
  }, []);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    REQUIRED_TEXT_FIELDS.forEach((field) => {
      const value = values[field];
      if (typeof value !== "string" || !value.trim()) {
        nextErrors[field] = copy.validation.required;
      }
    });

    const fullNameLength = values.fullName.trim().length;
    if (fullNameLength > 0 && (fullNameLength < 2 || fullNameLength > 100)) {
      nextErrors.fullName = copy.validation.nameLength;
    }

    const companyLength = values.companyName.trim().length;
    if (companyLength > 0 && (companyLength < 2 || companyLength > 150)) {
      nextErrors.companyName = copy.validation.companyLength;
    }

    if (
      values.businessEmail.trim() &&
      (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.businessEmail.trim()) ||
        values.businessEmail.trim().length > 150)
    ) {
      nextErrors.businessEmail = copy.validation.email;
    }

    if (
      values.companyWebsite.trim() &&
      (values.companyWebsite.trim().length > 250 ||
        !isValidWebsite(values.companyWebsite.trim()))
    ) {
      nextErrors.companyWebsite = copy.validation.website;
    }

    const travelerCount = Number(values.travelers);
    if (
      values.travelers.trim() &&
      (!Number.isInteger(travelerCount) ||
        travelerCount < 1 ||
        travelerCount > 10000)
    ) {
      nextErrors.travelers = copy.validation.travelers;
    }

    const messageLength = values.message.trim().length;
    if (messageLength > 0 && (messageLength < 20 || messageLength > 5000)) {
      nextErrors.message = copy.validation.messageLength;
    }

    if (values.phone.trim().length > 40) {
      nextErrors.phone = copy.validation.required;
    }
    if (values.country.trim().length > 100) {
      nextErrors.country = copy.validation.required;
    }
    if (values.primaryMarket.trim().length > 150) {
      nextErrors.primaryMarket = copy.validation.required;
    }
    if (values.travelDates.trim().length > 150) {
      nextErrors.travelDates = copy.validation.required;
    }
    if (values.destinations.trim().length > 500) {
      nextErrors.destinations = copy.validation.required;
    }
    if (values.serviceLanguage.trim().length > 100) {
      nextErrors.serviceLanguage = copy.validation.required;
    }
    if (!values.consentGiven) {
      nextErrors.consentGiven = copy.validation.consent;
    }

    return nextErrors;
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const field = event.target.name as FieldName;
    const value =
      event.target instanceof HTMLInputElement &&
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setResult(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setResult("error");
      const firstInvalidField = Object.keys(nextErrors)[0];
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)
        ?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setResult(null);

    try {
      const response = await fetch(API_ENDPOINTS.CONTACT.TRAVEL_TRADE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Locale": locale,
        },
        body: JSON.stringify({
          source: "travel-trade",
          inquiryType: values.inquiryType,
          name: values.fullName.trim(),
          email: values.businessEmail.trim(),
          phone: values.phone.trim(),
          companyName: values.companyName.trim(),
          companyWebsite: values.companyWebsite.trim(),
          country: values.country.trim(),
          businessType: values.businessType,
          primaryMarket: values.primaryMarket.trim(),
          annualTravelers: values.annualTravelers,
          travelDates: values.travelDates.trim(),
          travelers: Number(values.travelers),
          destinations: values.destinations.trim(),
          serviceLanguage: values.serviceLanguage.trim(),
          serviceLevel: values.serviceLevel,
          message: values.message.trim(),
          consentGiven: values.consentGiven,
          locale,
          website: values.website,
        }),
      });

      if (!response.ok) {
        setResult("error");
        return;
      }

      setValues(INITIAL_VALUES);
      setResult("success");
    } catch {
      setResult("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSelect = (
    name: FieldName,
    label: string,
    options: SelectOption[]
  ) => {
    const errorId = `${name}-error`;
    return (
      <div className={styles.formField}>
        <label htmlFor={name}>
          {label} <span aria-hidden="true">*</span>
        </label>
        <select
          id={name}
          name={name}
          value={String(values[name])}
          onChange={handleChange}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? errorId : undefined}
          required
        >
          <option value="">{label}</option>
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ErrorMessage id={errorId} message={errors[name]} />
      </div>
    );
  };

  const renderInput = ({
    name,
    label,
    type = "text",
    autoComplete,
    maxLength,
    inputMode,
  }: {
    name: Exclude<FieldName, "consentGiven">;
    label: string;
    type?: "text" | "email" | "url" | "tel" | "number";
    autoComplete?: string;
    maxLength?: number;
    inputMode?: "text" | "email" | "url" | "tel" | "numeric";
  }) => {
    const errorId = `${name}-error`;
    return (
      <div className={styles.formField}>
        <label htmlFor={name}>
          {label} <span aria-hidden="true">*</span>
        </label>
        <input
          id={name}
          name={name}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          min={type === "number" ? 1 : undefined}
          max={type === "number" ? 10000 : undefined}
          value={String(values[name])}
          placeholder={
            name in copy.placeholders
              ? copy.placeholders[name as keyof typeof copy.placeholders]
              : undefined
          }
          onChange={handleChange}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? errorId : undefined}
          required
        />
        <ErrorMessage id={errorId} message={errors[name]} />
      </div>
    );
  };

  return (
    <section
      id={TRAVEL_TRADE_INQUIRY_ID}
      className={`${styles.section} ${styles.inquirySection}`}
      aria-labelledby="travel-trade-inquiry-title"
    >
      <div className="container">
        <div className={styles.inquiryLayout}>
          <aside className={styles.inquiryIntro}>
            <span className={styles.eyebrow}>{copy.eyebrow}</span>
            <h2 id="travel-trade-inquiry-title">{copy.title}</h2>
            <p>{copy.intro}</p>

            <div className={styles.contactAlternative}>
              <h3>{copy.alternative.title}</h3>
              <p>{copy.alternative.text}</p>
              <a href={`mailto:${contactEmail}`}>
                <Mail size={18} aria-hidden="true" />
                <span>{copy.alternative.email}</span>
              </a>
              <a href={whatsappHref} target="_blank" rel="noreferrer noopener">
                <MessageCircle size={18} aria-hidden="true" />
                <span>{copy.alternative.whatsapp}</span>
              </a>
            </div>
          </aside>

          <form
            ref={formRef}
            className={styles.inquiryForm}
            onSubmit={handleSubmit}
            noValidate
          >
            <input
              className={styles.honeypot}
              type="text"
              name="website"
              value={values.website}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {result === "success" ? (
              <div className={styles.formSuccess} role="status" aria-live="polite">
                <CheckCircle2 size={25} aria-hidden="true" />
                <div>
                  <strong>{copy.successTitle}</strong>
                  <p>{copy.successMessage}</p>
                </div>
              </div>
            ) : null}
            {result === "error" ? (
              <div className={styles.formFailure} role="alert" aria-live="assertive">
                <strong>{copy.errorTitle}</strong>
                <p>{copy.errorMessage}</p>
              </div>
            ) : null}

            <fieldset>
              <legend>{copy.sections.contact}</legend>
              <div className={styles.formGrid}>
                {renderSelect(
                  "inquiryType",
                  copy.fields.inquiryType,
                  copy.options.inquiryTypes
                )}
                {renderInput({
                  name: "fullName",
                  label: copy.fields.fullName,
                  autoComplete: "name",
                  maxLength: 100,
                })}
                {renderInput({
                  name: "businessEmail",
                  label: copy.fields.businessEmail,
                  type: "email",
                  inputMode: "email",
                  autoComplete: "email",
                  maxLength: 150,
                })}
                {renderInput({
                  name: "phone",
                  label: copy.fields.phone,
                  type: "tel",
                  inputMode: "tel",
                  autoComplete: "tel",
                  maxLength: 40,
                })}
                {renderInput({
                  name: "companyName",
                  label: copy.fields.companyName,
                  autoComplete: "organization",
                  maxLength: 150,
                })}
                {renderInput({
                  name: "companyWebsite",
                  label: copy.fields.companyWebsite,
                  type: "url",
                  inputMode: "url",
                  autoComplete: "url",
                  maxLength: 250,
                })}
                {renderInput({
                  name: "country",
                  label: copy.fields.country,
                  autoComplete: "country-name",
                  maxLength: 100,
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend>{copy.sections.business}</legend>
              <div className={styles.formGrid}>
                {renderSelect(
                  "businessType",
                  copy.fields.businessType,
                  copy.options.businessTypes
                )}
                {renderInput({
                  name: "primaryMarket",
                  label: copy.fields.primaryMarket,
                  maxLength: 150,
                })}
                {renderSelect(
                  "annualTravelers",
                  copy.fields.annualTravelers,
                  copy.options.annualTravelers
                )}
              </div>
            </fieldset>

            <fieldset>
              <legend>{copy.sections.request}</legend>
              <div className={styles.formGrid}>
                {renderInput({
                  name: "travelDates",
                  label: copy.fields.travelDates,
                  maxLength: 150,
                })}
                {renderInput({
                  name: "travelers",
                  label: copy.fields.travelers,
                  type: "number",
                  inputMode: "numeric",
                })}
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label htmlFor="destinations">
                    {copy.fields.destinations} <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="destinations"
                    name="destinations"
                    rows={3}
                    maxLength={500}
                    value={values.destinations}
                    placeholder={copy.placeholders.destinations}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.destinations)}
                    aria-describedby={
                      errors.destinations ? "destinations-error" : undefined
                    }
                    required
                  />
                  <ErrorMessage
                    id="destinations-error"
                    message={errors.destinations}
                  />
                </div>
                {renderInput({
                  name: "serviceLanguage",
                  label: copy.fields.serviceLanguage,
                  maxLength: 100,
                })}
                {renderSelect(
                  "serviceLevel",
                  copy.fields.serviceLevel,
                  copy.options.serviceLevels
                )}
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label htmlFor="message">
                    {copy.fields.message} <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={7}
                    minLength={20}
                    maxLength={5000}
                    value={values.message}
                    placeholder={copy.placeholders.message}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? "message-error" : undefined}
                    required
                  />
                  <ErrorMessage id="message-error" message={errors.message} />
                </div>
              </div>
            </fieldset>

            <p className={styles.fileNote}>{copy.fileNote}</p>

            <div className={styles.consentField}>
              <input
                id="consentGiven"
                type="checkbox"
                name="consentGiven"
                checked={values.consentGiven}
                onChange={handleChange}
                aria-invalid={Boolean(errors.consentGiven)}
                aria-describedby={
                  errors.consentGiven ? "consentGiven-error" : undefined
                }
                required
              />
              <label htmlFor="consentGiven">
                {copy.consentPrefix}{" "}
                <Link href={`/${locale}/privacy-policy`}>
                  {copy.consentLink}
                </Link>
                {copy.consentSuffix}
              </label>
              <ErrorMessage
                id="consentGiven-error"
                message={errors.consentGiven}
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className={styles.spinner} size={19} aria-hidden="true" />
              ) : (
                <Send size={19} aria-hidden="true" />
              )}
              <span>{isSubmitting ? copy.submitting : copy.submit}</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
