// Build the current summary from finished, published records; never rewrite those records.
const { readFileSync, writeFileSync, existsSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const { createHash } = require('node:crypto');
const Excel = require('../../../server/node_modules/exceljs');
const { root } = require('../helpers/run-store');
const args = Object.fromEntries(process.argv.slice(2).map((value) => value.replace(/^--/, '').split('=')));
function readRun(id, prefix, file) {
  if (!/^QA-[A-Za-z0-9TZ]+-[a-f0-9]+$/.test(id || '')) throw new Error('A published Run ID is required');
  const path = `${prefix}/${id}/${file}`;
  const data = JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  if (data.runId !== id || !data.finished) throw new Error('Only completed records may be summarized');
  return { path, data };
}
async function main() {
  const business = readRun(args.run, 'automation-testing/reports/runs', 'execution.json');
  const unit = readRun(args.unit, 'automation-testing/reports/runs', 'unit-results.json');
  const postman = readRun(args.postman, 'api-testing/reports/newman', 'newman-results.json');
  if (business.data.label !== 'all' || unit.data.label !== 'unit' || postman.data.label !== 'postman') throw new Error('Wrong run types');
  const manualFile = args.manual || 'manual-testing/test-execution/manual-regression.xlsx';
  const book = new Excel.Workbook();
  await book.xlsx.readFile(resolve(root, manualFile));
  const sheet = book.getWorksheet('Execution');
  if (!sheet) throw new Error('Manual workbook requires an Execution sheet');
  const headers = sheet.getRow(1).values;
  const counts = { Pass: 0, Fail: 0, Blocked: 0, 'Not Run': 0 };
  sheet.eachRow((row, index) => {
    if (index === 1 || !row.getCell(headers.indexOf('Test Case ID')).text) return;
    const status = row.getCell(headers.indexOf('Status')).text;
    if (!Object.hasOwn(counts, status)) throw new Error('Invalid manual status');
    if (status !== 'Not Run') {
      for (const key of ['Run ID', 'Build commit', 'Executed at', 'Executor', 'Actual', 'Evidence']) {
        if (!row.getCell(headers.indexOf(key)).text.trim()) throw new Error(`Executed manual row lacks ${key}`);
      }
      const evidence = row.getCell(headers.indexOf('Evidence')).text;
      if (!existsSync(resolve(root, evidence)) && !existsSync(resolve(root, dirname(manualFile), evidence))) throw new Error('Manual evidence file does not exist');
    }
    counts[status]++;
  });
  const registry = JSON.parse(readFileSync(resolve(root, 'manual-testing/bug-reports/registry.json'), 'utf8'));
  const manifest = (data) => ({ runId: data.runId, commit: data.commit, workingTreeHash: data.workingTreeHash,
    started: data.started, finished: data.finished, executor: data.executor, environment: data.environment });
  const suites = Object.fromEntries(['api', 'known-defects', 'ui'].map((suite) => [suite,
    Object.fromEntries(['Pass', 'Fail', 'Not Run'].map((status) => [status, business.data.results.filter((item) => item.suite === suite && item.status === status).length]))]));
  const report = { generatedAt: new Date().toISOString(),
    business: { ...manifest(business.data), report: business.path, counts: business.data.counts, suites },
    unit: { ...manifest(unit.data), report: unit.path, counts: unit.data.counts, scope: unit.data.scope },
    postman: { ...manifest(postman.data), report: postman.path, stats: postman.data.stats, failures: postman.data.failures },
    manual: { workbook: manualFile, counts, sha256: createHash('sha256').update(readFileSync(resolve(root, manualFile))).digest('hex') },
    defects: registry.defects.map(({ id, state, severity, priority }) => ({ id, state, severity, priority })) };
  const directory = resolve(root, 'manual-testing/test-execution');
  writeFileSync(resolve(directory, 'latest-qa-summary.json'), JSON.stringify(report, null, 2) + '\n');
  const link = (path) => `../../${path}`;
  const open = report.defects.filter((item) => item.state !== 'Closed');
  const md = `# Tổng hợp QA mới nhất\n\nCập nhật: ${report.generatedAt}. Nguồn máy đọc: [latest-qa-summary.json](latest-qa-summary.json). Đây là trang trạng thái hiện hành; [báo cáo cũ](test-report.md) và các run đã công bố là hồ sơ lịch sử, không sửa lại thành Pass.\n\n## Kết quả mới nhất\n\n| Nhóm | Kết quả | Bằng chứng |\n| --- | --- | --- |\n| Nghiệp vụ HTTP + UI | **${business.data.counts.Pass} Pass / ${business.data.counts.Fail} Fail**, ${business.data.results.length} test | [JSON](${link(business.path)}) · [Excel](${link(business.path.replace('execution.json', 'execution.xlsx'))}) |\n| API HTTP | ${suites.api.Pass} Pass / ${suites.api.Fail} Fail, ${suites.api.Pass + suites.api.Fail} test | [TAP](${link(business.path.replace('execution.json', 'api/results.tap'))}) · [JUnit](${link(business.path.replace('execution.json', 'api/junit.xml'))}) |\n| Hồi quy BUG-002/003 | ${suites['known-defects'].Pass} Pass / ${suites['known-defects'].Fail} Fail | Trong run nghiệp vụ trên |\n| Cypress UI/hybrid | ${suites.ui.Pass} Pass / ${suites.ui.Fail} Fail | Trong run nghiệp vụ trên |\n| Unit: biên controller + reporting/lifecycle | ${unit.data.counts.pass}/${unit.data.counts.tests} Pass: 6 biên controller + 13 hạ tầng | [Unit JSON](${link(unit.path)}) · [TAP](${link(unit.path.replace('unit-results.json', 'unit/results.tap'))}) · [JUnit](${link(unit.path.replace('unit-results.json', 'unit/junit.xml'))}) |\n| Newman | ${postman.data.stats.requests.total} request; ${postman.data.stats.assertions.total - postman.data.stats.assertions.failed}/${postman.data.stats.assertions.total} assertions Pass | [JSON](${link(postman.path)}) |\n| Manual regression | ${counts.Pass} Pass / ${counts.Fail} Fail / ${counts.Blocked} Blocked / **${counts['Not Run']} Not Run** | [Workbook](${link(manualFile)}) · [20 case chạy trước](manual-regression.md) |\n\n## Build và môi trường\n\n- Nghiệp vụ: ${business.data.runId}; commit \`${business.data.commit}\`; fingerprint \`${business.data.workingTreeHash}\`.\n- Bắt đầu/kết thúc UTC: ${business.data.started} / ${business.data.finished}; người chạy: ${business.data.executor}.\n- Môi trường: ${business.data.environment.platform}, Node ${business.data.environment.node}, timezone ${business.data.environment.timezone}, API ${business.data.environment.apiUrl}, UI ${business.data.environment.baseUrl}.\n- Unit: ${unit.data.runId}; Newman: ${postman.data.runId}. Từng báo cáo giữ commit/fingerprint riêng; không suy đoán các run cùng build chỉ vì gần giờ chạy.\n\n## Lỗi hiện hành và kết luận\n\n${open.map((item) => `- [${item.id}](../bug-reports/${item.id}.md): **${item.state}**, ${item.severity}/${item.priority}.`).join('\n')}\n\nBUG-002/003/004 vẫn Closed theo retest đã ghi. Có ${open.length} lỗi chưa Closed trong registry hiện tại. Các test mới mở rộng coverage; run cũ 53 Pass không bao gồm các assertions mới này, nên không có mâu thuẫn khi run mới phát hiện Fail. **Chưa đạt điều kiện phát hành** khi còn lỗi Open và manual chưa thực thi. CI phải Fail khi các assertions nghiệp vụ này Fail; không dùng unit/Newman Pass để che kết quả đó.\n\n## Mức xác minh và việc còn lại\n\n- Biên đúng ±30 phút và lệch 1 ms đã kiểm tra bằng đồng hồ cố định ở **mức controller, persistence mock**. Không tuyên bố là HTTP/UI/manual tại đúng biên.\n- Quyền đọc/cập nhật lịch bác sĩ khác và dữ liệu thiếu/ID sai đã có test HTTP thực tế, với lỗi đã ghi trong registry. Chưa xác minh mọi endpoint/nhánh hoặc mọi quy tắc thanh toán.\n- Manual do người kiểm thử trực tiếp thực hiện: ưu tiên 20 case trong [hướng dẫn](manual-regression.md), ghi build, dữ liệu, Actual, trạng thái và evidence. Không sao chép kết quả automation vào manual.\n- 337 Pass Excel và 288 Pass/26 Fail PDF là [kết quả học phần riêng](history/README.md), không phải retest build mới.\n\n## Cập nhật báo cáo\n\nChỉ chọn các run hoàn tất đã publish. Từ thư mục gốc:\n\n\`\`\`sh\nnode .github/qa/scripts/update-latest-summary.js --run=${business.data.runId} --unit=${unit.data.runId} --postman=${postman.data.runId}\n\`\`\`\n\nKhi có manual run thật, thêm \`--manual=<đường-dẫn-workbook-thực-thi.xlsx>\`; script kiểm tra metadata và evidence của dòng đã thực hiện. Không ghi đè run cũ để cập nhật trang này.\n`;
  writeFileSync(resolve(directory, 'latest-qa-summary.md'), md);
  console.log(`Latest QA summary: ${business.data.counts.Pass} Pass / ${business.data.counts.Fail} Fail; manual ${counts['Not Run']} Not Run; ${open.length} non-Closed defects.`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
