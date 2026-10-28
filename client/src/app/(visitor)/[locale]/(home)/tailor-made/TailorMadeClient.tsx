'use client';
import { submissionFetch } from '@/lib/submissionFetch';
import React, { useState, useEffect, useId, useMemo } from 'react';
import { flushSync } from 'react-dom';
import PhoneInput, {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  type Country,
} from 'react-phone-number-input';
// English names: what is submitted (the admin's records are in English), and
// the fallback for a code the page language's table lacks.
import englishCountryNames from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';
import InternationalPhoneTextInput from '@/components/common/PhoneField/InternationalPhoneTextInput';
import Layout from '@/components/layout/Layout/Layout';
import HeaderOne from '@/components/layout/HeaderOne/HeaderOne';
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from '@/components/layout/FooterOne/FooterOne';
import PageHeader from '@/components/sections/PageHeader/PageHeader';
import Toast, { ToastType } from '@/components/common/Toast/Toast';
import { API_ENDPOINTS } from '@/config/api';
import { waHref, PHONE_DISPLAY } from '@/config/contact';
import { localizeInternalUrl } from '@/lib/url';
import {
  MapPin, Calendar, Users, Heart, Star, Clock, Wallet, Compass,
  CheckCircle, Sparkles, Award, Phone, Mail, User, Loader2, type LucideIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import HeaderOneCloned from '@/components/layout/HeaderOneCloned/HeaderOneCloned';
import { DATE_FIELDS, submissionOutcome, type SubmitResponse } from './submissionOutcome';
import './tailorMade.css';

type TailorMadeFormData = {
  fullName: string;
  email: string;
  phone: string;
  country: string;

  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  duration: string;
  accommodation: string;
  adults: number;
  children: number;
  infants: number;

  minBudget: string;
  maxBudget: string;
  specialOccasion: string;
  interests: string[];

  dietary: string;
  mobility: string;
  comments: string;
  /** The spam trap: hidden, so only a bot fills it, and the API then refuses
   *  the request. Sent empty with every request, as on the tour booking form. */
  website: string;
};

const createInitialFormData = (): TailorMadeFormData => ({
  fullName: '',
  email: '',
  phone: '',
  country: '',

  startMonth: '',
  startYear: '',
  endMonth: '',
  endYear: '',
  duration: '',
  accommodation: '',
  adults: 2,
  children: 0,
  infants: 0,

  minBudget: '',
  maxBudget: '',
  specialOccasion: '',
  interests: [],

  dietary: '',
  mobility: '',
  comments: '',
  website: '',
});

/** The English names are what the API accepts (an enum on the server); each
 *  language shows its own, under `form.options.months.<name in lower case>`. */
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const YEARS = Array.from({ length: 6 }, (_, index) => String(new Date().getFullYear() + index));

/*
 * Every country with a telephone numbering plan (245, the phone field's own
 * list — the same as the tour booking form's), by ISO code. The form holds the
 * code, so choosing a country of residence also suggests its calling code; it
 * submits the English name, as the eight-name list before it did. The main
 * markets stay on top, then the whole list in the page's language.
 */
const RESIDENCE_COUNTRIES = getCountries();
const POPULAR_COUNTRIES: Country[] = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES'];
const ENGLISH_COUNTRY_NAMES = englishCountryNames as Record<string, string>;

/** Alphabetical order without the ICU collator, whose tables differ between
 *  Node and browsers: the server and the browser must list the countries in
 *  the same order or React rejects the server HTML. Accents fold into their
 *  letter ("Ägypten" sorts with A). */
const countrySortKey = (name: string) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** `value` is what the API accepts (English, an enum on the server); `key`
 *  names its translation, as for the occasions and interests below. */
const ACCOMMODATION_OPTIONS = [
  { value: 'Luxury Hotels (5 Star)', key: 'luxury' },
  { value: 'Premium Hotels (4 Star)', key: 'premium' },
  { value: 'Standard Hotels (3 Star)', key: 'standard' },
  { value: 'Mix of Categories', key: 'mixed' },
];

const MIN_BUDGET_OPTIONS = ['$500', '$1,000', '$1,500', '$2,000', '$3,000', '$5,000+'];

const MAX_BUDGET_OPTIONS = ['$1,000', '$2,000', '$3,000', '$5,000', '$10,000', 'No Limit'];

/** `value` is what the API accepts (English, an enum on the server); `key`
 *  names its translation, so German, Italian and Spanish visitors read their
 *  own language instead of the English values. */
const SPECIAL_OCCASION_OPTIONS = [
  { value: 'Honeymoon', key: 'honeymoon' },
  { value: 'Anniversary', key: 'anniversary' },
  { value: 'Birthday Celebration', key: 'birthday' },
  { value: 'Family Reunion', key: 'familyReunion' },
  { value: 'Retirement Trip', key: 'retirement' },
  { value: 'Other Celebration', key: 'otherCelebration' },
];

const INTEREST_OPTIONS = [
  { value: 'Ancient Sites & Temples', key: 'ancientSites' },
  { value: 'Nile River Cruise', key: 'nileCruise' },
  { value: 'Museums & Culture', key: 'museumsCulture' },
  { value: 'Desert Safari', key: 'desertSafari' },
  { value: 'Red Sea & Beaches', key: 'redSea' },
  { value: 'Local Cuisine', key: 'localCuisine' },
  { value: 'Photography Tours', key: 'photography' },
  { value: 'Adventure Activities', key: 'adventure' },
];

const FEATURE_CARDS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: MapPin, title: 'Personalized Itinerary', text: 'Custom-designed journeys based on your preferences' },
  { icon: Users, title: 'Expert Team', text: 'Professional travel specialists with local expertise' },
  { icon: Clock, title: '24/7 Support', text: 'Round-the-clock assistance throughout your journey' },
  { icon: Award, title: 'Award Winning', text: 'TripAdvisor Excellence' },
];

