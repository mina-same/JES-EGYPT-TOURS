"use client";
import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { googleMapDirectionsUrl } from "@/data/contactData";

interface ContactItem {
  icon: string;
  title: string;
  text: string;
  link?: string;
  /** Leaves the site (Google Maps) rather than handing off to a mail/dial
   *  client, so it needs the new-tab treatment and a spoken warning. */
  external?: boolean;
  /** Overrides the visible title for assistive tech when the title alone
   *  ("Our Address") does not say what following the link will do. */
  linkLabel?: string;
}

const ContactTop: React.FC = () => {
  const { t } = useTranslation('contact');

  const contactItems: ContactItem[] = [
    {
      icon: "icon-pin",
      title: t('top.addressTitle'),
      text: t('top.addressText'),
      // Was the only card of the three that could not be acted on.
      link: googleMapDirectionsUrl,
      external: true,
      // aria-label REPLACES the link text, so the new-tab warning has to be
      // part of it — a separate visually-hidden span would never be read out.
      linkLabel: `${t('top.addressLinkLabel')} ${t('form.newTab')}`,
    },
    {
      icon: "icon-mail-3",
      title: t('top.emailTitle'),
      text: t('top.emailText'),
      link: "mailto:info@jesegypttours.com",
    },
    {
      icon: "icon-call-3",
      title: t('top.phoneTitle'),
      text: t('top.phoneText'),
      link: "tel:+201007437271",
    },
  ];

  return (
    <section className='contact-top section-space'>
      <div className='container'>
        {/* The section had no heading at all, which left an h1 → h4 jump in the
            document outline and gave screen-reader users nothing to navigate to. */}
        <div className='sec-title text-center'>
          <h2 className='sec-title__title'>{t('top.sectionTitle')}</h2>
        </div>
        <div className='row gutter-y-30'>
          {contactItems.map((item: ContactItem, index) => (
            <div key={index} className='col-lg-4 col-md-6'>
              <div className='contact-top__item'>
                <div className='contact-top__item__icon'>
                  <i className={item.icon} aria-hidden='true'></i>
                </div>
                {/* h3, not h4: these sit under the section's h2 above. The
                    template styles `.contact-top__item__title` by class, so the
                    tag change carries no visual cost. */}
                <h3 className='contact-top__item__title'>
                  {item.link ? (
                    <Link
                      href={item.link}
                      aria-label={item.linkLabel}
                      {...(item.external
                        ? { target: "_blank", rel: "noreferrer noopener" }
                        : {})}
                    >
                      {item.title}
                    </Link>
                  ) : (
                    item.title
                  )}
                </h3>
                <p className='contact-top__item__text'>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactTop;
