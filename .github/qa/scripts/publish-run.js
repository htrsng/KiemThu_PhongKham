const { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } = require('node:fs');
const { resolve, relative } = require('node:path');
const { root, runRoot } = require('../helpers/run-store');
const { redact } = require('../helpers/redact');
function publishRun(runId) {
  if (!/^QA-[A-Za-z0-9TZ]+-[a-f0-9]+$/.test(runId || '')) throw new Error('Invalid Run ID');
  const source = resolve(runRoot, runId);
  const record = ['execution.json', 'newman-results.json', 'unit-results.json'].find((file) => existsSync(resolve(source, file)));
  if (!record) throw new Error('No execution, Newman or unit report found');
  const execution = JSON.parse(readFileSync(resolve(source, record), 'utf8'));
  if (execution.runId !== runId || !execution.finished) throw new Error('Run must be finished before publication');
  const destination = resolve(root, execution.label === 'postman' ? 'api-testing/reports/newman' : 'automation-testing/reports/runs', runId);
  if (existsSync(destination)) throw new Error('Published runs are immutable; choose a new run');
  mkdirSync(destination, { recursive: true });
  function copy(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        if (!['videos', 'report'].includes(entry.name)) copy(file);
      } else if (/\.(jsonl?|csv|tap|xml|xlsx|png|log|md)$/.test(entry.name)) {
        const target = resolve(destination, relative(source, file));
        mkdirSync(resolve(target, '..'), { recursive: true });
        const binary = /\.(png|xlsx)$/.test(entry.name);
        writeFileSync(target, binary ? readFileSync(file) : redact(readFileSync(file, 'utf8')));
      }
    }
  }
  copy(source);
  console.log(`Published ${runId}: ${destination}`);
  return destination;
}
if (require.main === module) {
  try { publishRun(process.argv[2]); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { publishRun };
