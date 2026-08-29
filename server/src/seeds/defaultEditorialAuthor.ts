/**
 * The house author's profile content.
 *
 * SEED data, not the source of truth. It creates the document on a fresh
 * database and fills in fields that are still missing on an existing one; it
 * never overwrites a value that is already there. Edit the author in the
 * database and the edit sticks.
 *
 * ── What is and is not asserted here ──
 * Every claim below is one the project already supports: the role, the
 * employer, the subjects of the 23 articles actually attributed to her, and
 * the editorial handling the site already described. There are deliberately no
 * years of experience, no degrees, no guide licence, no city of residence, no
 * awards and no social profiles — none of that exists anywhere in this
 * project, and an author page is the last place to start inventing it.
 *
 * The copy is written per language, not translated. The German, Italian and
 * Spanish are not sentence-for-sentence renderings of the English; each is
 * phrased the way that language would put it.
 */
export const DEFAULT_AUTHOR_SLUG = 'madonna-roshdey';

export const DEFAULT_AUTHOR_SEED = {
  name: 'Madonna Roshdey',
  slug: DEFAULT_AUTHOR_SLUG,
  isActive: true,

  /*
   * Restored to the wording the site shipped with, at the owner's direction.
   *
   * This was briefly changed to "Travel Content Editor" to resolve a clash
   * between the author page and the article bylines. The clash was real, but
   * the resolution went the wrong way: "Travel Specialist" is the correct
   * title. The two surfaces agree on it now because both read this field —
   * the hard-coded copy in DynamicBlogDetails that caused the split is gone.
   */
  role: {
    en: 'Travel Specialist at Jes Egypt Tours',
    de: 'Reisespezialistin bei Jes Egypt Tours',
    it: 'Travel Specialist di Jes Egypt Tours',
    es: 'Especialista en viajes en Jes Egypt Tours',
  },

  /**
   * The hero introduction — the original text, restored at the owner's
   * direction. The first-hand-travel claim it makes is the author's own to
   * stand behind, and the photographs further down the page show her at the
   * sites she writes about.
   */
  bio: {
    en: "Madonna Roshdey is a travel specialist at Jes Egypt Tours, where she helps international travelers plan private tours across Egypt. The tips she shares come from trips she's actually taken, not just research she's done.",
    de: 'Madonna Roshdey ist Reisespezialistin bei Jes Egypt Tours und hilft internationalen Reisenden dabei, private Touren durch Ägypten zu planen. Die Tipps, die sie teilt, stammen aus Reisen, die sie selbst gemacht hat – nicht nur aus Recherchen am Schreibtisch.',
    it: "Madonna Roshdey è una travel specialist di Jes Egypt Tours e aiuta viaggiatori internazionali a organizzare tour privati in tutto l'Egitto. I consigli che condivide nascono da viaggi che ha realmente vissuto, non da semplici ricerche.",
    es: 'Madonna Roshdey es especialista en viajes en Jes Egypt Tours y ayuda a viajeros internacionales a planificar tours privados por todo Egipto. Los consejos que comparte vienen de viajes que ella misma ha vivido, no solo de investigaciones de escritorio.',
  },

  /*
   * The portrait that leads the hero.
   *
   * Alt text names WHO, WHAT THEY DO and WHERE — the three things a screen
   * reader user and an image crawler both need — and stops there. It is not a
   * keyword list: "Egypt tours travel expert guide Luxor Cairo" would rank no
   * better and would read as gibberish aloud.
   */
  image: {
    url: '/images/authors/madonna-roshdey-portrait-egypt-temple.webp',
    alt: {
      en: 'Madonna Roshdey, Travel Specialist at Jes Egypt Tours, at an ancient Egyptian temple',
      de: 'Madonna Roshdey, Reisespezialistin bei Jes Egypt Tours, an einem altägyptischen Tempel',
      it: 'Madonna Roshdey, Travel Specialist di Jes Egypt Tours, in un antico tempio egizio',
      es: 'Madonna Roshdey, Especialista en viajes en Jes Egypt Tours, en un antiguo templo egipcio',
    },
    caption: {
      en: 'Madonna Roshdey at an ancient Egyptian temple',
      de: 'Madonna Roshdey an einem altägyptischen Tempel',
      it: 'Madonna Roshdey in un antico tempio egizio',
      es: 'Madonna Roshdey en un antiguo templo egipcio',
    },
  },

  /*
   * The byline headshot under every article — a tight, circle-safe crop.
   *
   * The article box reads this rather than `image`: when the hero portrait was
   * swapped for the new half-length photograph, the circular byline avatar
   * inherited it and the subject came out small and off-centre inside the
   * mask. Two slots, two crops.
   */
  avatar: {
    url: '/images/authors/madonna-roshdey-author.jpg',
    alt: {
      en: 'Madonna Roshdey, Travel Specialist at Jes Egypt Tours',
      de: 'Madonna Roshdey, Reisespezialistin bei Jes Egypt Tours',
      it: 'Madonna Roshdey, Travel Specialist di Jes Egypt Tours',
      es: 'Madonna Roshdey, Especialista en viajes en Jes Egypt Tours',
    },
  },

  /*
   * The two contextual photographs, in reading order.
   *
   * The captions do a job the alt text cannot: they say why the picture is on
   * the page. Each one ties the photograph to the work — the sites the guides
   * describe, the river the itineraries follow — rather than captioning the
   * obvious ("Madonna smiling at a temple").
   */
  contextImages: [
    {
      /*
       * The Valley of the Kings, confirmed by the author.
       *
       * Naming the actual site is worth far more than "an ancient Egyptian
       * tomb" — to a reader, to an image search, and to an assistant
       * summarising the page. It is only here because it was confirmed: the
       * photograph alone does not identify which tomb, so the alt text stops
       * at the valley and does not guess a KV number.
       *
       * It also lands next to something real: "Valley of the Kings Visitor
       * Guide" is one of her published articles, so the picture shows her at
       * a site her own guide covers.
       */
      url: '/images/authors/madonna-roshdey-valley-of-the-kings-tomb-luxor.webp',
      alt: {
        en: 'Madonna Roshdey beside a wall of carved hieroglyphs in a tomb in the Valley of the Kings, Luxor',
        de: 'Madonna Roshdey vor einer Wand mit gemeißelten Hieroglyphen in einem Grab im Tal der Könige, Luxor',
        it: "Madonna Roshdey accanto a una parete di geroglifici incisi in una tomba della Valle dei Re, a Luxor",
        es: 'Madonna Roshdey junto a un muro de jeroglíficos tallados en una tumba del Valle de los Reyes, en Luxor',
      },
      caption: {
        en: 'In the Valley of the Kings, one of the sites her visitor guides cover.',
        de: 'Im Tal der Könige – einer der Orte, die ihre Besucherinformationen behandeln.',
        it: 'Nella Valle dei Re, uno dei luoghi di cui parlano le sue guide pratiche.',
        es: 'En el Valle de los Reyes, uno de los lugares que tratan sus guías prácticas.',
      },
    },
    {
      url: '/images/authors/madonna-roshdey-luxor-nile-bridge.webp',
      alt: {
        en: 'Madonna Roshdey on the Nile bridge in Luxor, Egypt',
        de: 'Madonna Roshdey auf der Nilbrücke in Luxor, Ägypten',
        it: 'Madonna Roshdey sul ponte sul Nilo a Luxor, in Egitto',
        es: 'Madonna Roshdey en el puente sobre el Nilo en Luxor, Egipto',
      },
      caption: {
        en: 'On the Nile at Luxor, the stretch most cruise itineraries are built around.',
        de: 'Am Nil bei Luxor – dem Abschnitt, um den herum die meisten Kreuzfahrtrouten aufgebaut sind.',
        it: 'Sul Nilo a Luxor, il tratto attorno a cui è costruita la maggior parte degli itinerari in crociera.',
        es: 'En el Nilo a su paso por Luxor, el tramo sobre el que se arma la mayoría de los itinerarios de crucero.',
      },
    },
  ],

  organisation: {
    en: 'Jes Egypt Tours',
    de: 'Jes Egypt Tours',
    it: 'Jes Egypt Tours',
    es: 'Jes Egypt Tours',
  },

  contentFocus: {
    en: 'Egypt travel planning, visitor guides, cultural sites',
    de: 'Reiseplanung Ägypten, Besucherinformationen, Kulturstätten',
    it: 'Organizzazione di viaggi in Egitto, guide pratiche, siti culturali',
    es: 'Planificación de viajes a Egipto, guías prácticas, sitios culturales',
  },


  /** Short subject chips under the hero intro. Kept to four. */
  topics: [
    { en: 'Egypt travel', de: 'Ägypten-Reisen', it: 'Viaggi in Egitto', es: 'Viajes a Egipto' },
    { en: 'Trip planning', de: 'Reiseplanung', it: 'Organizzazione del viaggio', es: 'Planificación del viaje' },
    { en: 'Visitor guides', de: 'Besucherinformationen', it: 'Guide pratiche', es: 'Guías prácticas' },
    { en: 'Cultural sites', de: 'Kulturstätten', it: 'Siti culturali', es: 'Sitios culturales' },
  ],

  about: [
    {
      en: 'Her work sits between a brochure and a guidebook. An article on the Valley of the Kings explains which tombs the standard ticket covers and which cost extra; one on the Nile starts with what the river means to the places along it and only then gets to cruise itineraries. The point is that a reader finishes knowing what to expect.',
      de: 'Ihre Arbeit liegt zwischen Prospekt und Reiseführer. Ein Text über das Tal der Könige erklärt, welche Gräber im Standardticket enthalten sind und für welche man extra zahlt; ein Text über den Nil beginnt damit, was der Fluss für die Orte an seinen Ufern bedeutet, und kommt erst dann zu den Kreuzfahrtrouten. Am Ende soll der Leser wissen, was ihn erwartet.',
      it: "Il suo lavoro sta tra la brochure e la guida. Un articolo sulla Valle dei Re spiega quali tombe rientrano nel biglietto ordinario e per quali serve un supplemento; uno sul Nilo parte da che cosa rappresenta il fiume per i luoghi che attraversa e solo dopo arriva agli itinerari delle crociere. Il senso è che chi legge finisca sapendo che cosa aspettarsi.",
      es: 'Su trabajo está entre el folleto y la guía. Un artículo sobre el Valle de los Reyes explica qué tumbas cubre la entrada general y cuáles llevan suplemento; uno sobre el Nilo empieza por lo que significa el río para los lugares por los que pasa y solo después llega a los itinerarios de crucero. La idea es que quien lo lea termine sabiendo qué va a encontrarse.',
    },
    {
      en: 'Most of what she edits is written for international visitors: people planning a first trip to Egypt, and returning travellers after detail on a particular site or region. Prices, opening hours and access rules change often enough in Egypt that she treats them as provisional and says so in the text, rather than publishing a number that reads as settled.',
      de: 'Das meiste richtet sich an internationale Besucher – an Menschen, die zum ersten Mal nach Ägypten fahren, und an Wiederkehrende, die Details zu einem bestimmten Ort oder einer Region suchen. Preise, Öffnungszeiten und Zutrittsregeln ändern sich in Ägypten so häufig, dass sie diese Angaben als vorläufig behandelt und das im Text auch kenntlich macht, statt eine Zahl zu veröffentlichen, die endgültig wirkt.',
      it: 'Quasi tutto è pensato per visitatori stranieri: chi organizza il primo viaggio in Egitto e chi torna cercando dettagli su un sito o una regione. Prezzi, orari e regole di accesso cambiano abbastanza spesso da indurla a trattarli come dati provvisori e a dirlo nel testo, invece di pubblicare una cifra che sembri definitiva.',
      es: 'Casi todo se dirige a visitantes internacionales: quienes preparan su primer viaje a Egipto y quienes vuelven buscando detalle sobre un sitio o una región. Los precios, los horarios y las condiciones de acceso cambian con la frecuencia suficiente como para tratarlos como datos provisionales y decirlo en el texto, en lugar de publicar una cifra que parezca firme.',
    },
  ],

  /*
   * Areas of expertise — SUBJECTS, not principles.
   *
   * There are four, which is also what makes the grid balance: the previous
   * five cards left a hole in the last row. The fifth card was "People-first
   * content", which is an editorial stance rather than a subject anyone can
   * be expert in; it belongs in `approach` below, and that is where it went.
   *
   * `icon` names a lucide glyph — the icon set the tour pages already use.
   */
  expertise: [
    {
      icon: 'map',
      heading: {
        en: 'Egypt trip planning',
        de: 'Reiseplanung in Ägypten',
        it: 'Organizzare un viaggio in Egitto',
        es: 'Planificar un viaje a Egipto',
      },
      body: {
        en: 'How a trip fits together: how many days each region needs, what to see first, and how to order Cairo, Luxor and Aswan without spending the trip in transit.',
        de: 'Wie eine Reise zusammenpasst: wie viele Tage jede Region braucht, was zuerst kommt und in welcher Reihenfolge Kairo, Luxor und Assuan sinnvoll sind, ohne die halbe Reise unterwegs zu verbringen.',
        it: 'Come si tiene insieme un viaggio: quanti giorni chiede ogni regione, da dove conviene cominciare e in che ordine mettere Il Cairo, Luxor e Assuan senza passare la vacanza in trasferimento.',
        es: 'Cómo encaja un viaje: cuántos días pide cada región, por dónde conviene empezar y en qué orden colocar El Cairo, Luxor y Asuán sin pasarse el viaje en desplazamientos.',
      },
    },
    {
      icon: 'compass',
      heading: {
        en: 'Practical visitor guidance',
        de: 'Praktische Hinweise vor Ort',
        it: 'Indicazioni pratiche sul posto',
        es: 'Orientación práctica sobre el terreno',
      },
      body: {
        en: 'What to expect once you are there: getting between sites, what to wear, tipping, and when the crowds arrive and thin out again.',
        de: 'Was vor Ort auf einen zukommt: die Wege zwischen den Stätten, passende Kleidung, Trinkgeld und die Tageszeiten, zu denen es voll wird und wieder leerer.',
        it: 'Che cosa aspettarsi una volta lì: gli spostamenti tra un sito e l\'altro, come vestirsi, le mance e le ore in cui la folla arriva e poi si dirada.',
        es: 'Qué esperar una vez allí: cómo moverse entre sitios, cómo vestir, las propinas y a qué horas se llena y se vacía cada lugar.',
      },
    },
    {
      icon: 'landmark',
      heading: {
        en: 'Cultural sites and museums',
        de: 'Kulturstätten und Museen',
        it: 'Siti culturali e musei',
        es: 'Sitios culturales y museos',
      },
      body: {
        en: 'Temples, tombs and museums across Upper and Lower Egypt, including what earns a detour and what a rushed visit tends to miss.',
        de: 'Tempel, Gräber und Museen in Ober- und Unterägypten – auch, wofür sich ein Umweg lohnt und was bei einem eiligen Besuch meist untergeht.',
        it: "Templi, tombe e musei dell'Alto e del Basso Egitto, compreso ciò che vale una deviazione e ciò che una visita di corsa si lascia sfuggire.",
        es: 'Templos, tumbas y museos del Alto y el Bajo Egipto, incluido lo que merece un desvío y lo que suele perderse en una visita apresurada.',
      },
    },
    {
      icon: 'ticket',
      heading: {
        en: 'Tickets, timing and logistics',
        de: 'Tickets, Zeiten und Abläufe',
        it: 'Biglietti, orari e logistica',
        es: 'Entradas, horarios y logística',
      },
      body: {
        en: 'What a ticket actually covers, when sites open, and which extras are paid for separately — always with the caveat that these details move.',
        de: 'Was ein Ticket wirklich abdeckt, wann die Stätten öffnen und welche Extras separat bezahlt werden – stets mit dem Hinweis, dass sich diese Angaben ändern.',
        it: 'Che cosa copre davvero un biglietto, gli orari di apertura e quali supplementi si pagano a parte, sempre con l\'avvertenza che sono dati che cambiano.',
        es: 'Qué cubre realmente una entrada, cuándo abren los sitios y qué suplementos se pagan aparte, siempre con la advertencia de que son datos que cambian.',
      },
    },
  ],

  /*
   * How she works — the dark section.
   *
   * This replaces a block of general editorial policy that described the SITE
   * rather than the author, on the one page whose subject is a person. Nothing
   * here claims a process the project has not already described: research
   * before drafting, a traveller's order of questions, time-sensitive details
   * flagged as such, and a clarity/consistency check before publishing.
   */
  approach: [
    {
      icon: 'search',
      heading: {
        en: 'Research first',
        de: 'Erst recherchieren',
        it: 'Prima la ricerca',
        es: 'Primero documentarse',
      },
      body: {
        en: 'Information is gathered and ordered before anything is drafted, so an article follows the questions a traveller actually asks rather than the order the research happened to arrive in.',
        de: 'Erst wird recherchiert und sortiert, dann geschrieben. So folgt ein Artikel den Fragen, die Reisende tatsächlich stellen, und nicht der Reihenfolge, in der die Informationen zusammenkamen.',
        it: "Prima si raccolgono e si ordinano le informazioni, poi si scrive: così l'articolo segue le domande che si pone davvero chi viaggia, non l'ordine in cui è arrivata la documentazione.",
        es: 'Primero se reúne y se ordena la información, y después se escribe. Así el artículo sigue las preguntas que se hace quien viaja y no el orden en que apareció la documentación.',
      },
    },
    {
      icon: 'users',
      heading: {
        en: 'Written for the visitor',
        de: 'Aus Sicht der Besucher',
        it: 'Dal punto di vista di chi visita',
        es: 'Desde el punto de vista del visitante',
      },
      body: {
        en: 'The starting point is what someone has to decide — how long to stay, what to book ahead, what a ticket includes — not whatever is easiest to write about.',
        de: 'Ausgangspunkt ist, was jemand entscheiden muss: wie lange bleiben, was vorab buchen, was im Ticket enthalten ist. Nicht das, worüber sich am leichtesten schreiben lässt.',
        it: 'Il punto di partenza è quello che una persona deve decidere: quanto fermarsi, che cosa prenotare in anticipo, che cosa comprende il biglietto. Non ciò di cui è più comodo scrivere.',
        es: 'El punto de partida es lo que alguien tiene que decidir: cuánto quedarse, qué reservar con antelación, qué incluye la entrada. No aquello sobre lo que resulta más cómodo escribir.',
      },
    },
    {
      icon: 'clock',
      heading: {
        en: 'Details that move',
        de: 'Angaben, die sich ändern',
        it: 'I dati che cambiano',
        es: 'Los datos que cambian',
      },
      body: {
        en: 'Opening hours, prices and access conditions are treated as time-sensitive. Where a detail is likely to have shifted, the article says so instead of presenting it as fixed.',
        de: 'Öffnungszeiten, Preise und Zutrittsregeln gelten als kurzlebige Angaben. Wo sich etwas geändert haben dürfte, steht das im Text, statt die Zahl als feststehend auszugeben.',
        it: 'Orari, prezzi e condizioni di accesso sono considerati dati deperibili. Dove è probabile che qualcosa sia cambiato, il testo lo dice invece di presentarlo come definitivo.',
        es: 'Los horarios, los precios y las condiciones de acceso se tratan como datos perecederos. Cuando es probable que algo haya cambiado, el texto lo indica en lugar de darlo por fijo.',
      },
    },
    {
      icon: 'check-circle',
      heading: {
        en: 'Checked before publishing',
        de: 'Vor der Veröffentlichung geprüft',
        it: 'Verificato prima di pubblicare',
        es: 'Revisado antes de publicar',
      },
      body: {
        en: 'Every article is read through for clarity and factual consistency before it goes live, and revisited when something significant changes.',
        de: 'Jeder Artikel wird vor der Veröffentlichung auf Verständlichkeit und sachliche Stimmigkeit gelesen und überarbeitet, wenn sich Wesentliches ändert.',
        it: 'Ogni articolo viene riletto per chiarezza e coerenza dei fatti prima di andare online, e ripreso quando cambia qualcosa di rilevante.',
        es: 'Cada artículo se relee para comprobar su claridad y su coherencia factual antes de publicarse, y se retoma cuando cambia algo relevante.',
      },
    },
  ],
};

/** The seed fields that may be filled in on an EXISTING document when absent. */
export const BACKFILLABLE_AUTHOR_FIELDS = [
  'organisation',
  'contentFocus',
  'topics',
  'about',
  'expertise',
  'approach',
] as const;

/**
 * Fields from an earlier shape of this page, removed once.
 *
 * `editorialFocus` became `expertise` (and lost its fifth, non-subject card);
 * `aboutTitle` is composed in the page from the author's name now; the
 * `articlesNote` paragraph under the article grid said only that the author
 * writes articles and the site publishes them, which the section around it
 * already made obvious.
 */
export const RETIRED_AUTHOR_FIELDS = [
  'editorialFocus',
  'aboutTitle',
  'articlesNote',
  'gallery',
  // The biography column holds the profile card, not a photograph: with three
  // real pictures there was no honest use for a fourth slot, and reserving one
  // would have left an empty frame on a finished page.
  'aboutImage',
  // The "Writes in" row was removed from the profile card: for an author whose
  // articles are published in four languages it stated a fact about her
  // drafting language that read, on the German page, as a limitation.
  'languages',
] as const;
