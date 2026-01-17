'use client';
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout/Layout';
import HeaderOne from '@/components/layout/HeaderOne/HeaderOne';
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from '@/components/layout/FooterOne/FooterOne';
import PageHeader from '@/components/sections/PageHeader/PageHeader';
import Toast, { ToastType } from '@/components/common/Toast/Toast';
import { API_ENDPOINTS } from '@/config/api';
import { 
  MapPin, Calendar, Users, Heart, Star, Clock, 
  CheckCircle, Sparkles, Award, Phone, Mail, User, Loader2
} from 'lucide-react';
import HeaderOneCloned from '@/components/layout/HeaderOneCloned/HeaderOneCloned';

const TailorMadePage = () => {
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    country: '',
    
    // Travel Details
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    duration: '',
    accommodation: '',
    adults: 2,
    children: 0,
    infants: 0,
    
    // Preferences
    minBudget: '',
    maxBudget: '',
    specialOccasion: '',
    interests: [] as string[],
    
    // Special Requirements
    dietary: '',
    mobility: '',
    comments: ''
  });

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
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    // Travel Details
    if (!formData.startMonth) {
      newErrors.startMonth = 'Start month is required';
    }
    if (!formData.startYear) {
      newErrors.startYear = 'Start year is required';
    }
    if (!formData.endMonth) {
      newErrors.endMonth = 'End month is required';
    }
    if (!formData.endYear) {
      newErrors.endYear = 'End year is required';
    }

    if (formData.adults < 1) {
      newErrors.adults = 'At least one adult is required';
    }

    // Special Requirements
    if (!formData.comments.trim()) {
      newErrors.comments = 'Additional comments are required';
    } else if (formData.comments.trim().length > 2000) {
      newErrors.comments = 'Comments cannot exceed 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setToast({
        message: 'Please fill in all required fields correctly',
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
          message: data.message || 'Your travel request has been submitted successfully!',
          type: 'success'
        });
        
        // Reset form
        setFormData({
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
          comments: ''
        });
      } else {
        setToast({
          message: data.error || 'Failed to submit your request. Please try again.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setToast({
        message: 'Network error. Please check your connection and try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2025', '2026', '2027'];

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
        title="Tailor-Made Travel Experiences"
        subTitle="Tailor-Made"
      />

      <section className="tailor-made-section">
        <div className="container">
          {/* Hero Section */}
          <div className="tailor-made-hero">
            <div className="tailor-made-hero__content">
              <h2 className="tailor-made-hero__title">
                Create Your Perfect Egyptian Adventure
              </h2>
              <p className="tailor-made-hero__subtitle">
                Create your perfect Egyptian adventure with our expert travel specialists. 
                Every detail crafted to match your dreams.
              </p>
            </div>

            {/* Features Grid */}
            <div className="tailor-made-features">
              <div className="feature-card">
                <div className="feature-card__icon">
                  <MapPin size={32} />
                </div>
                <h3 className="feature-card__title">Personalized Itinerary</h3>
                <p className="feature-card__text">Custom-designed journeys based on your preferences</p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon">
                  <Users size={32} />
                </div>
                <h3 className="feature-card__title">Expert Team</h3>
                <p className="feature-card__text">Professional travel specialists with local expertise</p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon">
                  <Clock size={32} />
                </div>
                <h3 className="feature-card__title">24/7 Support</h3>
                <p className="feature-card__text">Round-the-clock assistance throughout your journey</p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon">
                  <Award size={32} />
                </div>
                <h3 className="feature-card__title">Award Winning</h3>
                <p className="feature-card__text">TripAdvisor Excellence</p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="tailor-made-content-wrapper">
          <div className="tailor-made-form-wrapper">
            <div className="tailor-made-form-header">
              <h2 className="form-header-title">Plan Your Dream Journey</h2>
              <p className="form-header-subtitle">
                Share your preferences and we'll craft your perfect adventure.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="tailor-made-form">
              {/* Step 1: Personal Information */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="step-number">1</span>
                  <h3 className="form-section-title">Personal Information</h3>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      <User size={18} />
                      Full Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`form-input ${errors.fullName ? 'form-input--error' : ''}`}
                      placeholder="Enter your full name"
                      required
                    />
                    {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Mail size={18} />
                      Email Address <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                      placeholder="your.email@example.com"
                      required
                    />
                    {errors.email && <span className="form-error">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Phone size={18} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <MapPin size={18} />
                      Country of Residence <span className="required">*</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className={`form-select ${errors.country ? 'form-input--error' : ''}`}
                      required
                    >
                      <option value="">Select your country</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Italy">Italy</option>
                      <option value="Spain">Spain</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.country && <span className="form-error">{errors.country}</span>}
                  </div>
                </div>
              </div>

              {/* Step 2: Travel Details */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="step-number">2</span>
                  <h3 className="form-section-title">Travel Details</h3>
                </div>

                <div className="form-grid">
                  <div className="form-group form-group--full">
                    <label className="form-label">
                      <Calendar size={18} />
                      Travel Dates <span className="required">*</span>
                    </label>
                    <div className="date-range-wrapper">
                      <div className="date-select-group">
                        <select name="startMonth" value={formData.startMonth} onChange={handleInputChange} className="form-select" required>
                          <option value="">Month</option>
                          {months.map(month => <option key={month} value={month}>{month}</option>)}
                        </select>
                        <select name="startYear" value={formData.startYear} onChange={handleInputChange} className="form-select" required>
                          <option value="">Year</option>
                          {years.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                      </div>
                      <span className="date-separator">to</span>
                      <div className="date-select-group">
                        <select name="endMonth" value={formData.endMonth} onChange={handleInputChange} className="form-select" required>
                          <option value="">Month</option>
                          {months.map(month => <option key={month} value={month}>{month}</option>)}
                        </select>
                        <select name="endYear" value={formData.endYear} onChange={handleInputChange} className="form-select" required>
                          <option value="">Year</option>
                          {years.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Clock size={18} />
                      Trip Duration
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., 7 days"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Star size={18} />
                      Accommodation Preference
                    </label>
                    <select
                      name="accommodation"
                      value={formData.accommodation}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">Select preference</option>
                      <option value="Luxury Hotels (5 Star)">Luxury Hotels (5 Star)</option>
                      <option value="Premium Hotels (4 Star)">Premium Hotels (4 Star)</option>
                      <option value="Standard Hotels (3 Star)">Standard Hotels (3 Star)</option>
                      <option value="Mix of Categories">Mix of Categories</option>
                    </select>
                  </div>

                  <div className="form-group form-group--full">
                    <label className="form-label">
                      <Users size={18} />
                      Number of Travelers
                    </label>
                    <div className="travelers-grid">
                      <div className="traveler-counter">
                        <span className="traveler-label">Adults <span className="required">*</span></span>
                        <div className="counter-controls">
                          <button type="button" onClick={() => handleNumberChange('adults', false)} className="counter-btn">-</button>
                          <span className="counter-value">{formData.adults}</span>
                          <button type="button" onClick={() => handleNumberChange('adults', true)} className="counter-btn">+</button>
                        </div>
                      </div>
                      <div className="traveler-counter">
                        <span className="traveler-label">Children <span className="age-label">(6-12 years)</span></span>
                        <div className="counter-controls">
                          <button type="button" onClick={() => handleNumberChange('children', false)} className="counter-btn">-</button>
                          <span className="counter-value">{formData.children}</span>
                          <button type="button" onClick={() => handleNumberChange('children', true)} className="counter-btn">+</button>
                        </div>
                      </div>
                      <div className="traveler-counter">
                        <span className="traveler-label">Infants <span className="age-label">(1-6 years)</span></span>
                        <div className="counter-controls">
                          <button type="button" onClick={() => handleNumberChange('infants', false)} className="counter-btn">-</button>
                          <span className="counter-value">{formData.infants}</span>
                          <button type="button" onClick={() => handleNumberChange('infants', true)} className="counter-btn">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Travel Preferences */}
              <div className="form-section">
                <div className="form-section-header">
                  <span className="step-number">3</span>
                  <h3 className="form-section-title">Travel Preferences</h3>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Budget Range (Per Person)</label>
                    <div className="budget-selects">
                      <select name="minBudget" value={formData.minBudget} onChange={handleInputChange} className="form-select">
                        <option value="">Min Budget</option>
                        <option value="$500">$500</option>
                        <option value="$1,000">$1,000</option>
                        <option value="$1,500">$1,500</option>
                        <option value="$2,000">$2,000</option>
                        <option value="$3,000">$3,000</option>
                        <option value="$5,000+">$5,000+</option>
                      </select>
                      <select name="maxBudget" value={formData.maxBudget} onChange={handleInputChange} className="form-select">
                        <option value="">Max Budget</option>
                        <option value="$1,000">$1,000</option>
                        <option value="$2,000">$2,000</option>
                        <option value="$3,000">$3,000</option>
                        <option value="$5,000">$5,000</option>
                        <option value="$10,000">$10,000</option>
                        <option value="No Limit">No Limit</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Heart size={18} />
                      Special Occasions
                    </label>
                    <select
                      name="specialOccasion"
                      value={formData.specialOccasion}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">Select if applicable</option>
                      <option value="Honeymoon">Honeymoon</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Birthday Celebration">Birthday Celebration</option>
                      <option value="Family Reunion">Family Reunion</option>
                      <option value="Retirement Trip">Retirement Trip</option>
                      <option value="Other Celebration">Other Celebration</option>
                    </select>
                  </div>

                  <div className="form-group form-group--full">
                    <label className="form-label">Interests & Activities (Select all that apply)</label>
                    <div className="interests-grid">
                      {[
                        'Ancient Sites & Temples',
                        'Nile River Cruise',
                        'Museums & Culture',
                        'Desert Safari',
                        'Red Sea & Beaches',
                        'Local Cuisine',
                        'Photography Tours',
                        'Adventure Activities'
                      ].map(interest => (
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
                  <h3 className="form-section-title">Special Requirements</h3>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Dietary Requirements</label>
                    <input
                      type="text"
                      name="dietary"
                      value={formData.dietary}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Vegetarian, Halal, Gluten-free"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobility Requirements</label>
                    <input
                      type="text"
                      name="mobility"
                      value={formData.mobility}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Any accessibility needs"
                    />
                  </div>

                  <div className="form-group form-group--full">
                    <label className="form-label">
                      Additional Comments & Special Requests <span className="required">*</span>
                    </label>
                    <textarea
                      name="comments"
                      value={formData.comments}
                      onChange={handleInputChange}
                      className={`form-textarea ${errors.comments ? 'form-input--error' : ''}`}
                      rows={6}
                      placeholder="Tell us more about your dream trip, special interests, or any specific requirements..."
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
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Send My Travel Request
                    </>
                  )}
                </button>
                <div className="form-submit-info">
                  <div className="submit-info-card">
                    <Clock size={18} />
                    <div className="submit-info-text">
                      <strong>Quick Response</strong>
                      <span>Our travel specialists will contact you within 24 hours</span>
                    </div>
                  </div>
                  <div className="submit-info-card">
                    <CheckCircle size={18} />
                    <div className="submit-info-text">
                      <strong>Personalized Itinerary</strong>
                      <span>Receive a custom proposal tailored to your preferences</span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="tailor-made-sidebar">
            <div className="sidebar-card">
              <h3 className="sidebar-card__title">
                <Sparkles size={24} />
                Why Choose Our Tailor-Made Service?
              </h3>
              <ul className="sidebar-features">
                <li className="sidebar-feature">
                  <CheckCircle size={20} />
                  <span>Personal Travel Consultant</span>
                </li>
                <li className="sidebar-feature">
                  <CheckCircle size={20} />
                  <span>24/7 Travel Support</span>
                </li>
                <li className="sidebar-feature">
                  <CheckCircle size={20} />
                  <span>Free Consultation</span>
                </li>
                <li className="sidebar-feature">
                  <CheckCircle size={20} />
                  <span>Completely Customizable</span>
                </li>
                <li className="sidebar-feature">
                  <CheckCircle size={20} />
                  <span>Best Price Guarantee</span>
                </li>
                <li className="sidebar-feature">
                  <CheckCircle size={20} />
                  <span>Handpicked Experiences</span>
                </li>
              </ul>
            </div>

            <div className="sidebar-card sidebar-card--contact">
              <h3 className="sidebar-card__title">
                <Phone size={24} />
                Need Help?
              </h3>
              <p className="sidebar-card__subtitle">Speak with our travel experts</p>
              <div className="sidebar-contact">
                <a href="tel:+19172678628" className="sidebar-contact__item">
                  <Phone size={18} />
                  <span>+1 (917) 267-8628</span>
                </a>
                <a href="mailto:info@luxorandaswan.com" className="sidebar-contact__item">
                  <Mail size={18} />
                  <span>info@luxorandaswan.com</span>
                </a>
              </div>
              <p className="sidebar-card__note">
                <Clock size={16} />
                Available 24/7 to assist with your travel planning
              </p>
            </div>
          </div>
          </div>
        </div>
      </section>

      <FooterOne />

      <style jsx>{`
        .tailor-made-section {
          padding: 80px 0;
          background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
        }

        .tailor-made-hero {
          text-align: center;
          margin-bottom: 60px;
        }

        .tailor-made-hero__content {
          max-width: 800px;
          margin: 0 auto 50px;
        }

        .tailor-made-hero__title {
          font-size: 42px;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 20px;
          line-height: 1.2;
        }

        .tailor-made-hero__subtitle {
          font-size: 18px;
          color: #666;
          line-height: 1.6;
        }

        .tailor-made-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          margin-bottom: 60px;
        }

        .feature-card {
          background: white;
          padding: 30px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(212, 175, 55, 0.2);
        }

        .feature-card__icon {
          width: 70px;
          height: 70px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .feature-card__title {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 10px;
        }

        .feature-card__text {
          font-size: 14px;
          color: #666;
          line-height: 1.5;
          margin: 0;
        }

        .tailor-made-content-wrapper {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 40px;
          align-items: start;
        }

        .tailor-made-form-wrapper {
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .tailor-made-form-header {
          padding: 30px 30px 25px;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-header-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #0E3A57;
          letter-spacing: -0.3px;
        }

        .form-header-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
          font-weight: 400;
        }

        .tailor-made-form {
          padding: 40px 35px;
        }

        .form-section {
          margin-bottom: 40px;
          padding-bottom: 35px;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-section:last-of-type {
          border-bottom: none;
          margin-bottom: 20px;
        }

        .form-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 25px;
        }

        .step-number {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .form-section-title {
          font-size: 18px;
          font-weight: 600;
          color: #0E3A57;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group--full {
          grid-column: 1 / -1;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          color: #374151;
          font-size: 13px;
        }

        .form-label svg {
          color: #d4af37;
        }

        .required {
          color: #ef4444;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
          font-family: inherit;
          color: #0E3A57;
          background: #ffffff;
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: #9ca3af;
          opacity: 1;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.08);
        }

        .form-input--error,
        .form-select--error,
        .form-textarea--error {
          border-color: #ef4444 !important;
        }

        .form-input--error:focus,
        .form-select--error:focus,
        .form-textarea--error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
        }

        .form-error {
          display: block;
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
          font-weight: 500;
        }

        .form-textarea {
          resize: vertical;
          min-height: 120px;
        }

        .date-range-wrapper {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .date-select-group {
          display: flex;
          gap: 10px;
          flex: 1;
          min-width: 200px;
        }

        .date-separator {
          font-weight: 600;
          color: #666;
        }

        .budget-selects {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .travelers-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .traveler-counter {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .traveler-label {
          font-weight: 600;
          color: #333;
          font-size: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .age-label {
          font-size: 12px;
          font-weight: 400;
          color: #666;
        }

        .counter-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f9fafb;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .counter-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          color: white;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .counter-btn:hover {
          transform: scale(1.1);
        }

        .counter-btn:active {
          transform: scale(0.95);
        }

        .counter-value {
          flex: 1;
          text-align: center;
          font-size: 16px;
          font-weight: 600;
          color: #0E3A57;
        }

        .interests-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .checkbox-label:hover {
          border-color: #d4af37;
          background: rgba(212, 175, 55, 0.03);
        }

        .checkbox-input {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #d4af37;
        }

        .checkbox-text {
          font-size: 13px;
          font-weight: 400;
          color: #374151;
        }

        .form-submit-wrapper {
          margin-top: 40px;
          padding: 30px;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(244, 208, 63, 0.05) 100%);
          border-radius: 12px;
          border: 1px solid rgba(212, 175, 55, 0.15);
        }

        .form-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 16px 40px;
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
          letter-spacing: 0.3px;
        }

        .form-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
        }

        .form-submit-btn:active {
          transform: translateY(0px);
        }

        .form-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none !important;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .form-submit-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-top: 24px;
        }

        .submit-info-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: white;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .submit-info-card:hover {
          border-color: #d4af37;
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.1);
        }

        .submit-info-card svg {
          color: #d4af37;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .submit-info-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .submit-info-text strong {
          font-size: 14px;
          font-weight: 600;
          color: #0E3A57;
          line-height: 1.3;
        }

        .submit-info-text span {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .tailor-made-section {
            padding: 50px 0;
          }

          .tailor-made-hero__title {
            font-size: 32px;
          }

          .tailor-made-features {
            grid-template-columns: 1fr;
          }

          .tailor-made-form {
            padding: 30px 20px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .date-select-group {
            min-width: 100%;
          }

          .travelers-grid {
            grid-template-columns: 1fr;
          }

          .interests-grid {
            grid-template-columns: 1fr;
          }

          .budget-selects {
            grid-template-columns: 1fr;
          }

          .tailor-made-content-wrapper {
            grid-template-columns: 1fr;
          }

          .tailor-made-sidebar {
            margin-top: 40px;
          }

          .form-submit-wrapper {
            padding: 20px;
          }

          .form-submit-info {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .submit-info-card {
            padding: 14px;
          }
        }

        .tailor-made-sidebar {
          display: flex;
          flex-direction: column;
          gap: 25px;
          position: sticky;
          top: 100px;
          align-self: start;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
        }

        .sidebar-card {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .sidebar-card--contact {
          background: linear-gradient(135deg, #0E3A57 0%, #1a4d6d 100%);
          color: white;
        }

        .sidebar-card__title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #1a1a1a;
        }

        .sidebar-card--contact .sidebar-card__title {
          color: white;
        }

        .sidebar-card__subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 20px;
        }

        .sidebar-card__note {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .sidebar-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .sidebar-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          color: #333;
        }

        .sidebar-feature svg {
          color: #d4af37;
          flex-shrink: 0;
        }

        .sidebar-contact {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .sidebar-contact__item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .sidebar-contact__item:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateX(5px);
        }

        .sidebar-contact__item svg {
          color: #f4d03f;
          flex-shrink: 0;
        }

        @media (max-width: 1024px) {
          .tailor-made-sidebar {
            position: static;
          }
        }
      `}</style>
    </Layout>
  );
};

export default TailorMadePage;
