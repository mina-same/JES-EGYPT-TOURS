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
- [ ] FILTER-06 Safe migration applied; manual classification and final legacy cleanup remain
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

All 11 tours need explicit product/style/place review; two also need a numeric
duration decision. See [the data review](tour-filter-data-review.md). Existing
localized type/style values remain readable for manual review; the old style
field is neither a schema field nor a filter source. After canonical styles
are assigned, rerun the migration to remove obsolete raw `tourStyle` values.
No permanent rollback fields were added to Tour.

Status-only saves validate modified fields so unmigrated classifications do
not break status toggles. The existing content-wide duplicate-link guard still
runs. Full editor saves enforce the new classification contract.

## Verification

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
connectivity, which was unreachable during the migration's best-effort refresh.
