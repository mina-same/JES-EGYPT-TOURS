# Visitor filter implementation — 2026-09-30

Scope: the approved VISITOR-FILTER-01–08 visitor UX pass. No deployment or publication. This pass does not edit Admin, Tour schemas, classification storage, catalog IDs, destination/pricing architecture, duration normalization, tourKind, navigation cards, or Recommended ranking.

## Completed tasks

| Task | Implementation | Main files | Verification / result |
| --- | --- | --- | --- |
| VISITOR-FILTER-01 | Visitor Tour Type checkboxes; sorted/deduplicated CSV; OR membership. A single old URL remains valid. Stored Tour type remains scalar. | `StructuredFilters.tsx`, `tourFilterContract.ts` | Contract/type tests; Mongo `$documents` single/multiple/AND cases; browser multi-type Apply and individual chip removal: pass. |
| VISITOR-FILTER-02 | Search reads applied filters, page and sort from one URL snapshot. AbortController retained. Draft state is separate. | `SearchResultsPage.tsx` | Apply from page 2, Back and Forward each produce one coherent request: pass. |
| VISITOR-FILTER-04 | Localized price context and current currency in chips; shared ID sanitization; invalid labels hidden; valid values retained; Clear all with any active filter; individual multi-value removal. | `filterValues.ts`, `FilterChips.tsx`, `listingFilters.ts`, `tour.server.ts`, three listing views, locale JSON | Helper/listing tests; EUR browser checks; unknown-ID URLs; individual chip removal: pass. |
| VISITOR-FILTER-05 | Dark interactive text on brand gold, visible keyboard focus, 44px minimum targets, associated translated price errors, first invalid field focus. | `visitorFilters.css`, `TourListingFilters.tsx`, listing views | Button text contrast 6.27:1; browser error association, focus, Escape and focus trap: pass. |
| VISITOR-FILTER-03 | Shared drawer shell with fixed header/footer and only the form content scrolling. Search gains the same mobile Tour form. | `TourFilterDrawer.tsx`, `mobileFilterDrawer.css`, `TourListingFilters.tsx`, listing views | Three pages at mobile/tablet widths; footer inside viewport; invalid Apply stays open; Escape/focus restoration/body lock: pass. |
| VISITOR-FILTER-06 | Places remain checkboxes; eight-or-fewer options stay simple. Longer lists offer Show more/less and local search. No nested option scrollers. Existing five duration ranges retained. Empty groups hidden. | `StructuredFilters.tsx`, four `tours.json` files | Control tests; 12-place browser fixture at 390px retains hidden selection and sends zero requests while searching: pass. |
| VISITOR-FILTER-07 | Shared five-option sort near Tour count; immediate sort uses applied filters, resets page, and preserves unapplied drafts. | `TourSort.tsx`, three listing views | Browser checks on Category/Subcategory/Search; rapid changes end in latest sort; control/catalog test: pass. |
| VISITOR-FILTER-08 | Unfiltered empty scope uses existing scope text; filtered zero results offer a concise message and nearby Clear filters. | `TourEmptyState.tsx`, listing views, four `tours.json` files | Control tests and real Search zero-result recovery: pass. |

Implementation followed the approved order: 01 → 02 → 04 → 05 → 03 → 06 → 07 → 08. No scope deviation. Search shares only Tour controls/shell/chips/sort, rather than its article fetching or page architecture. Its Blog Category has an independent Apply action; Tour Apply preserves the applied Blog Category. Full Reset retains the existing Search reset behavior, including clearing the shared search and returning to Recommended.

## Final behavior

1. **Structure:** Search, Places Visited, Duration, Price, Tour Type, Tour Styles. Search page retains its existing top search input instead of duplicating it inside the drawer. Empty option groups disappear.
2. **Mobile:** header → scrollable content → Reset/Apply footer, safe-area padding; focus trap, Escape, close, focus restoration and body lock. Invalid prices prevent application and reveal/focus the offending field.
3. **Search:** URL is the committed snapshot; typing and checkbox changes only modify drafts. Articles retain their separate query/fetch behavior.
4. **Type:** multi-select visitor filter; scalar Tour storage unchanged. CSV values use OR, combined with other groups using AND.
5. **Chips:** localized labels, contextual prices, currency from the existing currency context; one chip removes one value. Unknown catalog IDs are sanitized and unknown destination IDs never receive invented/raw labels. Destination membership is sanitized on the next URL update after scope options load.
6. **Sort:** Recommended, ascending/descending Price, ascending/descending Duration. Applied immediately, page 1, without applying/discarding pending filter edits.
7. **Accessibility:** explicit labels, error associations, visible focus, touch targets, dark-on-gold controls; calculated normal-state button contrast 6.27:1. This is focused verification, not a claim of a whole-site WCAG audit.
8. **Localization:** EN/DE/IT/ES checked in the actual browser, including German wrapping, Spanish Familiar, translated errors, euro input/chips and no raw unknown IDs. Local-option labels are also covered by tests.
9. **Requests:** no typing/local-place-search requests; one coherent Apply/Back/Forward/Reset request; invalid price sends none; multi-type submits one CSV request. Rapid sorting resolves to the latest requested state with abort protection retained.
10. **Validation:** results below.

