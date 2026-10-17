# Request lifecycle checks

These checks were verified with Node.js 24. No production database or customer account is used.

From `server`, run `npm run test:request-flow`. This starts a temporary MongoDB,
checks all five public forms through HTTP, connects real Socket.IO clients,
then disposes the database. MongoDB Memory Server downloads its binary on its
first run; an existing test binary can be supplied with `MONGOMS_SYSTEM_BINARY`.

For the real admin UI and audio checks, install client dependencies and set
`RUN_REQUEST_BROWSER=1` before running the same command. Microsoft Edge must be
installed (or change the test's Playwright channel to an installed Chromium).
The harness uses port 3108 and a temporary source copy; it does not interrupt an
existing development server. The temporary copy is removed at process exit, after the frontend closes and queued directory scans finish. The Node test-runner exit flag prevents Next dev's global
watcher handles from retaining the test process after explicit cleanup.

Coverage includes:
- all forms, valid aliases/long email domains, retries and administrative field filtering;
- persisted notification recovery, unique delivery keys, explicit acknowledgment,
  batches over 100 and late/out-of-order inserts;
- permission-scoped HTTP/socket delivery, long and expired sessions, deactivated accounts;
- personal read/dismiss status, complete statistics beyond a single list page;
- version conflicts, employee assignment/release, previous and new statuses in audit history and historical tour identity;
- readable and empty activity history, unsaved-note reload confirmation and disabled controls during reload;
- browser sound activation, duration, matching stop, one audible owner across tabs;
- direct details outside pagination, notification pagination, failed operation feedback;
- HTTP synchronization while Socket.IO is unavailable.

Request status changes record internal workflow only. They do not send email to
customers. The request details explicitly remind employees to contact the customer.
