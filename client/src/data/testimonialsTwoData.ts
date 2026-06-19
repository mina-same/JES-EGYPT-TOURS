import image3 from '@/assets/images/resources/about-4-1.png';

export interface TestimonialItem {
  id: number;
  name: { en: string; de: string; it: string; es: string };
  text: { en: string; de: string; it: string; es: string };
}

const testimonialsTwoData = {
  tagline: 'Clients Testimonial',
  title: 'Recent Clients',
  highlighted: 'Feedback',
  elementImage: image3,
  testimonials: [
    {
      id: 1,
      name: {
        en: 'James & Patricia Holloway',
        de: 'Markus & Sabine Hoffmann',
        it: 'Marco & Alessandra Ferretti',
        es: 'Carlos & Isabel Domínguez',
      },
      text: {
        en: 'Two days, two cities — Alexandria and the Grand Egyptian Museum with Amr as our guide. He knew the history, answered every question properly, and made the whole thing feel personal rather than scripted. Logistics were smooth, pacing was right. For private tours in Egypt, we\'d recommend Jes Egypt Tours without hesitation.',
        de: 'Zwei Tage, zwei Städte — Alexandrien und das Große Ägyptische Museum, mit Amr als Guide. Er kannte die Geschichte in- und auswendig, beantwortete jede Frage vernünftig und gab dem Ganzen eine persönliche Note. Organisation und Tempo haben gestimmt. Für Privattouren in Ägypten empfehlen wir Jes Egypt Tours ohne Zögern.',
        it: 'Due giorni, due città — Alessandria e il Grande Museo Egizio, con Amr come guida. Conosceva la storia nei minimi dettagli, rispondeva a ogni domanda con chiarezza e rendeva tutto molto personale. L\'organizzazione era impeccabile, i ritmi giusti. Per tour privati in Egitto, consigliamo Jes Egypt Tours senza esitazione.',
        es: 'Dos días, dos ciudades — Alejandría y el Gran Museo Egipcio, con Amr como guía. Conocía la historia a fondo, respondía cada pregunta con claridad y hacía que todo se sintiera personal. La organización fue perfecta, el ritmo también. Para tours privados en Egipto, recomendamos Jes Egypt Tours sin dudarlo.',
      },
    },
    {
      id: 2,
      name: {
        en: 'Michelle Tanaka',
        de: 'Julia Steinberg',
        it: 'Giulia Marchetti',
        es: 'Lucía Fernández',
      },
      text: {
        en: 'Today reminded me why travel matters. Jospy, Bobi, dinner together — strangers from different countries, different ages, different backgrounds, and somehow it felt like family by the end. Egypt did that. Not just the sites, but the people. I came back loving the world a little more than before.',
        de: 'Dieser Tag hat mir wieder gezeigt, warum ich überhaupt reise. Jospy, Bobi, ein gemeinsames Abendessen — Fremde aus verschiedenen Ländern, unterschiedlichen Alters, und trotzdem fühlte es sich am Ende wie Familie an. Ägypten hat das möglich gemacht. Nicht die Sehenswürdigkeiten allein, sondern die Menschen. Ich bin mit etwas mehr Liebe zur Welt nach Hause gefahren.',
        it: 'Oggi ho capito di nuovo perché amo viaggiare. Jospy, Bobi, una cena insieme — sconosciuti di paesi diversi, età diverse, e alla fine sembrava di essere in famiglia. L\'Egitto ha fatto questo. Non solo i monumenti, ma le persone. Sono tornata a casa con un po\' più d\'amore per il mondo.',
        es: 'Hoy recordé por qué me gusta viajar. Jospy, Bobi, una cena juntos — desconocidos de distintos países, distintas edades, y al final parecía familia. Egipto hizo eso. No solo los monumentos, sino las personas. Volví a casa queriendo un poco más al mundo.',
      },
    },
    {
      id: 3,
      name: {
        en: 'David Kowalski',
        de: 'Thomas Brückner',
        it: 'Roberto Conti',
        es: 'Javier Morales',
      },
      text: {
        en: 'Cairo in a day — Pyramids, Sphinx, the Egyptian Museum, a Nile boat, papyrus making, Coptic churches, a synagogue. A lot to fit into one trip, but it flowed well. Our guide knew the history and talked about modern Egypt too, not just the ancient stuff. We drove from Hurghada — 25 hours there and back. Exhausting. Still, watching my kids experience all of this made every hour worth it.',
        de: 'Kairo an einem Tag — Pyramiden, Sphinx, das Ägyptische Museum, eine Nilfahrt, Papyrusherstellung, koptische Kirchen, eine Synagoge. Viel für einen einzigen Tag, aber es hat sich nie gehetzt angefühlt. Unser Guide hat nicht nur Geschichte erklärt, sondern auch über das heutige Ägypten gesprochen. Die Fahrt aus Hurghada war lang — fast einen ganzen Tag hin und zurück. Anstrengend. Aber als ich gesehen habe, wie meine Kinder das alles in sich aufgenommen haben, war jede Stunde es wert.',
        it: 'Il Cairo in un giorno — Piramidi, Sfinge, il Museo Egizio, una barca sul Nilo, la lavorazione del papiro, chiese copte, una sinagoga. Tanto in poco tempo, ma non si è mai sentita la fretta. La nostra guida non si è limitata alla storia antica: ha parlato anche dell\'Egitto di oggi. Eravamo partiti da Hurghada — quasi un giorno di viaggio andata e ritorno. Stancante. Ma vedere i miei figli vivere quella giornata valeva ogni ora.',
        es: 'El Cairo en un día — Pirámides, Esfinge, el Museo Egipcio, un paseo en barco por el Nilo, elaboración de papiro, iglesias coptas, una sinagoga. Mucho para un solo día, pero nunca se sintió apresurado. Nuestro guía no se limitó a la historia antigua; también habló del Egipto de hoy. Veníamos desde Hurghada — casi un día entero de viaje ida y vuelta. Agotador. Pero ver a mis hijos vivir esa experiencia valió cada hora.',
      },
    },
    {
      id: 4,
      name: {
        en: 'Robert & Susan Fletcher',
        de: 'Hans & Ingrid Neumann',
        it: 'Luca & Paola Mancini',
        es: 'Miguel & Rosa Herrera',
      },
      text: {
        en: 'Five days on the Nile, Luxor to Aswan, with Maged as our guide. He answered everything — including the silly questions — without losing patience once. The cruise was excellent, but honestly, Maged was the reason it felt that good.',
        de: 'Fünf Tage auf dem Nil, von Luxor nach Assuan, mit Maged als Guide. Er hat alles beantwortet — auch die Fragen, über die man sich fast schämt. Ohne Ungeduld, ohne Abkürzungen. Die Kreuzfahrt war schön, aber ehrlich gesagt war Maged der Grund, warum sie so gut war.',
        it: 'Cinque giorni sul Nilo, da Luxor ad Assuan, con Maged come guida. Ha risposto a tutto — anche alle domande più banali — senza mai perdere la pazienza. La crociera era bellissima, ma è stato Maged a renderla davvero speciale.',
        es: 'Cinco días por el Nilo, de Luxor a Asuán, con Maged como guía. Respondió a todo — incluso las preguntas más tontas — sin perder la paciencia ni una vez. El crucero fue excelente, pero la verdad es que Maged fue la razón por la que fue tan bueno.',
      },
    },
    {
      id: 5,
      name: {
        en: 'Karen & Tom Whitfield',
        de: 'Stefan & Claudia Vogel',
        it: 'Davide & Francesca Ricci',
        es: 'Pablo & Carmen Vázquez',
      },
      text: {
        en: 'Cairo, Aswan, Luxor — four guides across ten days, and every single one delivered. Sara made the first day easy. Reda brought the Pyramids and GEM to life. Yousi kept Aswan entertaining while actually teaching us things. Ghada in Luxor was the best of all — Valley of the Kings with someone who genuinely loves the history. We came home different.',
        de: 'Kairo, Assuan, Luxor — vier Guides in zehn Tagen, und alle haben geliefert. Sara hat den ersten Tag unkompliziert gemacht. Reda hat die Pyramiden und das GEM wirklich zum Leben erweckt. Yousi hat Assuan unterhaltsam und lehrreich zugleich gemacht. Ghada in Luxor war die Beste — das Tal der Könige mit jemandem, der die Geschichte wirklich liebt. Wir sind verändert nach Hause geflogen.',
        it: 'Il Cairo, Assuan, Luxor — quattro guide in dieci giorni, e ognuna all\'altezza. Sara ha reso il primo giorno semplice e piacevole. Reda ha dato vita alle Piramidi e al GEM. Yousi ad Assuan era divertente e istruttiva allo stesso tempo. Ghada a Luxor era la migliore — la Valle dei Re con qualcuno che ama davvero la storia. Siamo tornati a casa diversi.',
        es: 'El Cairo, Asuán, Luxor — cuatro guías en diez días, y todos estuvieron a la altura. Sara hizo que el primer día fuera fácil. Reda dio vida a las Pirámides y al GEM. Yousi en Asuán fue entretenida y didáctica a la vez. Ghada en Luxor fue la mejor — el Valle de los Reyes con alguien que de verdad ama la historia. Volvimos a casa siendo otras personas.',
      },
    },
    {
      id: 6,
      name: {
        en: 'Amanda Pierce',
        de: 'Katharina Lindemann',
        it: 'Valentina Esposito',
        es: 'Sofía Delgado',
      },
      text: {
        en: 'Cairo with Cristina as our guide — Pyramids, Sphinx, the GEM, historic mosques, Coptic churches, Khan El Khalili. She didn\'t walk us through monuments and dates. She made us feel the place. That\'s a different thing entirely. The whole trip was well-organized and smooth, but Cristina is the reason we\'re still thinking about Cairo weeks later.',
        de: 'Kairo mit Cristina — Pyramiden, Sphinx, das GEM, historische Moscheen, koptische Kirchen, Khan El Khalili. Sie hat uns nicht einfach durch Monumente und Jahreszahlen geführt. Sie hat uns das Gefühl gegeben, wirklich dort zu sein. Das ist etwas anderes. Die Reise war gut organisiert, aber Cristina ist der Grund, warum wir noch Wochen später an Kairo denken.',
        it: 'Il Cairo con Cristina come guida — Piramidi, Sfinge, il GEM, le moschee storiche, le chiese copte, Khan El Khalili. Non ci ha portati da un monumento all\'altro recitando date. Ci ha fatto sentire il posto. È una cosa diversa. Il viaggio era ben organizzato, ma Cristina è il motivo per cui pensiamo ancora al Cairo settimane dopo.',
        es: 'El Cairo con Cristina de guía — Pirámides, Esfinge, el GEM, mezquitas históricas, iglesias coptas, Khan El Khalili. No nos llevó de monumento en monumento recitando fechas. Nos hizo sentir el lugar. Eso es otra cosa. El viaje estuvo bien organizado, pero Cristina es la razón por la que seguimos pensando en El Cairo semanas después.',
      },
    },
    {
      id: 7,
      name: {
        en: 'Greg & Donna Callahan',
        de: 'Andreas & Monika Schreiber',
        it: 'Matteo & Silvia Gallo',
        es: 'Alejandro & Marta Ruiz',
      },
      text: {
        en: 'We\'ve traveled a lot and never used a tour company. Egypt changed that. Fourteen days, party of four — and from the booking process with Walaa to Farah our guide knowing every hidden local restaurant, to Hussein navigating Cairo traffic like it was nothing, every piece worked. We came in skeptical. We left as converts.',
        de: 'Wir reisen viel und haben noch nie eine Reiseagentur gebucht. Ägypten hat das geändert. Vierzehn Tage zu viert — von der Buchung mit Walaa über Farah, die uns die besten versteckten Restaurants gezeigt hat, bis zu Hussein, der durch den Kairoer Verkehr navigiert hat, als wäre es nichts. Alles hat gepasst. Wir waren skeptisch. Wir sind überzeugt nach Hause gefahren.',
        it: 'Viaggiamo spesso e non avevamo mai prenotato con un\'agenzia. L\'Egitto ha cambiato tutto. Quattordici giorni in quattro — dalla prenotazione con Walaa, a Farah che ci ha portati nei migliori ristoranti locali, fino a Hussein che navigava nel traffico del Cairo come se niente fosse. Tutto ha funzionato. Eravamo scettici. Siamo tornati convinti.',
        es: 'Viajamos mucho y nunca habíamos contratado una agencia de viajes. Egipto cambió eso. Catorce días entre cuatro — desde la reserva con Walaa hasta Farah mostrándonos los mejores restaurantes locales, pasando por Hussein sorteando el tráfico de El Cairo como si fuera lo más normal del mundo. Todo funcionó. Llegamos con dudas. Nos fuimos convencidos.',
      },
    },
    {
      id: 8,
      name: {
        en: 'Brian Okonkwo',
        de: 'Florian Hartmann',
        it: 'Simone Barbieri',
        es: 'Diego Santamaría',
      },
      text: {
        en: 'Two guides, two halves of Egypt. Refaat in Lower Egypt taught us hieroglyphics and made history genuinely fun. Hassan in Upper Egypt was patient, flexible, and gave us real time to explore each site. Both felt like family by the end. Yalla yalla habibi — we\'ll be back.',
        de: 'Zwei Guides, zwei Hälften Ägyptens. Refaat im Norden hat uns Hieroglyphen beigebracht und Geschichte wirklich interessant gemacht. Hassan im Süden war geduldig, flexibel und hat uns echte Zeit gegeben, die Orte selbst zu erkunden. Beide fühlten sich am Ende wie Freunde an. Yalla yalla Habibi — wir kommen wieder.',
        it: 'Due guide, due metà dell\'Egitto. Refaat nel Basso Egitto ci ha insegnato i geroglifici e reso la storia coinvolgente. Hassan nell\'Alto Egitto era paziente, flessibile e ci lasciava sempre il tempo di esplorare con calma. Entrambi sono diventati come amici. Yalla yalla habibi — torneremo.',
        es: 'Dos guías, dos mitades de Egipto. Refaat en el Bajo Egipto nos enseñó jeroglíficos e hizo la historia realmente entretenida. Hassan en el Alto Egipto fue paciente, flexible y nos dejaba tiempo para explorar cada lugar con calma. Los dos se convirtieron en algo parecido a amigos. Yalla yalla habibi — volveremos.',
      },
    },
  ] as TestimonialItem[],
};

export default testimonialsTwoData;
