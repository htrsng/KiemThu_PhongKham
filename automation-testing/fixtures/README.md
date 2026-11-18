# QA Fixtures

Node API tests, Cypress tasks, and the Newman runner share `qa-data.js`. Each fixture has its own doctor, patient, service, shift, and IDs. The business actions under test go through HTTP or the UI. Fixtures require loopback API and MongoDB services and a database name ending in `_test`.

Cleanup deletes only records owned by the process and leaves the database in place. Keep credentials, tokens, passwords, and real patient records out of this directory.
