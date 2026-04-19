'use client';
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout/Layout';
import HeaderOne from '@/components/layout/HeaderOne/HeaderOne';
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from '@/components/layout/FooterOne/FooterOne';
import PageHeader from '@/components/sections/PageHeader/PageHeader';
import Toast, { ToastType } from '@/components/common/Toast/Toast';
import { API_ENDPOINTS } from '@/config/api';
import { 
  MapPin, Calendar, Users, Heart, Star, Clock, 
  CheckCircle, Sparkles, Award, Phone, Mail, User, Loader2, type LucideIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import HeaderOneCloned from '@/components/layout/HeaderOneCloned/HeaderOneCloned';
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
});

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

const YEARS = ['2025', '2026', '2027'];

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Other',
];

const ACCOMMODATION_OPTIONS = [
  'Luxury Hotels (5 Star)',
  'Premium Hotels (4 Star)',
  'Standard Hotels (3 Star)',
  'Mix of Categories',
];

const MIN_BUDGET_OPTIONS = ['$500', '$1,000', '$1,500', '$2,000', '$3,000', '$5,000+'];

const MAX_BUDGET_OPTIONS = ['$1,000', '$2,000', '$3,000', '$5,000', '$10,000', 'No Limit'];

const SPECIAL_OCCASION_OPTIONS = [
  'Honeymoon',
  'Anniversary',
  'Birthday Celebration',
  'Family Reunion',
  'Retirement Trip',
  'Other Celebration',
];

