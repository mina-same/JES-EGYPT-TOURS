# Tour filtering implementation

Contract: one product type; multiple styles and destinations; OR within a group,
AND between groups. Stable IDs travel in URLs as sorted, deduplicated comma-separated
values. Localized labels are presentation only. Duration uses positive hours;
day-based catalogue values use 24 hours per day. Missing values remain missing.
Options use the full visible category/subcategory scope, independent of active
filters, sorting and pagination. Recommended order: specified ascending, then
unspecified; ties use createdAt descending and _id ascending.

- [x] FILTER-01 Contract/catalog
- [x] FILTER-02 Destinations and optional localized short labels
- [x] FILTER-03 Duration precision and removal of the false 3 Days fallback
- [x] FILTER-04 Product type and multiple styles (canonical schema and all consumers)
- [x] FILTER-05 Admin and recommended order
- [ ] FILTER-06 Types/places and ten durations applied; style decision, duration conflicts and legacy cleanup remain
- [x] FILTER-07 Backend filters/options/sorting
- [x] FILTER-08 URL/SSR/cache
- [x] FILTER-09 Accessible localized UI
- [x] FILTER-10 Technical verification; data acceptance follows the manual review

## Architecture and behavior

`server/src/config/tourFilters.json` is the single catalog imported by both
applications. Next's Turbopack root includes the workspace so it can resolve
the shared JSON. Build the frontend with both workspace directories present.

The Tour schema stores `tourType`, `tourStyles[]`, `destinations[]`,
`durationHours`, and optional `recommendedOrder`. `tourKind` still controls
pricing plans. Localized duration text is presentation only. A catalogue
selection writes both the display labels and numeric hours. Custom/ambiguous
durations require an explicit numeric value in Admin.

Queries use OR within styles/places/duration ranges and AND across groups,
including search and price. Filters and sorting run before pagination.
Unpriced tours and tours without duration sort last in both directions.
The price expression uses the selected currency, otherwise converted USD,
and the same displayed precision as cards. The response supplies that effective
currency amount, so cached browser exchange rates cannot change the amount
that was filtered. Missing/zero prices are excluded from price ranges.

Options come from the full visible category/subcategory scope, including locale
availability, independently of active filters, sort and page. Destination
options are restricted to IDs referenced by those tours. The client no longer
derives additional options from the current result page.

The URL stores applied filters. Draft editing makes no requests. Apply, sorting,
pagination and Reset update native history and let the existing browser fetch
run once, without a second server-component navigation fetch. Back/Forward
restores applied state. Arbitrary filtered SSR requests bypass the data cache;
bounded listing requests include scope, locale, currency, sort, page and a new
filter-contract version in their identity. Destination, tour and exchange-rate
updates invalidate tour caches. Options are fetched afresh, with locale headers.

## Migration and remaining data work

From `server/`:

```sh
npx ts-node src/scripts/migrateTourFilters.ts          # report only
npx ts-node src/scripts/migrateTourFilters.ts --apply  # deterministic changes
```

The applied migration populated numeric durations for nine tours and left
classifications and visited destinations untouched. It saved pre-migration
values, timestamps and edit versions in a local report before writing.
Post-migration verification confirmed all nine values, unchanged classifications,
and that a repeat migration plans no further deterministic changes.

The itinerary review applied types and existing destinations to all 11 tours
and resolved the eight-day duration. Styles and two conflicting duration records
still require the owner's decision. See [the data review](tour-filter-data-review.md). Existing
legacy style values remain readable for manual review; the old style
field is neither a schema field nor a filter source. Style inference and old-field cleanup are explicitly paused. The migration
never assigns styles, even from exact old labels, and never removes tourStyle.
Manual selection uses the new chip control; later cleanup is a separate step.
No permanent rollback fields were added to Tour.

Status-only saves validate modified fields so unmigrated classifications do
not break status toggles. The existing content-wide duplicate-link guard still
runs. Full editor saves enforce the new classification contract.

