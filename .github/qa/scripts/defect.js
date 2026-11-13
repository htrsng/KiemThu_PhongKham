const { readFileSync, writeFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { execFileSync } = require('node:child_process');
const { root } = require('../helpers/run-store');
const { transition } = require('../helpers/defect-lifecycle');
const args = Object.fromEntries(process.argv.slice(2).map((arg) => { const i = arg.indexOf('='); return [arg.slice(2, i), arg.slice(i + 1)]; }));
try {
  const path = resolve(root, 'manual-testing/bug-reports/registry.json');
  const registry = JSON.parse(readFileSync(path, 'utf8'));
  const index = registry.defects.findIndex((defect) => defect.id === args.id);
  const event = { state: args.state, actor: args.actor, note: args.note, evidence: args.evidence, ...(args.fix ? { fixCommit: args.fix } : {}) };
  if (index < 0) {
    if (args.state !== 'New' || !/^BUG-\d{3}$/.test(args.id || '') || !args.title || !args.actor || !args.evidence || !args.note) throw new Error('New defect requires ID, title, actor, note and evidence');
    if (!['Critical', 'High', 'Medium', 'Low'].includes(args.severity) || !/^P[0-3]$/.test(args.priority || '')) throw new Error('Invalid severity or priority');
    if (!existsSync(resolve(root, args.evidence))) throw new Error('Missing evidence');
    registry.defects.push({ id: args.id, title: args.title, severity: args.severity, priority: args.priority,
      owner: args.owner || 'maintainer', testCaseIds: (args.cases || '').split(',').filter(Boolean),
      state: 'New', history: [{ ...event, at: new Date().toISOString() }] });
  } else {
    if (args.state === 'Fixed') execFileSync('git', ['cat-file', '-e', `${args.fix}^{commit}`], { cwd: root });
    registry.defects[index] = transition(registry.defects[index], event);
  }
  writeFileSync(path, JSON.stringify(registry, null, 2) + '\n');
  console.log(`${args.id}: ${args.state}`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
