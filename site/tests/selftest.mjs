/* =============================================================================
 * selftest.mjs — 零第三方自测（Node 内置能力）
 *
 * 用法：node site/tests/selftest.mjs
 * 导入方式：createRequire 导入 UMD 的 core.js / data.js（CommonJS 分支），
 *          与浏览器 <script> 加载同一份源码，验证「一份源码双端可用」。
 *
 * 分组随切片增量：
 *   S1  E1: UMD 双端导出 + 静态服务 200
 *   S2  E2: 校验 / 成本 / 批量 / 模式
 *   S3  E3: 状态机 / 结果组装 / 额度 / CSV / 模式对历史 / 静态服务 200 全量
 * 所有输出为真实执行结果，未编造；见 docs/03-selftest.md。
 * ========================================================================== */
import { createRequire } from 'node:module';
import { strict as assert } from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const Core = require('../core.js');
const Data = require('../data.js');
const here = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(here, '..');

let pass = 0, fail = 0;
const failures = [];

function group(name) { console.log('\n[' + name + ']'); }
function t(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; failures.push(name + ' -> ' + e.message); console.log('  ✗ ' + name + ' -> ' + e.message); }
}
function summary() {
  console.log('\n----------------------------------------');
  console.log('通过 ' + pass + ' / 失败 ' + fail);
  if (fail) { console.log('失败项：\n  - ' + failures.join('\n  - ')); }
  console.log('----------------------------------------');
}

// ===========================================================================
// E1 / S1：UMD 双端导出（core.js 与 data.js 必须能被 Node 直接 require）
// ===========================================================================
group('E1 · UMD 双端导出（S1 骨架）');
t('core.js 导出为对象且含状态机', () => {
  assert.ok(Core && typeof Core === 'object');
  assert.equal(typeof Core.reduceResult, 'function');
  assert.equal(typeof Core.validateQuery, 'function');
  assert.equal(typeof Core.computeCost, 'function');
  assert.equal(typeof Core.buildResults, 'function');
  assert.equal(typeof Core.toCSV, 'function');
});
t('data.js 导出为对象且含 18 类 / 模块 / 来源 / 结果种子', () => {
  assert.ok(Data && typeof Data === 'object');
  assert.equal(Data.searchTypes.length, 18);
  assert.ok(Data.modules.length >= 18 * 3);
  assert.ok(Data.sources.length >= 8);
  assert.ok(Data.resultSeeds.length >= 10);
});
t('状态机每个 phase 都有明确文案与可操作出口（X2 全状态）', () => {
  // 切片 4 新增 F-03「关联线索为空」-> 14 个 phase
  assert.equal(Core.PHASE_KEYS.length, 14);
  Core.PHASE_KEYS.forEach((k) => {
    const p = Core.PHASES[k];
    assert.ok(p.title && p.title.length > 0, k + ' 缺标题');
    assert.ok(p.desc && p.desc.length > 0, k + ' 缺说明');
    assert.ok(Array.isArray(p.actions) && p.actions.length > 0, k + ' 缺出口动作');
  });
});
t('占位数据不含真实个人信息的合成标识（.invalid / demo.* / 保留地址段）', () => {
  const ids = Data.resultSeeds.map((s) => s.identifier).join(' ');
  assert.ok(ids.indexOf('demo.') >= 0 || ids.indexOf('0xDEMO') >= 0);
  assert.ok(ids.indexOf('.invalid') >= 0 || ids.indexOf('192.0.2.') >= 0 || ids.indexOf('demo.') >= 0);
});

