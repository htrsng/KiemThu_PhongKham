# SmileCare clinic management

Academic web application for managing clinic accounts, doctors, services, appointments, billing and payroll. The repository also contains manual test documents and a Cypress suite.

## Repository layout

- `client/`: React and TypeScript frontend.
- `server/`: Express API and MongoDB models.
- `testing/e2e/`: Cypress specs, page objects, fixtures and configuration.
- `docs/qa/`: test case workbooks, generators and historical reports.
- `scripts/`: maintenance scripts.
- `patches/`: existing one-off fixes; review before running.

## Run locally

Use Node.js 22.12 or later and a running MongoDB instance.

1. Copy `server/.env.example` to `server/.env` and set local values.
2. In `server/`, run `npm install` and `npm start` (port 5000 by default).
3. In `client/`, run `npm install` and `npm run dev` (port 5173).
4. In `testing/e2e/`, run `npm install`, then `npm run cy:open` or `npm run cy:run`.

Set the required `ADMIN_USER`, `ADMIN_PASS` and role-specific `*_USER` / `*_PASS` environment variables in the shell or CI secrets before running Cypress. Credentials have no built-in defaults. A `.env.example` file is a template; Cypress does not load it automatically.

The test accounts and database records required by each spec must exist before execution. Fixtures are input files, not proof that accounts have been seeded.

## Testing status

The suite is work in progress. Some specs contain placeholder bodies or only visit a page. A passing placeholder does not verify the named business behavior. GitHub Actions is configured, but successful end-to-end execution has not been verified for this cleanup.

Some legacy Python generators in `docs/qa/generators/` randomly assign Pass, Fail, Blocked, tester names and dates. Their output is synthetic, not a record of manual execution. Do not use those generated statuses or counts as portfolio results. Record actual execution separately and retain the input, expected result, observed result and evidence.

Historical reports may refer to earlier paths or local Windows files. Treat them as historical documents rather than current execution evidence.

## Conventions

See [repository conventions](CONTRIBUTING.md). Test output and dependencies stay out of version control.