## Verification

- After the itinerary review, 252 read-only calls to the actual listing/options
  controllers passed against the connected database: all four languages and
  three currencies, type/place/duration filters, price/duration ordering with
  missing values last, stable pagination, and subcategory-scoped options.
  Results contain six day tours, five multi-day tours and six represented
  existing destinations. Styles remain pending and are not claimed as accepted.
- Server and frontend production builds passed.
- Server tests cover schema validation, migration/idempotence, scope-aware
  options, OR/AND behavior, pagination, numeric sorting and price validation.
- Opt-in Mongo integration tests use `$documents` fixtures and write no data;
  they cover every duration boundary, missing values, deterministic ordering,
  currency fallback, displayed-price rounding and pagination.
- Client tests cover URL state, Reset defaults, cache eligibility and request
  identity. Existing duplicate-link tests remain passing.
- Browser checks used the production build and intercepted fixture responses
  for classified tour options: English desktop/mobile, German, Italian and
  Spanish; multi-select, Apply-only fetching, individual chip removal, Reset,
  history navigation, sorting, invalid-price drawer behavior, Escape/focus
  return and horizontal overflow. No browser page errors were recorded.
- Targeted frontend lint has no errors; existing broad-effect dependency
  warnings remain in the three listing views.

Application changes have not been deployed. Deploy both API and frontend
together after reviewing the remaining data; verify cache invalidation
connectivity. Local revalidation now returns HTTP 200 after starting the configured
frontend; the earlier failure was caused by that frontend being offline.


## Revised Tour Styles delivery

- FILTER-01/04: existing shared catalog remains the only list of five IDs and localized labels. Schema/API now reject unknown IDs, non-arrays and duplicates; empty arrays are allowed. Type and booking kind remain independent.
- FILTER-05/09: Admin uses native toggle buttons with aria-pressed, visible check marks, keyboard focus and wrapping. No language tabs/free text/default selection. Empty values show Needs manual review. Saved arrays load directly into the same control on create/edit.
- FILTER-06: classification and cleanup paused; never infer from title, description or legacy text. Existing valid arrays remain intact. Remaining manual records are in the data review document. Duration conflicts do not block the style control.
- FILTER-07/08: existing OR-within-styles and AND-across-groups, stable URL IDs, scoped options and caching retained.
- FILTER-10: added write/schema/API rejection, Admin state/edit/empty, four-language labels, no guessing/cleanup and real Mongo filtering coverage. Browser verified native Tab/Space/Enter operation at 390px, no horizontal overflow or page errors. Server/client builds pass. No deployment or style database writes.

Dependencies: catalog -> validation/schema/types -> Admin and visitor labels -> tests. Manual selection -> later separately authorized cleanup; neither duration clarification nor legacy cleanup blocks this implementation.

Changed implementation files in this revision:

- server/src/utils/tourStyles.ts, server/src/models/Tour.ts, server/src/controllers/tourController.ts, server/src/utils/tourFilterMigration.ts
- client/src/components/admin/tour/TourStyleSelect.tsx, TourFilterFields.tsx
- client/src/lib/tours/catalog.ts, client/src/types/tour.ts
- client/src/components/common/TourListingFilters/FilterChips.tsx
- client/src/components/sections/TourListingDetailsOne/{TourListingDetailsOne.tsx,useTourData.ts,types.ts,components/TourInfoBar.tsx}
- server/tests/{tour-styles.test.ts,tour-filter-contract.test.ts,tour-filter-mongo.test.ts}, client/tests/tour-styles.test.ts
- docs/tour-filter-implementation.md, docs/tour-filter-data-review.md

Verification totals for this revision: 14 server tests passed (8 contract, 1 options, 4 style save/API/schema/legacy, 1 opt-in read-only Mongo), plus 10 client tests (7 listing/URL/cache, 3 Admin/localization). Backend build, frontend production build and TypeScript checks passed. No tests wrote style classifications to the connected database.