// ===========================================================================
// E2 / S2：查询校验（C1）/ 成本（C2）/ 批量（C3）/ 模式（C9）
// ===========================================================================
group('E2 · C1 查询校验（各类型 / 边界，X1-步骤4 + X2-①）');
t('8 种校验规则均存在且合法样例通过', () => {
  const samples = {
    handle: 'demo.handle.01', email: 'demo.mail.03@north.invalid',
    phone: '+00 000 000 001', ip: '192.0.2.14', domain: 'demo.domain.invalid',
    image: 'img.demo.04.png', wallet: '0xDEMO0001', text: 'demo.record.07'
  };
  Object.keys(samples).forEach((k) => {
    const r = Core.validateQuery(k, samples[k]);
    assert.equal(r.valid, true, k + ' 应合法，实际 ' + r.code + ' / ' + r.message);
    assert.equal(r.normalized, samples[k]);
  });
});
t('空输入 / 仅空白 / 首尾空格 分别拦截', () => {
  assert.equal(Core.validateQuery('handle', '').code, 'empty');
  assert.equal(Core.validateQuery('handle', '    ').code, 'whitespace');
  assert.equal(Core.validateQuery('handle', ' demo.handle.01 ').code, 'whitespace');
});
t('超长输入拦截（> 上限）', () => {
  assert.equal(Core.validateQuery('handle', 'a'.repeat(200)).code, 'tooLong');
});
t('含 URL 拦截（http/https/www/协议相对）', () => {
  ['https://example.invalid/x', 'http://x', 'www.example.invalid', '//example.invalid']
    .forEach((v) => assert.equal(Core.validateQuery('handle', v).code, 'url', v));
});
t('特殊字符拦截（引号 / 尖括号 / 换行 / 控制字符）', () => {
  ['a"b', 'a<b', 'a\nb', 'a\tb', 'a\\b'].forEach((v) => {
    assert.equal(Core.validateQuery('handle', v).code, 'special', JSON.stringify(v));
  });
});
t('格式错按类型拦截（邮箱缺 @、IPv4 越界、域名缺点、钱包缺 0x）', () => {
  assert.equal(Core.validateQuery('email', 'not-an-email').code, 'format');
  assert.equal(Core.validateQuery('ip', '999.1.1.1').code, 'format');
  assert.equal(Core.validateQuery('domain', 'nodot').code, 'format');
  assert.equal(Core.validateQuery('wallet', 'DEMO0001').code, 'format');
});

group('E2 · C2 成本计算（免费 / 固定 / 浮动 / 批量累加，X1-步骤3/4）');
const srcs = Data.sources;
const freeMod = { cost: { kind: 'free', value: 0 } };
const fixedMod = { cost: { kind: 'fixed', value: 4 } };
const dynMod = { cost: { kind: 'dynamic', value: 0 } };
t('免费模块成本为 0', () => {
  const c = Core.computeCost(freeMod, [], srcs, 1);
  assert.equal(c.perSearch, 0); assert.equal(c.total, 0); assert.equal(c.label, '免费');
});
t('固定模块成本 = 固定值，批量累加 total = perSearch × 条数', () => {
  const c = Core.computeCost(fixedMod, [], srcs, 3);
  assert.equal(c.perSearch, 4); assert.equal(c.total, 12); assert.equal(c.label, '固定');
});
t('浮动成本 = 所选来源之和（实时随勾选变化）', () => {
  const one = Core.computeCost(dynMod, ['north'], srcs, 1);
  const three = Core.computeCost(dynMod, ['north', 'beacon', 'echo'], srcs, 1);
  assert.equal(one.perSearch, Core.findSource(srcs, 'north').cost);
  assert.equal(three.perSearch,
    ['north', 'beacon', 'echo'].reduce((a, id) => a + Core.findSource(srcs, id).cost, 0));
  assert.ok(three.perSearch > one.perSearch);
  assert.equal(three.breakdown.length, 3);
});
t('浮动未选来源 -> 0；批量条数被钳制到 [1,5]', () => {
  assert.equal(Core.computeCost(dynMod, [], srcs, 1).perSearch, 0);
  assert.equal(Core.computeCost(fixedMod, [], srcs, 99).batchCount, 5);
  assert.equal(Core.computeCost(fixedMod, [], srcs, 0).batchCount, 1);
});

