import Faq, { IFaq } from '../models/Faq';
import connectDB from '../config/database';

const faqData: Partial<IFaq>[] = [
  // General FAQs - SEO Optimized
  {
    question: {
      en: "What is JES Egypt Tours and why choose us for your Egypt travel adventure?",
      de: "Was ist JES Egypt Tours und warum sollten Sie uns für Ihr Ägypten-Reiseabenteuer wählen?",
      it: "Che cos'è JES Egypt Tours e perché sceglierci per la vostra avventura di viaggio in Egitto?"
    },
    answer: {
      en: "JES Egypt Tours is a premium travel agency specializing in authentic Egyptian experiences with over 15 years of excellence. We offer expertly guided tours, customized vacation packages, and unforgettable travel experiences throughout Egypt including Cairo, Luxor, Aswan, and Red Sea resorts. Our certified Egyptologist guides, flexible itineraries, and commitment to authentic cultural experiences make us the preferred choice for travelers seeking genuine Egypt adventures.",
      de: "JES Egypt Tours ist ein erstklassiges Reisebüro, das sich auf authentische ägyptische Erlebnisse mit über 15 Jahren Exzellenz spezialisiert hat. Wir bieten fachkundig geführte Touren, maßgeschneiderte Urlaubspakete und unvergessliche Reiseerlebnisse in ganz Ägypten, einschließlich Kairo, Luxor, Assuan und den Resorts am Roten Meer. Unsere zertifizierten Ägyptologen-Reiseleiter, flexiblen Reiserouten und unser Engagement für authentische kulturelle Erlebnisse machen uns zur bevorzugten Wahl für Reisende, die echte Ägypten-Abenteuer suchen.",
      it: "JES Egypt Tours è un'agenzia di viaggi premium specializzata in autentiche esperienze egiziane con oltre 15 anni di eccellenza. Offriamo tour guidati da esperti, pacchetti vacanza personalizzati ed esperienze di viaggio indimenticabili in tutto l'Egitto, tra cui Il Cairo, Luxor, Assuan e le località balneari del Mar Rosso. Le nostre guide egittologhe certificate, gli itinerari flessibili e l'impegno per autentiche esperienze culturali ci rendono la scelta preferita per i viaggiatori che cercano genuine avventure in Egitto."
    },
    category: "General",
    isActive: true,
    displayOnHome: true,
    order: 1
  },
  {
    question: {
      en: "How long has JES Egypt Tours been providing exceptional Egypt travel experiences?",
      de: "Wie lange bietet JES Egypt Tours schon außergewöhnliche Ägypten-Reiseerlebnisse an?",
      it: "Da quanto tempo JES Egypt Tours offre eccezionali esperienze di viaggio in Egitto?"
    },
    answer: {
      en: "JES Egypt Tours has been proudly serving travelers from around the world for over 15 years, establishing ourselves as Egypt's leading tour operator. Our extensive experience, deep local knowledge, and thousands of satisfied customers demonstrate our commitment to delivering exceptional Egypt travel experiences that combine comfort, authenticity, and adventure.",
      de: "JES Egypt Tours bedient seit über 15 Jahren stolz Reisende aus aller Welt und hat sich als Ägyptens führender Reiseveranstalter etabliert. Unsere umfangreiche Erfahrung, unser tiefes lokales Wissen und Tausende von zufriedenen Kunden beweisen unser Engagement für außergewöhnliche Ägypten-Reiseerlebnisse, die Komfort, Authentizität und Abenteuer verbinden.",
      it: "JES Egypt Tours serve con orgoglio viaggiatori da tutto il mondo da oltre 15 anni, affermandosi come il principale tour operator egiziano. La nostra vasta esperienza, la profonda conoscenza locale e le migliaia di clienti soddisfatti dimostrano il nostro impegno nel fornire eccezionali esperienze di viaggio in Egitto che combinano comfort, autenticità e avventura."
    },
    category: "General",
    isActive: true,
    displayOnHome: true,
    order: 2
  },
  {
    question: {
      en: "What makes JES Egypt Tours different from other Egypt tour operators and travel agencies?",
      de: "Was unterscheidet JES Egypt Tours von anderen ägyptischen Reiseveranstaltern und Reisebüros?",
      it: "Cosa rende JES Egypt Tours diversa da altri tour operator e agenzie di viaggio in Egitto?"
    },
    answer: {
      en: "JES Egypt Tours stands out through our personalized service, expert Egyptologist guides, flexible itineraries, and transparent pricing. Unlike mass-market operators, we provide authentic cultural experiences, small group sizes, and customized attention to detail. Our deep knowledge of Egyptian history, culture, and hidden gems ensures you experience the real Egypt, not just tourist attractions.",
      de: "JES Egypt Tours zeichnet sich durch persönlichen Service, fachkundige Ägyptologen-Reiseleiter, flexible Reiserouten und transparente Preisgestaltung aus. Im Gegensatz zu Massenveranstaltern bieten wir authentische kulturelle Erlebnisse, kleine Gruppengrößen und maßgeschneiderte Liebe zum Detail. Unser tiefes Wissen über die ägyptische Geschichte, Kultur und verborgene Schätze stellt sicher, dass Sie das echte Ägypten erleben, nicht nur Touristenattraktionen.",
      it: "JES Egypt Tours si distingue per il servizio personalizzato, le guide egittologhe esperte, gli itinerari flessibili e i prezzi trasparenti. A differenza degli operatori del turismo di massa, offriamo esperienze culturali autentiche, piccoli gruppi e attenzione personalizzata ai dettagli. La nostra profonda conoscenza della storia, della cultura e delle gemme nascoste dell'Egitto ti assicura di vivere il vero Egitto, non solo le attrazioni turistiche."
    },
    category: "General",
    isActive: true,
    displayOnHome: false,
    order: 3
  },
  {
    question: {
      en: "Are JES Egypt Tours licensed and insured for travel in Egypt?",
      de: "Ist JES Egypt Tours für Reisen in Ägypten lizenziert und versichert?",
      it: "JES Egypt Tours è autorizzata e assicurata per i viaggi in Egitto?"
    },
    answer: {
      en: "Yes, JES Egypt Tours is fully licensed by the Egyptian Ministry of Tourism and carries comprehensive travel insurance. We are members of the Egyptian Travel Agents Association (ETAA) and maintain all required certifications for operating tours in Egypt. Your safety and security are our top priorities with fully insured vehicles, licensed guides, and 24/7 emergency support.",
      de: "Ja, JES Egypt Tours ist vom ägyptischen Tourismusministerium voll lizenziert und verfügt über eine umfassende Reiseversicherung. Wir sind Mitglieder der Egyptian Travel Agents Association (ETAA) und verfügen über alle erforderlichen Zertifizierungen für den Betrieb von Touren in Ägypten. Ihre Sicherheit hat für uns oberste Priorität, mit voll versicherten Fahrzeugen, lizenzierten Guides und 24/7-Notfallunterstützung.",
      it: "Sì, JES Egypt Tours è pienamente autorizzata dal Ministero del Turismo egiziano e dispone di un'assicurazione di viaggio completa. Siamo membri della Egyptian Travel Agents Association (ETAA) e manteniamo tutte le certificazioni richieste per l'operatività dei tour in Egitto. La vostra sicurezza e protezione sono le nostre massime priorità con veicoli completamente assicurati, guide autorizzate e supporto di emergenza 24 ore su 24, 7 giorni su 7."
    },
    category: "General",
    isActive: true,
    displayOnHome: false,
    order: 4
  },

  // Booking FAQs - SEO Optimized
  {
    question: {
      en: "How do I book my dream Egypt tour with JES Egypt Tours online?",
      de: "Wie buche ich meine Traum-Ägyptenreise mit JES Egypt Tours online?",
      it: "Come posso prenotare online il mio tour da sogno in Egitto con JES Egypt Tours?"
    },
    answer: {
      en: "Booking your Egypt tour is simple and secure: 1) Browse our tour packages or request a custom itinerary, 2) Select your preferred travel dates and group size, 3) Complete our secure online booking form with your details, 4) Pay the 30% deposit via credit card, PayPal, or bank transfer, 5) Receive instant confirmation and detailed travel preparation guide. Our customer service team is available 24/7 to assist with your booking.",
      de: "Die Buchung Ihrer Ägypten-Tour ist einfach und sicher: 1) Stöbern Sie in unseren Tour-Paketen oder fordern Sie eine maßgeschneiderte Reiseroute an, 2) Wählen Sie Ihre bevorzugten Reisedaten und die Gruppengröße aus, 3) Füllen Sie unser sicheres Online-Buchungsformular mit Ihren Daten aus, 4) Zahlen Sie die Anzahlung von 30 % per Kreditkarte, PayPal oder Banküberweisung, 5) Erhalten Sie eine sofortige Bestätigung und einen detaillierten Reisevorbereitungsleitfaden. Unser Kundenservice-Team steht Ihnen rund um die Uhr zur Verfügung, um Sie bei Ihrer Buchung zu unterstützen.",
      it: "Prenotare il tuo tour in Egitto è semplice e sicuro: 1) Sfoglia i nostri pacchetti tour o richiedi un itinerario personalizzato, 2) Seleziona le date di viaggio preferite e le dimensioni del gruppo, 3) Completa il nostro modulo di prenotazione online sicuro con i tuoi dettagli, 4) Paga il deposito del 30% tramite carta di credito, PayPal o bonifico bancario, 5) Ricevi una conferma istantanea e una guida dettagliata alla preparazione del viaggio. Il nostro team di assistenza clienti è a vostra disposizione 24 ore su 24, 7 giorni su 7 per assistervi nella prenotazione."
    },
    category: "Booking",
    isActive: true,
    displayOnHome: true,
    order: 1
  },
  {
    question: {
      en: "What payment methods and currencies does JES Egypt Tours accept for tour bookings?",
      de: "Welche Zahlungsmethoden und Währungen akzeptiert JES Egypt Tours für Tourbuchungen?",
      it: "Quali metodi di pagamento e valute accetta JES Egypt Tours per le prenotazioni dei tour?"
    },
    answer: {
      en: "JES Egypt Tours accepts all major credit cards (Visa, MasterCard, American Express), PayPal, wire transfers, and Western Union. We process payments in USD, EUR, GBP, and EGP. A 30% deposit secures your booking, with the remaining balance due 30 days before departure. All transactions are secured with SSL encryption and we offer flexible payment plans for tours over $2000.",
      de: "JES Egypt Tours akzeptiert alle gängigen Kreditkarten (Visa, MasterCard, American Express), PayPal, Überweisungen und Western Union. Wir verarbeiten Zahlungen in USD, EUR, GBP und EGP. Eine Anzahlung von 30 % sichert Ihre Buchung, der Restbetrag ist 30 Tage vor Abreise fällig. Alle Transaktionen sind mit SSL-Verschlüsselung gesichert und wir bieten flexible Zahlungspläne für Touren über 2000 $ an.",
      it: "JES Egypt Tours accetta tutte le principali carte di credito (Visa, MasterCard, American Express), PayPal, bonifici bancari e Western Union. Elaboriamo i pagamenti in USD, EUR, GBP ed EGP. Un deposito del 30% garantisce la tua prenotazione, con il saldo rimanente dovuto 30 giorni prima della partenza. Tutte le transazioni sono protette con crittografia SSL e offriamo piani di pagamento flessibili per tour superiori a $ 2000."
    },
    category: "Booking",
    isActive: true,
    displayOnHome: true,
    order: 2
  },
  {
    question: {
      en: "What is the cancellation policy for Egypt tours booked with JES Egypt Tours?",
      de: "Wie sehen die Stornierungsbedingungen für bei JES Egypt Tours gebuchte Ägypten-Reisen aus?",
      it: "Qual è la politica di cancellazione per i tour in Egitto prenotati con JES Egypt Tours?"
    },
    answer: {
      en: "Our flexible cancellation policy allows free cancellation up to 30 days before departure for a full refund minus a $50 administrative fee. Cancellations 15-29 days before departure receive a 50% refund, while cancellations within 14 days are non-refundable. We highly recommend travel insurance to protect your investment. Custom cancellation terms may apply to peak season tours and group bookings.",
      de: "Unsere flexible Stornierungsrichtlinie erlaubt eine kostenlose Stornierung bis zu 30 Tage vor Abflug für eine vollständige Rückerstattung abzüglich einer Verwaltungsgebühr von 50 $. Stornierungen 15–29 Tage vor Abflug erhalten eine Rückerstattung von 50 %, während Stornierungen innerhalb von 14 Tagen nicht erstattungsfähig sind. Wir empfehlen dringend eine Reiseversicherung, um Ihre Investition zu schützen. Für Touren in der Hochsaison und Gruppenbuchungen können benutzerdefinierte Stornierungsbedingungen gelten.",
      it: "La nostra politica di cancellazione flessibile consente la cancellazione gratuita fino a 30 giorni prima della partenza per un rimborso completo meno una spesa amministrativa di $ 50. Le cancellazioni effettuate da 15 a 29 giorni prima della partenza ricevono un rimborso del 50%, mentre le cancellazioni entro 14 giorni non sono rimborsabili. Consigliamo vivamente un'assicurazione di viaggio per proteggere il tuo investimento. Termini di cancellazione personalizzati possono essere applicati ai tour in alta stagione e alle prenotazioni di gruppo."
    },
    category: "Booking",
    isActive: true,
    displayOnHome: false,
    order: 3
  },
  {
    question: {
      en: "How far in advance should I book my Egypt tour to get the best prices and availability?",
      de: "Wie weit im Voraus sollte ich meine Ägypten-Tour buchen, um die besten Preise und Verfügbarkeit zu erhalten?",
      it: "Quanto tempo prima dovrei prenotare il mio tour in Egitto per ottenere i prezzi e la disponibilità migliori?"
    },
    answer: {
      en: "For optimal pricing and availability, we recommend booking your Egypt tour 3-6 months in advance, especially for peak season (October-April) and holiday periods. Early booking discounts of up to 10% are available for reservations made 6+ months ahead. Last-minute bookings (within 30 days) are possible but may have limited availability and higher prices.",
      de: "Für optimale Preise und Verfügbarkeit empfehlen wir, Ihre Ägypten-Tour 3-6 Monate im Voraus zu buchen, insbesondere für die Hochsaison (Oktober-April) und Ferienzeiten. Frühbucherrabatte von bis zu 10 % sind für Reservierungen verfügbar, die mehr als 6 Monate im Voraus getätigt werden. Last-Minute-Buchungen (innerhalb von 30 Tagen) sind möglich, können aber eine begrenzte Verfügbarkeit und höhere Preise haben.",
      it: "Per prezzi e disponibilità ottimali, consigliamo di prenotare il tour in Egitto con 3-6 mesi di anticipo, specialmente per l'alta stagione (ottobre-aprile) e i periodi festivi. Sono disponibili sconti per prenotazioni anticipate fino al 10% per prenotazioni effettuate con più di 6 mesi di anticipo. Le prenotazioni last-minute (entro 30 giorni) sono possibili ma possono avere disponibilità limitata e prezzi più alti."
    },
    category: "Booking",
    isActive: true,
    displayOnHome: false,
    order: 4
  },
  {
    question: {
      en: "Do I need travel insurance for my Egypt tour with JES Egypt Tours?",
      de: "Benötige ich eine Reiseversicherung für meine Ägypten-Tour mit JES Egypt Tours?",
      it: "Ho bisogno di un'assicurazione di viaggio per il mio tour in Egitto con JES Egypt Tours?"
    },
    answer: {
      en: "While travel insurance is not mandatory, we strongly recommend comprehensive coverage for all Egypt tours. Your policy should include trip cancellation, medical emergencies, emergency evacuation, lost luggage, and travel delays. JES Egypt Tours can provide recommended insurance providers and ensures all tours include basic emergency assistance coverage.",
      de: "Obwohl eine Reiseversicherung nicht obligatorisch ist, empfehlen wir dringend einen umfassenden Versicherungsschutz für alle Ägypten-Reisen. Ihre Police sollte Reiserücktritt, medizinische Notfälle, Notevakuierung, verlorenes Gepäck und Reiseverzögerungen abdecken. JES Egypt Tours kann empfohlene Versicherungsanbieter nennen und stellt sicher, dass alle Touren eine grundlegende Notfallhilfe abdecken.",
      it: "Sebbene l'assicurazione di viaggio non sia obbligatoria, consigliamo vivamente una copertura completa per tutti i tour in Egitto. La tua polizza dovrebbe includere l'annullamento del viaggio, le emergenze mediche, l'evacuazione di emergenza, lo smarrimento del bagaglio e i ritardi di viaggio. JES Egypt Tours può fornire fornitori di assicurazioni consigliati e garantisce che tutti i tour includano una copertura di assistenza di emergenza di base."
    },
    category: "Booking",
    isActive: true,
    displayOnHome: false,
    order: 5
  },

  // Tour FAQs - SEO Optimized
  {
    question: {
      en: "What types of Egypt tours and vacation packages does JES Egypt Tours offer?",
      de: "Welche Arten von Ägypten-Touren und Urlaubspaketen bietet JES Egypt Tours an?",
      it: "Quali tipi di tour in Egitto e pacchetti vacanza offre JES Egypt Tours?"
    },
    answer: {
      en: "JES Egypt Tours offers diverse Egypt travel experiences including classic Nile cruises, pyramid tours, desert safaris, Red Sea diving packages, cultural immersion tours, religious pilgrimages, and completely customized private tours. Our packages range from 3-day Cairo highlights to 21-day comprehensive Egypt adventures, all featuring expert guides, quality accommodations, and authentic experiences.",
      de: "JES Egypt Tours bietet vielfältige Ägypten-Reiseerlebnisse, darunter klassische Nilkreuzfahrten, Pyramidentouren, Wüstensafaris, Tauchpakete am Roten Meer, kulturelle Immersionsreisen, religiöse Pilgerfahrten und vollständig maßgeschneiderte Privattouren. Unsere Pakete reichen von 3-tägigen Kairo-Highlights bis hin zu 21-tägigen umfassenden Ägypten-Abenteuern, alle mit fachkundigen Reiseleitern, hochwertigen Unterkünften und authentischen Erlebnissen.",
      it: "JES Egypt Tours offre diverse esperienze di viaggio in Egitto tra cui classiche crociere sul Nilo, tour delle piramidi, safari nel deserto, pacchetti subacquei nel Mar Rosso, tour di immersione culturale, pellegrinaggi religiosi e tour privati completamente personalizzati. I nostri pacchetti spaziano dagli highlight del Cairo di 3 giorni alle avventure complete in Egitto di 21 giorni, il tutto con guide esperte, alloggi di qualità ed esperienze autentiche."
    },
    category: "Tours",
    isActive: true,
    displayOnHome: true,
    order: 1
  },
  {
    question: {
      en: "Are JES Egypt Tours suitable for families with children and elderly travelers?",
      de: "Sind JES Egypt Tours für Familien mit Kindern und ältere Reisende geeignet?",
      it: "I tour di JES Egypt Tours sono adatti a famiglie con bambini e viaggiatori anziani?"
    },
    answer: {
      en: "Absolutely! Many of our Egypt tours are family-friendly with special activities for children and comfortable pacing for elderly travelers. We offer family packages with interconnected rooms, kid-friendly guides, and educational activities. Our vehicles are wheelchair accessible, and we can customize itineraries to accommodate mobility needs and energy levels.",
      de: "Absolut! Viele unserer Ägypten-Reisen sind familienfreundlich mit speziellen Aktivitäten für Kinder und einem angenehmen Tempo für ältere Reisende. Wir bieten Familienpakete mit Zimmern mit Verbindungstür, kinderfreundlichen Guides und pädagogischen Aktivitäten an. Unsere Fahrzeuge sind rollstuhlgerecht und wir können die Reiserouten an Mobilitätsbedürfnisse und Energieniveaus anpassen.",
      it: "Assolutamente! Molti dei nostri tour in Egitto sono adatti alle famiglie con attività speciali per bambini e un ritmo confortevole per i viaggiatori anziani. Offriamo pacchetti famiglia con camere comunicanti, guide adatte ai bambini e attività educative. I nostri veicoli sono accessibili ai disabili e possiamo personalizzare gli itinerari per soddisfare le esigenze di mobilità e i livelli di energia."
    },
    category: "Tours",
    isActive: true,
    displayOnHome: false,
    order: 2
  },
  {
    question: {
      en: "What is included in JES Egypt Tours package prices and what additional costs should I expect?",
      de: "Was ist in den Paketpreisen von JES Egypt Tours enthalten und mit welchen zusätzlichen Kosten muss ich rechnen?",
      it: "Cosa è incluso nei prezzi dei pacchetti JES Egypt Tours e quali costi aggiuntivi devo aspettarmi?"
    },
    answer: {
      en: "Our tour prices typically include: quality accommodation, daily breakfast, transportation in modern A/C vehicles, expert Egyptologist guides, entrance fees to specified attractions, and bottled water. Exclusions usually are: international flights, visas, travel insurance, personal expenses, optional activities, and some meals. Detailed inclusions/exclusions are provided in each tour itinerary.",
      de: "Unsere Tourpreise beinhalten in der Regel: hochwertige Unterkünfte, tägliches Frühstück, Transport in modernen klimatisierten Fahrzeugen, fachkundige Ägyptologen-Reiseleiter, Eintrittsgelder für die angegebenen Attraktionen und Mineralwasser in Flaschen. Ausgeschlossen sind in der Regel: internationale Flüge, Visa, Reiseversicherung, persönliche Ausgaben, optionale Aktivitäten und einige Mahlzeiten. Detaillierte Ein- und Ausschlüsse finden Sie in jeder Reiseroute.",
      it: "I prezzi dei nostri tour in genere includono: sistemazione di qualità, colazione quotidiana, trasporto in moderni veicoli climatizzati, guide egittologhe esperte, biglietti d'ingresso alle attrazioni specificate e acqua in bottiglia. Le esclusioni di solito sono: voli internazionali, visti, assicurazione di viaggio, spese personali, attività opzionali e alcuni pasti. Inclusioni/esclusioni dettagliate sono fornite in ogni itinerario del tour."
    },
    category: "Tours",
    isActive: true,
    displayOnHome: false,
    order: 3
  },
  {
    question: {
      en: "Can JES Egypt Tours create completely customized itineraries for my Egypt travel preferences?",
      de: "Kann JES Egypt Tours komplett maßgeschneiderte Reiserouten nach meinen Ägypten-Reisevorlieben erstellen?",
      it: "JES Egypt Tours può creare itinerari completamente personalizzati per le mie preferenze di viaggio in Egitto?"
    },
    answer: {
      en: "Yes! We specialize in creating personalized Egypt tours tailored to your interests, schedule, and budget. Whether you want to focus on archaeology, photography, adventure, religious sites, or relaxation, our expert team will design your perfect Egypt experience. Custom tours can include special access, unique accommodations, and exclusive experiences not available in standard packages.",
      de: "Ja! Wir sind darauf spezialisiert, personalisierte Ägypten-Touren zu erstellen, die auf Ihre Interessen, Ihren Zeitplan und Ihr Budget zugeschnitten sind. Ganz gleich, ob Sie sich auf Archäologie, Fotografie, Abenteuer, religiöse Stätten oder Entspannung konzentrieren möchten, unser Expertenteam entwirft Ihr perfektes Ägypten-Erlebnis. Maßgeschneiderte Touren können speziellen Zugang, einzigartige Unterkünfte und exklusive Erlebnisse beinhalten, die in Standardpaketen nicht verfügbar sind.",
      it: "Sì! Siamo specializzati nella creazione di tour personalizzati in Egitto su misura per i tuoi interessi, il tuo programma e il tuo budget. Se desideri concentrarti su archeologia, fotografia, avventura, siti religiosi o relax, il nostro team di esperti progetterà la tua perfetta esperienza in Egitto. I tour personalizzati possono includere accessi speciali, alloggi unici ed esperienze esclusive non disponibili nei pacchetti standard."
    },
    category: "Tours",
    isActive: true,
    displayOnHome: false,
    order: 4
  },
  {
    question: {
      en: "What is the best time of year to visit Egypt and travel with JES Egypt Tours?",
      de: "Was ist die beste Jahreszeit, um Ägypten zu besuchen und mit JES Egypt Tours zu reisen?",
      it: "Qual è il periodo migliore dell'anno per visitare l'Egitto e viaggiare con JES Egypt Tours?"
    },
    answer: {
      en: "The best time to visit Egypt is during the cooler months from October to April when temperatures are pleasant for sightseeing (20-30°C). Peak season is December-February with comfortable weather but higher prices and more crowds. May-September is hot but offers lower prices and fewer tourists. We offer year-round tours with adjusted schedules for summer months to ensure comfort.",
      de: "Die beste Reisezeit für Ägypten sind die kühleren Monate von Oktober bis April, wenn die Temperaturen für Besichtigungen angenehm sind (20-30°C). Die Hochsaison ist von Dezember bis Februar mit angenehmem Wetter, aber höheren Preisen und mehr Gedränge. Mai–September ist heiß, bietet aber niedrigere Preise und weniger Touristen. Wir bieten das ganze Jahr über Touren mit angepassten Terminen für die Sommermonate an, um Komfort zu gewährleisten.",
      it: "Il periodo migliore per visitare l'Egitto è durante i mesi più freschi da ottobre ad aprile, quando le temperature sono gradevoli per le visite turistiche (20-30°C). L'alta stagione è dicembre-febbraio con clima confortevole ma prezzi più alti e più folla. Maggio-settembre è caldo ma offre prezzi più bassi e meno turisti. Offriamo tour tutto l'anno con programmi adattati ai mesi estivi per garantire il massimo comfort."
    },
    category: "Tours",
    isActive: true,
    displayOnHome: false,
    order: 5
  },

  // Payment FAQs - SEO Optimized
  {
    question: {
      en: "How secure are online payments when booking Egypt tours with JES Egypt Tours?",
      de: "Wie sicher sind Online-Zahlungen bei der Buchung von Ägypten-Reisen mit JES Egypt Tours?",
      it: "Quanto sono sicuri i pagamenti online quando si prenotano tour in Egitto con JES Egypt Tours?"
    },
    answer: {
      en: "JES Egypt Tours uses industry-standard SSL encryption and secure payment gateways to protect your personal and financial information. We are PCI DSS compliant and never store credit card details on our servers. All transactions are processed through reputable payment providers with fraud protection and buyer security guarantees.",
      de: "JES Egypt Tours verwendet SSL-Verschlüsselung nach Industriestandard und sichere Zahlungsgateways, um Ihre persönlichen und finanziellen Daten zu schützen. Wir sind PCI DSS-konform und speichern niemals Kreditkartendaten auf unseren Servern. Alle Transaktionen werden über seriöse Zahlungsanbieter mit Betrugsschutz und Käufersicherheitsgarantien abgewickelt.",
      it: "JES Egypt Tours utilizza la crittografia SSL standard del settore e gateway di pagamento sicuri per proteggere le tue informazioni personali e finanziarie. Siamo conformi allo standard PCI DSS e non memorizziamo mai i dettagli della carta di credito sui nostri server. Tutte le transazioni vengono elaborate tramite fornitori di pagamento affidabili con protezione dalle frodi e garanzie di sicurezza per l'acquirente."
    },
    category: "Payment",
    isActive: true,
    displayOnHome: false,
    order: 1
  },
  {
    question: {
      en: "Does JES Egypt Tours offer flexible payment plans or installment options for Egypt tours?",
      de: "Bietet JES Egypt Tours flexible Zahlungspläne oder Ratenzahlungsoptionen für Ägypten-Reisen an?",
      it: "JES Egypt Tours offre piani di pagamento flessibili o opzioni di rateizzazione per i tour in Egitto?"
    },
    answer: {
      en: "Yes, for tours over $2000, we offer flexible payment plans with 0% interest. Typical plans include: 50% deposit, 25% at 60 days, 25% at 30 days before departure. We can also customize payment schedules to match your budget. Contact our team to discuss payment plan options for your preferred Egypt tour.",
      de: "Ja, für Touren über 2000 $ bieten wir flexible Zahlungspläne mit 0 % Zinsen an. Typische Pläne beinhalten: 50 % Anzahlung, 25 % nach 60 Tagen, 25 % 30 Tage vor Abflug. Wir können die Zahlungspläne auch so anpassen, dass sie Ihrem Budget entsprechen. Kontaktieren Sie unser Team, um Zahlungsplanoptionen für Ihre bevorzugte Ägypten-Tour zu besprechen.",
      it: "Sì, per tour superiori a $ 2000, offriamo piani di pagamento flessibili con interessi allo 0%. I piani tipici includono: deposito del 50%, 25% a 60 giorni, 25% a 30 giorni prima della partenza. Possiamo anche personalizzare i programmi di pagamento in base al tuo budget. Contatta il nostro team per discutere le opzioni del piano di pagamento per il tuo tour preferito in Egitto."
    },
    category: "Payment",
    isActive: true,
    displayOnHome: false,
    order: 2
  },
  {
    question: {
      en: "Are there any hidden fees or charges I should know about when booking with JES Egypt Tours?",
      de: "Gibt es versteckte Gebühren oder Kosten, über die ich bei der Buchung bei JES Egypt Tours Bescheid wissen sollte?",
      it: "Ci sono costi o oneri nascosti di cui dovrei essere a conoscenza quando prenoto con JES Egypt Tours?"
    },
    answer: {
      en: "No, JES Egypt Tours believes in complete transparency with no hidden fees. All costs are clearly outlined in your tour quotation and booking confirmation. Optional activities, personal expenses, and tips are clearly marked as such. We provide detailed cost breakdowns so you know exactly what's included in your Egypt tour price.",
      de: "Nein, JES Egypt Tours glaubt an absolute Transparenz ohne versteckte Gebühren. Alle Kosten sind in Ihrem Tourangebot und Ihrer Buchungsbestätigung klar aufgeführt. Optionale Aktivitäten, persönliche Ausgaben und Trinkgelder sind deutlich als solche gekennzeichnet. Wir stellen detaillierte Kostenaufstellungen zur Verfügung, damit Sie genau wissen, was in Ihrem Ägypten-Tourpreis enthalten ist.",
      it: "No, JES Egypt Tours crede nella completa trasparenza senza costi nascosti. Tutti i costi sono chiaramente indicati nel preventivo del tour e nella conferma della prenotazione. Le attività opzionali, le spese personali e le mance sono chiaramente contrassegnate come tali. Forniamo suddivisioni dettagliate dei costi in modo da sapere esattamente cosa è incluso nel prezzo del tour in Egitto."
    },
    category: "Payment",
    isActive: true,
    displayOnHome: false,
    order: 3
  },

  // Safety FAQs - SEO Optimized
  {
    question: {
      en: "Is it safe to travel to Egypt with JES Egypt Tours in 2024?",
      de: "Ist es im Jahr 2024 sicher, mit JES Egypt Tours nach Ägypten zu reisen?",
      it: "È sicuro viaggiare in Egitto con JES Egypt Tours nel 2024?"
    },
    answer: {
      en: "Yes, Egypt is generally very safe for tourists, especially when traveling with experienced operators like JES Egypt Tours. We prioritize your safety with: expert local guides, secure transportation, carefully selected accommodations, 24/7 emergency support, and comprehensive safety protocols. Popular tourist areas have enhanced security, and millions of tourists visit safely each year.",
      de: "Ja, Ägypten ist für Touristen im Allgemeinen sehr sicher, insbesondere wenn sie mit erfahrenen Reiseveranstaltern wie JES Egypt Tours reisen. Wir priorisieren Ihre Sicherheit durch: fachkundige lokale Guides, sicheren Transport, sorgfältig ausgewählte Unterkünfte, 24/7-Notfallunterstützung und umfassende Sicherheitsprotokolle. Beliebte Touristengebiete verfügen über erhöhte Sicherheitsvorkehrungen und Millionen von Touristen besuchen das Land jedes Jahr sicher.",
      it: "Sì, l'Egitto è generalmente molto sicuro per i turisti, specialmente quando si viaggia con operatori esperti come JES Egypt Tours. Priorizziamo la tua sicurezza con: guide locali esperte, trasporto sicuro, alloggi accuratamente selezionati, supporto di emergenza 24 ore su 24, 7 giorni su 7 e protocolli di sicurezza completi. Le aree turistiche popolari hanno una maggiore sicurezza e milioni di turisti le visitano in sicurezza ogni anno."
    },
    category: "Safety",
    isActive: true,
    displayOnHome: true,
    order: 1
  },
  {
    question: {
      en: "What health precautions and vaccinations should I take before traveling to Egypt?",
      de: "Welche gesundheitlichen Vorsichtsmaßnahmen und Impfungen sollte ich vor einer Reise nach Ägypten treffen?",
      it: "Quali precauzioni sanitarie e vaccinazioni dovrei prendere prima di recarmi in Egitto?"
    },
    answer: {
      en: "Consult your doctor 6-8 weeks before travel for personalized advice. Generally recommended: Hepatitis A & B, Typhoid, and routine vaccinations. Consider malaria medication for certain areas. Pack prescription medications, basic first aid, insect repellent, and stay hydrated. Our tours include access to quality medical facilities, and all guides are trained in emergency procedures.",
      de: "Konsultieren Sie Ihren Arzt 6–8 Wochen vor der Reise für eine persönliche Beratung. Allgemein empfohlen: Hepatitis A und B, Typhus und Routineimpfungen. Ziehen Sie für bestimmte Gebiete Malariamedikamente in Betracht. Packen Sie verschreibungspflichtige Medikamente, einfache Erste Hilfe und Insektenschutzmittel ein und trinken Sie ausreichend Flüssigkeit. Unsere Touren bieten Zugang zu hochwertigen medizinischen Einrichtungen und alle Guides sind in Notfallverfahren geschult.",
      it: "Consultate il vostro medico 6-8 settimane prima del viaggio per un consiglio personalizzato. In generale si consiglia: Epatite A e B, Tifo e vaccinazioni di routine. Prendi in considerazione farmaci antimalarici per certe aree. Metti in valigia i farmaci su prescrizione, il pronto soccorso di base, il repellente per insetti e mantieniti idratato. I nostri tour includono l'accesso a strutture mediche di qualità e tutte le guide sono addestrate nelle procedure di emergenza."
    },
    category: "Safety",
    isActive: true,
    displayOnHome: false,
    order: 2
  },
  {
    question: {
      en: "What should I pack for my Egypt tour with JES Egypt Tours?",
      de: "Was sollte ich für meine Ägypten-Reise mit JES Egypt Tours einpacken?",
      it: "Cosa devo mettere in valigia per il mio tour in Egitto con JES Egypt Tours?"
    },
    answer: {
      en: "Pack lightweight, modest clothing (shoulders and knees covered for religious sites), comfortable walking shoes, sun hat, sunscreen, sunglasses, insect repellent, and any personal medications. Bring layers for cool evenings, modest swimwear, and a small backpack for daily tours. Don't forget: camera, power bank, adapter (Type C/F), and cash for small purchases.",
      de: "Packen Sie leichte, dezente Kleidung ein (Schultern und Knie für religiöse Stätten bedeckt), bequeme Wanderschuhe, Sonnenhut, Sonnencreme, Sonnenbrille, Insektenschutzmittel und alle persönlichen Medikamente. Bringen Sie Kleidung für kühle Abende, dezente Badebekleidung und einen kleinen Rucksack für tägliche Touren mit. Nicht vergessen: Kamera, Powerbank, Adapter (Typ C/F) und Bargeld für kleine Einkäufe.",
      it: "Metti in valigia abiti leggeri e modesti (spalle e ginocchia coperte per i siti religiosi), scarpe comode per camminare, cappello da sole, crema solare, occhiali da sole, repellente per insetti e tutti i farmaci personali. Porta strati per le serate fresche, costumi da bagno modesti e un piccolo zaino per i tour giornalieri. Non dimenticare: fotocamera, power bank, adattatore (tipo C/F) e contanti per piccoli acquisti."
    },
    category: "Safety",
    isActive: true,
    displayOnHome: false,
    order: 3
  },
  {
    question: {
      en: "Do I need a visa to visit Egypt, and can JES Egypt Tours help with the visa process?",
      de: "Benötige ich für den Besuch in Ägypten ein Visum und kann JES Egypt Tours beim Visumsprozess helfen?",
      it: "Ho bisogno di un visto per visitare l'Egitto e JES Egypt Tours può aiutarmi nel processo del visto?"
    },
    answer: {
      en: "Most nationalities require a visa to enter Egypt. Many tourists can obtain an e-visa online (https://visa2egypt.gov.eg) or visa on arrival at major airports for $25 USD. The process typically takes 5-10 minutes. JES Egypt Tours provides detailed visa instructions and can assist with required documentation. Check requirements for your specific nationality before booking.",
      de: "Die meisten Nationalitäten benötigen für die Einreise nach Ägypten ein Visum. Viele Touristen können online ein E-Visum (https://visa2egypt.gov.eg) oder ein Visum bei der Ankunft an großen Flughäfen für 25 USD erhalten. Der Vorgang dauert normalerweise 5–10 Minuten. JES Egypt Tours stellt detaillierte Visumsanweisungen bereit und kann bei der erforderlichen Dokumentation behilflich sein. Prüfen Sie vor der Buchung die Anforderungen für Ihre spezifische Nationalität.",
      it: "La maggior parte delle nazionalità richiede un visto per entrare in Egitto. Molti turisti possono ottenere un visto elettronico online (https://visa2egypt.gov.eg) o un visto all'arrivo nei principali aeroporti per $ 25 USD. Il processo richiede in genere 5-10 minuti. JES Egypt Tours fornisce istruzioni dettagliate per il visto e può assistere con la documentazione richiesta. Controlla i requisiti per la tua specifica nazionalità prima di prenotare."
    },
    category: "Safety",
    isActive: true,
    displayOnHome: false,
    order: 4
  },
  {
    question: {
      en: "What cultural etiquette and customs should I be aware of when traveling in Egypt?",
      de: "Welche kulturelle Etikette und Bräuche sollte ich bei Reisen in Ägypten beachten?",
      it: "Quali etichette e usanze culturali dovrei conoscere quando viaggio in Egitto?"
    },
    answer: {
      en: "Egypt is conservative but very welcoming. Dress modestly, especially when visiting religious sites. Remove shoes before entering mosques. Ask permission before photographing people. Use right hand for eating and greeting. During Ramadan, avoid eating in public during daylight hours. Egyptians are hospitable - a smile and 'shukran' (thank you) go a long way!",
      de: "Ägypten ist konservativ, aber sehr einladend. Ziehen Sie sich bescheiden an, insbesondere beim Besuch religiöser Stätten. Ziehen Sie Ihre Schuhe aus, bevor Sie Moscheen betreten. Bitten Sie um Erlaubnis, bevor Sie Personen fotografieren. Benutzen Sie die rechte Hand zum Essen und Grüßen. Vermeiden Sie während des Ramadan das Essen in der Öffentlichkeit während der Tagesstunden. Ägypter sind gastfreundlich – ein Lächeln und ein „Shukran“ (Danke) bewirken viel!",
      it: "L'Egitto è conservatore ma molto accogliente. Vestitevi con modestia, specialmente quando visitate i siti religiosi. Toglietevi le scarpe prima di entrare nelle moschee. Chiedete il permesso prima di fotografare le persone. Usate la mano destra per mangiare e salutare. Durante il Ramadan, evitate di mangiare in pubblico durante le ore diurne. Gli egiziani sono ospitali: un sorriso e uno 'shukran' (grazie) fanno molto!"
    },
    category: "Safety",
    isActive: true,
    displayOnHome: false,
    order: 5
  },

  // Accommodation FAQs - SEO Optimized
  {
    question: {
      en: "What types of accommodation does JES Egypt Tours provide during Egypt tours?",
      de: "Welche Arten von Unterkünften bietet JES Egypt Tours während Ägypten-Reisen an?",
      it: "Quali tipi di alloggio offre JES Egypt Tours durante i tour in Egitto?"
    },
    answer: {
      en: "JES Egypt Tours offers a range of carefully selected accommodations from 5-star luxury hotels to authentic boutique properties and traditional Nile cruise ships. All accommodations meet international standards for safety, cleanliness, and comfort. We choose properties with excellent locations, local character, and outstanding service to enhance your Egypt experience.",
      de: "JES Egypt Tours bietet eine Reihe sorgfältig ausgewählter Unterkünfte, von 5-Sterne-Luxushotels bis hin zu authentischen Boutique-Anwesen und traditionellen Nilkreuzfahrtschiffen. Alle Unterkünfte entsprechen internationalen Standards für Sicherheit, Sauberkeit und Komfort. Wir wählen Unterkünfte mit hervorragender Lage, lokalem Charakter und hervorragendem Service aus, um Ihr Ägypten-Erlebnis zu bereichern.",
      it: "JES Egypt Tours offre una gamma di alloggi accuratamente selezionati, dagli hotel di lusso a 5 stelle alle autentiche proprietà boutique e alle tradizionali navi da crociera sul Nilo. Tutti gli alloggi soddisfano gli standard internazionali di sicurezza, pulizia e comfort. Scegliamo strutture con posizioni eccellenti, carattere locale e un servizio eccezionale per migliorare la tua esperienza in Egitto."
    },
    category: "Accommodation",
    isActive: true,
    displayOnHome: false,
    order: 1
  },
  {
    question: {
      en: "Can JES Egypt Tours accommodate special dietary requirements and room preferences?",
      de: "Kann JES Egypt Tours spezielle Ernährungsbedürfnisse und Zimmerwünsche berücksichtigen?",
      it: "JES Egypt Tours può soddisfare esigenze dietetiche speciali e preferenze per le camere?"
    },
    answer: {
      en: "Absolutely! We can accommodate vegetarian, vegan, halal, kosher, gluten-free, and other dietary restrictions with advance notice. Room preferences include king/queen beds, smoking/non-smoking, lower floors, and accessibility features. Please inform us of special requirements at booking so we can make appropriate arrangements with our hotel partners.",
      de: "Absolut! Wir können vegetarische, vegane, halal-, koschere, glutenfreie und andere diätetische Einschränkungen nach vorheriger Ankündigung berücksichtigen. Zu den Zimmerpräferenzen gehören Kingsize-/Queensize-Betten, Raucher-/Nichtraucherzimmer, untere Stockwerke und Barrierefreiheit. Bitte informieren Sie uns bei der Buchung über besondere Anforderungen, damit wir entsprechende Vorkehrungen mit unseren Hotelpartnern treffen können.",
      it: "Assolutamente! Possiamo soddisfare restrizioni dietetiche vegetariane, vegane, halal, kosher, senza glutine e di altro tipo con preavviso. Le preferenze per le camere includono letti king/queen size, fumatori/non fumatori, piani inferiori e caratteristiche di accessibilità. Ti preghiamo di informarci di esigenze speciali al momento della prenotazione in modo da poter prendere accordi adeguati con i nostri hotel partner."
    },
    category: "Accommodation",
    isActive: true,
    displayOnHome: false,
    order: 2
  },
  {
    question: {
      en: "What are Nile cruise ships like with JES Egypt Tours, and which cruise is best for me?",
      de: "Wie sind Nilkreuzfahrtschiffe bei JES Egypt Tours und welche Kreuzfahrt ist am besten für mich geeignet?",
      it: "Come sono le navi da crociera sul Nilo con JES Egypt Tours e quale crociera è la migliore per me?"
    },
    answer: {
      en: "Our Nile cruise ships are floating hotels offering 3-5 star comfort with amenities like swimming pools, restaurants, bars, and sun decks. Cabins feature panoramic windows, en-suite bathrooms, and air conditioning. Choose 3-night cruises (Luxor to Aswan) or 4-night cruises (Aswan to Luxor) based on your schedule. We offer standard, deluxe, and luxury categories to match your budget and preferences.",
      de: "Unsere Nilkreuzfahrtschiffe sind schwimmende Hotels, die 3- bis 5-Sterne-Komfort mit Annehmlichkeiten wie Schwimmbädern, Restaurants, Bars und Sonnendecks bieten. Die Kabinen verfügen über Panoramafenster, ein eigenes Bad und eine Klimaanlage. Wählen Sie 3-Nächte-Kreuzfahrten (Luxor bis Assuan) oder 4-Nächte-Kreuzfahrten (Assuan bis Luxor) basierend auf Ihrem Zeitplan. Wir bieten Standard-, Deluxe- und Luxuskategorien an, die Ihrem Budget und Ihren Vorlieben entsprechen.",
      it: "Le nostre navi da crociera sul Nilo sono hotel galleggianti che offrono comfort a 3-5 stelle con servizi come piscine, ristoranti, bar e ponti sole. Le cabine sono dotate di finestre panoramiche, bagno interno e aria condizionata. Scegli crociere di 3 notti (da Luxor ad Assuan) o crociere di 4 notti (da Assuan a Luxor) in base al tuo programma. Offriamo categorie standard, deluxe e luxury per soddisfare il tuo budget e le tue preferenze."
    },
    category: "Accommodation",
    isActive: true,
    displayOnHome: false,
    order: 3
  }
];

const seedFAQs = async (): Promise<void> => {
  try {
    await connectDB();

    // Clear existing FAQs
    await Faq.deleteMany({});
    console.log('🗑️  Cleared existing FAQs');

    // Insert new FAQs
    const insertedFAQs = await Faq.insertMany(faqData);
    console.log(`✅ Successfully seeded ${insertedFAQs.length} FAQs`);

    // Display seeded categories
    const categories = [...new Set(faqData.map(faq => faq.category))];
    console.log(`📂 Categories seeded: ${categories.join(', ')}`);

    // Display home page FAQs count
    const homeFAQs = faqData.filter(faq => faq.displayOnHome).length;
    console.log(`🏠 Home page FAQs: ${homeFAQs}`);

  } catch (error) {
    console.error('❌ Error seeding FAQs:', error);
    throw error;
  }
};

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedFAQs()
    .then(() => {
      console.log('🎉 FAQ seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 FAQ seeding failed:', error);
      process.exit(1);
    });
}

export default seedFAQs;
