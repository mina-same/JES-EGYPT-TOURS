// Single source of truth for the special-offers FAQ content.
// Used by BOTH the visible FAQ section (SpecialOffersView → ListingFaqs) and
// the FAQPage JSON-LD in page.tsx — Google requires the structured data to
// match the on-page text, so never let these drift apart again.

export interface SpecialOffersFaq {
  question: { en: string; de: string; it: string; es: string };
  answer: { en: string; de: string; it: string; es: string };
}

export const SPECIAL_OFFERS_FAQS: SpecialOffersFaq[] = [
  {
    question: { en: "What are special offer tours?", de: "Was sind Sonderangebots-Touren?", it: "Cosa sono i tour in offerta speciale?", es: "¿Qué son los tours en oferta especial?" },
    answer: {
      en: "Special offer tours are handpicked experiences with exclusive pricing or added value. They include seasonal discounts, early-bird deals, and bonus inclusions — all curated by our Egypt experts.",
      de: "Sonderangebots-Touren sind handverlesene Erlebnisse mit exklusiven Preisen oder Mehrwert. Sie umfassen Saisonrabatte, Frühbucher-Angebote und Bonus-Leistungen — alle kuratiert von unseren Ägypten-Experten.",
      it: "I tour in offerta speciale sono esperienze selezionate con prezzi esclusivi o valore aggiunto. Includono sconti stagionali, offerte early bird e inclusioni bonus — tutti curati dai nostri esperti d'Egitto.",
      es: "Los tours en oferta especial son experiencias seleccionadas con precios exclusivos o valor añadido. Incluyen descuentos de temporada, ofertas anticipadas e inclusiones adicionales — todos curados por nuestros expertos en Egipto.",
    },
  },
  {
    question: { en: "How long do special offers last?", de: "Wie lange gelten Sonderangebote?", it: "Quanto durano le offerte speciali?", es: "¿Cuánto duran las ofertas especiales?" },
    answer: {
      en: "Availability varies by tour and season. We recommend booking early — special offer tours are limited and sell out fast. Once gone, the discounted price is no longer available.",
      de: "Die Verfügbarkeit variiert je nach Tour und Saison. Wir empfehlen frühzeitiges Buchen — Sonderangebots-Touren sind begrenzt und schnell ausgebucht. Danach gilt der Rabattpreis nicht mehr.",
      it: "La disponibilità varia per tour e stagione. Ti consigliamo di prenotare in anticipo — i tour in offerta speciale sono limitati e si esauriscono rapidamente. Una volta terminati, il prezzo scontato non è più disponibile.",
      es: "La disponibilidad varía según el tour y la temporada. Recomendamos reservar con antelación — los tours en oferta especial son limitados y se agotan rápidamente. Una vez agotados, el precio con descuento ya no está disponible.",
    },
  },
  {
    question: { en: "Can I customize a special offer tour?", de: "Kann ich eine Sonderangebots-Tour anpassen?", it: "Posso personalizzare un tour in offerta speciale?", es: "¿Puedo personalizar un tour en oferta especial?" },
    answer: {
      en: "Yes. Many special offer tours can be tailored to your schedule or group. Use our Tailor-Made form for a personalized quote — we'll do our best to honour the special offer pricing.",
      de: "Ja. Viele Sonderangebots-Touren können an Ihren Zeitplan oder Ihre Gruppe angepasst werden. Nutzen Sie unser maßgeschneidertes Formular für ein persönliches Angebot — wir bemühen uns, den Sonderangebotspreis zu berücksichtigen.",
      it: "Sì. Molti tour in offerta speciale possono essere personalizzati in base al tuo programma o gruppo. Usa il nostro modulo su misura per un preventivo personalizzato — faremo del nostro meglio per rispettare il prezzo dell'offerta speciale.",
      es: "Sí. Muchos tours en oferta especial pueden adaptarse a tu horario o grupo. Usa nuestro formulario a medida para obtener un presupuesto personalizado — haremos lo posible por respetar el precio de la oferta especial.",
    },
  },
  {
    question: { en: "Is a deposit required to reserve a special offer?", de: "Wird eine Anzahlung zur Reservierung benötigt?", it: "È richiesto un deposito per prenotare un'offerta speciale?", es: "¿Se requiere un depósito para reservar una oferta especial?" },
    answer: {
      en: "A small deposit secures your spot at the special offer price. Full payment details are provided during booking. Cancellation policies vary by tour — check the tour page for specifics.",
      de: "Eine kleine Anzahlung sichert Ihren Platz zum Sonderangebotspreis. Vollständige Zahlungsdetails werden beim Buchen mitgeteilt. Stornierungsrichtlinien variieren je nach Tour — prüfen Sie die Tourseite für Details.",
      it: "Un piccolo deposito garantisce il tuo posto al prezzo dell'offerta speciale. I dettagli di pagamento completi vengono forniti durante la prenotazione. Le politiche di cancellazione variano per tour — controlla la pagina del tour per i dettagli.",
      es: "Un pequeño depósito asegura tu plaza al precio de la oferta especial. Los detalles completos de pago se proporcionan durante la reserva. Las políticas de cancelación varían según el tour — consulta la página del tour para más detalles.",
    },
  },
];