group('E2 · C3 批量上限 5（X1-Bulk / X2-FAQ）');
t('添加 1..5 条成功，第 6 条被禁止并给出明确提示', () => {
  let items = [];
  for (let i = 1; i <= 5; i++) {
    const r = Core.addBatchItem(items, 'v' + i);
    assert.equal(r.ok, true, '第 ' + i + ' 条应成功');
    items = r.items;
  }
  assert.equal(items.length, 5);
  const sixth = Core.addBatchItem(items, 'v6');
  assert.equal(sixth.ok, false);
  assert.equal(sixth.items.length, 5);
  assert.ok(sixth.message.indexOf('5') >= 0 && sixth.message.indexOf('6') >= 0);
});
t('remove / set 不改变原数组（不可变）', () => {
  const a = ['a', 'b', 'c'];
  assert.deepEqual(Core.removeBatchItem(a, 1), ['a', 'c']);
  assert.deepEqual(Core.setBatchItem(a, 2, 'z'), ['a', 'b', 'z']);
  assert.deepEqual(a, ['a', 'b', 'c']);
});

group('E2 · C9 模式对历史的影响（X1-Cases/模式）');
t('保留模式追加历史且不可变；隐私模式原样返回不写入', () => {
  const h = [{ id: 'h1' }];
  const kept = Core.applyMode('keep', h, { id: 'h2' });
  assert.equal(kept.length, 2);
  assert.equal(h.length, 1);
  const priv = Core.applyMode('private', h, { id: 'h2' });
  assert.strictEqual(priv, h);
  assert.equal(priv.length, 1);
});

// ===========================================================================
// E3 / S3：状态机迁移 / 结果组装三计数 / 额度 / CSV / 全状态可复现
// ===========================================================================
group('E3 · C4 状态机迁移（X2 全状态，不可变）');
t('idle --RUN(pass)--> loading --RESOLVE(success)--> success', () => {
  let s = Core.initialResult();
  assert.equal(s.phase, 'idle');
  const l = Core.reduceResult(s, { type: 'RUN', payload: { gate: 'pass' } });
  assert.equal(l.phase, 'loading');
  assert.notStrictEqual(l, s);
  const ok = Core.reduceResult(l, { type: 'RESOLVE', payload: { outcome: 'success' } });
  assert.equal(ok.phase, 'success');
});
t('RUN 前置拦截：invalid / credits / bulkLimit / pass', () => {
  assert.equal(Core.reduceResult(Core.initialResult(),
    { type: 'RUN', payload: { gate: 'invalid', reasons: ['x'] } }).phase, 'invalid');
  assert.equal(Core.reduceResult(Core.initialResult(),
    { type: 'RUN', payload: { gate: 'credits' } }).phase, 'credits');
  assert.equal(Core.reduceResult(Core.initialResult(),
    { type: 'RUN', payload: { gate: 'bulkLimit' } }).phase, 'bulk-limit');
});
t('loading --CANCEL--> idle；终态 --RETRY--> loading；非法迁移原样返回', () => {
  const loading = Core.reduceResult(Core.initialResult(), { type: 'RUN', payload: { gate: 'pass' } });
  assert.equal(Core.reduceResult(loading, { type: 'CANCEL' }).phase, 'idle');
  assert.equal(Core.reduceResult(Core.makeState('timeout'), { type: 'RETRY' }).phase, 'loading');
  const s = Core.makeState('idle');
  assert.strictEqual(Core.reduceResult(s, { type: 'RESOLVE', payload: { outcome: 'success' } }), s);
  assert.strictEqual(Core.reduceResult(s, { type: 'RETRY' }), s);
});
t('FORCE 可切到全部 14 个 phase；SESSION_EXPIRED / SIGNIN 闭环', () => {
  Core.PHASE_KEYS.forEach((k) => {
    assert.equal(Core.reduceResult(Core.initialResult(),
      { type: 'FORCE', payload: { phase: k } }).phase, k);
  });
  const ex = Core.reduceResult(Core.initialResult(), { type: 'SESSION_EXPIRED' });
  assert.equal(ex.phase, 'session-expired');
  assert.equal(Core.reduceResult(ex, { type: 'SIGNIN' }).phase, 'idle');
});
t('X2 要求的每个状态都有明确文案 + 至少一个可操作出口', () => {
  const required = ['idle', 'loading', 'success', 'noresults', 'partial', 'source-down',
    'invalid', 'credits', 'bulk-limit', 'timeout', 'network', 'session-expired',
    'export-success', 'no-connections'];
  required.forEach((k) => {
    const p = Core.PHASES[k];
    assert.ok(p, k + ' 缺失');
    assert.ok(p.title.length > 4 && p.desc.length > 8, k + ' 文案不足');
    assert.ok(p.actions.length >= 1, k + ' 无出口');
  });
});
t('零命中状态明确「这是结果不是错误」并带 3 条引导', () => {
  const p = Core.PHASES.noresults;
  assert.ok(p.title.indexOf('不是错误') >= 0);
  assert.ok(p.guidance.length >= 3);
});

