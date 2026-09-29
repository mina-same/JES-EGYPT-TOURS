# Tour Type write investigation — 2026-09-29

> Historical diagnosis. After the user manually corrected both records, the
> [final cleanup verification](tour-classification-cleanup.md#final-re-verification-after-both-manual-corrections)
> confirmed 13 valid scalar types, verified a real transactional save and resumed
> the authorized cleanup. Statements below about paused cleanup, retained display
> compatibility and the two invalid records describe the earlier snapshot.

## Outcome and limits

**Confirmed:** the update controller accepted a dotted property such as
`{"tourType.en":"day-tour","_editVersion":0}`. It checked only the exact
`tourType` property. Mongoose retained the dotted path and validated its leaf
against the scalar enum, even with `runValidators: true`. An isolated execution
of the actual controller and Mongoose query reached the stubbed collection
driver with `$set: {"tourType.en":"day-tour"}` and returned HTTP status 200.
No live write was used in this reproduction.

**Fixed:** create/update now reject all `tourType.*` request properties before
database access. Draft restoration accepts only current scalar IDs. The form
change handler treats type as scalar regardless of locale and ignores dotted
type changes. No translated value is converted or inferred into an ID.

**Not established:** which process/person wrote the two observed documents.
The dotted-path defect can change a legacy object, or create an object where
the field is absent; it does not convert an existing scalar to an object in
MongoDB. It also does not explain a `Privado` leaf: a separate diagnostic
confirmed that the current update enum rejects that leaf. Current create
validation rejects the Aswan object shape. Do not describe this fix as proof
of the historical writer or as protection against every direct database client.

The diagnosis was reported in the conversation before code changes. Legacy
cleanup remains paused. No record correction, database validator installation,
manual restart, deployment, or publishing was performed. The local nodemon
watcher can reload automatically when source changes.

## A. Write paths reviewed

| Path | Type behavior |
| --- | --- |
| `client/src/app/(admin)/admin/tour/tour/new/page.tsx` | `validateTourForm`, shallow form payload, `tourAPI.create`; no type localization |
| `client/src/app/(admin)/admin/tour/tour/[id]/edit/page.tsx` | Loads `tour.tourType` directly; validates, constructs payload and calls `tourAPI.update`; no type localization |
| `client/src/hooks/useTourForm.ts` | Initial state, localStorage restoration/autosave, generic change handler; restoration gap fixed |
| `client/src/components/admin/tour/TourFilterFields.tsx` | Radio control emits `onChange('tourType', option.id)` without a language argument |
| `client/src/lib/api/tour.ts`, `client/src/lib/api/axios.ts` | POST/PUT forwards data; interceptor sets headers, not type shape |
| `server/src/routes/tourRoutes.ts` | POST `/api/tours`, PUT `/api/tours/:id`, protected permission routes |
| `server/src/controllers/tourController.ts` | Create validates then `Tour.create`; edit validates then `$set: body` through `findByIdAndUpdate` with `runValidators: true` |
| `server/src/models/Tour.ts` | Required String, `cast: false`, enum from shared catalog; no type-localizing setter |
| Status/featured controller actions | `save({validateModifiedOnly:true})`; modify their flags, not type |
| `server/src/seeds/{tourSeeder,detailedTourSeeder,comprehensiveTourSeeder}.ts`, `server/src/scripts/seedTestTour.ts` | Model create/save; no current localized type writer found; missing required types would fail current validation. Not executed |
| `server/src/scripts/migrateTours.ts` | Localizes heading/Description only; uses `validateBeforeSave:false`, but does not assign type. Not executed |
| `server/src/scripts/sanitizeExistingContent.ts` | Generic model update of specified rich-text roots; type is not in its Tour field list |
| `server/src/scripts/{backfillTourKind,clearPlaceholderPrices}.ts` | Update kind/price fields only; no type assignment |
| `server/src/services/publishingScheduler.ts` | Updates scheduling/status fields only |
| `server/src/scripts/{finalizeTourDestinations,resetTourSocialImages}.ts` | Raw collection updates, scoped to old location or SEO fields; no type assignment |
| Leftover `server/dist/scripts/migrateTourFilters.js` and `server/dist/utils/tourFilterMigration.js` | Generated artifacts remain although source deletion predates this task. Reviewed, not executed or removed. The mapper writes recognized scalar IDs, not localized type objects |

No current repository importer or localization script assigning an object to
type was identified. This is not a claim to have inspected remote servers,
every external script, or every browser's localStorage.

## B. Exact Admin flow

| Stage | Create example | Edit example |
| --- | --- | --- |
| Selected radio | `"multi-day"` | `"day-tour"` |
| Form state | `tourType: "multi-day"` | `tourType: "day-tour"` |
| Validated submit payload | Same scalar | Same scalar plus edit version |
| API client / JSON request | Same scalar | Same scalar |
| Controller | Validates approved ID | Validates explicit approved ID; omitted type remains a supported partial update |
| Persistence operation | `Tour.create(body)` | `$set: {tourType: "day-tour", ...}` with validators |
| Expected Mongo shape | Scalar string | Scalar string |

These paths were checked through source, form/control tests, real controller
tests, model-save tests, and isolated HTTP route tests. No browser save or
live create/update was performed. The tests use model/collection substitutes
where persistence would occur.

## C–D. Localization and drafts

- `toLocalized` helpers in the edit page apply to content fields, not type.
- Locale middleware selects `req.locale`; response localization reads data,
  not writes a localized type object into request bodies.
- Labels/IDs come from `server/src/config/tourFilters.json` via the existing
  client catalog. The old object fallback in `tourTypeLabel` is display-only;
  it remains because this task explicitly pauses legacy cleanup.
- Before this fix, `createInitialTourFormData` whitelisted names only. A draft
  containing a type object survived restoration. Normal submit validation
  rejected it, so this is not evidence that a draft caused either DB write.
- After the fix, invalid/restored object types become an unselected empty
  form value. Saving still requires an explicit valid choice. Styles/kind and
  other editable values are retained. Autosave remains localStorage-only.

## E–F. Validation and bypass boundaries

- Before and after: direct type objects, `"Private"`, empty string and unknown
  values are rejected by current create/update validation.
- Before: a valid enum ID under a dotted type key bypassed the controller's
  exact-property check and passed Mongoose query validation. After: rejected
  with 400 and `path: "tourType"`, including when accompanied by a valid root ID.
- Ordinary object `$set: {tourType: {en: "Private"}}` raises a Mongoose cast
  error. `runValidators: true` is present in the edit operation but was not
  sufficient to forbid the dotted path.
- General Mongoose operations without validators, raw collection methods,
  and update pipelines must not be assumed safe from the scalar schema alone.
  A cast-only pipeline check retained its object assignment; this does not
  prove it passes the project's content-update middleware (which rejects
  pipelines while validating an existing document).
