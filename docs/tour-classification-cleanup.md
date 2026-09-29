# Final Tour classification cleanup — 2026-09-29

## Final re-verification after both manual corrections

This section supersedes the earlier **12-tour** snapshot below. All operations
were local code work or explicitly authorized work on the configured database;
nothing was deployed or published.

### Live audit

| Check | Result |
| --- | --- |
| Total Tours | 13 |
| Valid scalar Tour Types | 13 |
| Object-shaped / empty / invalid-string / other invalid types | 0 / 0 / 0 / 0 |
| Luxor `6ab69bff81f928e3f6581af2` | `"day-tour"` |
| Aswan `6abbe42d8e68608145aafcd4` | `"day-tour"` |

No classification value was inferred or corrected automatically.

### Real save verification

Executed the current `updateTour` controller against the current MongoDB
connection for Luxor, submitting only `tourType: "day-tour"` and its current
`_editVersion`. The actual Mongoose update was attached to a MongoDB transaction;
neither the controller's persistence implementation nor the collection driver
was mocked. The real database read inside that transaction confirmed
`tourType === "day-tour"`, and the controller returned 200. Only `editVersion`
and `updatedAt` differed during the transaction. The transaction was aborted,
and a full-document deep comparison confirmed the original document was intact.
The isolated runner disabled cache webhooks; no application server was restarted.

The first isolated runner attempt omitted registration of `TourSubcategory`,
causing a populate error; its transaction was also aborted. Registering the
same model used by the application bootstrap resolved this harness issue.

### Write protection and cleanup

- Real router/controller HTTP tests reject all requested dotted keys on both
  POST and PUT: `tourType.en`, `tourType.es`, and `tourType.anything`.
- They also reject localized objects, `Private`, empty and unknown strings,
  and a dotted key accompanied by an otherwise valid scalar root. **18 HTTP
  requests** return 400 before database access. Auth alone is stubbed in these
  isolated route tests; they do not target the running production service.
- Current source writers were rechecked. Admin submits scalar IDs; controllers
  reject nested type keys and objects; Mongoose uses the scalar catalog enum.
  Status/featured/scheduler and maintenance scripts do not assign type leaves.
  Seeds pass through the current model and cannot validly insert a type object.
- Previous classification UI, state, old singular query fallbacks, migration
  source helpers/scripts, migration-only tests and obsolete UI translations
  were already absent and remain absent.
- Removed the remaining object-display fallback from `tourTypeLabel`; both
  visitor details and structured-data labels now resolve current IDs only.
- Reworded stale status/featured comments; no status-save behavior was changed.
- Removed **8** stale generated files (`.js`, `.js.map`, `.d.ts`, `.d.ts.map`)
  for `migrateTourFilters` and `tourFilterMigration` from `server/dist`.
  Rebuilding the server does not recreate them.
- Retained current classification/filter tests, `tourType`, `tourStyles`,
  the shared catalog, all current filters, and `tourKind` unchanged.

### Authorized database cleanup

Dry run: **2** documents contained singular `tourStyle`; **2** non-empty,
**0** empty. Rechecked all 13 type IDs before applying only:

```javascript
collection.updateMany(
  { tourStyle: { $exists: true } },
  { $unset: { tourStyle: '' } },
  { session }
)
```

Matched/modified: **2/2**. Remaining singular fields: **0**. Within the
transaction, all documents were compared against the original documents with
only `tourStyle` omitted, then committed. The same comparison passed after
commit. All other content, `tourStyles`, `tourType`, `tourKind`, timestamps and
edit versions were preserved exactly. All 13 scalar IDs remained valid.

### Remaining references

- No `legacyClassification`, `previousType`, `previousStyle`, singular
  `tourStyle`, `tourFilterMigration` or `migrateTourFilters` runtime dependency
  remains in `client/src` or `server/src`.
- Two singular query-key mentions in `client/tests/tour-listing-filters.test.ts`
  deliberately verify that the removed alias is ignored. These protect the
  current contract; they do not support migration or compatibility.
- Invalid-object/dotted-key tests deliberately retain rejected examples.
- Documentation retains historical names and earlier audit results as evidence.
- `server/tour-filter-migration-destination-1790327020403.json` is a local
  destination before/after audit snapshot, not executable or loaded by runtime.
  It was retained as evidence; it is not a classification migration helper.
- `tourStyleLabels`, `TourStyleId` and `tourStyles` are current plural-array
  functionality, not the removed singular stored field.
- Other migrations (for destination locations, heading/description, prices,
  accommodation icons, etc.) are outside classification cleanup and remain.

This verifies the current application paths, not arbitrary direct MongoDB
clients. Historical writer attribution was not pursued further, as requested.

### Validation for this final pass

- Frontend full suite: **131 passed**, zero failures/skips.
- Backend full suite with `RUN_FILTER_DB_TESTS=1`: **92 passed**, zero
  failures/skips, including read-only MongoDB filter integration.
- Server production build / TypeScript: passed.
- Client production build / TypeScript: passed (37 static pages generated).
  Non-blocking notices: the middleware naming convention and outdated
  Browserslist metadata.
- Lint on files changed in this pass: no errors; existing server warnings.
- `git diff --check`: passed.