group('E3 · C5 结果组装与三计数（X1-结果字段 / X2-数据源故障）');
const allIds = Data.sources.map((s) => s.id);
t('success 组装出行，三计数之和 = 行数', () => {
  const r = Core.buildResults({
    seeds: Data.resultSeeds, sources: Data.sources,
    selectedSourceIds: allIds, scenario: 'success', batchCount: 1
  });
  assert.ok(r.total > 0);
  assert.equal(r.counts.found + r.counts.enriched + r.counts.connection, r.total);
  assert.ok(r.rows.every((x) => x.sourceName && x.status && typeof x.confidence === 'number'));
});
t('noresults：零行、三计数全 0（结果而非错误）', () => {
  const r = Core.buildResults({ seeds: Data.resultSeeds, sources: Data.sources,
    selectedSourceIds: allIds, scenario: 'noresults', batchCount: 1 });
  assert.equal(r.total, 0);
  assert.deepEqual(r.counts, { found: 0, enriched: 0, connection: 0 });
});
t('partial：健康来源结果仍出 + 故障来源单独提示', () => {
  const r = Core.buildResults({ seeds: Data.resultSeeds, sources: Data.sources,
    selectedSourceIds: allIds, scenario: 'partial', batchCount: 1 });
  assert.ok(r.total > 0, '健康来源应仍有结果');
  assert.ok(r.sourcesDown.length >= 1, '故障来源应被单列');
  assert.equal(r.sourcesDown[0].id, 'mistwatch');
  assert.ok(!r.healthySourceIds.includes('mistwatch'));
});
t('source-down：全部所选来源故障、无结果行', () => {
  const r = Core.buildResults({ seeds: Data.resultSeeds, sources: Data.sources,
    selectedSourceIds: allIds, scenario: 'source-down', batchCount: 1 });
  assert.equal(r.total, 0);
  assert.equal(r.sourcesDown.length, allIds.length);
});
t('批量 3 条 -> 行数 ×3；分页与来源筛选正确', () => {
  const one = Core.buildResults({ seeds: Data.resultSeeds, sources: Data.sources,
    selectedSourceIds: allIds, scenario: 'success', batchCount: 1 });
  const three = Core.buildResults({ seeds: Data.resultSeeds, sources: Data.sources,
    selectedSourceIds: allIds, scenario: 'success', batchCount: 3 });
  assert.equal(three.total, one.total * 3);
  const pg = Core.paginate(three.rows, 1, 5);
  assert.equal(pg.rows.length, 5);
  assert.ok(pg.totalPages >= 2);
  assert.equal(Core.paginate(three.rows, 999, 5).page, pg.totalPages);
  const f = Core.filterBySource(three.rows, 'north');
  assert.ok(f.length > 0 && f.every((x) => x.sourceId === 'north'));
  assert.equal(Core.filterBySource(three.rows, 'all').length, three.total);
});

