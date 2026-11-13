function suiteSummary(results) {
  const groups = [
    ['Automation API + UI', results.filter((item) => ['api', 'ui'].includes(item.suite))],
    ['Defect regression (BUG-002/003)', results.filter((item) => item.suite === 'known-defects')],
  ];
  return '| Group | Pass | Fail | Blocked | Not Run |\n| --- | ---: | ---: | ---: | ---: |\n'
    + groups.map(([name, rows]) => `| ${name} | ${['Pass', 'Fail', 'Blocked', 'Not Run'].map((status) => rows.filter((row) => row.status === status).length).join(' | ')} |`).join('\n');
}
module.exports = { suiteSummary };
