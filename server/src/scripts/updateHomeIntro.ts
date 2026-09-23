/**
 * Replaces the homepage intro copy.
 *
 * What it replaced was another operator's marketing text: "Egypt Day Tours"
 * appeared seven times in the body, the title advertised "Best Deals in 2025",
 * and Spanish was missing entirely. The prose was the generic travel-brochure
 * register — "breathtaking", "unforgettable", "immerse yourself", "marvel at".
 *
 * The replacement is written in the voice the rest of the site already uses
 * (see about.description and whyChooseUs.* in the locale files): plain, second
 * person, concrete, and claiming only what the site claims elsewhere — Cairo
 * based, one party per booking, guides licensed by the Ministry of Tourism,
 * prices fixed in writing before booking. Nothing here is a new promise.
 *
 * Report-only by default. Pass --apply to write.
 *   npm run content:home-intro
 *   npm run content:home-intro -- --apply
 *
 * The previous document is in server/home-intro.backup.json.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GeneralContent from '../models/GeneralContent';

dotenv.config();

const APPLY = process.argv.includes('--apply');

/** Split on the FIRST colon: the part after it renders as the gold accent. */
const title = {
  en: 'Private Egypt Tours: Built Around You, Not a Timetable',
  de: 'Private Ägypten-Reisen: Nach Ihnen geplant, nicht nach dem Fahrplan',
  it: 'Tour privati in Egitto: Costruiti su di voi, non su un orario',
  es: 'Tours privados por Egipto: A su medida, no a la de un horario',
};

const subtitle = {
  en: 'Cairo-Based Tour Operator',
  de: 'Reiseveranstalter mit Sitz in Kairo',
  it: 'Tour operator con sede al Cairo',
  es: 'Operador turístico con sede en El Cairo',
};