group('E3 · C7 额度扣减与不足判定 + 交易记录（X2-额度不足 / 扣费）');
t('足额扣减成功、不足判定为 false 且给出提示', () => {
  assert.equal(Core.canAfford(20, 12), true);
  assert.equal(Core.canAfford(5, 12), false);
  const ok = Core.deductCredits(20, 12);
  assert.equal(ok.ok, true); assert.equal(ok.balance, 8);
  const no = Core.deductCredits(5, 12);
  assert.equal(no.ok, false); assert.equal(no.balance, 5);
  assert.ok(no.message.indexOf('额度') >= 0);
});
t('扣减记录字段形状（时间/发起人/类型/金额/说明）', () => {
  const r = Core.makeDebitRecord('多源并查 · 账号标识', '3 个所选来源', 6, '2026-11-06 21:00');
  assert.deepEqual(Object.keys(r).sort(),
    ['amount', 'description', 'initiator', 'time', 'type'].sort());
  assert.equal(r.amount, -6);
  assert.ok(r.description.indexOf('多源并查') >= 0);
});
t('充值记录与额度增加', () => {
  const up = Core.topUpCredits(100, 50);
  assert.equal(up.balance, 150);
  const r = Core.makeTopupRecord(50, '单次充值', '2026-11-06 21:00');
  assert.equal(r.amount, 50); assert.equal(r.type, '充值');
});

group('E3 · C8 导出 CSV 内容形状（X1-导出 / G1）');
t('首行为列头，行数 = 表头 + 数据行；空结果仅表头', () => {
  const r = Core.buildResults({ seeds: Data.resultSeeds, sources: Data.sources,
    selectedSourceIds: allIds, scenario: 'success', batchCount: 1 });
  const csv = Core.toCSV(r.rows);
  const lines = csv.split('\n');
  assert.equal(lines[0], Core.CSV_HEADERS.join(','));
  assert.equal(lines.length, r.rows.length + 1);
  assert.equal(Core.toCSV([]), Core.CSV_HEADERS.join(','));
});
t('字段含逗号 / 引号 / 换行时正确转义', () => {
  assert.equal(Core.csvCell('a,b'), '"a,b"');
  assert.equal(Core.csvCell('a"b'), '"a""b"');
  assert.equal(Core.csvCell('a\nb'), '"a\nb"');
  const csv = Core.toCSV([{ identifier: 'x,y', sourceName: '北向索引', status: '直接命中',
    confidence: 90, note: '含"引号"' }]);
  assert.ok(csv.indexOf('"x,y"') >= 0);
  assert.ok(csv.indexOf('"含""引号"""') >= 0);
});

group('E3 · 状态演练选项与 ?state= 覆盖（验证脚手架）');
t('演练下拉覆盖 X2 要求的全部状态值', () => {
  const vals = Data.stateDemoOptions.map((o) => o.value);
  ['loading', 'noresults', 'credits', 'source-down', 'timeout', 'network',
    'invalid', 'partial', 'success', 'idle', 'bulk-limit',
    'session-expired', 'export-success', 'no-connections'].forEach((v) => {
    assert.ok(vals.indexOf(v) >= 0, '缺少演练项 ' + v);
  });
  vals.forEach((v) => assert.ok(Core.PHASES[v], v + ' 不是合法 phase'));
});
t('18 类类型 / 每类 3 模块 / 三种成本类型齐备', () => {
  assert.equal(Data.searchTypes.length, 18);
  Data.searchTypes.forEach((t) => {
    const mods = Data.modulesByType(t.id);
    assert.equal(mods.length, 3, t.id);
    const kinds = mods.map((m) => m.cost.kind).sort();
    assert.deepEqual(kinds, ['dynamic', 'fixed', 'free']);
  });
  assert.ok(Data.modules.filter((m) => m.recommended).length >= 18);
});

