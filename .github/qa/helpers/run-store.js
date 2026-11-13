const { mkdirSync, writeFileSync, readFileSync, existsSync } = require('node:fs');
const { resolve, relative, sep } = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash, randomBytes } = require('node:crypto');
const root = resolve(__dirname, '../../..');
const runRoot = resolve(root, 'automation-testing/reports/generated/runs');
const hash = (data) => createHash('sha256').update(data).digest('hex');
function git(args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); }
function createRun(label = 'all') {
  mkdirSync(runRoot, { recursive: true });
  const started = new Date().toISOString();
  const runId = `QA-${started.replace(/[-:.]/g, '')}-${randomBytes(3).toString('hex')}`;
  const directory = resolve(runRoot, runId);
  mkdirSync(directory); // Never reuse or overwrite an earlier run.
  const files = git(['ls-files', '--cached', '--others', '--exclude-standard', '--',
    'server', 'client', 'manual-testing', 'api-testing', 'automation-testing', '.github'])
    .split('\n').filter((file) => /\.(js|tsx?|json|csv|yml)$/.test(file)
      && !/\/(reports|test-execution)\//.test(file) && existsSync(resolve(root, file)));
  const sourceHashes = Object.fromEntries(files.map((file) => [file, hash(readFileSync(resolve(root, file)))]));
  const manifest = { schemaVersion: 1, runId, label, started, finished: null,
    executor: process.env.QA_EXECUTOR || (process.env.GITHUB_ACTOR ? `ci:${process.env.GITHUB_ACTOR}` : 'automation:local'),
    executionType: 'Automated', applicationVersion: JSON.parse(readFileSync(resolve(root, 'server/package.json'))).version,
    commit: git(['rev-parse', 'HEAD']), workingTreeHash: hash(JSON.stringify(sourceHashes)), sourceHashes,
    environment: { node: process.version, platform: process.platform, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      apiUrl: process.env.API_URL || 'http://localhost:5000/api', baseUrl: process.env.BASE_URL || 'http://localhost:5173' },
    ciRunUrl: process.env.GITHUB_RUN_ID ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null };
  writeFileSync(resolve(directory, 'run.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { directory, manifest };
}
function activeRun(label) {
  if (!process.env.QA_RUN_DIR) return createRun(label);
  const directory = resolve(process.env.QA_RUN_DIR);
  const path = relative(runRoot, directory);
  if (!path || path.startsWith('..' + sep) || path === '..' || resolve(runRoot, path) !== directory) throw new Error('Invalid QA run directory');
  return { directory, manifest: JSON.parse(readFileSync(resolve(directory, 'run.json'), 'utf8')) };
}
module.exports = { root, runRoot, hash, createRun, activeRun };
