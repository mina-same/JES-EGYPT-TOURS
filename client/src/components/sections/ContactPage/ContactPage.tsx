// ContactPage.tsx
"use client";
import React, { useState } from "react";
import { contactFormFields, googleMapUrl } from "@/data/contactData"; // Import the data
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "@/hooks/use-toast";

interface ContactFormField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "textarea";
}
const ContactPage: React.FC = () => {
  const formFields = contactFormFields as ContactFormField[];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.nativeEvent as any)?.stopImmediatePropagation?.();
    console.log('ContactPage: handleSubmit called');

    if (isSubmitting || submittedOnce) return;
    setIsSubmitting(true);
    setSubmittedOnce(true);
    setSuccessMessage("");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Basic client-side validation
    if (!data.name?.trim()) {
      setErrorMessage('Name is required');
      toast({
        title: 'Send failed',
        description: 'Name is required',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      setSubmittedOnce(false);
      return;
    }
    if (!data.email?.trim()) {
      setErrorMessage('Email is required');
      toast({
        title: 'Send failed',
        description: 'Email is required',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      setSubmittedOnce(false);
      return;
    }
    if (!data.message?.trim()) {
      setErrorMessage('Message is required');
      toast({
        title: 'Send failed',
        description: 'Message is required',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      setSubmittedOnce(false);
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(data.email.trim())) {
      setErrorMessage('Please provide a valid email');
      toast({
        title: 'Send failed',
        description: 'Please provide a valid email',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      setSubmittedOnce(false);
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.CONTACT.BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name || '',
          email: data.email || '',
          message: data.message || '',
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const errMsg = json?.error || 'Failed to send message';
        setErrorMessage(errMsg);
        toast({
          title: 'Send failed',
          description: errMsg,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        setSubmittedOnce(false);
        return;
      }

      const okMsg = json?.message || 'Message sent successfully';
      setSuccessMessage(okMsg);
      toast({
        title: 'Message sent',
        description: okMsg,
      });
      e.currentTarget.reset();
    } catch (_err) {
      setErrorMessage('Failed to send message');
      toast({
        title: 'Send failed',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      // Reset submittedOnce after a short delay to allow re-submit if needed
      setTimeout(() => setSubmittedOnce(false), 1000);
    }
  };
  return (
    <section className='contact-page section-space-bottom'>
      <div className='container'>
        <div className='row gutter-y-30'>
          {/* Google Map Section */}
          <div
            className='col-lg-6 wow fadeInLeft'
            data-wow-duration='1500ms'
            data-wow-delay='300ms'
          >
            <div className='contact-page__map'>
              <div className='google-map'>
                <iframe
                  title='template google map'
                  src={googleMapUrl}
                  className='map'
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>

          {/* Contact Form Section */}
          <div
            className='col-lg-6 wow fadeInRight'
            data-wow-duration='1500ms'
            data-wow-delay='300ms'
          >
            <div className='contact-page__contact'>
              <h2 className='contact-page__title'>Ready to Get Started?</h2>
              <p className='contact-page__text'>
                Nullam varius, erat quis iaculis dictum, eros urna varius eros,
                ut blandit felis odio in turpis. Quisque rhoncus.
              </p>
              <form
                className='comments-form__form form-one'
                onSubmit={handleSubmit}
              >
                <div className='form-one__group'>
                  {successMessage ? (
                    <div className='form-one__control form-one__control--full'>
                      <div className='alert alert-success'>{successMessage}</div>
                    </div>
                  ) : null}
                  {errorMessage ? (
                    <div className='form-one__control form-one__control--full'>
                      <div className='alert alert-danger'>{errorMessage}</div>
                    </div>
                  ) : null}
                  {formFields.map((field, index) => (
                    <div
                      key={index}
                      className={`form-one__control ${
                        field.type === "textarea"
                          ? "form-one__control--full"
                          : ""
                      }`}
                    >
                      <label htmlFor={field.name}>{field.label}</label>
                      {field.type === "textarea" ? (
                        <textarea
                          name={field.name}
                          id={field.name}
                          placeholder={field.placeholder}
                          required
                        ></textarea>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          id={field.name}
                          placeholder={field.placeholder}
                          required
                        />
                      )}
                    </div>
                  ))}
                  <div className='form-one__control form-one__control--full'>
                    <button type='submit' className='gotur-btn gotur-btn--base' disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : 'Send Message'}{' '}
                      <i className='icon-arrow-right'></i>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