const content = {
  en: [
    `<p>JES Egypt Tours is a tour operator based in Giza, on the road that runs up to the Pyramids. We plan private trips across Egypt — a single day out of Cairo, or a route that runs from Alexandria down to Abu Simbel. What we don't run is a coach with forty strangers on it.</p>`,
    `<p>Every booking is one party. The guide and the car are yours for the day, and the plan can change at breakfast: stay longer in the Valley of the Kings, skip a stop that doesn't interest you, start at six to reach Giza before the heat. Those are your calls to make, not a timetable's.</p>`,
    `<p>Our guides are licensed by the Egyptian Ministry of Tourism. That licence is what lets a guide work inside the sites rather than wait at the gate — the difference between reading about the reliefs at Karnak and having them explained where they stand.</p>`,
    `<p>Most itineraries open with Giza and Saqqara, the Grand Egyptian Museum and Islamic Cairo. From there people usually head south to Luxor and Aswan, with a Nile cruise between them and Abu Simbel near the border. Others go the other way — Alexandria for the coast and the catacombs, the Fayoum lakes, Siwa Oasis, or the Red Sea reefs at Hurghada, Dahab and Sharm El Sheikh.</p>`,
    `<p>Prices are agreed in writing before anything is booked: entrance fees, transport and guide, itemised. We plan from Cairo, so whoever arranges your trip is in the same time zone as the trip itself. Send us your dates and what you'd like to see, and we'll come back with an itinerary and a price.</p>`,
  ].join(''),

  de: [
    `<p>JES Egypt Tours ist ein Reiseveranstalter in Gizeh, an der Straße, die zu den Pyramiden führt. Wir planen private Reisen durch Ägypten — einen einzelnen Tag ab Kairo oder eine Route von Alexandria bis Abu Simbel. Was wir nicht anbieten, ist ein Bus mit vierzig Fremden darin.</p>`,
    `<p>Jede Buchung gilt für eine Reisegruppe allein. Reiseleiter und Fahrzeug gehören für diesen Tag Ihnen, und der Plan lässt sich noch beim Frühstück ändern: länger im Tal der Könige bleiben, einen Stopp auslassen, der Sie nicht interessiert, um sechs starten, um vor der Hitze in Gizeh zu sein. Das entscheiden Sie, nicht ein Fahrplan.</p>`,
    `<p>Unsere Reiseleiter sind vom ägyptischen Tourismusministerium lizenziert. Diese Lizenz erlaubt es, innerhalb der Stätten zu führen statt am Eingang zu warten — der Unterschied zwischen über die Reliefs in Karnak zu lesen und sie dort erklärt zu bekommen, wo sie stehen.</p>`,
    `<p>Die meisten Reisen beginnen mit Gizeh und Sakkara, dem Großen Ägyptischen Museum und dem islamischen Kairo. Von dort geht es meist südwärts nach Luxor und Assuan, mit einer Nilkreuzfahrt dazwischen und Abu Simbel nahe der Grenze. Andere fahren in die andere Richtung — Alexandria für die Küste und die Katakomben, die Seen des Fayum, die Oase Siwa oder die Riffe des Roten Meeres bei Hurghada, Dahab und Sharm El Sheikh.</p>`,
    `<p>Preise werden schriftlich vereinbart, bevor etwas gebucht wird: Eintrittsgelder, Transport und Reiseleitung, einzeln aufgeführt. Wir planen von Kairo aus — wer Ihre Reise zusammenstellt, sitzt also in derselben Zeitzone wie die Reise selbst. Schreiben Sie uns Ihre Daten und was Sie sehen möchten, und Sie erhalten einen Reiseverlauf und einen Preis zurück.</p>`,
  ].join(''),

  it: [
    `<p>JES Egypt Tours è un tour operator con sede a Giza, sulla strada che porta alle Piramidi. Organizziamo viaggi privati in tutto l'Egitto — una singola giornata da Il Cairo, oppure un percorso che va da Alessandria fino ad Abu Simbel. Quello che non facciamo è un pullman con quaranta sconosciuti a bordo.</p>`,
    `<p>Ogni prenotazione vale per un solo gruppo. La guida e l'auto sono vostre per la giornata, e il programma si può cambiare a colazione: restare di più nella Valle dei Re, saltare una tappa che non vi interessa, partire alle sei per arrivare a Giza prima del caldo. Decidete voi, non un orario.</p>`,
    `<p>Le nostre guide sono autorizzate dal Ministero del Turismo egiziano. È quella licenza a permettere di accompagnarvi dentro i siti invece di aspettare al cancello — la differenza fra leggere dei rilievi di Karnak e sentirseli spiegare davanti.</p>`,
    `<p>La maggior parte degli itinerari parte da Giza e Saqqara, dal Grande Museo Egizio e dal Cairo islamico. Da lì si scende in genere a Luxor e Assuan, con una crociera sul Nilo nel mezzo e Abu Simbel vicino al confine. Altri vanno nella direzione opposta — Alessandria per la costa e le catacombe, i laghi del Fayyum, l'oasi di Siwa, o le barriere del Mar Rosso a Hurghada, Dahab e Sharm El Sheikh.</p>`,
    `<p>I prezzi si concordano per iscritto prima di prenotare qualsiasi cosa: ingressi, trasporto e guida, voce per voce. Pianifichiamo dal Cairo, quindi chi organizza il vostro viaggio si trova nello stesso fuso orario del viaggio. Scriveteci le date e quello che vorreste vedere, e vi rispondiamo con un itinerario e un prezzo.</p>`,
  ].join(''),

  es: [
    `<p>JES Egypt Tours es un operador turístico con sede en Guiza, en la avenida que sube hasta las Pirámides. Organizamos viajes privados por todo Egipto — un solo día desde El Cairo, o una ruta que va de Alejandría hasta Abu Simbel. Lo que no hacemos es un autocar con cuarenta desconocidos dentro.</p>`,
    `<p>Cada reserva es para un solo grupo. El guía y el coche son suyos durante el día, y el plan se puede cambiar en el desayuno: quedarse más tiempo en el Valle de los Reyes, saltarse una parada que no les interesa, salir a las seis para llegar a Guiza antes del calor. Lo deciden ustedes, no un horario.</p>`,
    `<p>Nuestros guías están autorizados por el Ministerio de Turismo egipcio. Esa licencia es la que permite guiar dentro de los recintos en lugar de esperar en la entrada — la diferencia entre leer sobre los relieves de Karnak y que se los expliquen delante.</p>`,
    `<p>La mayoría de los itinerarios empieza por Guiza y Saqqara, el Gran Museo Egipcio y El Cairo islámico. Desde ahí se suele bajar a Luxor y Asuán, con un crucero por el Nilo entre medias y Abu Simbel cerca de la frontera. Otros van en dirección contraria — Alejandría por la costa y las catacumbas, los lagos de El Fayum, el oasis de Siwa, o los arrecifes del mar Rojo en Hurghada, Dahab y Sharm el Sheij.</p>`,
    `<p>Los precios se acuerdan por escrito antes de reservar nada: entradas, transporte y guía, desglosados. Planificamos desde El Cairo, así que quien organiza su viaje está en la misma zona horaria que el viaje. Envíennos sus fechas y lo que les gustaría ver, y les respondemos con un itinerario y un precio.</p>`,
  ].join(''),
};

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGO_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(APPLY ? 'MODE: APPLY (writing)\n' : 'MODE: report only (pass --apply to write)\n');

  const doc: any = await GeneralContent.findOne({ slug: 'home-intro' }).lean();
  if (!doc) {
    console.error('home-intro not found.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const strip = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  for (const lang of ['en', 'de', 'it', 'es'] as const) {
    const before = strip(String(doc.content?.[lang] ?? ''));
    const after = strip(content[lang]);
    console.log(`${lang}:`);
    console.log(`   title    : ${title[lang]}`);
    console.log(`   body     : ${before.length} chars -> ${after.length} chars`);
    console.log(`   "Egypt Day Tours" mentions: ${(before.match(/Egypt Day Tours/g) || []).length} -> ${(after.match(/Egypt Day Tours/g) || []).length}`);
  }

  if (APPLY) {
    await GeneralContent.updateOne(
      { slug: 'home-intro' },
      { $set: { title, subtitle, content } }
    );
    console.log('\nWritten.');
  } else {
    console.log('\nNothing written. Re-run with -- --apply');
  }

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('content:home-intro failed:', error);
  process.exit(1);
});