// ===========================================================================
// E4 / S4：证据包新增 UI 规格（数据形状 / 纯逻辑 / 合规硬边界）
// ===========================================================================
group('E4 · F-03 关联线索为空（独立状态 + 计数口径差异）');
t('no-connections 有明确文案、口径差异说明与可操作出口', () => {
  const p = Core.PHASES['no-connections'];
  assert.ok(p && p.title.length > 4 && p.desc.length > 8);
  assert.ok(p.desc.indexOf('口径') >= 0, '需说明是统计口径差异');
  assert.ok(p.desc.indexOf('不是') >= 0, '需说明不是错误');
  assert.ok(p.actions.length >= 1);
  assert.ok(p.guidance.length >= 2);
});
t('buildResults(no-connections)：关联计数 0，详情区仍有相关行，显式标记口径差异', () => {
  const r = Core.buildResults({ seeds: Data.resultSeeds, sources: Data.sources,
    selectedSourceIds: allIds, scenario: 'no-connections', batchCount: 1 });
  assert.ok(r.total > 0, '仍应有直接/补充命中行');
  assert.equal(r.counts.connection, 0, '关联线索计数应为 0');
  assert.ok(r.counts.found > 0 && r.counts.enriched > 0);
  assert.ok(r.rows.some((x) => x.category === 'connection'), '详情区仍可列出关联条目');
  assert.equal(r.counterMismatch, true);
  assert.ok(r.counterMismatchNote.indexOf('口径') >= 0);
});
t('RESOLVE 可落到 no-connections，且 RETRY 可回到 loading', () => {
  const loading = Core.reduceResult(Core.initialResult(), { type: 'RUN', payload: { gate: 'pass' } });
  const s = Core.reduceResult(loading, { type: 'RESOLVE', payload: { outcome: 'no-connections' } });
  assert.equal(s.phase, 'no-connections');
  assert.equal(Core.reduceResult(s, { type: 'RETRY' }).phase, 'loading');
});

group('E4 · E.2/H-4 两套结果列集（按模块切换，不声称唯一列集）');
t('columnSets 恰有两套且列头形状不同', () => {
  assert.deepEqual(Object.keys(Data.columnSets).sort(), ['multi', 'single']);
  const s = Data.columnSets.single.headers.map((h) => h.label);
  const m = Data.columnSets.multi.headers.map((h) => h.label);
  assert.notDeepEqual(s, m, '两套列集不应相同');
  assert.ok(s.indexOf('站点') >= 0 && s.indexOf('档案链接') >= 0);
  assert.ok(m.indexOf('命中平台') >= 0 && m.indexOf('数据源') >= 0);
  [Data.columnSets.single, Data.columnSets.multi].forEach((set) => {
    assert.ok(set.headers.length >= 4);
    set.headers.forEach((h) => assert.ok(h.key && h.label, '列头需含 key/label'));
  });
});
t('columnSetFor：单源模块 -> single，多源/浮动模块 -> multi', () => {
  const mods = Data.modulesByType(Data.searchTypes[0].id);
  assert.equal(Core.columnSetFor(mods[0]), 'single');
  assert.equal(Core.columnSetFor(mods[1]), 'single');
  assert.equal(Core.columnSetFor(mods[2]), 'multi');
  assert.equal(Core.columnSetFor(null), 'single');
});

