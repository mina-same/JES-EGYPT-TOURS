"use client";
import React from "react";
import { TEL_HREF, PHONE_DISPLAY } from "@/config/contact";
import { Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { googleMapDirectionsUrl } from "@/data/contactData";
import styles from "./ContactTop.module.css";

interface ContactItem {
  key: string;
  Icon: LucideIcon;
  title: string;
  text: string;
  href: string;
  /** Leaves the site (Google Maps) rather than handing off to a mail or dial
   *  client, so it opens in a new tab and says so. */
  external?: boolean;
  /** Visually hidden, appended INSIDE the anchor so it extends the link's
   *  accessible name ("Our Address on Google Maps") instead of replacing it.
   *  An aria-label on the anchor would override the visible title and would be
   *  what heading navigation announces. */
  hiddenSuffix?: string;
}

const ContactTop: React.FC = () => {
  const { t } = useTranslation("contact");

  const contactItems: ContactItem[] = [
    {
      key: "address",
      Icon: MapPin,
      title: t("top.addressTitle"),
      text: t("top.addressText"),
      href: googleMapDirectionsUrl,
      external: true,
      hiddenSuffix: `${t("top.addressLinkLabel")} ${t("form.newTab")}`,
    },
    {
      key: "email",
      Icon: Mail,
      title: t("top.emailTitle"),
      text: t("top.emailText"),
      href: "mailto:info@jesegypttours.com",
    },
    {
      key: "phone",
      Icon: Phone,
      title: PHONE_DISPLAY,
      text: t("top.phoneText"),
      href: TEL_HREF,
    },
  ];

  return (
    <section
      className={`${styles.section} section-space`}
      aria-labelledby='contact-top-title'
    >
      <div className='container'>
        <div className={styles.head}>
          <h2 id='contact-top-title' className={styles.title}>
            {t("top.sectionTitle")}
          </h2>
        </div>

        {/* role="list" is not redundant: Safari/VoiceOver drops the implicit
            list role once `list-style: none` is applied, and the grid needs it. */}
        <ul className={styles.grid} role='list'>
          {contactItems.map(
            ({ key, Icon, title, text, href, external, hiddenSuffix }) => (
              <li key={key} className={styles.card}>
                <span className={styles.chip}>
                  <Icon size={20} aria-hidden={true} />
                </span>
                {/* h3 sits under the section's h2 above; the anchor lives
                    inside it so heading navigation still finds a real heading. */}
                <h3 className={styles.cardTitle}>
                  <a
                    className={styles.cardLink}
                    href={href}
                    {...(external
                      ? { target: "_blank", rel: "noreferrer noopener" }
                      : {})}
                  >
                    {title}
                    {hiddenSuffix && (
                      <span className={styles.srOnly}> {hiddenSuffix}</span>
                    )}
                  </a>
                </h3>
                <p className={styles.cardText}>{text}</p>
              </li>
            )
          )}
        </ul>
      </div>
    </section>
  );
};

export default ContactTop;
