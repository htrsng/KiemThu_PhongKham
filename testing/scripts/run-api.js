// Reports are generated directly by Node's runner; no guessed pass counts.
const { spawnSync, execFileSync } = require('node:child_process');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const root = resolve(__dirname, '../..');
const defects = process.argv.includes('--known-defects');
const label = defects ? 'known-defects' : 'api';
const directory = resolve(root, 'testing/artifacts', label);
mkdirSync(directory, { recursive: true });
const files = defects ? ['testing/api/known-defects.test.js'] : ['testing/api/auth.test.js', 'testing/api/authorization-invoice.test.js'];
const started = new Date().toISOString();
for (const file of ['results.tap', 'junit.xml']) writeFileSync(resolve(directory, file), '');
const result = spawnSync(process.execPath, ['--test', '--test-concurrency=1',
  '--test-reporter=spec', '--test-reporter-destination=stdout',
  '--test-reporter=tap', `--test-reporter-destination=${directory}/results.tap`,
  '--test-reporter=junit', `--test-reporter-destination=${directory}/junit.xml`, ...files],
{ cwd: root, env: process.env, stdio: 'inherit' });
if (result.error) throw result.error;
const tap = readFileSync(resolve(directory, 'results.tap'), 'utf8');
const counts = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map((key) => {
  const match = tap.match(new RegExp(`^# ${key} (\\d+)$`, 'm'));
  return [key, match ? Number(match[1]) : null];
}));
const source = ['testing/scripts/run-api.js', 'testing/helpers/qa-data.js', 'server/server.js',
  'server/src/controllers/authController.js', 'server/src/controllers/appointmentController.js',
  'server/src/routes/appointmentRoutes.js', 'server/src/routes/invoiceRoutes.js', ...files];
writeFileSync(resolve(directory, 'manifest.json'), JSON.stringify({ started, finished: new Date().toISOString(),
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  sourceHashes: Object.fromEntries(source.map((file) => [file, createHash('sha256').update(readFileSync(resolve(root, file))).digest('hex')])),
  node: process.version, platform: process.platform, suite: label, counts, exitCode: result.status,
  note: 'Working tree run; source hashes identify tested files. No credentials included.' }, null, 2) + '\n');
process.exitCode = result.status ?? 1;