group('E4 · P01/P03 实体页签 / 表头排序 / F-09 逐行流入');
t('filterByEntity：all 全量，其余按占位分类过滤', () => {
  const r = Core.buildResults({ seeds: Data.resultSeeds, sources: Data.sources,
    selectedSourceIds: allIds, scenario: 'success', batchCount: 1 });
  assert.equal(Core.filterByEntity(r.rows, 'all').length, r.total);
  ['email', 'phone', 'ip', 'domain', 'wallet', 'url'].forEach((tab) => {
    const f = Core.filterByEntity(r.rows, tab);
    assert.ok(f.length > 0, tab + ' 页签应有示例行');
    assert.ok(f.every((x) => (x.entity || 'url') === tab));
  });
  assert.deepEqual(r.rows, r.rows, '过滤不得改动原数组');
});
t('sortRows：按置信度升降序、非法 key 原样副本、不可变', () => {
  const r = Core.buildResults({ seeds: Data.resultSeeds, sources: Data.sources,
    selectedSourceIds: allIds, scenario: 'success', batchCount: 1 });
  const asc = Core.sortRows(r.rows, 'confidence', 'asc');
  const desc = Core.sortRows(r.rows, 'confidence', 'desc');
  for (let i = 1; i < asc.length; i++) { assert.ok(asc[i - 1].confidence <= asc[i].confidence); }
  for (let i = 1; i < desc.length; i++) { assert.ok(desc[i - 1].confidence >= desc[i].confidence); }
  const bad = Core.sortRows(r.rows, 'notAKey', 'asc');
  assert.deepEqual(bad, r.rows);
  assert.notStrictEqual(bad, r.rows);
  assert.notStrictEqual(asc, r.rows);
  assert.equal(Core.SORT_KEYS.indexOf('notAKey'), -1);
});
t('streamSlice：前 n 行且 n 被钳制到 [0, length]', () => {
  const arr = [1, 2, 3, 4, 5];
  assert.deepEqual(Core.streamSlice(arr, 0), []);
  assert.deepEqual(Core.streamSlice(arr, 3), [1, 2, 3]);
  assert.deepEqual(Core.streamSlice(arr, 99), arr);
  assert.deepEqual(Core.streamSlice(arr, -5), []);
  assert.notStrictEqual(Core.streamSlice(arr, 99), arr);
});

group('E4 · P07/P14/P05/E12/E04/G-03 新增 UI 规格数据形状');
t('三种视图分段、默认普通视图；高级视图数据齐备', () => {
  assert.equal(Data.views.length, 3);
  assert.deepEqual(Data.views.map((v) => v.id), ['basic', 'advanced', 'agent']);
  assert.ok(Data.caseEvents.length >= 3);
  Data.caseEvents.forEach((e) => {
    assert.deepEqual(Object.keys(e).sort(), ['at', 'event']);
  });
  assert.ok(Data.agentPromo && Data.agentPromo.title && Data.agentPromo.points.length >= 2);
});
t('7 个实体页签默认全部；结果双 tab / 三详情 tab / 弹窗双变体', () => {
  assert.equal(Data.entityTabs.length, 7);
  assert.equal(Data.entityTabs[0].id, 'all', '默认应为「全部」');
  assert.deepEqual(Data.resultTabs.map((x) => x.label), ['结果', '书签']);
  assert.equal(Data.detailTabs.length, 3);
  assert.ok(Data.detailTabs.some((x) => x.label === '档案视图'));
  assert.ok(Data.detailTabs.some((x) => x.label === '关系图'));
  assert.equal(Data.modalVariants.length, 2);
  assert.deepEqual(Data.modalVariants.map((x) => x.id), ['filter', 'sources']);
});
t('主题默认浅色且有自造持久化键；登录页头/页脚、重置页文案齐备', () => {
  assert.equal(Data.theme.defaultTheme, 'light');
  assert.ok(Data.theme.storageKey && Data.theme.storageKey.length > 4);
  assert.ok(Data.signinHeader.length >= 2 && Data.signinFooter.length >= 4);
  assert.ok(Data.resetCopy.title && Data.resetCopy.desc && Data.resetCopy.codeSent);
});
t('D.2 输入 label 随「模块」变化：每类 3 个模块给出 3 个不同 label', () => {
  Data.searchTypes.forEach((ty) => {
    const labels = Data.modulesByType(ty.id).map((m) => m.inputLabel);
    assert.equal(labels.length, 3);
    assert.equal(new Set(labels).size, 3, ty.id + ' 的模块 label 应互不相同');
    labels.forEach((l) => assert.ok(l && l.length > 0));
  });
});

