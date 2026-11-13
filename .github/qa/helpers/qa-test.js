const { test: nodeTest } = require('node:test');
const { AsyncLocalStorage } = require('node:async_hooks');
const { mkdirSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { hash } = require('./run-store');
const observations = new AsyncLocalStorage();
function test(name, fn) {
  return nodeTest(name, (context) => observations.run([], async () => {
    try { await fn(context); }
    finally {
      if (process.env.QA_RUN_DIR) {
        const directory = resolve(process.env.QA_RUN_DIR, process.env.QA_SUITE || 'api', 'observations');
        mkdirSync(directory, { recursive: true });
        writeFileSync(resolve(directory, `${hash(name).slice(0, 12)}.json`), JSON.stringify(observations.getStore(), null, 2) + '\n');
      }
    }
  }));
}
async function observedFetch(url, options = {}) {
  const response = await globalThis.fetch(url, options);
  if (observations.getStore()) {
    let data;
    try { data = await response.clone().json(); } catch { data = {}; }
    const source = data.data && !Array.isArray(data.data) ? data.data : data;
    const body = Object.fromEntries(['status', 'amountPaid', 'finalAmount', 'debt', 'paymentMethod', 'checkInTime', 'deletedCount', 'error']
      .filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
    if (Array.isArray(data.data)) body.recordCount = data.data.length;
    if (data.account) body.role = data.account.role;
    observations.getStore().push({ method: options.method || 'GET', path: new URL(url).pathname,
      httpStatus: response.status, body }); // Never record request credentials, token or full response.
  }
  return response;
}
module.exports = { test, observedFetch };
