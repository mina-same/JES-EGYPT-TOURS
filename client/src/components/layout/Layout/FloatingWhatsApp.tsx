"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { waHref } from "@/config/contact";

/**
 * The round WhatsApp button fixed to the corner of every visitor page.
 *
 * Its own client component so the label can be translated: Layout is rendered
 * by server pages and client views alike and has no translation hook, so the
 * screen-reader label used to be English in every language.
 */
const FloatingWhatsApp: React.FC = () => {
  const { t } = useTranslation("common");

  return (
    <a
      href={waHref("Hello JES Egypt Tours, I'd like to inquire about a tour.")}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={t("whatsappButtonLabel")}
      className="floating-whatsapp-button"
    >
      <i className="fab fa-whatsapp floating-whatsapp-icon" />
    </a>
  );
};

export default FloatingWhatsApp;
