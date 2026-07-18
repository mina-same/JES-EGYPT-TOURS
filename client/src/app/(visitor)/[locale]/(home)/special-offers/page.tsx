import { Metadata } from "next";
import SpecialOffersView from "./_views/SpecialOffersView";
import enStrings from "@/i18n/locales/en/specialOffers.json";
import deStrings from "@/i18n/locales/de/specialOffers.json";
import itStrings from "@/i18n/locales/it/specialOffers.json";
import esStrings from "@/i18n/locales/es/specialOffers.json";
import { getStaticLocaleAlternates, SEO_BASE_URL } from "@/lib/seo/localeAlternates";
import { getLocalizedStaticSlug } from "@/lib/url";
import { ogSiteDefaults } from "@/lib/ogDefaults";

const baseUrl = SEO_BASE_URL;

const strings: Record<string, typeof enStrings> = { en: enStrings, de: deStrings, it: itStrings, es: esStrings };

const STATIC_FAQS = {
  en: [
    { q: "What are special offer tours?", a: "Special offer tours are handpicked experiences with exclusive pricing or added value. They include seasonal discounts, early-bird deals, and bonus inclusions — all curated by our Egypt experts." },
    { q: "How long do special offers last?", a: "Availability varies by tour and season. We recommend booking early — special offer tours are limited and sell out fast. Once gone, the discounted price is no longer available." },
    { q: "Can I customize a special offer tour?", a: "Yes. Many special offer tours can be tailored to your schedule or group. Use our Tailor-Made form for a personalized quote — we'll do our best to honour the special offer pricing." },
    { q: "Is a deposit required to reserve a special offer?", a: "A small deposit secures your spot at the special offer price. Full payment details are provided during booking. Cancellation policies vary by tour — check the tour page for specifics." },
  ],
  de: [
    { q: "Was sind Sonderangebots-Touren?", a: "Sonderangebots-Touren sind handverlesene Erlebnisse mit exklusiven Preisen oder Mehrwert. Sie umfassen Saisonrabatte, Frühbucher-Angebote und Bonus-Leistungen — alle kuratiert von unseren Ägypten-Experten." },
    { q: "Wie lange gelten Sonderangebote?", a: "Die Verfügbarkeit variiert je nach Tour und Saison. Wir empfehlen frühzeitiges Buchen — Sonderangebots-Touren sind begrenzt und schnell ausgebucht." },
    { q: "Kann ich eine Sonderangebots-Tour anpassen?", a: "Ja. Viele Sonderangebots-Touren können an Ihren Zeitplan oder Ihre Gruppe angepasst werden. Nutzen Sie unser maßgeschneidertes Formular für ein persönliches Angebot." },
    { q: "Wird eine Anzahlung zur Reservierung benötigt?", a: "Eine kleine Anzahlung sichert Ihren Platz zum Sonderangebotspreis. Vollständige Zahlungsdetails werden beim Buchen mitgeteilt." },
  ],
  it: [
    { q: "Cosa sono i tour in offerta speciale?", a: "I tour in offerta speciale sono esperienze selezionate con prezzi esclusivi o valore aggiunto. Includono sconti stagionali, offerte early bird e inclusioni bonus." },
    { q: "Quanto durano le offerte speciali?", a: "La disponibilità varia per tour e stagione. Ti consigliamo di prenotare in anticipo — i tour in offerta speciale sono limitati e si esauriscono rapidamente." },
    { q: "Posso personalizzare un tour in offerta speciale?", a: "Sì. Molti tour in offerta speciale possono essere personalizzati in base al tuo programma o gruppo." },
    { q: "È richiesto un deposito per prenotare un'offerta speciale?", a: "Un piccolo deposito garantisce il tuo posto al prezzo dell'offerta speciale. I dettagli di pagamento completi vengono forniti durante la prenotazione." },
  ],
  es: [
    { q: "¿Qué son los tours en oferta especial?", a: "Los tours en oferta especial son experiencias seleccionadas con precios exclusivos o valor añadido. Incluyen descuentos de temporada, ofertas anticipadas e inclusiones adicionales." },
    { q: "¿Cuánto duran las ofertas especiales?", a: "La disponibilidad varía según el tour y la temporada. Recomendamos reservar con antelación — los tours en oferta especial son limitados y se agotan rápidamente." },
    { q: "¿Puedo personalizar un tour en oferta especial?", a: "Sí. Muchos tours en oferta especial pueden adaptarse a tu horario o grupo." },
    { q: "¿Se requiere un depósito para reservar una oferta especial?", a: "Un pequeño depósito asegura tu plaza al precio de la oferta especial. Los detalles completos de pago se proporcionan durante la reserva." },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = (["en", "de", "it", "es"].includes(locale) ? locale : "en") as keyof typeof STATIC_FAQS;
  const s = strings[lang] ?? enStrings;
  // Per-locale slug (e.g. /de/sonderangebote) — must match what the locale
  // actually serves (see next.config rewrites + lib/url/staticSlugs).
  const canonicalUrl = `${baseUrl}/${lang}/${getLocalizedStaticSlug("special-offers", lang)}`;

  return {
    title: s.pageTitle,
    description: s.pageDescription,
    keywords: s.seoKeywords,
    alternates: getStaticLocaleAlternates(locale, "special-offers"),
    openGraph: {
      ...ogSiteDefaults(lang),
      title: s.pageTitle,
      description: s.pageDescription,
      type: "website",
      url: canonicalUrl,
      images: [
        {
          url: `${baseUrl}/images/resources/offer-1-1.jpg`,
          alt: s.header.title,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: s.pageTitle,
      description: s.pageDescription,
      images: [`${baseUrl}/images/resources/offer-1-1.jpg`],
    },
  };
}

export default async function SpecialOffersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = (["en", "de", "it", "es"].includes(locale) ? locale : "en") as keyof typeof STATIC_FAQS;
  const faqs = STATIC_FAQS[lang];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SpecialOffersView locale={locale} />
    </>
  );
}