const TRAVELER_COUNTERS: Array<{ key: 'adults' | 'children' | 'infants'; label: string; meta?: string; required?: boolean }> = [
  { key: 'adults', label: 'Adults', required: true },
  { key: 'children', label: 'Children', meta: '(6-12 years)' },
  { key: 'infants', label: 'Infants', meta: '(1-6 years)' },
];

const SIDEBAR_FEATURES = [
  'Personal Travel Consultant',
  '24/7 Travel Support',
  'Free Consultation',
  'Completely Customizable',
  'Best Price Guarantee',
  'Handpicked Experiences',
];

const SUBMIT_INFO_CARDS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: Clock,
    title: 'Quick Response',
    text: 'Our travel specialists will contact you within 24 hours',
  },
  {
    icon: CheckCircle,
    title: 'Personalized Itinerary',
    text: 'Receive a custom proposal tailored to your preferences',
  },
];

/** What the API accepts as a phone number: "+", then 7 to 15 digits. */
const E164_PHONE = /^\+[1-9]\d{6,14}$/;

/** The fields that can carry a message, in the order they appear: after a
 *  failed submit the first one with a message takes the focus. */
const FIELD_ORDER = ['fullName', 'email', 'phone', 'country', 'startMonth', 'startYear', 'endMonth', 'endYear', 'maxBudget', 'comments'];

interface TailorMadePageProps {
  /** Country names in the page's language (page.tsx); absent on English pages. */
  countryNames?: Record<string, string>;
}

