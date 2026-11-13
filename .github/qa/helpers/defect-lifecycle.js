const { readFileSync, existsSync } = require('node:fs');
const { resolve, relative } = require('node:path');
const { execFileSync } = require('node:child_process');
const { root } = require('./run-store');
const transitions = { New: ['Open'], Open: ['Fixed'], Fixed: ['Retest'], Retest: ['Closed', 'Reopened'], Reopened: ['Open', 'Fixed'], Closed: ['Reopened'] };
function transition(defect, event) {
  if (!transitions[defect.state]?.includes(event.state)) throw new Error(`Invalid defect transition: ${defect.state} -> ${event.state}`);
  if (!event.actor || !event.note || !event.evidence) throw new Error('Actor, note and evidence are required');
  const evidence = resolve(root, event.evidence);
  if (relative(root, evidence).startsWith('..') || !existsSync(evidence)) throw new Error('Evidence must exist inside the project');
  if (event.state === 'Fixed' && !/^[a-f0-9]{40}$/.test(event.fixCommit || '')) throw new Error('Fixed requires a full fix commit');
  if (['Retest', 'Closed', 'Reopened'].includes(event.state)) {
    const report = JSON.parse(readFileSync(evidence, 'utf8'));
    const hits = report.results?.filter((result) => result.bugIds?.includes(defect.id)) || [];
    if (!/^QA-/.test(report.runId || '') || !report.finished || !/^[a-f0-9]{40}$/.test(report.commit || '') || !hits.length) throw new Error('A finished run with a build and tests linked to this defect is required');
    const fix = [...defect.history].reverse().find((item) => item.state === 'Fixed');
    if (event.state === 'Retest' || event.state === 'Closed') {
      if (!fix?.fixCommit) throw new Error('Retest requires a recorded fix commit');
      execFileSync('git', ['merge-base', '--is-ancestor', fix.fixCommit, report.commit], { cwd: root });
    }
    if (event.state === 'Closed' && (hits.some((hit) => hit.status !== 'Pass') || !hits.every((hit) => hit.suite === 'ui' || hit.suite === 'api' || hit.suite === 'known-defects'))) {
      throw new Error('Cannot close: all linked retest assertions must Pass');
    }
    if (event.state === 'Closed' && defect.history.at(-1).evidence !== event.evidence) throw new Error('Closed must use the same run as the recorded Retest');
    if (event.state === 'Reopened' && !hits.some((hit) => hit.status === 'Fail')) throw new Error('Reopened requires a failed retest');
    event.runId = report.runId;
  }
  return { ...defect, state: event.state, history: [...defect.history, { ...event, at: event.at || new Date().toISOString() }] };
}
module.exports = { transitions, transition };