Files changed in this pass: `client/src/lib/tours/catalog.ts`,
`client/tests/tour-classification.test.ts`,
`server/src/controllers/tourController.ts` (comments only),
`server/tests/tour-type-routes.test.ts`, this report and the historical diagnosis
status note, plus the 8 ignored generated artifacts removed above.

## Earlier cleanup snapshot (historical, 12 Tours)

Completed locally and in the configured MongoDB database. No deployment or publication.

## Pre-cleanup verification

- All 12 tours have an approved stable string type; none has a localized type object.
- Luxor West Bank Tour (`6ab69bff81f928e3f6581af2`) was manually saved as `day-tour`, with styles `["classic"]`.
- No invalid or duplicate current style IDs. Missing/empty styles are valid and were preserved.
- Approved IDs, destinations, duration rules, ranking, and tourKind were not changed.

## Removed

- Previous classification UI, its state and JSON mapping from the Admin Edit page.
- Handling of a localized object as an old Tour Type during Edit initialization.
- Singular `tourStyle` query aliases in API, listing parser, Category, Subcategory, Search and SSR.
- Old request-body compatibility and eight unused singular style translation keys.
- `server/src/utils/tourFilterMigration.ts` and `server/src/scripts/migrateTourFilters.ts`.
- Migration-only test cases, retaining current classification/filter coverage.
- Four ignored local reports: `tour-filter-migration-1790272641680.json`, `tour-filter-migration-1790290517074.json`, `tour-filter-migration-1790327180566.json`, `tour-filter-migration-reviewed-1790327001769.json`.
- Obsolete migration execution instructions in the implementation documentation.

## Save contract

The catalog remains `server/src/config/tourFilters.json`, unchanged. The model now
requires a type and accepts only its four IDs, with implicit string casting disabled.
API creation requires a valid type; updates reject any explicitly supplied invalid
type while allowing partial updates that leave the saved type untouched.

Both Admin create and edit use the shared save validator. Local browser drafts can
remain incomplete because autosave does not write to MongoDB. There is no exception
for saving inactive Tours with an empty type. New server utility `validTourType`
validates the current catalog; it is not a migration helper.

## Database operation

Read-only dry run: 12 documents contained the old singular field; 9 had non-empty
values and 3 had empty values. After code checks, a fresh audit again verified all
current classifications before executing only:

```javascript
collection.updateMany({ tourStyle: { $exists: true } }, { $unset: { tourStyle: '' } })
```

Matched/modified: 12. Remaining: **0**. All 12 current classifications remain valid.
A SHA-256 comparison of all other tour fields, sorted by document ID, matched before
and after. This verifies unchanged current types, styles, kind, timestamps, version,
destinations and all other tour content. No migration script was added for this
one-time cleanup.

## Validation

- Frontend: **127 tests passed**, zero failures.
- Backend: **90 tests passed**, zero failures/skips, including opt-in MongoDB filtering integration.
- New coverage: all valid types; missing, empty, null, unknown, free-text, array and object rejection; inactive saves; valid API create/edit; partial edits; document save/reload; kind/styles preservation; shared Admin save validation; canonical URL parsing.
- Retained coverage includes empty/single/multiple styles, invalid/duplicate styles, Admin controls, destinations, duration, filtering and sorting.
- API write tests use mocked persistence and actual controller logic. Model save tests use actual Mongoose middleware with mocked collection writes. No test tours were inserted into the live database.
- Client TypeScript, server TypeScript/build and client production build passed.
- Lint on task-modified TS/TSX files: zero errors; 4 client warnings and 89 server warnings.
- `git diff --check` passed.
- Repository scan: no old classification runtime dependencies. Two singular-key occurrences remain intentionally in the URL regression test to prove the obsolete alias is ignored. Documentation names removed fields/tools only as historical audit evidence.

## Files changed by this task

- `client/src/app/(admin)/admin/tour/tour/[id]/edit/page.tsx`
- `client/src/app/(visitor)/[locale]/(home)/[slug]/page.tsx` (only the style alias; other existing changes preserved)
- `client/src/app/(visitor)/[locale]/(home)/[slug]/_views/CategoryView.tsx`
- `client/src/app/(visitor)/[locale]/(home)/[slug]/_views/SubcategoryView.tsx`
- `client/src/components/sections/SearchResultsPage/SearchResultsPage.tsx`
- `client/src/lib/tours/listingFilters.ts`
- `client/src/lib/validations/tourValidation.ts`
- `client/src/types/tour.ts`
- `client/src/i18n/locales/{en,de,it,es}/{tours,search}.json`
- `client/tests/tour-classification.test.ts`
- `client/tests/tour-listing-filters.test.ts`
- `server/src/controllers/tourController.ts`
- `server/src/models/Tour.ts` (type definition/validation only; existing cache changes preserved)
- `server/src/utils/tourType.ts` (new current-contract validator)
- `server/tests/tour-type.test.ts` (new)
- `server/tests/tour-filter-contract.test.ts`
- `server/tests/tour-styles.test.ts`
- `server/tests/tour-destinations.test.ts` (valid type added to API test requests)
- The two deleted tools and four local reports listed above.
- `docs/tour-filter-implementation.md`, `docs/tour-filter-data-review.md`, and this report.

Unrelated work already present in the workspace was preserved.
