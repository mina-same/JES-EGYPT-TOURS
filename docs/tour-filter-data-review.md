# Tour filter data review

Reviewed the saved itinerary bodies, numbered days, included stops and overnight stays on 2026-09-25. The following types and destination references have been applied. No classification was inferred from a tour title or Private.

Rules: a same-day itinerary with return is day-tour; overnight itineraries are multi-day. Packages combining Cairo hotels and a Nile cruise remain multi-day. Places include scheduled sightseeing and overnight destinations, not pickup-only cities or optional excursions. Only existing Destination records are linked; no new public destination pages were created.

| Tour ID | Applied type | Applied destinations | Evidence |
|---|---|---|---|
| 69d6cad7c892ee7bf706b7c1 | day-tour | Giza | One day: Saqqara, Memphis and Giza; same-day return |
| 69eba460ac4b6f1c4b5e978b | day-tour | Giza | Giza plateau and GEM; pickup 08:00, return 16:00 |
| 6a6e541ba7140e1258b8408a | day-tour | Alexandria | Body explicitly states return the same evening |
| 6a7398c392de90d50098dd5c | multi-day | Aswan | Two days and overnight in Aswan; Luxor pickup/drop-off only |
| 6a77a6f7ab95158963322c61 | multi-day | Cairo, Giza, Luxor, Aswan | Eight numbered days and seven overnight stays |
| 6a87755d0268abc7356301c4 | multi-day | Cairo, Giza, Alexandria | Five days, four Cairo nights, included city sightseeing |
| 6a88b5edb76c55511f7e0205 | multi-day | Cairo, Giza, Luxor, Aswan | Eight days combining hotels and four-night cruise |
| 6aacf82547dcc8ec678d6c74 | day-tour | Luxor | Body explicitly says eight hours with same-day return |
| 6aad11bfcb26661aeb74e0a2 | multi-day | Cairo, Giza, Aswan, Luxor, Hurghada | Ten numbered days with hotels, cruise and sightseeing |
| 6aae353ddd225c59e29681fc | day-tour | Giza | Single GEM visit followed by hotel/airport return |
| 6ab2c859a83cf835c0240cac | day-tour | Luxor | Body explicitly says single-day itinerary |

Giza has compact localized shortName labels; its page title is unchanged. Abu Simbel, Edfu and Kom Ombo have no existing Destination records, so they are not separate filter options.

## Durations

The original deterministic migration populated nine durations. Tour 6a77a6f7ab95158963322c61 now has 192 hours and localized 8 Days / 7 Nights labels, verified against its eight itinerary days and seven overnight stays.

Two conflicting records require the owner's factual decision, requested in chat:

- 69d6cad7c892ee7bf706b7c1: itinerary pickup 08:00 and return 16:00, English Full Day Tour, but Spanish duration says 4 horas. Numeric duration remains missing until confirmed.
- 6aae353ddd225c59e29681fc: saved duration is 6 Hours in all four languages, but general description and drop-off text say four to five hours. Existing 6-hour value is preserved pending confirmation.

## Styles and legacy cleanup

Per the revised instruction, **all style classification and legacy cleanup are paused**. Do not infer a style from Private, old prose, product names, descriptions or accommodation. Even an exact old label is not migrated automatically. Existing canonical selections are preserved; missing styles are treated as [] and Admin displays Needs manual review.

The new Admin chip selector is ready for manual classification. These 11 tours still need the owner's selections:

| Tour ID | Tour needing manual style selection |
|---|---|
| 69d6cad7c892ee7bf706b7c1 | Private Giza Pyramids, Saqqara & Memphis Day Tour from Cairo |
| 69eba460ac4b6f1c4b5e978b | Private Giza Pyramids and Grand Egyptian Museum Tour from Cairo |
| 6a6e541ba7140e1258b8408a | Private Alexandria Day Tour from Cairo |
| 6a7398c392de90d50098dd5c | 2-Day Private Tour from Luxor to Aswan and Abu Simbel |
| 6a77a6f7ab95158963322c61 | 8-Day Egypt Tour: Cairo, Luxor & Aswan with Nile Cruise |
| 6a87755d0268abc7356301c4 | 5-Day Cairo and Alexandria Private Tour Package |
| 6a88b5edb76c55511f7e0205 | Luxury 8-Day Egypt Tour: Cairo, Luxor & Aswan with Nile Cruise |
| 6aacf82547dcc8ec678d6c74 | Luxor East and West Bank Tour: Private Full-Day Tour |
| 6aad11bfcb26661aeb74e0a2 | 10-Day Egypt Luxury Tour: Cairo, Nile Cruise & Hurghada |
| 6aae353ddd225c59e29681fc | Half Day Private Tour of the Grand Egyptian Museum in Giza |
| 6ab2c859a83cf835c0240cac | Karnak and Luxor Temple Tour: Private East Bank Day Tour |

Edit each at `/admin/tour/tour/<ID>/edit`. No style data was changed during this revision. Old tourStyle is read-only review material, not a visitor/filter fallback. The migration script no longer assigns styles or unsets this field. Cleanup requires a later explicit step after manual review and verification; it is not automatically triggered by running migration --apply.

## Backups and cache

Local git-ignored backups were written before updates. Writes compared updatedAt to avoid overwriting concurrent edits; tour writes incremented editVersion. No permanent backup fields were added.

- server/tour-filter-migration-1790290517074.json: original nine durations.
- server/tour-filter-migration-reviewed-1790327001769.json: full original tour documents, evidence and explicit changes.
- server/tour-filter-migration-destination-*.json: original Giza destination.

Authenticated POST /api/revalidate returned HTTP 200 with the configured local frontend running. Both secrets match. The earlier failure was an unavailable local frontend. Production deployment/connectivity is not established by this local check.
