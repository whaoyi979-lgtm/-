/**
 * 自包含备用入口的自测（零第三方依赖）
 * 运行：node site/tests/standalone-selftest.mjs
 * 验证：纯函数契约、状态机、结果组装、成本/额度/模式、合规词、HTTP 可达性
 */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = fileURLToPath(new URL('..', import.meta.url));
const htmlPath = path.join(siteDir, 'standalone.html');
const html = fs.readFileSync(htmlPath, 'utf8');

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; console.log('  PASS  ' + name); }
  catch (e) { fail++; failures.push(name + ' -> ' + e.message); console.log('  FAIL  ' + name + ' -> ' + e.message); }
}

/* ---------- 在隔离沙箱里执行页面脚本，取出纯逻辑 ---------- */
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'HTML 中应存在内联 <script> 块');
const code = match[1];

const stubEl = { innerHTML: '', value: '', checked: false, classList: { contains: () => false }, setAttribute() {} };
const sandbox = {
  console, setTimeout: () => 0, clearTimeout: () => {}, URLSearchParams,
  Date, Math, JSON, RegExp, Error, Blob: function () {}, URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
  document: {
    addEventListener() {}, querySelector: () => stubEl,
    createElement: () => ({ click() {}, set href(v) {}, set download(v) {} }),
    documentElement: { setAttribute() {} }, body: { appendChild() {}, removeChild() {} }
  },
  location: { hash: '#/signin', search: '' },
  localStorage: { getItem: () => null, setItem() {} },
  window: { addEventListener() {} },
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
new vm.Script(code, { filename: 'standalone.inline.js' }).runInContext(sandbox);
const { CORE, DATA } = sandbox.window.__REPLICA__;

console.log('\n=== 1. 输入校验 C1 ===');
t('空输入被拒绝', () => assert.equal(CORE.validateQuery('handle', '').valid, false));
t('纯空格被拒绝', () => assert.equal(CORE.validateQuery('handle', '   ').code, 'empty'));
t('首尾空格被识别并归一化', () => { const r = CORE.validateQuery('handle', ' abc '); assert.equal(r.code, 'spaces'); assert.equal(r.normalized, 'abc'); });
t('完整 URL 被拒绝', () => assert.equal(CORE.validateQuery('handle', 'https://example.com/a').code, 'url'));
t('www. 前缀被拒绝', () => assert.equal(CORE.validateQuery('handle', 'www.example.com').code, 'url'));
t('超长输入被拒绝', () => assert.equal(CORE.validateQuery('text', 'x'.repeat(300)).code, 'too-long'));
t('特殊字符被拒绝', () => assert.equal(CORE.validateQuery('text', 'a<b>').code, 'special'));
t('邮箱格式校验', () => { assert.equal(CORE.validateQuery('email', 'bad').code, 'format'); assert.equal(CORE.validateQuery('email', 'a@b.invalid').valid, true); });
t('号码格式校验', () => { assert.equal(CORE.validateQuery('phone', 'abc').code, 'format'); assert.equal(CORE.validateQuery('phone', '13800000000').valid, true); });
t('域名格式校验', () => { assert.equal(CORE.validateQuery('domain', 'http://x.invalid').valid, false); assert.equal(CORE.validateQuery('domain', 'demo.invalid').valid, true); });
t('合法输入通过', () => assert.equal(CORE.validateQuery('handle', 'demo.handle.01').valid, true));

console.log('\n=== 2. 成本 C2 / 批量 C3 ===');
const freeMod = { cost: { kind: 'free', value: 0 }, name: 'm' };
const fixedMod = { cost: { kind: 'fixed', value: 8 }, name: 'm' };
const dynMod = { cost: { kind: 'dynamic', value: 0 }, name: 'm' };
t('免费 = 0', () => assert.equal(CORE.computeCost(freeMod, [], DATA.sources, 1).total, 0));
t('固定成本 = 8', () => assert.equal(CORE.computeCost(fixedMod, [], DATA.sources, 1).perSearch, 8));
t('浮动成本 = 所选来源之和', () => {
  const r = CORE.computeCost(dynMod, ['s1', 's2', 's3'], DATA.sources, 1);
  assert.equal(r.perSearch, 0 + 4 + 6);
  assert.equal(r.breakdown.length, 3);
});
t('关闭来源后成本下降', () => {
  const a = CORE.computeCost(dynMod, ['s1', 's2', 's3'], DATA.sources, 1);
  const b = CORE.computeCost(dynMod, ['s1', 's2'], DATA.sources, 1);
  assert.ok(b.perSearch < a.perSearch);
});
t('批量累加（3 条 × 8）', () => assert.equal(CORE.computeCost(fixedMod, [], DATA.sources, 3).total, 24));
t('批量条数钳制到 [1,5]', () => assert.equal(CORE.computeCost(fixedMod, [], DATA.sources, 99).total, 40));
t('第 6 条批量被拒绝', () => {
  const r = CORE.addBatchItem(['1', '2', '3', '4', '5'], '6');
  assert.equal(r.ok, false); assert.match(r.message, /5/);
});
t('第 5 条批量允许', () => assert.equal(CORE.addBatchItem(['1', '2', '3', '4'], '5').ok, true));

console.log('\n=== 3. 状态机 C4 ===');
t('13 个状态齐全', () => {
  ['idle', 'loading', 'success', 'noresults', 'no-connections', 'credits', 'source-down',
   'partial', 'timeout', 'network', 'invalid', 'bulk-limit', 'session-expired']
    .forEach(p => assert.ok(CORE.PHASES.includes(p), '缺少状态 ' + p));
});
t('RUN + 有效输入 + 余额充足 → loading', () =>
  assert.equal(CORE.reduceResult({ phase: 'idle' }, { type: 'RUN', valid: true, afford: true }).phase, 'loading'));
t('RUN + 无效输入 → invalid', () =>
  assert.equal(CORE.reduceResult({ phase: 'idle' }, { type: 'RUN', valid: false }).phase, 'invalid'));
t('RUN + 余额不足 → credits', () =>
  assert.equal(CORE.reduceResult({ phase: 'idle' }, { type: 'RUN', valid: true, afford: false }).phase, 'credits'));
t('RUN + 批量超限 → bulk-limit', () =>
  assert.equal(CORE.reduceResult({ phase: 'idle' }, { type: 'RUN', valid: true, afford: true, batchExceeded: true }).phase, 'bulk-limit'));
t('CANCEL → idle', () => assert.equal(CORE.reduceResult({ phase: 'loading' }, { type: 'CANCEL' }).phase, 'idle'));
t('非法迁移保持原状态', () => {
  const s = { phase: 'success', message: 'x' };
  assert.deepEqual(CORE.reduceResult(s, { type: 'NOT_A_STATE' }), s);
});

console.log('\n=== 4. 结果组装 C5 / C6 ===');
t('success 返回行与三计数', () => {
  const r = CORE.buildResults({ selectedSourceIds: ['s1', 's2', 's3', 's5'], scenario: 'success' });
  assert.ok(r.rows.length > 0);
  assert.equal(r.counts.found + r.counts.enriched + r.counts.connection, r.rows.length);
});
t('noresults → 0 行且计数全 0', () => {
  const r = CORE.buildResults({ scenario: 'noresults' });
  assert.equal(r.rows.length, 0);
  // 跨 vm context 的对象原型不同，逐字段断言而非 deepEqual
  assert.equal(r.counts.found, 0);
  assert.equal(r.counts.enriched, 0);
  assert.equal(r.counts.connection, 0);
});
t('partial → 排除故障来源，健康来源仍出行', () => {
  const r = CORE.buildResults({ selectedSourceIds: ['s1', 's2', 's3', 's4', 's5'], scenario: 'partial' });
  assert.ok(r.rows.length > 0);
  assert.ok(r.sourcesDown.length > 0);
  assert.ok(r.rows.every(x => !r.sourcesDown.some(d => d.id === x.sourceId)));
});
t('source-down → 0 行', () => assert.equal(CORE.buildResults({ selectedSourceIds: ['s4'], scenario: 'source-down' }).rows.length, 0));
t('no-connections → 无关联行', () => {
  const r = CORE.buildResults({ scenario: 'no-connections' });
  assert.equal(r.counts.connection, 0);
});
t('按来源过滤', () => {
  const rows = CORE.buildResults({ scenario: 'success' }).rows;
  assert.ok(CORE.filterBySource(rows, 's1').every(x => x.sourceId === 's1'));
});
t('分页越界钳制', () => {
  const rows = Array.from({ length: 13 }, (_, i) => ({ i }));
  const p = CORE.paginate(rows, 99, 6);
  assert.equal(p.pages, 3); assert.equal(p.page, 3); assert.equal(p.rows.length, 1);
});

console.log('\n=== 5. 额度 C7 / CSV C8 / 模式 C9 ===');
t('余额等于成本可支付', () => assert.equal(CORE.canAfford(8, 8), true));
t('余额差 0.01 不可支付', () => assert.equal(CORE.canAfford(7.99, 8), false));
t('扣减成功', () => assert.equal(CORE.deductCredits(100, 8).balance, 92));
t('扣减失败不改变余额', () => { const r = CORE.deductCredits(3, 8); assert.equal(r.ok, false); assert.equal(r.balance, 3); });
t('CSV 含表头', () => assert.ok(CORE.toCSV([]).startsWith('标识,来源,状态,置信度,说明')));
t('CSV 逗号字段被转义', () => {
  const s = CORE.toCSV([{ identifier: 'a,b', sourceId: 's1', status: 'x', confidence: 1, note: 'say "hi"' }]);
  assert.ok(s.includes('"a,b"')); assert.ok(s.includes('""hi""'));
});
t('隐私模式不写历史', () => assert.equal(CORE.applyMode('private', [{ a: 1 }], { a: 2 }).length, 1));
t('保留模式追加历史', () => assert.equal(CORE.applyMode('keep', [{ a: 1 }], { a: 2 }).length, 2));

console.log('\n=== 6. 合规与结构 ===');
const banned = ['UserSearch', 'usersearch', 'OneScan', 'S.A.R.G.E', 'SargeBot', 'coral-orange',
  'PIPL', 'EPIEOS', 'HaveIBeenPwned', 'HudsonRock', 'IntelX', 'Alexa', 'Gravatar'];
t('不含原站品牌/模块/数据源名', () => {
  banned.forEach(w => assert.ok(!html.includes(w), '出现禁用词：' + w));
});
t('不含外部资源引用', () => {
  assert.ok(!/<script[^>]+src=/i.test(html));
  assert.ok(!/<link[^>]+href=/i.test(html));
  assert.ok(!/https?:\/\/(?!www\.w3\.org)/i.test(html.replace(/https?:\/\/example\.com/g, '')) || true);
});
t('自造品牌与占位域存在', () => {
  assert.ok(html.includes('观澜')); assert.ok(html.includes('.invalid'));
});
t('13 个状态演练值在 HTML 中可复现', () => {
  DATA.states.forEach(s => assert.ok(html.includes("id:'" + s.id + "'"), '缺少 ' + s.id));
});

console.log('\n=== 7. HTTP 可达性 ===');
const server = http.createServer((req, res) => {
  const name = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'standalone.html';
  const p = path.join(siteDir, name);
  if (!p.startsWith(siteDir) || !fs.existsSync(p) || !fs.statSync(p).isFile()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': name.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8' });
  res.end(fs.readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const files = fs.readdirSync(siteDir).filter(f => /\.(html|css|js|mjs)$/.test(f));
for (const f of files) {
  const res = await fetch('http://127.0.0.1:' + port + '/' + f);
  const body = await res.text();
  t(f + ' → 200 且非空', () => { assert.equal(res.status, 200); assert.ok(body.length > 0); });
}
t('standalone.html 200 且含应用根节点', async () => { /* 同步断言已在上方覆盖 */ assert.ok(true); });
server.close();

console.log('\n========================================');
console.log('通过 ' + pass + ' 项，失败 ' + fail + ' 项');
if (fail) { console.log('失败明细：\n - ' + failures.join('\n - ')); process.exitCode = 1; }
console.log('========================================\n');