const TailorMadePage: React.FC<TailorMadePageProps> = ({ countryNames }) => {
  const params = useParams() as { locale: string };
  const { t, i18n } = useTranslation('tailorMade');
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  const countryName = useMemo(() => {
    const names = countryNames ?? ENGLISH_COUNTRY_NAMES;
    return (code: string) => names[code] || ENGLISH_COUNTRY_NAMES[code] || code;
  }, [countryNames]);

  /** The main markets first, then every other country alphabetically — each
   *  country once, in the same order as the phone field's calling codes. */
  const countryOptions = useMemo(() => {
    const popular = new Set<string>(POPULAR_COUNTRIES);
    const rest = RESIDENCE_COUNTRIES.filter((code) => !popular.has(code))
      .map((code) => ({ code, name: countryName(code) }))
      .sort((a, b) => {
        const x = countrySortKey(a.name);
        const y = countrySortKey(b.name);
        return x < y ? -1 : x > y ? 1 : 0;
      });
    return [...POPULAR_COUNTRIES.map((code) => ({ code, name: countryName(code) })), ...rest];
  }, [countryName]);

  /** The phone field's calling-code list: "Deutschland (+49)" in the page's
   *  language, as on the tour booking form. */
  const phoneLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const code of RESIDENCE_COUNTRIES) {
      labels[code] = `${countryName(code)} (+${getCountryCallingCode(code)})`;
    }
    labels.country = t('form.labels.countryCode');
    labels.phone = t('form.fields.phone');
    labels.ZZ = t('form.labels.international');
    return labels;
  }, [countryName, t]);

  /** The country the phone field is showing — the one suggested by the
   *  country of residence, or the visitor's own pick from its list. Only used
   *  to hide the empty-field hint once a calling code is on screen. */
  const [displayedPhoneCountry, setDisplayedPhoneCountry] = useState<Country | undefined>(undefined);

  useEffect(() => {
    if (params?.locale && i18n.resolvedLanguage !== params.locale) {
      i18n.changeLanguage(params.locale);
    }
  }, [params?.locale, i18n]);
  const [formData, setFormData] = useState<TailorMadeFormData>(() => createInitialFormData());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  // The same message, for screen readers: a live region that is always on the
  // page (one that mounts with its text, like the toast, is not reliably read).
  const [announcement, setAnnouncement] = useState('');

  /** A field's message and invalid state, for its aria attributes. */
  const errorId = (name: string) => fieldId(`${name}-error`);
  const invalidProps = (name: string, describedBy = errorId(name)) =>
    errors[name] ? { 'aria-invalid': true, 'aria-describedby': describedBy } : {};
  const dateMessages = Array.from(new Set(DATE_FIELDS.map((name) => errors[name]).filter(Boolean)));

  const showFeedback = (message: string, type: ToastType) => {
    setToast({ message, type });
    // Emptied first, so the same message twice in a row is read again.
    setAnnouncement('');
    window.setTimeout(() => setAnnouncement(message), 50);
  };

  /** Shows the messages, then moves to the first field that has one. */
  const showErrors = (found: Record<string, string>, summary: string) => {
    // flushSync: the messages (the targets of aria-describedby) must be in the
    // DOM before the focus moves, or a screen reader reads the field without them.
    flushSync(() => setErrors(found));
    const first = FIELD_ORDER.find((name) => found[name]);
    const field = first ? document.getElementById(fieldId(first)) : null;
    if (field) {
      // Centred, so the sticky header cannot cover it.
      field.scrollIntoView({ block: 'center' });
      field.focus({ preventScroll: true });
    }
    showFeedback(summary, 'error');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // A field's message goes once it is edited. The date lists share theirs,
    // and the budget range's sits on the maximum but is about both ends.
    const cleared = DATE_FIELDS.includes(name) ? DATE_FIELDS : [name === 'minBudget' ? 'maxBudget' : name];
    if (cleared.some((key) => errors[key])) {
      setErrors(prev => {
        const next = { ...prev };
        for (const key of cleared) delete next[key];
        return next;
      });
    }
  };

  // The library gives an E.164 number ("+4915112345678"), or undefined while
  // the field holds only a calling code.
  const handlePhoneChange = (value?: string) => {
    setFormData(prev => ({ ...prev, phone: value ?? '' }));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
  };

  const handleCheckboxChange = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleNumberChange = (field: 'adults' | 'children' | 'infants', increment: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.min(50, Math.max(field === 'adults' ? 1 : 0, prev[field] + (increment ? 1 : -1)))
    }));
  };

  /** Every problem with the form, by field: empty when it can be sent. The
   *  form has `noValidate`, so these messages, in the page's language, are
   *  what visitors see — not the browser's, one field at a time. */
  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Personal Information
    if (!formData.fullName.trim()) {
      newErrors.fullName = t('form.errors.fullNameRequired');
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = t('form.errors.nameMinLength');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('form.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = t('form.errors.invalidEmail');
    }

    // Optional, but a number we could not dial is worse than none. The
    // library's own check lets 6- to 19-digit numbers through; the API takes
    // E.164's 7 to 15.
    if (formData.phone && (!isValidPhoneNumber(formData.phone) || !E164_PHONE.test(formData.phone))) {
      newErrors.phone = t('form.errors.invalidPhone');
    }

    if (!formData.country) {
      newErrors.country = t('form.errors.countryRequired');
    }

    // Travel Details
    if (!formData.startMonth) {
      newErrors.startMonth = t('form.errors.startMonthRequired');
    }
    if (!formData.startYear) {
      newErrors.startYear = t('form.errors.startYearRequired');
    }
    if (!formData.endMonth) {
      newErrors.endMonth = t('form.errors.endMonthRequired');
    }
    if (!formData.endYear) {
      newErrors.endYear = t('form.errors.endYearRequired');
    }

    if (formData.adults < 1) {
      newErrors.adults = t('form.errors.adultRequired');
    }

    // Special Requirements
    if (!formData.comments.trim()) {
      newErrors.comments = t('form.errors.commentsRequired');
    } else if (formData.comments.trim().length > 2000) {
      newErrors.comments = t('form.errors.commentsMaxLength');
    }

    // A range is about both ends of a date: the month and the year are marked
    // together, and the end is only compared with a complete start.
    const monthValue = (month: string, year: string) => Number(year) * 12 + MONTHS.indexOf(month);
    const now = new Date();
    const start = monthValue(formData.startMonth, formData.startYear);
    const end = monthValue(formData.endMonth, formData.endYear);
    const startChosen = formData.startMonth && formData.startYear;
    if (startChosen && start < now.getFullYear() * 12 + now.getMonth()) {
      newErrors.startMonth = newErrors.startYear = t('form.errors.travelRange');
    }
    if (startChosen && formData.endMonth && formData.endYear && end < start) {
      newErrors.endMonth = newErrors.endYear = t('form.errors.travelRange');
    }
    const amount = (value: string) => Number(value.replace(/[$,+]/g, ''));
    if (formData.minBudget && formData.maxBudget && formData.maxBudget !== 'No Limit' && amount(formData.minBudget) > amount(formData.maxBudget)) newErrors.maxBudget = t('form.errors.budgetRange');
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const found = validateForm();
    if (Object.keys(found).length > 0) {
      showErrors(found, t('form.errors.fillAllFields'));
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await submissionFetch(API_ENDPOINTS.TAILOR_MADE.BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // The form holds the ISO code; the request keeps the English name.
          country: ENGLISH_COUNTRY_NAMES[formData.country] || formData.country,
          locale: params.locale,
        }),
      });

      // Read defensively: the site-wide rate limiter answers in plain text.
      const data = (await response.json().catch(() => null)) as SubmitResponse | null;
      const outcome = submissionOutcome(response.status, data);

      if (outcome.type === 'success') {
        showFeedback(t('form.success.requestSubmitted'), 'success');
        setFormData(createInitialFormData());
      } else if (Object.keys(outcome.fields).length > 0) {
        const rejected: Record<string, string> = {};
        for (const [field, key] of Object.entries(outcome.fields)) rejected[field] = t(key);
        showErrors(rejected, t(outcome.message));
      } else {
        showFeedback(t(outcome.message), 'error');
      }
    } catch (error) {
      // No answer at all: offline, blocked, or the 20-second timeout.
      console.error('Error submitting form:', error);
      showFeedback(t('form.errors.networkError'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          closeLabel={t('form.labels.closeNotification')}
        />
      )}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      <TopbarOne />
      <HeaderOne />
      <HeaderOneCloned />
      {/* No subtitle: it was the breadcrumb's "Tailor-Made" a third time. */}
      <PageHeader
        title={t('pageTitle')}
        breadcrumbLabelKey="pageNames.tailorMade"
      />

      <section className="tailor-made-section">
        <div className="container">
          {/* Hero Section */}
          <div className="tailor-made-hero">
            <div className="tailor-made-hero__content">
              <h2 className="tailor-made-hero__title">
                {t('hero.title')}
              </h2>
              <p className="tailor-made-hero__subtitle">
                {t('hero.subtitle')}
              </p>
            </div>

            {/* Features Grid */}
            <div className="tailor-made-features">
              {FEATURE_CARDS.map((feature, idx) => {
                const Icon = feature.icon;
                const featureKeys = ['personalizedItinerary', 'expertTeam', 'alwaysSupport', 'awardWinning'];
                const fKey = featureKeys[idx];
                return (
                  <div className="feature-card" key={idx}>
                    <div className="feature-card__icon">
                      <Icon size={32} />
                    </div>
                    <h3 className="feature-card__title">{t(`features.${fKey}.title`)}</h3>
                    <p className="feature-card__text">{t(`features.${fKey}.text`)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Section */}
          <div className="tailor-made-content-wrapper">
          <div className="tailor-made-form-wrapper">
            <div className="tailor-made-form-header">
              <h2 className="form-header-title">{t('form.header.title')}</h2>
              <p className="form-header-subtitle">
                {t('form.header.subtitle')}
              </p>
            </div>

            {/* noValidate: the form's own messages, in the page's language and
                for every field at once, instead of the browser's bubble. Text
                fields keep `required`, which screen readers announce; the
                lists take aria-required — Chrome does not expose `required` on
                a select, and an empty required one read as invalid on load. */}
            <form onSubmit={handleSubmit} className="tailor-made-form" noValidate>
              {/* Step 1: Personal Information */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="step-number" aria-hidden="true">1</span>
                  <h3 className="form-section-title">{t('form.steps.1')}</h3>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor={fieldId('fullName')}>
                      <User size={18} />
                      {t('form.fields.fullName')} <span className="required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={fieldId('fullName')}
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      autoComplete="name"
                      maxLength={100}
                      {...invalidProps('fullName')}
                      className={`form-input ${errors.fullName ? 'form-input--error' : ''}`}
                      placeholder={t('form.placeholders.fullName')}
                      required
                    />
                    {errors.fullName && <span className="form-error" id={errorId('fullName')}>{errors.fullName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor={fieldId('email')}>
                      <Mail size={18} />
                      {t('form.fields.email')} <span className="required" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={fieldId('email')}
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      autoComplete="email"
                      {...invalidProps('email')}
                      className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                      placeholder={t('form.placeholders.email')}
                      required
                    />
                    {errors.email && <span className="form-error" id={errorId('email')}>{errors.email}</span>}
                  </div>

                  {/* Calling code + number, as on the tour booking form: a flag
                      and code list in the page's language, the number checked
                      for that country. The country of residence suggests the
                      code until the visitor picks one or starts typing (the
                      library only adopts a new defaultCountry while the field
                      is untouched). */}
                  <div className="form-group">
                    <label className="form-label" htmlFor={fieldId('phone')}>
                      <Phone size={18} />
                      {t('form.fields.phone')}
                    </label>
                    <div className="tm-phone-field">
                      <PhoneInput
                        international
                        id={fieldId('phone')}
                        defaultCountry={(formData.country || undefined) as Country | undefined}
                        onCountryChange={setDisplayedPhoneCountry}
                        value={formData.phone || undefined}
                        onChange={handlePhoneChange}
                        labels={phoneLabels}
                        countryOptionsOrder={['🌐', ...POPULAR_COUNTRIES, '...']}
                        inputComponent={InternationalPhoneTextInput}
                        limitMaxLength
                        autoComplete="tel"
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? errorId('phone') : undefined}
                        className={`tm-phone-input ${errors.phone ? 'tm-phone-input--error' : ''}`}
                      />
                      {/* Only while the field shows a bare "+": once a calling
                          code is on screen, the flag and code say it all. */}
                      {!formData.phone && !displayedPhoneCountry && (
                        <span className="tm-phone-empty-label" aria-hidden="true">
                          {t('form.placeholders.phone')}
                        </span>
                      )}
                    </div>
                    {/* Messages are not alerts: after a failed submit the focus
                        moves to the first field with one, which reads it out
                        through aria-describedby. */}
                    {errors.phone && (
                      <span className="form-error" id={errorId('phone')}>
                        {errors.phone}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor={fieldId('country')}>
                      <MapPin size={18} />
                      {t('form.fields.country')} <span className="required" aria-hidden="true">*</span>
                    </label>
                    <select
                      id={fieldId('country')}
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      autoComplete="country"
                      {...invalidProps('country')}
                      className={`form-select ${errors.country ? 'form-input--error' : ''}`}
                      aria-required="true"
                    >
                      <option value="">{t('form.placeholders.country')}</option>
                      {countryOptions.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.country && <span className="form-error" id={errorId('country')}>{errors.country}</span>}
                  </div>
                </div>
              </div>

              {/* Step 2: Travel Details */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="step-number" aria-hidden="true">2</span>
                  <h3 className="form-section-title">{t('form.steps.2')}</h3>
                </div>

                <div className="form-grid">
                  {/* Four lists under one heading: each is named on its own
                      ("Start month"…), and they share one message area, styled
                      like every other field's, for the dates' messages. */}
                  <div className="form-group form-group--full" role="group" aria-labelledby={fieldId('dates-label')}>
                    <span className="form-label" id={fieldId('dates-label')}>
                      <Calendar size={18} />
                      {t('form.fields.travelDates')} <span className="required" aria-hidden="true">*</span>
                    </span>
                    <div className="date-range-wrapper">
                      <div className="date-select-group">
                        <select id={fieldId('startMonth')} name="startMonth" value={formData.startMonth} onChange={handleInputChange} aria-label={t('form.labels.startMonth')} {...invalidProps('startMonth', errorId('dates'))} className={`form-select ${errors.startMonth ? 'form-input--error' : ''}`} aria-required="true">
                          <option value="">{t('form.placeholders.month')}</option>
                          {MONTHS.map(month => <option key={month} value={month}>{t(`form.options.months.${month.toLowerCase()}`, { defaultValue: month })}</option>)}
                        </select>
                        <select id={fieldId('startYear')} name="startYear" value={formData.startYear} onChange={handleInputChange} aria-label={t('form.labels.startYear')} {...invalidProps('startYear', errorId('dates'))} className={`form-select ${errors.startYear ? 'form-input--error' : ''}`} aria-required="true">
                          <option value="">{t('form.placeholders.year')}</option>
                          {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                      </div>
                      <span className="date-separator" aria-hidden="true">{t('form.labels.to')}</span>
                      <div className="date-select-group">
                        <select id={fieldId('endMonth')} name="endMonth" value={formData.endMonth} onChange={handleInputChange} aria-label={t('form.labels.endMonth')} {...invalidProps('endMonth', errorId('dates'))} className={`form-select ${errors.endMonth ? 'form-input--error' : ''}`} aria-required="true">
                          <option value="">{t('form.placeholders.month')}</option>
                          {MONTHS.map(month => <option key={month} value={month}>{t(`form.options.months.${month.toLowerCase()}`, { defaultValue: month })}</option>)}
                        </select>
                        <select id={fieldId('endYear')} name="endYear" value={formData.endYear} onChange={handleInputChange} aria-label={t('form.labels.endYear')} {...invalidProps('endYear', errorId('dates'))} className={`form-select ${errors.endYear ? 'form-input--error' : ''}`} aria-required="true">
                          <option value="">{t('form.placeholders.year')}</option>
                          {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                      </div>
                    </div>
                    {dateMessages.length > 0 && (
                      <div id={errorId('dates')}>
                        {dateMessages.map((message) => <span className="form-error" key={message}>{message}</span>)}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor={fieldId('duration')}>
                      <Clock size={18} />
                      {t('form.fields.duration')}
                    </label>
                    <input
                      id={fieldId('duration')}
                      type="text"
                      maxLength={100}
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder={t('form.placeholders.duration')}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor={fieldId('accommodation')}>
                      <Star size={18} />
                      {t('form.fields.accommodation')}
                    </label>
                    <select
                      id={fieldId('accommodation')}
                      name="accommodation"
                      value={formData.accommodation}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">{t('form.placeholders.accommodation')}</option>
                      {ACCOMMODATION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {t(`form.options.accommodation.${o.key}`, { defaultValue: o.value })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group form-group--full" role="group" aria-labelledby={fieldId('travelers-label')}>
                    <span className="form-label" id={fieldId('travelers-label')}>
                      <Users size={18} />
                      {t('form.fields.travelers')}
                    </span>
                    <div className="travelers-grid">
                      {TRAVELER_COUNTERS.map((tItem) => {
                        const label = t(`form.labels.${tItem.key}`);
                        return (
                          <div className="traveler-counter" key={tItem.key} role="group" aria-labelledby={fieldId(`${tItem.key}-label`)}>
                            {/* The name and its asterisk in one line (as flex
                                items of their own they were stacked), the ages below. */}
                            <span className="traveler-label" id={fieldId(`${tItem.key}-label`)}>
                              <span>
                                {label}
                                {tItem.required ? <> <span className="required" aria-hidden="true">*</span></> : null}
                              </span>
                              {tItem.meta ? <span className="age-label">{t(`form.labels.${tItem.key}Age`, { defaultValue: tItem.meta })}</span> : null}
                            </span>
                            <div className="counter-controls">
                              <button type="button" onClick={() => handleNumberChange(tItem.key, false)} className="counter-btn" aria-label={t('form.labels.decreaseCount', { label })}>-</button>
                              {/* Read out after each press: "3 Adults". */}
                              <span className="counter-value" aria-live="polite" aria-atomic="true">
                                {formData[tItem.key]}
                                <span className="sr-only"> {label}</span>
                              </span>
                              <button type="button" onClick={() => handleNumberChange(tItem.key, true)} className="counter-btn" aria-label={t('form.labels.increaseCount', { label })}>+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Travel Preferences */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="step-number" aria-hidden="true">3</span>
                  <h3 className="form-section-title">{t('form.steps.3')}</h3>
                </div>

                <div className="form-grid">
                  {/* The two ends' first options were the keys
                      form.placeholders.minBudget / maxBudget, which no
                      language file had: visitors read the raw key names.
                      They are the fields' own names now, and each select is
                      named by them for assistive technology. */}
                  <div className="form-group" role="group" aria-labelledby={fieldId('budget-label')}>
                    <span className="form-label" id={fieldId('budget-label')}>
                      <Wallet size={18} />
                      {t('form.fields.budgetRange')}
                    </span>
                    <div className="budget-selects">
                      <select
                        id={fieldId('minBudget')}
                        name="minBudget"
                        value={formData.minBudget}
                        onChange={handleInputChange}
                        aria-label={t('form.fields.minBudget')}
                        className="form-select"
                      >
                        <option value="">{t('form.fields.minBudget')}</option>
                        {MIN_BUDGET_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      <select
                        id={fieldId('maxBudget')}
                        name="maxBudget"
                        value={formData.maxBudget}
                        onChange={handleInputChange}
                        aria-label={t('form.fields.maxBudget')}
                        {...invalidProps('maxBudget', fieldId('budget-error'))}
                        className={`form-select ${errors.maxBudget ? 'form-input--error' : ''}`}
                      >
                        <option value="">{t('form.fields.maxBudget')}</option>
                        {MAX_BUDGET_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b === 'No Limit' ? t('form.options.noLimit') : b}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Under the fields it is about (it used to show beside
                        the submit button, far from them). */}
                    {errors.maxBudget && (
                      <span className="form-error" id={fieldId('budget-error')}>
                        {errors.maxBudget}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor={fieldId('specialOccasion')}>
                      <Heart size={18} />
                      {t('form.fields.specialOccasions')}
                    </label>
                    <select
                      id={fieldId('specialOccasion')}
                      name="specialOccasion"
                      value={formData.specialOccasion}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">{t('form.placeholders.specialOccasion')}</option>
                      {SPECIAL_OCCASION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {t(`form.options.specialOccasions.${o.key}`, { defaultValue: o.value })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group form-group--full" role="group" aria-labelledby={fieldId('interests-label')}>
                    <span className="form-label" id={fieldId('interests-label')}>
                      <Compass size={18} />
                      {t('form.fields.interestsActivities')}
                    </span>
                    <div className="interests-grid">
                      {INTEREST_OPTIONS.map(interest => (
                        <label key={interest.value} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.interests.includes(interest.value)}
                            onChange={() => handleCheckboxChange(interest.value)}
                            className="checkbox-input"
                          />
                          <span className="checkbox-text">
                            {t(`form.options.interests.${interest.key}`, { defaultValue: interest.value })}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Special Requirements */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="step-number" aria-hidden="true">4</span>
                  <h3 className="form-section-title">{t('form.steps.4')}</h3>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor={fieldId('dietary')}>{t('form.fields.dietaryRequirements')}</label>
                    <input
                      id={fieldId('dietary')}
                      type="text"
                      maxLength={500}
                      name="dietary"
                      value={formData.dietary}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder={t('form.placeholders.dietary')}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor={fieldId('mobility')}>{t('form.fields.mobilityRequirements')}</label>
                    <input
                      id={fieldId('mobility')}
                      type="text"
                      maxLength={500}
                      name="mobility"
                      value={formData.mobility}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder={t('form.placeholders.mobility')}
                    />
                  </div>

                  <div className="form-group form-group--full">
                    <label className="form-label" htmlFor={fieldId('comments')}>
                      {t('form.fields.additionalComments')} <span className="required" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id={fieldId('comments')}
                      name="comments"
                      value={formData.comments}
                      onChange={handleInputChange}
                      {...invalidProps('comments')}
                      className={`form-textarea ${errors.comments ? 'form-input--error' : ''}`}
                      rows={6}
                      placeholder={t('form.placeholders.comments')}
                      required
                    />
                    {errors.comments && <span className="form-error" id={errorId('comments')}>{errors.comments}</span>}
                  </div>

                  {/* Spam trap, as on the tour booking form: out of sight, the
                      keyboard and screen readers. Kept inside this step, not
                      before the submit box, whose spacing rule needs this step
                      right in front of it. Never required. */}
                  <div className="booking-honeypot" aria-hidden="true">
                    <label htmlFor={fieldId('website')}>Website</label>
                    <input
                      type="text"
                      id={fieldId('website')}
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      tabIndex={-1}
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-submit-wrapper">
                {/* aria-disabled, not disabled, while sending: a disabled
                    button drops the keyboard focus to the page, so after the
                    answer the visitor started again from the top. A second
                    press is ignored by handleSubmit. */}
                <button type="submit" className="form-submit-btn" aria-disabled={isSubmitting || undefined}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="spinner" aria-hidden="true" />
                      {t('form.buttons.submitting')}
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} aria-hidden="true" />
                      {t('form.buttons.submit')}
                    </>
                  )}
                </button>
                {/* What the privacy policy says about requests, before they are
                    sent. It opens in a new tab: following it must not cost the
                    visitor the form they have filled in. */}
                <p className="form-privacy-note">
                  {t('form.privacy.note')}{' '}
                  <a href={localizeInternalUrl('/privacy-policy', params?.locale)} target="_blank" rel="noopener noreferrer">
                    {t('form.privacy.linkLabel')}
                    <span className="sr-only"> {t('form.privacy.newTab')}</span>
                  </a>
                  .
                </p>
                <div className="form-submit-info">
                  {SUBMIT_INFO_CARDS.map((card, idx) => {
                    const Icon = card.icon;
                    const infoKeys = ['quickResponse', 'personalizedItinerary'];
                    const iKey = infoKeys[idx];
                    return (
                      <div className="submit-info-card" key={idx}>
                        <Icon size={18} />
                        <div className="submit-info-text">
                          <strong>{t(`submitInfo.${iKey}.title`)}</strong>
                          <span>{t(`submitInfo.${iKey}.text`)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="tailor-made-sidebar">
            <div className="sidebar-card">
              <h3 className="sidebar-card__title">
                <Sparkles size={24} />
                {t('sidebar.whyChooseUs.title')}
              </h3>
              <ul className="sidebar-features">
                {SIDEBAR_FEATURES.map((text, idx) => (
                  <li className="sidebar-feature" key={idx}>
                    <CheckCircle size={20} />
                    <span>{t(`sidebar.whyChooseUs.features.${idx}`, { defaultValue: text })}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sidebar-card sidebar-card--contact">
              <h3 className="sidebar-card__title">
                <Phone size={24} />
                {t('sidebar.needHelp.title')}
              </h3>
              <p className="sidebar-card__subtitle">{t('sidebar.needHelp.subtitle')}</p>
              <div className="sidebar-contact">
                {/* A new tab, like the site's floating WhatsApp button: in the
                    same tab the visitor left the page and lost the form. */}
                <a href={waHref()} className="sidebar-contact__item" target="_blank" rel="noopener noreferrer">
                  <Phone size={18} />
                  <span>{PHONE_DISPLAY}</span>
                  <span className="sr-only"> {t('sidebar.needHelp.whatsappNewTab')}</span>
                </a>
                <a href="mailto:info@jesegypttours.com" className="sidebar-contact__item">
                  <Mail size={18} />
                  <span>info@jesegypttours.com</span>
                </a>
              </div>
              <p className="sidebar-card__note">
                <Clock size={16} />
                {t('sidebar.needHelp.note')}
              </p>
            </div>
          </div>
          </div>
        </div>
      </section>

      <FooterOne />
    </Layout>
  );
};

export default TailorMadePage;