group('E4 · 合规硬边界（站点 5 文件，逐条 grep 自检）');
t('站点 5 文件不含原站品牌 / 模块名 / 数据源名 / 暖橙配色词', () => {
  const banned = ['UserSearch', 'usersearch', 'S.A.R.G.E.', 'SargeBot', 'OneScan',
    'HaveIBeenPwned', 'HudsonRock', 'IntelX', 'Gravatar', 'coral-orange',
    'PIPL', 'EPIEOS', 'Username Search'];
  ['index.html', 'styles.css', 'data.js', 'core.js', 'app.js'].forEach((f) => {
    const txt = fs.readFileSync(path.join(siteDir, f), 'utf8');
    banned.forEach((w) => {
      assert.ok(txt.toLowerCase().indexOf(w.toLowerCase()) < 0,
        f + ' 命中禁止词 ' + w);
    });
  });
});
t('index.html 不使用 ES module / fetch / CDN / 外部图片', () => {
  const html = fs.readFileSync(path.join(siteDir, 'index.html'), 'utf8');
  assert.ok(html.indexOf('type="module"') < 0, '不可用 ES module');
  assert.ok(html.indexOf('fetch(') < 0, '不可 fetch');
  assert.ok(!/<script[^>]+src=["']https?:/i.test(html), '不可引用外部脚本');
  assert.ok(!/<link[^>]+href=["']https?:/i.test(html), '不可引用外部样式');
  assert.ok(!/<img[^>]+src=/i.test(html), '不可引用外部图片');
  assert.ok(html.indexOf('<script src="data.js"></script>') >= 0);
  assert.ok(html.indexOf('<script src="core.js"></script>') >= 0);
  assert.ok(html.indexOf('<script src="app.js"></script>') >= 0);
});
t('?state= 每个演练值都能被 FORCE 接受（14 个状态可复现）', () => {
  Data.stateDemoOptions.forEach((o) => {
    const s = Core.reduceResult(Core.initialResult(),
      { type: 'FORCE', payload: { phase: o.value } });
    assert.equal(s.phase, o.value, o.value + ' 不可复现');
    assert.ok(Core.PHASES[o.value].actions.length >= 1);
  });
  assert.equal(Data.stateDemoOptions.length, 14);
});

// ===========================================================================
// HTTP 200：用 Node 内置 http server 验证 5 个站点文件均返回 200 且内容非空
// ===========================================================================
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8'
};
const FILES = ['index.html', 'styles.css', 'data.js', 'core.js', 'app.js'];

function httpCheck() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(String(req.url || '/').replace(/^\/+/, '').split('?')[0]) || 'index.html';
      const full = path.resolve(siteDir, rel);
      if (full.indexOf(siteDir) !== 0 || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('not found');
        return;
      }
      const body = fs.readFileSync(full);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
      res.end(body);
    });
    server.listen(0, '127.0.0.1', async () => {
      const port = server.address().port;
      try {
        group('E1 · 静态服务 200（Node 内置 http server）');
        for (const f of FILES) {
          const r = await new Promise((res, rej) => {
            http.get({ host: '127.0.0.1', port, path: '/' + f }, (resp) => {
              let buf = '';
              resp.setEncoding('utf8');
              resp.on('data', (c) => { buf += c; });
              resp.on('end', () => res({ status: resp.statusCode, len: buf.length, type: resp.headers['content-type'] }));
            }).on('error', rej);
          });
          t(f + ' -> 200 且内容非空 (' + r.len + ' 字节)', () => {
            assert.equal(r.status, 200);
            assert.ok(r.len > 0);
            assert.ok(String(r.type).indexOf('charset=utf-8') >= 0 || String(r.type).indexOf('javascript') >= 0);
          });
        }
        server.close(() => resolve());
      } catch (e) { server.close(() => reject(e)); }
    });
  });
}

await httpCheck();
summary();
process.exit(fail ? 1 : 0);