- Read-only collection metadata showed **no MongoDB collection validator**.
  A raw database client can bypass application validation. No validator or
  database permissions were changed in this task.

## G. Runtime/build/environment evidence

- Local Admin config: `NEXT_PUBLIC_API_URL=http://localhost:5001`.
- Main backend observed on port 5001: PID 26276, ts-node `src/server.ts`,
  started `2026-09-29T10:40:29.7138242Z`.
- Controller/model source modification timestamps were approximately
  `10:40:29Z`, immediately before that start. This does not support blaming
  an older local process merely because it was long-running.
- On-disk `dist` controller/model already contained the scalar guard/schema
  at diagnosis time. The active backend used source, not `dist`.
- Main Next development process was on port 3000. Additional isolated
  harness/Next processes were also running on other ports. Their presence
  alone does not identify the historical writer.
- The server `.env` points to one configured database; client configuration
  uses the expected local API. Remote production environment variables,
  browser-cached builds, and the actual URL used for the two historical edits
  were not established. No credentials were printed.

## H. Database evidence (UTC)

| Tour | createdAt | updatedAt | editVersion |
| --- | --- | --- | --- |
| Luxor `6ab69bff81f928e3f6581af2` | 2026-09-25T16:06:23.344Z | 2026-09-29T15:20:55.971Z | 4 |
| Aswan `6abbe42d8e68608145aafcd4` | 2026-09-29T16:15:41.308Z | 2026-09-29T16:15:41.308Z | 0 |

Luxor still has `{en:"day-tour",de:"",it:"",es:"Privado"}`. Aswan still has
`{en:"Private",de:"",it:"",es:""}`. Both retain the observed legacy style
objects. There was no writer identity metadata on these documents and no
dedicated audit/history collection identified. Dates/version numbers alone
do not prove an Admin action. Database provider audit logs were not available
through this local project.

Full-document SHA-256 fingerprints matched before and after the work:

- Luxor: `8ed9cbbe326d68bce1357cc46e4ea1a1d62b2822113819b1c7a5a88a79e24aff`
- Aswan: `53c9624cf75fd841c98ee8aa99b4f99d6692450a20fa046fc0ea493cf36f6bf2`

## Changes in this task only

- `server/src/utils/tourType.ts`: detect dotted type request properties.
- `server/src/controllers/tourController.ts`: reject them on create/update.
- `client/src/hooks/useTourForm.ts`: enforce scalar restoration/change shape.
- `server/tests/tour-type.test.ts`: additional object and dotted-key regression cases.
- `server/tests/tour-type-routes.test.ts`: real HTTP router/controller validation,
  with auth stubbed and database access forbidden.
- `client/tests/tour-classification.test.ts`: restoration and locale regressions.
- `client/tests/tour-destinations.test.ts`: provide the catalog dependency to the
  existing hook test.
- This diagnostic report.

Other existing workspace changes, including previously deleted migration
sources, were not created, reverted, or cleaned up by this task.

## Verification

- Server type/controller/route tests: **6 passed**, including **14 isolated
  HTTP requests** rejected before any database access.
- Client classification/destination tests: **17 passed**.
- Server TypeScript `npx tsc --noEmit`: passed.
- Client TypeScript `npx tsc --noEmit --incremental false`: passed.
- Targeted server lint: passed after replacing test-only CommonJS requires
  with dynamic imports; the HTTP test was rerun and passed.
- Targeted client lint: passed. Targeted lint used `--quiet` (no errors;
  warnings are not included in that output).
- No production build/deploy or live write test was run.

Historical attribution remains open. The missing evidence is the actual
Admin/API address used for those changes and/or the relevant server/database
audit logs or external import/translation script. The repaired application
defect must not be presented as a proven explanation of both records.
