# Tour filter data review

The safe migration populated durationHours for nine tours. No product types, styles or visited places were inferred. Two duration values still need an explicit decision.

For every row, open `/admin/tour/tour/<ID>/edit`, choose one product type, select all applicable styles and link the visited Destination records. The editor displays the old classification for reference. Do not infer a product type from Private, or a style from a mixed prose value.

| Tour ID | Previous type | Previous styles | Duration text | Numeric hours |
|---|---|---|---|---|
| 69d6cad7c892ee7bf706b7c1 | Private Day Tour | Cultural, Historical, Archaeological | Full Day Tour | Review required |
| 69eba460ac4b6f1c4b5e978b | Private Day Tour | Cultural, Historical | 8 Hours | 8 |
| 6a6e541ba7140e1258b8408a | Private | Cultural, Historical, Sightseeing | 12 Hours | 12 |
| 6a7398c392de90d50098dd5c | Private | Cultural, Historical | 2 days / 1 night | 48 |
| 6a77a6f7ab95158963322c61 |  |  |  | Review required |
| 6a87755d0268abc7356301c4 |  |  | 5 Days / 4 Nights | 120 |
| 6a88b5edb76c55511f7e0205 |  |  | 8 Days / 7 Nights | 192 |
| 6aacf82547dcc8ec678d6c74 | Private | Cultural, Historical | 8 Hours | 8 |
| 6aad11bfcb26661aeb74e0a2 | Private | Cultural, Luxury, Beach | 10 Days / 9 Nights | 240 |
| 6aae353ddd225c59e29681fc | Private | Cultural | 6 Hours | 6 |
| 6ab2c859a83cf835c0240cac | Private | Cultural, Historical | 6 Hours | 6 |

After manual classification, run the migration dry-run again and review its report. Applying it then removes the obsolete tourStyle field only where canonical tourStyles have been provided. The old field is not used by filters or accepted by create/update APIs.

Rollback source for the applied duration migration: `server/tour-filter-migration-1790290517074.json` (local, git-ignored). It includes pre-migration values and edit versions. Restore only the fields changed by that migration after checking for subsequent edits.

The migration attempted cache revalidation, but the configured frontend endpoint was unreachable. Deploying the updated frontend uses a new listing cache identity; verify cache invalidation connectivity during deployment.
