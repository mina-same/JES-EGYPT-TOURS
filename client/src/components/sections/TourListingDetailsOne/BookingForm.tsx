import React, { FormEvent, useState } from "react";
import DatePicker from "react-datepicker";
import PhoneInput from "react-phone-number-input";
import { getCountries } from "react-phone-number-input";
import en from "react-phone-number-input/locale/en";
import { createBooking } from "@/lib/api/booking";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface BookingFormProps {
  tourId: string;
  onSubmit?: (data: any) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ tourId, onSubmit }) => {
  const [startDate, setStartDate] = useState<Date | null>();
  const [startTime, setStartTime] = useState<Date | null>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>("");

  const nationalityOptions = getCountries()
    .map((code) => ({
      code,
      name: (en as any)[code] || code,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleCounter = (type: 'adults' | 'children' | 'infants', operation: 'inc' | 'dec') => {
    if (type === 'adults') {
      setAdults(prev => operation === 'inc' ? prev + 1 : Math.max(1, prev - 1));
    } else if (type === 'children') {
      setChildren(prev => operation === 'inc' ? prev + 1 : Math.max(0, prev - 1));
    } else if (type === 'infants') {
      setInfants(prev => operation === 'inc' ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const formData = new FormData(document.querySelector('form') as HTMLFormElement);
    const name = formData.get('name')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const requirements = formData.get('requirements')?.toString().trim();

    if (!name || name.length < 2) {
      newErrors.name = 'Name is required and must be at least 2 characters';
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!startDate) {
      newErrors.date = 'Please select a booking date';
    }

    if (!startTime) {
      newErrors.time = 'Please select a booking time';
    }

    if (adults < 1) {
      newErrors.adults = 'At least one adult is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
    const formData = new FormData(e.currentTarget);
      const data = {
        tour: tourId,
        name: formData.get('name')?.toString().trim() || "",
        email: formData.get('email')?.toString().trim() || "",
        phone: phone || formData.get('phone')?.toString().trim() || "",
        nationality: formData.get('nationality')?.toString().trim() || "",
        date: startDate!.toISOString(),
        time: startTime!.toISOString(),
      adults,
      children,
      infants,
        requirements: formData.get('requirements')?.toString().trim() || "",
    };

      const response = await createBooking(data);

      if (response.success) {
        setSuccessMessage(response.message || "Your booking has been submitted successfully!");
        
        // Reset form
        (e.target as HTMLFormElement).reset();
        setStartDate(null);
        setStartTime(null);
        setAdults(1);
        setChildren(0);
        setInfants(0);
        setPhone(undefined);

        // Call optional onSubmit callback
        if (onSubmit) {
    onSubmit(data);
        }

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setErrors({ submit: response.error || "Failed to submit booking. Please try again." });
      }
    } catch (error: any) {
      console.error("Error submitting booking:", error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.errors?.[0]?.msg ||
                          "Network error. Please check your connection and try again.";
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
      <h4 className='tour-listing-details__sidebar__title'>
        Book This Tour
      </h4>
      <div className='booking-form-card'>
        <form
          className='booking-form-inner contact-form-validated'
          onSubmit={handleSubmit}
        >
          {successMessage && (
            <div className="booking-message booking-message-success">
              <CheckCircle size={20} />
              <span>{successMessage}</span>
            </div>
          )}

          {errors.submit && (
            <div className="booking-message booking-message-error">
              <XCircle size={20} />
              <span>{errors.submit}</span>
            </div>
          )}

          <div className='booking-form-control'>
            <input 
              type="text" 
              id="name" 
              name="name" 
              placeholder="Name *" 
              required 
              className={`booking-input ${errors.name ? 'booking-input-error' : ''}`}
            />
            {errors.name && <span className="booking-error-text">{errors.name}</span>}
          </div>
          
          <div className='booking-form-control'>
            <input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="E-mail *" 
              required 
              className={`booking-input ${errors.email ? 'booking-input-error' : ''}`}
            />
            {errors.email && <span className="booking-error-text">{errors.email}</span>}
          </div>

          <div className='booking-form-control'>
            <select id="nationality" name="nationality" className="booking-select">
              <option value="">Select your Nationality</option>
              {nationalityOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className='booking-form-control'>
            <div className="phone-input-wrapper">
              <PhoneInput
                international
                defaultCountry="EG"
                value={phone}
                onChange={setPhone}
                placeholder="Mobile"
                className="booking-phone-input"
              />
            </div>
          </div>

          <div className='booking-form-row'>
            <div className='booking-col-date'>
              <div className="date-input-wrapper">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    if (errors.date) setErrors(prev => ({ ...prev, date: "" }));
                  }}
                  placeholderText="From *"
                  className={`booking-date-input ${errors.date ? 'booking-input-error' : ''}`}
                  minDate={new Date()}
                />
                <i className='icon-calendar'></i>
              </div>
              {errors.date && <span className="booking-error-text">{errors.date}</span>}
            </div>
            <div className='booking-col-date'>
              <div className="date-input-wrapper">
                <DatePicker
                  selected={startTime}
                  onChange={(date) => {
                    setStartTime(date);
                    if (errors.time) setErrors(prev => ({ ...prev, time: "" }));
                  }}
                  placeholderText="Time *"
                  className={`booking-date-input ${errors.time ? 'booking-input-error' : ''}`}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  dateFormat="h:mm aa"
                  timeCaption="Time"
                />
                <i className='icon-calendar'></i>
              </div>
              {errors.time && <span className="booking-error-text">{errors.time}</span>}
            </div>
          </div>

          {/* Counters */}
          <div className="booking-counter-row">
            <div className="counter-label">
              <span className="counter-title">No. of Adults</span>
              <span className="counter-subtitle">( + 12 years )</span>
            </div>
            <div className="counter-controls">
              <button type="button" className="counter-btn" onClick={() => handleCounter('adults', 'dec')}>-</button>
              <span className="counter-value">{adults}</span>
              <button type="button" className="counter-btn" onClick={() => handleCounter('adults', 'inc')}>+</button>
            </div>
          </div>

          <div className="booking-counter-row">
            <div className="counter-label">
              <span className="counter-title">No. of Children</span>
              <span className="counter-subtitle">( 2 to 11 years )</span>
            </div>
            <div className="counter-controls">
              <button type="button" className="counter-btn" onClick={() => handleCounter('children', 'dec')}>-</button>
              <span className="counter-value">{children}</span>
              <button type="button" className="counter-btn" onClick={() => handleCounter('children', 'inc')}>+</button>
            </div>
          </div>

          <div className="booking-counter-row">
            <div className="counter-label">
              <span className="counter-title">No. of Infants</span>
              <span className="counter-subtitle">( 0 to 2 years )</span>
            </div>
            <div className="counter-controls">
              <button type="button" className="counter-btn" onClick={() => handleCounter('infants', 'dec')}>-</button>
              <span className="counter-value">{infants}</span>
              <button type="button" className="counter-btn" onClick={() => handleCounter('infants', 'inc')}>+</button>
            </div>
          </div>

          <div className='booking-form-control'>
            <textarea 
              id="requirements" 
              name="requirements" 
              rows={4} 
              placeholder="Please advise your tour requirements"
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
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