## Validation results

- Frontend: `npm test` — **148 passed**. New `visitor-filter-controls.test.ts` also rerun after its lint-only variable rename: **5 passed**.
- Backend: eight related test files — **36 passed, zero skipped**, including read-only Mongo integration with `RUN_FILTER_DB_TESTS=1`. `$documents` fixtures do not insert/update collections.
- Client TypeScript: `tsc --noEmit` — pass.
- Client production build: `npm run build` — pass.
- Server TypeScript/build: `npm run build` — pass.
- ESLint on this task's changed client files: zero errors, three hook-dependency warnings in the existing listing fetch effects. New controls/helpers/tests: zero warnings/errors. Changed server contract/tests: zero warnings/errors.
- `git diff --check` — pass. Git reports only line-ending conversion notices.
- Browser matrix: Category/Subcategory/Search × EN/DE/IT/ES × 1280/768/390px — **36 passed**, including no horizontal page overflow, five sort choices, localized contextual chips and viewport-visible drawer footer.
- Additional browser checks: mobile invalid-field focus and Escape on all three pages; sort preserves drafts on all three pages; four-language translated validation/EUR apply and sorting; long-list selection persistence, no local-search requests, empty styles hidden, focus trap; actual request and empty-recovery tests.
- Non-blocking tool notices: Next middleware convention deprecation, old Browserslist data, Node test-module type inference. No dependencies were changed to suppress these unrelated notices.

Browser scripts, logs and screenshots are local verification artifacts under `%TEMP%/visitor-filter-*`, `%TEMP%/visitor-*.log`, and `%TEMP%/visitor-filter-review/final-*.png`. Tests use the locally available Playwright/Chrome installation; no browser-test dependency was added.

## Files changed by this pass

- `client/src/app/(visitor)/[locale]/(home)/[slug]/_views/CategoryView.tsx`
- `client/src/app/(visitor)/[locale]/(home)/[slug]/_views/SubcategoryView.tsx`
- `client/src/app/(visitor)/[locale]/(home)/[slug]/_views/mobileFilterDrawer.css`
- `client/src/components/common/TourListingFilters/FilterChips.tsx`
- `client/src/components/common/TourListingFilters/StructuredFilters.tsx`
- `client/src/components/common/TourListingFilters/TourListingFilters.tsx`
- `client/src/components/common/TourListingFilters/TourFilterDrawer.tsx` (new)
- `client/src/components/common/TourListingFilters/TourSort.tsx` (new)
- `client/src/components/common/TourListingFilters/TourEmptyState.tsx` (new)
- `client/src/components/common/TourListingFilters/visitorFilters.css` (new)
- `client/src/components/sections/SearchResultsPage/SearchResultsPage.tsx`
- `client/src/lib/tours/filterValues.ts` (new)
- `client/src/lib/tours/catalog.ts` (JSON import attribute for shared Node/browser test loading; catalog unchanged)
- `client/src/lib/tours/listingFilters.ts`
- `client/src/lib/api/tour.server.ts` (sanitize SSR query; listing cache contract version increment)
- `client/src/i18n/locales/{en,de,it,es}/{tours,search}.json`
- `client/tests/tour-listing-filters.test.ts`
- `client/tests/visitor-filter-values.test.ts` (new)
- `client/tests/visitor-filter-controls.test.ts` (new)
- `server/src/utils/tourFilterContract.ts`
- `server/tests/tour-filter-contract.test.ts`
- `server/tests/tour-filter-mongo.test.ts`
- This report.

Other concurrent workspace changes are outside this pass and are not included in the file list above.
