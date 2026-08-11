"use client";
import "react-datepicker/dist/react-datepicker.css";
import "react-phone-number-input/style.css";
import React, { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { de as dateDe } from "date-fns/locale/de";
import { enUS as dateEn } from "date-fns/locale/en-US";
import { es as dateEs } from "date-fns/locale/es";
import { it as dateIt } from "date-fns/locale/it";
import PhoneInput, { getCountryCallingCode, isValidPhoneNumber, type Country } from "react-phone-number-input";
import { getCountries } from "react-phone-number-input";
import de from "react-phone-number-input/locale/de";
import en from "react-phone-number-input/locale/en";
import es from "react-phone-number-input/locale/es";
import it from "react-phone-number-input/locale/it";
import { createBooking } from "@/lib/api/booking";
import { Loader2, CheckCircle, XCircle, Heart, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCurrency, type ICurrencyPrice } from "@/contexts/CurrencyContext";
import { footerOneData } from "@/data/footerOneData";
import { PACKAGE_NOT_SURE } from "@/lib/tours/tourKind";
import {
  focusWithComfortableScroll,
  getFirstInvalidBookingField,
} from "@/lib/bookingFormUx";

/** Mirror of the server's express-validator / mongoose bounds. The UI stopping
 *  at the same numbers means the visitor can never build a party size the API
 *  will bounce after they have already filled the whole form. */
const PARTY_LIMITS = { adults: { min: 1, max: 50 }, children: { min: 0, max: 50 }, infants: { min: 0, max: 50 } };
const REQUIREMENTS_MAX = 2000;
const BOOKING_SUPPORT_EMAIL = footerOneData.contact.email.trim();
const BOOKING_COUNTRIES = getCountries();
const PHONE_COUNTRY_LABELS_BY_LANGUAGE: Record<string, Record<string, string>> = {
  de: de as Record<string, string>,
  en: en as Record<string, string>,
  es: es as Record<string, string>,
  it: it as Record<string, string>,
};
const DATE_PICKER_LOCALES = {
  de: dateDe,
  en: dateEn,
  es: dateEs,
  it: dateIt,
} as const;
const NATIONALITY_OPTIONS = BOOKING_COUNTRIES
  .map((code) => ({
    code,
    name: (en as Record<string, string>)[code] || code,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** `react-phone-number-input` intentionally maps a lone `+` to `undefined`
 * because it is not an E.164 number yet. Keep that safe model value while
 * rendering the international prefix in the real input so visitors can type
 * their digits directly after it. */
const InternationalPhoneTextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ value, ...props }, ref) => (
  <input
    {...props}
    ref={ref}
    value={value === undefined || value === null || value === "" ? "+" : value}
  />
));
InternationalPhoneTextInput.displayName = "InternationalPhoneTextInput";

/** A travel date is a calendar day, not an instant in time. Building the value
 *  from local date parts preserves exactly what the visitor selected instead
 *  of letting `toISOString()` shift it to yesterday in positive time zones. */
const toDateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface CounterProps {
  title: string;
  subtitle: string;
  value: number;
  min: number;
  max: number;
  /** ±1 steps. A delta, not a computed next value: the parent applies it with a
   *  functional setState, so rapid clicks inside one React batch each build on
   *  the LATEST count instead of all reusing the render-time value. */
  onDelta: (delta: 1 | -1) => void;
  decreaseLabel: string;
  increaseLabel: string;
}

/** One counter row instead of three hand-copied ones: the clamp, the disabled
 *  states and the screen-reader wiring live in exactly one place. */
const Counter: React.FC<CounterProps> = ({
  title, subtitle, value, min, max, onDelta, decreaseLabel, increaseLabel,
}) => (
  <div className="booking-counter-row">
    <div className="counter-label">
      <span className="counter-title">{title}</span>
      <span className="counter-subtitle">{subtitle}</span>
    </div>
    <div className="counter-controls">
      <button
        type="button"
        className="counter-btn"
        onClick={() => onDelta(-1)}
        disabled={value <= min}
        aria-label={decreaseLabel}
      >
        -
      </button>
      {/* aria-live so the new count is announced; the buttons' text is just
          a glyph, so without this a screen-reader user gets no feedback. */}
      <span className="counter-value" aria-live="polite">{value}</span>
      <button
        type="button"
        className="counter-btn"
        onClick={() => onDelta(1)}
        disabled={value >= max}
        aria-label={increaseLabel}
      >
        +
      </button>
    </div>
  </div>
);

interface BookingFormProps {
  tourId: string;
  /**
   * Starting price, shown at the top of both the desktop card and mobile sheet.
   * Not a plain number — `priceStartingFrom` is a { USD, EUR, GBP } object, so
   * the currency context resolves it.
   */
  price?: number | ICurrencyPrice | null;
  /** True when the tour has real pricing plans, so the price can link to them. */
  hasPricing?: boolean;
  /** The tour's own pricing plan names, in the order the admin arranged them.
   *  The package choice is built from these — never from a fixed list — so a
   *  tour offering two tiers offers exactly two. */
  packageOptions?: string[];
  /** Names the tour in the prefilled WhatsApp message. */
  tourTitle?: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({ tourId, price, hasPricing, tourTitle, packageOptions }) => {
  const { t, i18n } = useTranslation('tours');
  const { formatPrice, getPriceValue, currency } = useCurrency();
  // Resolved through the context rather than a `typeof === 'number'` check: the
  // value arrives as a per-currency object on real tours, so a numeric test
  // silently hid the price on every one of them.
  const resolvedPrice = getPriceValue(price);
  // The wishlist labels live in `common`, alongside the ones the tour cards use,
  // so the same wording appears wherever a tour can be saved.
  const { t: tCommon } = useTranslation('common');
  const { toggleWishlist, isInWishlist } = useWishlist();
  const saved = isInWishlist(tourId);
  const formRef = React.useRef<HTMLFormElement>(null);
  // This form is mounted TWICE on mobile (sidebar + bottom sheet), so bare
  // literal ids collided: invalid HTML, broken label targeting, and autofill
  // writing into the hidden copy. useId gives each instance its own namespace.
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const [startDate, setStartDate] = useState<Date | null>();
  const [endDate, setEndDate] = useState<Date | null>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  /** Seeds the phone field's country from the nationality the visitor picked,
   *  so they are not left dialling the international globe. Only ever a
   *  suggestion: PhoneInput adopts a new `defaultCountry` exclusively while
   *  `!hasUserSelectedACountry && noValueHasBeenEntered`, so the moment the
   *  visitor types digits or picks a country themselves, later nationality
   *  changes stop touching the number. Nationality is not residence and is not
   *  necessarily where the phone is registered — the library's own guard is
   *  what keeps this from overwriting real input. */
  const [phoneCountry, setPhoneCountry] = useState<Country | undefined>(undefined);
  /** The country actually showing in the field, which is NOT always the one
   *  suggested above: the visitor can pick their own from the flag dropdown.
   *  Needed because a country change made through `defaultCountry` goes via
   *  `getDerivedStateFromProps`, which returns `value: undefined` and never
   *  calls `onChange` — so `phone` stays empty even though the input now
   *  renders "+43", and the ghost placeholder would be painted over it.
   *  (Used only to know what is displayed. It cannot serve as a "user touched
   *  it" flag: it fires for programmatic changes too.) */
  const [displayedPhoneCountry, setDisplayedPhoneCountry] = useState<Country | undefined>(undefined);
  /** The plans this tour actually sells, in admin order. */
  const packageChoices = useMemo(
    () => (packageOptions || []).filter(Boolean),
    [packageOptions]
  );
  /** Asked only when there is more than one, so the visitor is never made to
   *  "pick" from a single option. */
  const showPackageChoice = packageChoices.length > 1;
  const [selectedPackage, setSelectedPackage] = useState<string>("");

  /** Gold when the tour sells it, otherwise the first tier. It is the middle
   *  option people are steered toward, so it starts selected rather than
   *  leaving the cheapest tier to look like the recommendation. */
  const defaultPackage = useMemo(() => {
    const gold = packageChoices.find((name) => name.startsWith("GOLD"));
    return gold || packageChoices[0] || "";
  }, [packageChoices]);

  // Keep the selection valid if the tour's plans change under it (locale swap,
  // client-side refetch) — but never overwrite a choice the visitor has made.
  useEffect(() => {
    setSelectedPackage((current) =>
      current && (packageChoices.includes(current) || current === PACKAGE_NOT_SURE)
        ? current
        : defaultPackage
    );
  }, [packageChoices, defaultPackage]);

  /** What the office is told. A single plan — including a day tour's one price
   *  — is reported even though nothing was asked, so staff always know which
   *  rate the enquiry refers to. */
  const effectivePackage =
    packageChoices.length === 0
      ? undefined
      : showPackageChoice
        ? selectedPackage || defaultPackage
        : packageChoices[0];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>("");
  const feedbackRef = useRef<HTMLDivElement>(null);
  const endDatePickerRef = useRef<DatePicker | null>(null);
  /** Tracked so unmounting (the bottom sheet closes) or a quick second submit
   *  cannot leave a stale timer firing setState on a gone component. */
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Built after mount: it needs `window.location.href`, which does not exist on
   *  the server, and an empty value simply hides the button. */
  const [waHref, setWaHref] = useState<string>("");
  const [bookingEmailHref, setBookingEmailHref] = useState<string>("");

  useEffect(() => {
    const digits = (footerOneData?.contact?.phone || '').replace(/[^\d]/g, '');
    const pageUrl = window.location.href;

    if (digits) {
      const message = t("tourDetails.brochure.waMessage", {
        defaultValue: 'Hi! I\'m interested in "{{title}}" ({{url}})',
        title: tourTitle || '',
        url: pageUrl,
      });
      setWaHref(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`);
    } else {
      setWaHref("");
    }

    if (BOOKING_SUPPORT_EMAIL) {
      const subject = t("tourDetails.bookingForm.emailSubject", {
        title: tourTitle || '',
      });
      const body = t("tourDetails.bookingForm.emailBody", {
        title: tourTitle || '',
        url: pageUrl,
      });
      setBookingEmailHref(
        `mailto:${BOOKING_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      );
    } else {
      setBookingEmailHref("");
    }
  }, [tourTitle, t]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  /** Success and API errors render above a long form. Bring that result back to
   * the visitor after submit, including inside the mobile sheet's scroll area. */
  useEffect(() => {
    if (!successMessage && !errors.submit) return;

    const frame = window.requestAnimationFrame(() => {
      focusWithComfortableScroll(feedbackRef.current);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [successMessage, errors.submit]);

  const nationalityOptions = NATIONALITY_OPTIONS;

  const activeLanguage = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
  const datePickerLocale = DATE_PICKER_LOCALES[
    activeLanguage as keyof typeof DATE_PICKER_LOCALES
  ] || DATE_PICKER_LOCALES.en;

  /** Use the phone library's static locale data rather than Intl.DisplayNames.
   *  ICU country names can differ between Node and the browser, which would
   *  make the server-rendered <option> text fail React hydration. */
  const phoneCountryLabels = useMemo(() => {
    const localizedLabels = PHONE_COUNTRY_LABELS_BY_LANGUAGE[activeLanguage]
      || PHONE_COUNTRY_LABELS_BY_LANGUAGE.en;
    const labels: Record<string, string> = { ...localizedLabels };
    for (const code of BOOKING_COUNTRIES) {
      const countryName = labels[code] || (en as Record<string, string>)[code] || code;
      labels[code] = `${countryName} (+${getCountryCallingCode(code)})`;
    }
    labels.country = t("tourDetails.bookingForm.countryCodeLabel", "Country calling code");
    labels.phone = t("tourDetails.bookingForm.mobilePlaceholder", "Mobile *");
    labels.ZZ = t("tourDetails.bookingForm.internationalOption", "International");
    return labels;
  }, [activeLanguage, t]);

  const clearError = (field: string) => {
    setErrors(prev => (prev[field] ? { ...prev, [field]: "" } : prev));
  };

  /** Functional update + clamp in one place per counter. */
  const stepCounter =
    (setter: React.Dispatch<React.SetStateAction<number>>, min: number, max: number) =>
    (delta: 1 | -1) =>
      setter(prev => Math.min(max, Math.max(min, prev + delta)));

  const stepAdults = stepCounter(setAdults, PARTY_LIMITS.adults.min, PARTY_LIMITS.adults.max);
  const stepChildren = stepCounter(setChildren, PARTY_LIMITS.children.min, PARTY_LIMITS.children.max);
  const stepInfants = stepCounter(setInfants, PARTY_LIMITS.infants.min, PARTY_LIMITS.infants.max);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formRef.current) return false;

    const formData = new FormData(formRef.current);
    const name = formData.get('name')?.toString().trim();
    const email = formData.get('email')?.toString().trim();

    if (!name || name.length < 2) {
      newErrors.name = t("tourDetails.bookingForm.validation.name");
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t("tourDetails.bookingForm.validation.email");
    }

    if (!phone || !isValidPhoneNumber(phone)) {
      newErrors.phone = t("tourDetails.bookingForm.validation.phone");
    }

    if (!startDate) {
      newErrors.dateFrom = t("tourDetails.bookingForm.validation.dateFrom");
    }

    if (!endDate) {
      newErrors.dateTo = t("tourDetails.bookingForm.validation.dateTo");
    } else if (startDate && endDate < startDate) {
      // The pickers' minDate only guards the order the fields are FILLED in;
      // picking To first and a later From used to submit an inverted range,
      // and neither the API nor the model checked it — corrupt bookings.
      newErrors.dateTo = t("tourDetails.bookingForm.validation.dateRange");
    }

    if (adults < 1) {
      newErrors.adults = t("tourDetails.bookingForm.validation.adults");
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    if (!isValid) {
      const firstInvalidField = getFirstInvalidBookingField(newErrors);

      if (firstInvalidField) {
        window.requestAnimationFrame(() => {
          focusWithComfortableScroll(
            document.getElementById(fieldId(firstInvalidField))
          );
        });
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");
    if (successTimerRef.current) clearTimeout(successTimerRef.current);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!formRef.current) return;
      const formData = new FormData(formRef.current);
      const data = {
        tour: tourId,
        name: formData.get('name')?.toString().trim() || "",
        email: formData.get('email')?.toString().trim() || "",
        // The phone lives in controlled state; the PhoneInput's inner input has
        // no `name`, so FormData never sees it — state is the only source.
        phone: phone!,
        nationality: formData.get('nationality')?.toString().trim() || "",
        dateFrom: toDateOnly(startDate!),
        dateTo: toDateOnly(endDate!),
        adults,
        children,
        infants,
        requirements: formData.get('requirements')?.toString().trim() || "",
        // Humans cannot reach this field. The server rejects non-empty values;
        // it is not stored and does not affect the idempotency fingerprint.
        website: formData.get('website')?.toString() || "",
        // Only the selected currency crosses the trust boundary. The API reads
        // the authoritative tour price and computes the quote itself; a public
        // caller must never be able to choose the stored quoted amount.
        currency,
        // Which tier the enquiry is about. Sent even when no question was
        // asked, so the office always knows the rate. The server checks it
        // against the tour's real plans — this value is a claim, not a fact.
        ...(effectivePackage ? { selectedPackage: effectivePackage } : {}),
      };

      const response = await createBooking(data);

      if (response.success) {
        // The API message is an English compatibility string. The visitor-facing
        // confirmation must come from the active locale so it cannot override
        // the richer translated guidance (response time + spam folder).
        setSuccessMessage(t("tourDetails.bookingForm.success"));

        // Reset form
        formRef.current.reset();
        setStartDate(null);
        setEndDate(null);
        setAdults(1);
        setChildren(0);
        setInfants(0);
        setPhone(undefined);

        // The confirmation includes important response-time and spam-folder
        // guidance, so keep it visible for a full minute on every screen size.
        successTimerRef.current = setTimeout(() => setSuccessMessage(""), 60_000);
      } else {
        setErrors({ submit: response.error || t("tourDetails.bookingForm.error") });
      }
    } catch (error: any) {
      console.error("Error submitting booking:", error);
      const errorMessage = error.response?.data?.code === 'BOOKING_RATE_LIMITED'
        ? t("tourDetails.bookingForm.validation.rateLimited")
        : error.response?.data?.error ||
          error.response?.data?.errors?.[0]?.msg ||
          t("status.networkError");
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className='tour-listing-details__sidebar__item tour-listing-details__sidebar__item-form wow fadeInUp animated'
      data-wow-delay='0.4s'
      data-wow-duration='1500ms'
    >
      {/* Keep price and intent together in one compact header. The form stays
          reassuringly priced without spending three full rows above Name.
          Two columns: what the card is for on the left, what it costs on the
          right. The secondary "Pricing" link lives under the title rather than
          under the amount — it belongs to the reading path, not to the number,
          and it fills the column's second line instead of ragging the badge. */}
      <div className="booking-card-header">
        <div className="booking-card-header__intent">
          <h2 className='tour-listing-details__sidebar__title'>
            {t("tourDetails.bookingForm.title")}
          </h2>
          {hasPricing && (
            <a className="booking-price-block__link" href="#pricing">
              {t("tourDetails.nav.pricing")}
              <ChevronRight size={13} aria-hidden="true" />
            </a>
          )}
        </div>

        {resolvedPrice > 0 && (
          <div className="booking-price-block">
            {/* "from" rather than "Price starts from": the long label was the
                widest thing in the header and pushed the title onto two lines
                in every locale. Same promise, and it now sits on the amount's
                own baseline where it reads as one phrase. */}
            <span className="booking-price-block__label">
              {t("tourDetails.from", "from")}
            </span>
            <span className="booking-price-block__value">{formatPrice(price)}</span>
            <span className="booking-price-block__unit">
              {t("tourDetails.pricing.perPerson", "per person")}
            </span>
          </div>
        )}
      </div>
      {/* The package row adds a field's worth of height, which pushed the card
          past the viewport on 900px-tall screens and brought back the internal
          scrollbar the layout was tuned to avoid. The tightening is scoped to
          the tours that actually carry the extra row, so day tours keep the
          spacing they were tuned with. */}
      <div className={`booking-form-card${showPackageChoice ? ' booking-form-card--with-package' : ''}`}>
        {/* noValidate: without it the browser's own `required` bubbles fired
            first — in the BROWSER's language — and the localized messages below
            never appeared. Validation still runs in validateForm(), and the
            `required` attributes stay for what they tell assistive tech. */}
        <form
          ref={formRef}
          className='booking-form-inner contact-form-validated'
          onSubmit={handleSubmit}
          noValidate
        >
          {successMessage && (
            <div
              ref={feedbackRef}
              className="booking-message booking-message-success"
              role="status"
              tabIndex={-1}
            >
              <CheckCircle size={20} />
              <span>{successMessage}</span>
            </div>
          )}

          {errors.submit && (
            <div
              ref={feedbackRef}
              className="booking-message booking-message-error"
              role="alert"
              tabIndex={-1}
            >
              <XCircle size={20} />
              <div className="booking-message__content">
                <span>{errors.submit}</span>
                {bookingEmailHref && (
                  <span className="booking-email-fallback">
                    {t("tourDetails.bookingForm.emailFallback")}{" "}
                    <a href={bookingEmailHref}>{BOOKING_SUPPORT_EMAIL}</a>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Honeypot: visually absent and skipped by keyboard/screen readers.
              It is intentionally not required, so human submissions stay
              compatible even when autofill or JavaScript behavior varies. */}
          <div className="booking-honeypot" aria-hidden="true">
            <label htmlFor={fieldId('website')}>Website</label>
            <input
              type="text"
              id={fieldId('website')}
              name="website"
              tabIndex={-1}
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
            />
          </div>

          <div className='booking-form-control'>
            <label htmlFor={fieldId('name')} className="sr-only">
              {t("tourDetails.bookingForm.namePlaceholder")}
            </label>
            <input
              type="text"
              id={fieldId('name')}
              name="name"
              placeholder={t("tourDetails.bookingForm.namePlaceholder")}
              required
              autoComplete="name"
              aria-invalid={!!errors.name}
              onChange={() => clearError('name')}
              className={`booking-input ${errors.name ? 'booking-input-error' : ''}`}
            />
            {errors.name && <span className="booking-error-text" role="alert">{errors.name}</span>}
          </div>

          <div className='booking-form-control'>
            <label htmlFor={fieldId('email')} className="sr-only">
              {t("tourDetails.bookingForm.emailPlaceholder")}
            </label>
            <input
              type="email"
              id={fieldId('email')}
              name="email"
              placeholder={t("tourDetails.bookingForm.emailPlaceholder")}
              required
              autoComplete="email"
              aria-invalid={!!errors.email}
              onChange={() => clearError('email')}
              className={`booking-input ${errors.email ? 'booking-input-error' : ''}`}
            />
            {errors.email && <span className="booking-error-text" role="alert">{errors.email}</span>}
          </div>

          <div className='booking-form-control'>
            <label htmlFor={fieldId('nationality')} className="sr-only">
              {t("tourDetails.bookingForm.nationalityPlaceholder")}
            </label>
            <select
              id={fieldId('nationality')}
              name="nationality"
              className="booking-select"
              autoComplete="country"
              defaultValue=""
              // Stays uncontrolled — the submit path still reads it from
              // FormData. This only mirrors the choice into the phone field.
              onChange={(event) =>
                setPhoneCountry((event.target.value || undefined) as Country | undefined)
              }
            >
              <option value="">{t("tourDetails.bookingForm.nationalityPlaceholder")}</option>
              {nationalityOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className='booking-form-control'>
            <label htmlFor={fieldId('phone')} className="sr-only">
              {t("tourDetails.bookingForm.mobilePlaceholder")}
            </label>
            <div className="phone-input-wrapper">
              <PhoneInput
                international
                defaultCountry={phoneCountry}
                onCountryChange={setDisplayedPhoneCountry}
                id={fieldId('phone')}
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  if (errors.phone) clearError('phone');
                }}
                placeholder={t("tourDetails.bookingForm.mobilePlaceholder")}
                labels={phoneCountryLabels}
                className="booking-phone-input"
                inputComponent={InternationalPhoneTextInput}
                required
                limitMaxLength
                aria-invalid={!!errors.phone}
              />
              {/* Only while the field is truly bare ("+"). Once a calling code
                  is on screen the flag and the code identify the field, and
                  this fixed-offset overlay would sit on top of the digits. */}
              {!phone && !displayedPhoneCountry && (
                <span className="booking-phone-empty-label" aria-hidden="true">
                  {t("tourDetails.bookingForm.mobilePlaceholder")}
                </span>
              )}
            </div>
            {errors.phone && <span className="booking-error-text" role="alert">{errors.phone}</span>}
          </div>

          <div className='booking-form-row'>
            <div className='booking-col-date'>
              <label htmlFor={fieldId('dateFrom')} className="sr-only">
                {t("tourDetails.bookingForm.dateFromPlaceholder")}
              </label>
              <div className="date-input-wrapper">
                <DatePicker
                  id={fieldId('dateFrom')}
                  selected={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    if (errors.dateFrom) clearError('dateFrom');
                    // Keep the pair ordered no matter which field was filled
                    // first: a From beyond the chosen To resets To.
                    if (date && endDate && endDate < date) {
                      setEndDate(null);
                      clearError('dateTo');
                    }
                    // Continue the date-range task without making visitors
                    // find and open the second field themselves.
                    if (date) {
                      window.requestAnimationFrame(() => {
                        endDatePickerRef.current?.setOpen(true);
                      });
                    }
                  }}
                  placeholderText={t("tourDetails.bookingForm.dateFromPlaceholder")}
                  className={`booking-date-input ${errors.dateFrom ? 'booking-input-error' : ''}`}
                  popperClassName="booking-date-popper"
                  popperPlacement="bottom-start"
                  popperProps={{ strategy: "fixed" }}
                  locale={datePickerLocale}
                  dateFormat="P"
                  startDate={startDate}
                  endDate={endDate}
                  selectsStart
                  minDate={new Date()}
                  showDisabledMonthNavigation
                  previousMonthAriaLabel={t("tourDetails.bookingForm.previousMonth", "Previous month")}
                  nextMonthAriaLabel={t("tourDetails.bookingForm.nextMonth", "Next month")}
                  autoComplete="off"
                />
                <i className='icon-calendar' aria-hidden="true"></i>
              </div>
              {errors.dateFrom && <span className="booking-error-text" role="alert">{errors.dateFrom}</span>}
            </div>
            <div className='booking-col-date'>
              <label htmlFor={fieldId('dateTo')} className="sr-only">
                {t("tourDetails.bookingForm.dateToPlaceholder")}
              </label>
              <div className="date-input-wrapper">
                <DatePicker
                  ref={endDatePickerRef}
                  id={fieldId('dateTo')}
                  selected={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    if (errors.dateTo) clearError('dateTo');
                  }}
                  placeholderText={t("tourDetails.bookingForm.dateToPlaceholder")}
                  className={`booking-date-input ${errors.dateTo ? 'booking-input-error' : ''}`}
                  popperClassName="booking-date-popper"
                  popperPlacement="bottom-end"
                  popperProps={{ strategy: "fixed" }}
                  locale={datePickerLocale}
                  dateFormat="P"
                  startDate={startDate}
                  endDate={endDate}
                  selectsEnd
                  minDate={startDate || new Date()}
                  showDisabledMonthNavigation
                  previousMonthAriaLabel={t("tourDetails.bookingForm.previousMonth", "Previous month")}
                  nextMonthAriaLabel={t("tourDetails.bookingForm.nextMonth", "Next month")}
                  autoComplete="off"
                />
                <i className='icon-calendar' aria-hidden="true"></i>
              </div>
              {errors.dateTo && <span className="booking-error-text" role="alert">{errors.dateTo}</span>}
            </div>
          </div>

          {/* Counters */}
          <Counter
            title={t("tourDetails.bookingForm.adults")}
            subtitle={t("tourDetails.bookingForm.adultsSub")}
            value={adults}
            min={PARTY_LIMITS.adults.min}
            max={PARTY_LIMITS.adults.max}
            onDelta={stepAdults}
            decreaseLabel={t("tourDetails.bookingForm.decrease", { field: t("tourDetails.bookingForm.adults") })}
            increaseLabel={t("tourDetails.bookingForm.increase", { field: t("tourDetails.bookingForm.adults") })}
          />

          <Counter
            title={t("tourDetails.bookingForm.children")}
            subtitle={t("tourDetails.bookingForm.childrenSub")}
            value={children}
            min={PARTY_LIMITS.children.min}
            max={PARTY_LIMITS.children.max}
            onDelta={stepChildren}
            decreaseLabel={t("tourDetails.bookingForm.decrease", { field: t("tourDetails.bookingForm.children") })}
            increaseLabel={t("tourDetails.bookingForm.increase", { field: t("tourDetails.bookingForm.children") })}
          />

          <Counter
            title={t("tourDetails.bookingForm.infants")}
            subtitle={t("tourDetails.bookingForm.infantsSub")}
            value={infants}
            min={PARTY_LIMITS.infants.min}
            max={PARTY_LIMITS.infants.max}
            onDelta={stepInfants}
            decreaseLabel={t("tourDetails.bookingForm.decrease", { field: t("tourDetails.bookingForm.infants") })}
            increaseLabel={t("tourDetails.bookingForm.increase", { field: t("tourDetails.bookingForm.infants") })}
          />

          {/* Only when there is a real choice to make. One plan (or a day
              tour's single price) still reaches the office on the booking —
              see `effectivePackage` — but asking the visitor to "choose" from
              a list of one is a question with no answer. */}
          {showPackageChoice && (
            <div className='booking-form-control'>
              <label htmlFor={fieldId('package')} className="booking-field-label">
                {t("tourDetails.bookingForm.packageLabel", "Package")}
              </label>
              <select
                id={fieldId('package')}
                name="selectedPackage"
                className="booking-select"
                value={selectedPackage}
                onChange={(event) => setSelectedPackage(event.target.value)}
              >
                {packageChoices.map((planName) => (
                  <option key={planName} value={planName}>
                    {t(`tourDetails.pricing.${planName.toLowerCase()}`, planName)}
                  </option>
                ))}
                <option value={PACKAGE_NOT_SURE}>
                  {t("tourDetails.bookingForm.packageNotSure", "Not sure — advise me")}
                </option>
              </select>
            </div>
          )}

          <div className='booking-form-control'>
            <label htmlFor={fieldId('requirements')} className="sr-only">
              {t("tourDetails.bookingForm.requirementsPlaceholder")}
            </label>
            <textarea
              id={fieldId('requirements')}
              name="requirements"
              rows={4}
              maxLength={REQUIREMENTS_MAX}
              placeholder={t("tourDetails.bookingForm.requirementsPlaceholder")}
              className="booking-textarea"
            ></textarea>
          </div>

          <button
            type='submit'
            className='booking-submit-btn'
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spinning" />
                {t("tourDetails.bookingForm.submitting")}
              </>
            ) : (
              t("tourDetails.bookingForm.submitBtn")
            )}
          </button>

          {/* Keep both useful secondary actions, but share one row on desktop so
              they do not make the booking card unnecessarily tall. */}
          {(waHref || tourId) && (
            <div className="booking-secondary-actions">
              {/* An <a>, not a button: WhatsApp navigates away from the form. */}
              {waHref && (
                <a
                  className="booking-whatsapp-btn"
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("tourDetails.bookingForm.whatsapp", "Ask on WhatsApp")}
                >
                  <i className="fab fa-whatsapp" aria-hidden="true" />
                  {t("tourDetails.bookingForm.whatsappShort", "WhatsApp")}
                </a>
              )}

              {/* Outside the submit path so saving can never post the form. */}
              {tourId && (
                <button
                  type="button"
                  className="booking-save-btn"
                  onClick={() => toggleWishlist(tourId)}
                  aria-pressed={saved}
                  aria-label={saved ? tCommon("tourCard.savedTour") : tCommon("tourCard.saveTour")}
                >
                  <Heart size={16} fill={saved ? "currentColor" : "none"} />
                  {saved
                    ? t("tourDetails.bookingForm.wishlistedShort", "Saved")
                    : t("tourDetails.bookingForm.wishlistShort", "Wishlist")}
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
