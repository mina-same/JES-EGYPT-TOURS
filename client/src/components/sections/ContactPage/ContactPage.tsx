"use client";
import React, { useState } from "react";
import { googleMapUrl } from "@/data/contactData"; // Import the data
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface ContactFormField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "textarea";
}

const ContactPage: React.FC = () => {
  const { t } = useTranslation('contact');
  const formFields: ContactFormField[] = [
    {
      name: "name",
      label: t('form.fields.nameLabel'),
      placeholder: t('form.fields.namePlaceholder'),
      type: "text",
    },
    {
      name: "email",
      label: t('form.fields.emailLabel'),
      placeholder: t('form.fields.emailPlaceholder'),
      type: "email",
    },
    {
      name: "message",
      label: t('form.fields.messageLabel'),
      placeholder: t('form.fields.messagePlaceholder'),
      type: "textarea",
    },
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.nativeEvent as any)?.stopImmediatePropagation?.();
    console.log('ContactPage: handleSubmit called');

    if (isSubmitting || submittedOnce) return;
    setIsSubmitting(true);
    setSubmittedOnce(true);
    setStatus({ type: null, message: "" });

    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget; // Store reference to form element
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Basic client-side validation
    if (!data.name?.trim()) {
      setStatus({ type: "error", message: t('form.errors.nameRequired') });
      toast({
        title: t('form.errors.sendFailed'),
        description: t('form.errors.nameRequired'),
        variant: "destructive",
      });
      setIsSubmitting(false);
      setSubmittedOnce(false);
      return;
    }
    if (!data.email?.trim()) {
      setStatus({ type: "error", message: t('form.errors.emailRequired') });
      toast({
        title: t('form.errors.sendFailed'),
        description: t('form.errors.emailRequired'),
        variant: "destructive",
      });
      setIsSubmitting(false);
      setSubmittedOnce(false);
      return;
    }
    if (!data.message?.trim()) {
      setStatus({ type: "error", message: t('form.errors.messageRequired') });
      toast({
        title: t('form.errors.sendFailed'),
        description: t('form.errors.messageRequired'),
        variant: "destructive",
      });
      setIsSubmitting(false);
      setSubmittedOnce(false);
      return;
    }
    const emailRegex = /^\\S+@\\S+\\.\\S+$/;
    if (!emailRegex.test(data.email.trim())) {
      setStatus({ type: "error", message: t('form.errors.invalidEmail') });
      toast({
        title: t('form.errors.sendFailed'),
        description: t('form.errors.invalidEmail'),
        variant: "destructive",
      });
      setIsSubmitting(false);
      setSubmittedOnce(false);
      return;
    }

    let successOccurred = false;
    try {
      console.log('ContactPage: Sending request to:', API_ENDPOINTS.CONTACT.BASE);
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

      console.log('ContactPage: Response status:', res.status, res.ok);
      const json = await res.json().catch(() => null);
      console.log('ContactPage: Response JSON:', json);

      if (!res.ok) {
        const errMsg = json?.error || t('form.errors.failedMessage');
        console.log('ContactPage: Setting error message:', errMsg);
        setStatus({ type: "error", message: errMsg });
        toast({
          title: t('form.errors.sendFailed'),
          description: errMsg,
          variant: "destructive",
        });
        setIsSubmitting(false);
        setSubmittedOnce(false);
        return;
      }

      successOccurred = true;
      const okMsg = json?.message || t('form.success.sentMessage');
      console.log('ContactPage: Setting success message:', okMsg);
      setStatus({ type: "success", message: okMsg });
      toast({
        title: t('form.success.sentTitle'),
        description: okMsg,
      });
      // Use the stored form reference to reset
      form.reset();
    } catch (_err: any) {
      console.error('ContactPage: Catch block error:', _err);
      if (!successOccurred) {
        const errMsg = _err.message || t('form.errors.failedMessage');
        setStatus({ type: "error", message: errMsg });
        toast({
          title: t('form.errors.sendFailed'),
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
              <h2 className='contact-page__title'>{t('form.title')}</h2>
              <p className='contact-page__text'>
                {t('form.text')}
              </p>
              <form
                className='comments-form__form form-one'
                onSubmit={handleSubmit}
              >
                <div className='form-one__group'>
                  {status.type === "success" && (
                    <div className='form-one__control form-one__control--full'>
                      <div className='alert alert-success'>
                        {status.message}
                      </div>
                    </div>
                  )}
                  {status.type === "error" && (
                    <div className='form-one__control form-one__control--full'>
                      <div className='alert alert-danger'>
                        {status.message}
                      </div>
                    </div>
                  )}
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
                      {isSubmitting ? t('form.buttons.sending') : t('form.buttons.send')}{' '}
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
