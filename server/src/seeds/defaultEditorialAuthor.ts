/**
 * The house author's profile content.
 *
 * This is SEED data, not the source of truth. It creates the document on a
 * fresh database and fills in fields that are still missing on an existing one;
 * it never overwrites a value that is already there. Edit the author in the
 * database and the edit sticks.
 *
 * Everything here used to be hard-coded English JSX in
 * client/src/app/(visitor)/[locale]/(home)/authors/madonna-roshdey/page.tsx —
 * one bespoke page for one author, in one language. It lives here now so that
 * app/(visitor)/[locale]/(home)/authors/[slug] can render ANY author from data:
 * adding a second author is a matter of writing this content for them, with no
 * new route and no new component.
 */
export const DEFAULT_AUTHOR_SLUG = 'madonna-roshdey';

export const DEFAULT_AUTHOR_SEED = {
  name: 'Madonna Roshdey',
  slug: DEFAULT_AUTHOR_SLUG,
  isActive: true,

  role: {
    en: 'Travel Specialist at Jes Egypt Tours',
    de: 'Reisespezialistin bei Jes Egypt Tours',
    it: 'Travel Specialist di Jes Egypt Tours',
    es: 'Especialista en viajes en Jes Egypt Tours',
  },

  bio: {
    en: 'Madonna works on Egypt travel content for Jes Egypt Tours, with a focus on helping international visitors plan their trips with realistic expectations and practical information. Her aim is to make Egypt more accessible to first-time and returning travelers alike — without overselling or underselling the experience.',
    de: 'Madonna betreut die Ägypten-Reiseinhalte von Jes Egypt Tours. Ihr Schwerpunkt liegt darauf, internationalen Besuchern bei der Reiseplanung mit realistischen Erwartungen und praktischen Informationen zu helfen. Ihr Ziel ist es, Ägypten für Erstreisende wie für Wiederkehrende zugänglicher zu machen — ohne das Erlebnis zu beschönigen oder kleinzureden.',
    it: "Madonna cura i contenuti di viaggio sull'Egitto per Jes Egypt Tours, con l'obiettivo di aiutare i visitatori internazionali a organizzare il viaggio con aspettative realistiche e informazioni concrete. Il suo scopo è rendere l'Egitto più accessibile sia a chi ci va per la prima volta sia a chi ritorna — senza esagerare né sminuire l'esperienza.",
    es: 'Madonna se ocupa de los contenidos de viaje sobre Egipto en Jes Egypt Tours, con el objetivo de ayudar a los visitantes internacionales a planificar su viaje con expectativas realistas e información práctica. Su propósito es hacer Egipto más accesible tanto para quienes viajan por primera vez como para quienes regresan, sin exagerar ni minimizar la experiencia.',
  },

  image: {
    url: '/images/authors/madonna-roshdey-author.jpg',
    alt: {
      en: 'Madonna Roshdey, Travel Specialist at Jes Egypt Tours',
      de: 'Madonna Roshdey, Reisespezialistin bei Jes Egypt Tours',
      it: 'Madonna Roshdey, Travel Specialist di Jes Egypt Tours',
      es: 'Madonna Roshdey, Especialista en viajes en Jes Egypt Tours',
    },
  },

  organisation: {
    en: 'Jes Egypt Tours',
    de: 'Jes Egypt Tours',
    it: 'Jes Egypt Tours',
    es: 'Jes Egypt Tours',
  },

  contentFocus: {
    en: 'Egypt travel planning, visitor guides, cultural sites',
    de: 'Ägypten-Reiseplanung, Besucherführer, Kulturstätten',
    it: 'Pianificazione di viaggi in Egitto, guide per visitatori, siti culturali',
    es: 'Planificación de viajes a Egipto, guías para visitantes, sitios culturales',
  },

  languages: {
    en: 'English',
    de: 'Englisch',
    it: 'Inglese',
    es: 'Inglés',
  },

  aboutTitle: {
    en: 'Egypt travel content for real visitors',
    de: 'Ägypten-Reiseinhalte für echte Besucher',
    it: 'Contenuti di viaggio sull\'Egitto per veri visitatori',
    es: 'Contenidos de viaje sobre Egipto para visitantes reales',
  },

  about: [
    {
      en: 'Madonna contributes visitor-focused travel guides, destination overviews, and practical planning articles for Jes Egypt Tours. The content is written for international travelers — people planning a first trip to Egypt or returning visitors who want more detail on specific sites, regions, or logistics.',
      de: 'Madonna schreibt besucherorientierte Reiseführer, Zielgebietsüberblicke und praktische Planungsartikel für Jes Egypt Tours. Die Inhalte richten sich an internationale Reisende — an Menschen, die ihre erste Ägyptenreise planen, und an Wiederkehrende, die mehr Details zu bestimmten Stätten, Regionen oder zur Logistik suchen.',
      it: 'Madonna scrive guide di viaggio pensate per i visitatori, panoramiche sulle destinazioni e articoli pratici di pianificazione per Jes Egypt Tours. I contenuti si rivolgono a viaggiatori internazionali: chi sta preparando il primo viaggio in Egitto e chi ritorna cercando maggiori dettagli su siti, regioni o aspetti logistici specifici.',
      es: 'Madonna escribe guías de viaje pensadas para el visitante, panorámicas de destinos y artículos prácticos de planificación para Jes Egypt Tours. Los contenidos están dirigidos a viajeros internacionales: quienes preparan su primer viaje a Egipto y quienes vuelven buscando más detalle sobre sitios, regiones o aspectos logísticos concretos.',
    },
    {
      en: 'The articles cover a range of topics: how to plan a Nile cruise, what to see in Luxor in two days, how to visit the Valley of the Kings, entry requirements, common questions about safety, and destination comparisons that help travelers make informed choices. The tone is direct and informative — the goal is usefulness, not enthusiasm for its own sake.',
      de: 'Die Artikel decken ein breites Themenfeld ab: wie man eine Nilkreuzfahrt plant, was man in zwei Tagen in Luxor sehen sollte, wie man das Tal der Könige besucht, Einreisebestimmungen, häufige Fragen zur Sicherheit und Vergleiche von Reisezielen, die eine fundierte Entscheidung erleichtern. Der Ton ist direkt und sachlich — es geht um Nützlichkeit, nicht um Begeisterung um ihrer selbst willen.',
      it: "Gli articoli coprono temi diversi: come organizzare una crociera sul Nilo, cosa vedere a Luxor in due giorni, come visitare la Valle dei Re, i requisiti d'ingresso, le domande frequenti sulla sicurezza e i confronti tra destinazioni che aiutano a scegliere con cognizione di causa. Il tono è diretto e informativo — l'obiettivo è l'utilità, non l'entusiasmo fine a se stesso.",
      es: 'Los artículos abarcan temas variados: cómo planificar un crucero por el Nilo, qué ver en Luxor en dos días, cómo visitar el Valle de los Reyes, los requisitos de entrada, las dudas habituales sobre seguridad y comparativas de destinos que ayudan a decidir con criterio. El tono es directo e informativo: el objetivo es la utilidad, no el entusiasmo por sí mismo.',
    },
    {
      en: "Where details like prices, opening hours, or permit requirements are included, the articles note that these are variable and should be confirmed before travel. Egypt's tourism landscape changes frequently enough that current accuracy matters more than publishing a specific number.",
      de: 'Wo Angaben wie Preise, Öffnungszeiten oder Genehmigungspflichten genannt werden, weisen die Artikel darauf hin, dass diese sich ändern können und vor der Reise bestätigt werden sollten. Ägyptens Tourismuslandschaft verändert sich häufig genug, dass Aktualität wichtiger ist als das Veröffentlichen einer konkreten Zahl.',
      it: 'Quando vengono indicati dettagli come prezzi, orari di apertura o permessi necessari, gli articoli segnalano che si tratta di informazioni variabili, da verificare prima di partire. Il panorama turistico egiziano cambia abbastanza spesso da rendere l\'attualità del dato più importante della pubblicazione di una cifra precisa.',
      es: 'Cuando se incluyen datos como precios, horarios de apertura o permisos necesarios, los artículos advierten de que son variables y conviene confirmarlos antes de viajar. El panorama turístico egipcio cambia con la frecuencia suficiente como para que la vigencia del dato importe más que publicar una cifra concreta.',
    },
  ],

  editorialFocus: [
    {
      icon: '🗺️',
      heading: {
        en: 'Clear travel planning',
        de: 'Klare Reiseplanung',
        it: 'Pianificazione chiara del viaggio',
        es: 'Planificación clara del viaje',
      },
      body: {
        en: 'Step-by-step guidance on how to plan an Egypt trip — from entry logistics to day-by-day itinerary structure.',
        de: 'Schritt-für-Schritt-Anleitungen zur Planung einer Ägyptenreise — von der Einreise bis zum Aufbau des Tagesprogramms.',
        it: "Indicazioni passo dopo passo per organizzare un viaggio in Egitto — dalla logistica d'ingresso alla struttura giorno per giorno dell'itinerario.",
        es: 'Orientación paso a paso para organizar un viaje a Egipto, desde los trámites de entrada hasta la estructura del itinerario día a día.',
      },
    },
    {
      icon: '🧭',
      heading: {
        en: 'Practical visitor guidance',
        de: 'Praktische Hinweise für Besucher',
        it: 'Consigli pratici per i visitatori',
        es: 'Consejos prácticos para el visitante',
      },
      body: {
        en: 'Honest information about what to expect on the ground: transport, dress codes, tipping, crowds, and timing.',
        de: 'Ehrliche Informationen darüber, was vor Ort zu erwarten ist: Transport, Kleiderordnung, Trinkgeld, Andrang und Timing.',
        it: 'Informazioni oneste su cosa aspettarsi sul posto: trasporti, abbigliamento, mance, affollamento e tempistiche.',
        es: 'Información honesta sobre qué esperar sobre el terreno: transporte, código de vestimenta, propinas, aglomeraciones y horarios.',
      },
    },
    {
      icon: '🏛️',
      heading: {
        en: 'Egyptian destinations and cultural sites',
        de: 'Ägyptische Reiseziele und Kulturstätten',
        it: 'Destinazioni egiziane e siti culturali',
        es: 'Destinos egipcios y sitios culturales',
      },
      body: {
        en: 'Coverage of temples, tombs, museums, and lesser-known sites across Upper and Lower Egypt.',
        de: 'Tempel, Gräber, Museen und weniger bekannte Stätten in Ober- und Unterägypten.',
        it: "Templi, tombe, musei e luoghi meno noti dell'Alto e del Basso Egitto.",
        es: 'Templos, tumbas, museos y lugares menos conocidos del Alto y el Bajo Egipto.',
      },
    },
    {
      icon: '🎟️',
      heading: {
        en: 'Tickets, timing, and logistics',
        de: 'Tickets, Zeiten und Logistik',
        it: 'Biglietti, orari e logistica',
        es: 'Entradas, horarios y logística',
      },
      body: {
        en: 'Ticket prices, opening hours, and booking details — with a note that these details change and should be verified before travel.',
        de: 'Eintrittspreise, Öffnungszeiten und Buchungsdetails — mit dem Hinweis, dass sich diese Angaben ändern und vor der Reise geprüft werden sollten.',
        it: "Prezzi dei biglietti, orari di apertura e dettagli di prenotazione — con l'avvertenza che questi dati cambiano e vanno verificati prima di partire.",
        es: 'Precios de entradas, horarios de apertura y detalles de reserva, con la advertencia de que estos datos cambian y conviene verificarlos antes de viajar.',
      },
    },
    {
      icon: '🤝',
      heading: {
        en: 'People-first content',
        de: 'Inhalte für Menschen zuerst',
        it: 'Contenuti pensati per le persone',
        es: 'Contenidos centrados en las personas',
      },
      body: {
        en: 'Writing aimed at real travelers with real questions, not generic marketing copy or inflated superlatives.',
        de: 'Texte für echte Reisende mit echten Fragen — keine allgemeinen Werbetexte und keine aufgeblasenen Superlative.',
        it: 'Testi rivolti a viaggiatori reali con domande reali, non testi promozionali generici o superlativi gonfiati.',
        es: 'Textos dirigidos a viajeros reales con preguntas reales, no textos publicitarios genéricos ni superlativos inflados.',
      },
    },
  ],

  articlesNote: {
    en: 'Articles written and edited by Madonna Roshdey are published in the Jes Egypt Tours travel blog. The blog covers destinations, itineraries, cultural guidance, and practical planning topics for travelers visiting Egypt.',
    de: 'Von Madonna Roshdey verfasste und redigierte Artikel erscheinen im Reiseblog von Jes Egypt Tours. Der Blog behandelt Reiseziele, Routen, kulturelle Hinweise und praktische Planungsthemen für Reisende nach Ägypten.',
    it: 'Gli articoli scritti e curati da Madonna Roshdey vengono pubblicati sul blog di viaggio di Jes Egypt Tours. Il blog tratta destinazioni, itinerari, indicazioni culturali e temi pratici di pianificazione per chi visita l\'Egitto.',
    es: 'Los artículos escritos y editados por Madonna Roshdey se publican en el blog de viajes de Jes Egypt Tours. El blog trata destinos, itinerarios, orientación cultural y temas prácticos de planificación para quienes visitan Egipto.',
  },
};

/** The seed fields that may be filled in on an EXISTING document when absent. */
export const BACKFILLABLE_AUTHOR_FIELDS = [
  'organisation',
  'contentFocus',
  'languages',
  'aboutTitle',
  'about',
  'editorialFocus',
  'articlesNote',
] as const;