const INTEREST_OPTIONS = [
  'Ancient Sites & Temples',
  'Nile River Cruise',
  'Museums & Culture',
  'Desert Safari',
  'Red Sea & Beaches',
  'Local Cuisine',
  'Photography Tours',
  'Adventure Activities',
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

const TailorMadePage: React.FC = () => {
  const params = useParams() as { locale: string };
  const { t, i18n } = useTranslation('tailorMade');
  
  useEffect(() => {
    if (params?.locale && i18n.resolvedLanguage !== params.locale) {
      i18n.changeLanguage(params.locale);
    }
  }, [params?.locale, i18n]);
  const [formData, setFormData] = useState<TailorMadeFormData>(() => createInitialFormData());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      [field]: Math.max(0, prev[field] + (increment ? 1 : -1))
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Personal Information
    if (!formData.fullName.trim()) {
      newErrors.fullName = t('form.errors.fullNameRequired');
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = t('form.errors.nameMinLength');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('form.errors.emailRequired');
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = t('form.errors.invalidEmail');
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setToast({
        message: t('form.errors.fillAllFields'),
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(API_ENDPOINTS.TAILOR_MADE.BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToast({
          message: data.message || t('form.success.requestSubmitted'),
          type: 'success'
        });
        
        // Reset form
        setFormData(createInitialFormData());
      } else {
        setToast({
          message: data.error || t('form.success.failFallback'),
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setToast({
        message: t('form.errors.networkError'),
        type: 'error'
      });
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
        />
      )}
      <TopbarOne />
      <HeaderOne />
      <HeaderOneCloned />
      <PageHeader 
        title={t('pageTitle')}
        subTitle={t('pageSubTitle')}
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

            <form onSubmit={handleSubmit} className="tailor-made-form">
              {/* Step 1: Personal Information */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="step-number">1</span>
                  <h3 className="form-section-title">{t('form.steps.1')}</h3>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      <User size={18} />
                      {t('form.fields.fullName')} <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`form-input ${errors.fullName ? 'form-input--error' : ''}`}
                      placeholder={t('form.placeholders.fullName')}
                      required
                    />
                    {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Mail size={18} />
                      {t('form.fields.email')} <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                      placeholder={t('form.placeholders.email')}
                      required
                    />
                    {errors.email && <span className="form-error">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Phone size={18} />
                      {t('form.fields.phone')}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder={t('form.placeholders.phone')}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <MapPin size={18} />
                      {t('form.fields.country')} <span className="required">*</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className={`form-select ${errors.country ? 'form-input--error' : ''}`}
                      required
                    >
                      <option value="">{t('form.placeholders.country')}</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.country && <span className="form-error">{errors.country}</span>}
                  </div>
                </div>
              </div>

              {/* Step 2: Travel Details */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="step-number">2</span>
                  <h3 className="form-section-title">{t('form.steps.2')}</h3>
                </div>

                <div className="form-grid">
                  <div className="form-group form-group--full">
                    <label className="form-label">
                      <Calendar size={18} />
                      {t('form.fields.travelDates')} <span className="required">*</span>
                    </label>
                    <div className="date-range-wrapper">
                      <div className="date-select-group">
                        <select name="startMonth" value={formData.startMonth} onChange={handleInputChange} className="form-select" required>
                          <option value="">{t('form.placeholders.month')}</option>
                          {MONTHS.map(month => <option key={month} value={month}>{month}</option>)}
                        </select>
                        <select name="startYear" value={formData.startYear} onChange={handleInputChange} className="form-select" required>
                          <option value="">{t('form.placeholders.year')}</option>
                          {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                      </div>
                      <span className="date-separator">{t('form.labels.to')}</span>
                      <div className="date-select-group">
                        <select name="endMonth" value={formData.endMonth} onChange={handleInputChange} className="form-select" required>
                          <option value="">{t('form.placeholders.month')}</option>
                          {MONTHS.map(month => <option key={month} value={month}>{month}</option>)}
                        </select>
                        <select name="endYear" value={formData.endYear} onChange={handleInputChange} className="form-select" required>
                          <option value="">{t('form.placeholders.year')}</option>
                          {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Clock size={18} />
                      {t('form.fields.duration')}
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder={t('form.placeholders.duration')}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Star size={18} />
                      {t('form.fields.accommodation')}
                    </label>
                    <select
                      name="accommodation"
                      value={formData.accommodation}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">{t('form.placeholders.accommodation')}</option>
                      {ACCOMMODATION_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group form-group--full">
                    <label className="form-label">
                      <Users size={18} />
                      {t('form.fields.travelers')}
                    </label>
                    <div className="travelers-grid">
                      {TRAVELER_COUNTERS.map((tItem) => (
                        <div className="traveler-counter" key={tItem.key}>
                          <span className="traveler-label">
                            {t(`form.labels.${tItem.key}`)} {tItem.required ? <span className="required">*</span> : null}
                            {tItem.meta ? <span className="age-label">{t(`form.labels.${tItem.key}Age`, { defaultValue: tItem.meta })}</span> : null}
                          </span>
                          <div className="counter-controls">
                            <button type="button" onClick={() => handleNumberChange(tItem.key, false)} className="counter-btn">-</button>
                            <span className="counter-value">{formData[tItem.key]}</span>
                            <button type="button" onClick={() => handleNumberChange(tItem.key, true)} className="counter-btn">+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Travel Preferences */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="step-number">3</span>
                  <h3 className="form-section-title">{t('form.steps.3')}</h3>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">{t('form.fields.budgetRange')}</label>
                    <div className="budget-selects">
                      <select name="minBudget" value={formData.minBudget} onChange={handleInputChange} className="form-select">
                        <option value="">{t('form.placeholders.minBudget')}</option>
                        {MIN_BUDGET_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      <select name="maxBudget" value={formData.maxBudget} onChange={handleInputChange} className="form-select">
                        <option value="">{t('form.placeholders.maxBudget')}</option>
                        {MAX_BUDGET_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Heart size={18} />
                      {t('form.fields.specialOccasions')}
                    </label>
                    <select
                      name="specialOccasion"
                      value={formData.specialOccasion}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">{t('form.placeholders.specialOccasion')}</option>
                      {SPECIAL_OCCASION_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group form-group--full">
                    <label className="form-label">{t('form.fields.interestsActivities')}</label>
                    <div className="interests-grid">
                      {INTEREST_OPTIONS.map(interest => (
                        <label key={interest} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.interests.includes(interest)}
                            onChange={() => handleCheckboxChange(interest)}
                            className="checkbox-input"
                          />
                          <span className="checkbox-text">{interest}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Special Requirements */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="step-number">4</span>
                  <h3 className="form-section-title">{t('form.steps.4')}</h3>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">{t('form.fields.dietaryRequirements')}</label>
                    <input
                      type="text"
                      name="dietary"
                      value={formData.dietary}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder={t('form.placeholders.dietary')}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('form.fields.mobilityRequirements')}</label>
                    <input
                      type="text"
                      name="mobility"
                      value={formData.mobility}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder={t('form.placeholders.mobility')}
                    />
                  </div>

                  <div className="form-group form-group--full">
                    <label className="form-label">
                      {t('form.fields.additionalComments')} <span className="required">*</span>
                    </label>
                    <textarea
                      name="comments"
                      value={formData.comments}
                      onChange={handleInputChange}
                      className={`form-textarea ${errors.comments ? 'form-input--error' : ''}`}
                      rows={6}
                      placeholder={t('form.placeholders.comments')}
                      required
                    />
                    {errors.comments && <span className="form-error">{errors.comments}</span>}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-submit-wrapper">
                <button type="submit" className="form-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="spinner" />
                      {t('form.buttons.submitting')}
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      {t('form.buttons.submit')}
                    </>
                  )}
                </button>
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
                <a href="https://wa.me/201007437271" className="sidebar-contact__item">
                  <Phone size={18} />
                  <span>+20 100 743 7271</span>
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
