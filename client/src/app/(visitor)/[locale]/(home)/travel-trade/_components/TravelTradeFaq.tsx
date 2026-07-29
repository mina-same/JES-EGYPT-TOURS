"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TravelTradeFaqCopy } from "./types";
import styles from "../TravelTradePage.module.css";

interface TravelTradeFaqProps {
  copy: TravelTradeFaqCopy;
}

export default function TravelTradeFaq({ copy }: TravelTradeFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={`${styles.section} ${styles.faqSection}`} aria-labelledby="travel-trade-faq-title">
      <div className="container">
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}>{copy.eyebrow}</span>
          <h2 id="travel-trade-faq-title">{copy.title}</h2>
        </div>

        <div className={styles.faqList}>
          {copy.items.map((item, index) => {
            const isOpen = openIndex === index;
            const buttonId = `travel-trade-faq-button-${index}`;
            const panelId = `travel-trade-faq-panel-${index}`;

            return (
              <article className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ""}`} key={item.question}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                  >
                    <span>{item.question}</span>
                    <ChevronDown size={20} aria-hidden="true" />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className={styles.faqPanel}
                >
                  <p>{item.answer}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
