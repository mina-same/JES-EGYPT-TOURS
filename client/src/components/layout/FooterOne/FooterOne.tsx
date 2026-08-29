"use client";

import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { footerOneData, type FooterDataType, type FooterLink } from "@/data/footerOneData";
import { TEL_HREF, getSocialProfiles } from "@/config/contact";
import { getLocaleFromPath, localizeInternalUrl } from "@/lib/url";
import { useTranslation } from "react-i18next";

/**
 * The newsletter widget was REMOVED, not disabled.
 *
 * It posted to the theme's demo Mailchimp endpoint
 * ("//xxxx.us13.list-manage.com/…&id=fnfgn"), so every signup was silently
 * discarded, and its consent checkbox was never read — the form submitted
 * whether or not it was ticked. Removing it also drops the
 * `react-mailchimp-subscribe` dependency from the client bundle.
 *
 * The three remaining widgets are rebalanced from xl={3} to lg={4} so they
 * fill the row instead of leaving a quarter-width gap where the form was.
 */
const FooterOne: React.FC = () => {
  const data: FooterDataType = footerOneData;
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { t } = useTranslation("common");
  // Only profiles that exist. A platform with no known account renders
  // nothing rather than an icon that opens that platform's own front page.
  const socials = getSocialProfiles();

  const renderLinks = (links: FooterLink[]) =>
    links.map((item) => (
      <li key={item.translationKey}>
        <Link href={localizeInternalUrl(item.href, locale)}>{t(item.translationKey)}</Link>
      </li>
    ));

  return (
    <footer className='main-footer'>
      <div className='main-footer__top'>
        <Container>
          <div className='main-footer__top__inner'>
            <div className='footer-widget__logo logo-retina'>
              <Link href={`/${locale}`}>
                <Image
                  src={data.logo}
                  alt='JES EGYPT TOURS'
                  title='JES EGYPT TOURS'
                  width={158}
                  height={45}
                  style={{ height: 'auto' }}
                />
              </Link>
            </div>
            <ul className='list-unstyled footer-widget__list'>
              <li>
                <div className='footer-widget__list__icon'>
                  <i className='icon-email' aria-hidden='true'></i>
                </div>
                <div className='footer-widget__list__content'>
                  <span className='footer-widget__list__subtitle'>
                    {t("footer.sendEmail")}
                  </span>
                  <Link href={`mailto:${data.contact.email}`}>
                    {data.contact.email}
                  </Link>
                </div>
              </li>
              <li>
                <div className='footer-widget__list__icon'>
                  <i className='icon-telephone' aria-hidden='true'></i>
                </div>
                <div className='footer-widget__list__content'>
                  <span className='footer-widget__list__subtitle'>
                    {t("footer.callAgent")}
                  </span>
                  {/* The label is the grouped form; the href has to be the
                      dialable one. Building `tel:` from the label shipped
                      `tel:+20 100 743 7271`, spaces and all. */}
                  <Link href={TEL_HREF}>{data.contact.phone}</Link>
                </div>
              </li>
            </ul>
          </div>
        </Container>
      </div>

      <div className='main-footer__middle'>
        <Container>
          <Row className='gutter-y-40'>
            <Col md={6} lg={4}>
              <div className='footer-widget footer-widget--about'>
                <h2 className='footer-widget__title'>{t("footer.about.title")}</h2>
                <p className='footer-widget__about-text'>{t("footer.about.text")}</p>
                {socials.length > 0 && (
                  <div className='footer-widget__social'>
                    {socials.map((social) => (
                      <Link
                        key={social.label}
                        href={social.href}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <i className={social.icon} aria-hidden='true'></i>
                        <span className='sr-only'>{social.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className='footer-widget footer-widget--links'>
                <h2 className='footer-widget__title'>{t("footer.destinationsTitle")}</h2>
                <ul className='list-unstyled footer-widget__links'>
                  {renderLinks(data.destinations)}
                </ul>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className='footer-widget footer-widget--post'>
                <h2 className='footer-widget__title'>{t("footer.usefulLinksTitle")}</h2>
                <ul className='list-unstyled footer-widget__links'>
                  {renderLinks(data.usefulLinks)}
                </ul>
              </div>
            </Col>
          </Row>
        </Container>

        <div className='main-footer__element-one'>
          <Image src={data.shape1} alt='' aria-hidden='true' />
        </div>
        <div className='main-footer__element-two'>
          <Image src={data.shape2} alt='' aria-hidden='true' />
        </div>
      </div>

      <div className='main-footer__bottom'>
        <Container>
          <div className='main-footer__bottom__inner'>
            <p className='main-footer__copyright'>
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>
            <div className='main-footer__bottom__pyment'>
              <Image
                src={data.cardImage}
                alt={t("footer.paymentMethodsAlt")}
                title={t("footer.paymentMethodsAlt")}
              />
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
};

export default FooterOne;
