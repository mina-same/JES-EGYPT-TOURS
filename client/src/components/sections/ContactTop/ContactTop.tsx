"use client";
import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface ContactItem {
  icon: string;
  title: string;
  text: string;
  link?: string;
}

const ContactTop: React.FC = () => {
  const { t } = useTranslation('contact');

  const contactItems: ContactItem[] = [
    {
      icon: "icon-pin",
      title: t('top.addressTitle'),
      text: t('top.addressText'),
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
      link: "tel:+208-666-0112",
    },
  ];

  return (
    <section className='contact-top section-space'>
      <div className='container'>
        <div className='row gutter-y-30'>
          {contactItems.map((item: ContactItem, index) => (
            <div
              key={index}
              className='col-lg-4 col-md-6 wow fadeInUp'
              data-wow-duration='1500ms'
              data-wow-delay={`${300 + 200 * index}ms`}
            >
              <div className='contact-top__item'>
                <div className='contact-top__item__icon'>
                  <i className={item.icon}></i>
                </div>
                <h4 className='contact-top__item__title'>
                  {item.link ? (
                    <Link href={item.link}>{item.title}</Link>
                  ) : (
                    item.title
                  )}
                </h4>
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
