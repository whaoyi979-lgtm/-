/* =============================================================================
 * core.js — 纯逻辑层（UMD 导出 ReplicaCore）
 *
 * 设计约束：
 *  - 不依赖 data.js、不触碰 DOM、不使用任何全局浏览器对象；
 *  - 全部为确定性纯函数，可被 Node 的 createRequire 直接导入断言；
 *  - 浏览器中挂 globalThis.ReplicaCore，供 <script> + app.js 使用；
 *  - 状态机不可变：reduceResult(state, action) -> newState，非法迁移原样返回。
 *
 * 契约编号对应 docs/01-blueprint.md §4.2（C1–C9）与 §8（状态机）。
 * 证据编号对应 recon/team-lead-crosscheck.md 的 X1 / X2，以及「推断」标记。
 * ========================================================================== */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;          // Node（selftest.mjs 用 createRequire 导入）
  } else {
    root.ReplicaCore = api;        // 浏览器（<script src>，含 file://）
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ==========================================================================
  // 0. 通用工具（ES5 风格，零依赖）
  // ==========================================================================
  function isArr(a) { return Object.prototype.toString.call(a) === '[object Array]'; }
  function clampBatch(n) {
    var x = Math.floor(Number(n));
    if (!isFinite(x) || x < 1) { x = 1; }
    if (x > 5) { x = 5; }
    return x;
  }
  function findSource(sources, id) {
    var list = sources || [];
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { return list[i]; } }
    return null;
  }
  function mergeMeta(base, extra) {
    var out = {}, k;
    base = base || {}; extra = extra || {};
    for (k in base)  { if (Object.prototype.hasOwnProperty.call(base, k))  { out[k] = base[k]; } }
    for (k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) { out[k] = extra[k]; } }
    return out;
  }

  // ==========================================================================
  // 1. 状态机（蓝图 §8）—— 每个 phase 的文案 / 徽标 / 出口动作全部数据化
  //    X2: 每个状态都要有明确文案与可操作出口；此处保证可自测断言。
  // ==========================================================================
  var PHASES = {
    'idle': {
      key: 'idle', title: '尚未开始查询', badge: '待命', tone: 'neutral',
      desc: '选择搜索类型与模块、填写查询内容后，点击「立即查询」开始。',
      actions: [ { label: '开始查询', act: 'focus-query' } ], guidance: []
    },
    'loading': {
      key: 'loading', title: '正在检索所选来源…', badge: '进行中', tone: 'info',
      desc: '结果面板正在汇总各来源的返回，可随时取消；取消不会扣减额度。',
      actions: [ { label: '取消查询', act: 'cancel' } ], guidance: []
    },
    'success': {
      key: 'success', title: '检索完成，已汇总所选来源的线索', badge: '已完成', tone: 'ok',
      desc: '以下线索来自所选来源。请复核来源归因与置信度后再采信，置信度只是信号而非定论。',
      actions: [
        { label: '重试', act: 'retry' },
        { label: '导出 CSV', act: 'export' },
        { label: '返回修改', act: 'edit' }
      ], guidance: []
    },
    // X2-零结果: Found=0 是正常结果，不是错误；并给 3 条处置引导。
    'noresults': {
      key: 'noresults', title: '未发现匹配记录 —— 这是结果，不是错误', badge: '零命中', tone: 'info',
      desc: '所选模块已查询其数据源，但没有记录与输入匹配。这不代表系统故障，可按以下方式继续。',
      actions: [
        { label: '扩大来源', act: 'widen-sources' },
        { label: '复核输入', act: 'recheck-input' },
        { label: '换搜索类型', act: 'switch-type' },
        { label: '重试', act: 'retry' }
      ],
      guidance: [
        '扩大来源：改用「多源并查」并勾选更多来源（推荐的处置方式）',
        '复核输入：去除多余空格、勿粘贴完整网址、确认字段与所选模块匹配',
        '换一个搜索类型再试：同一线索换入口常能得到不同结果'
      ]
    },
    // X2-数据源故障: 健康来源结果仍出，故障来源单独提示。
    'partial': {
      key: 'partial', title: '部分来源暂不可用，以下为健康来源的结果', badge: '部分可用', tone: 'warn',
      desc: '个别数据源当前不可用，其余来源的结果已正常返回；故障来源在下方单独标注，其成本不会计入。',
      actions: [
        { label: '关闭故障来源', act: 'disable-down' },
        { label: '重试', act: 'retry' },
        { label: '查看状态', act: 'status' },
        { label: '返回修改', act: 'edit' }
      ], guidance: []
    },
    'source-down': {
      key: 'source-down', title: '所选来源暂不可用', badge: '来源故障', tone: 'error',
      desc: '当前选中的数据源均未返回结果。可切换到健康来源后重试，或查看状态指示确认健康度。',
      actions: [
        { label: '切换到健康来源', act: 'use-healthy' },
        { label: '重试', act: 'retry' },
        { label: '查看状态', act: 'status' }
      ], guidance: []
    },
    // X2-校验失败: 空 / 格式错 / 首尾空格 / 超长 / 含 URL / 特殊字符。
    'invalid': {
      key: 'invalid', title: '输入未通过校验', badge: '校验失败', tone: 'error',
      desc: '请按下方提示修改输入后重新查询。常见问题：内容为空、格式不符、含首尾空格、超长、粘贴了完整网址或含特殊字符。',
      actions: [ { label: '修改输入', act: 'edit' } ], guidance: []
    },
    // X2-额度不足: 余额 < 单次成本时阻止，并给出充值入口。
    'credits': {
      key: 'credits', title: '当前额度不足以完成本次查询', badge: '额度不足', tone: 'warn',
      desc: '本次查询成本高于可用额度。请先补充额度再重试，或减少所选来源 / 批量条数。',
      actions: [
        { label: '前往充值', act: 'topup' },
        { label: '返回修改', act: 'edit' }
      ], guidance: []
    },
    // X1-Bulk / X2-FAQ: 批量上限 5 条。
    'bulk-limit': {
      key: 'bulk-limit', title: '单次最多 5 条，无法继续添加', badge: '已达上限', tone: 'warn',
      desc: '批量查询上限为 5 条；如需更多请分多次执行。',
      actions: [ { label: '修改输入', act: 'edit' } ], guidance: []
    },
    // X2-卡住/超时: 缩小范围、重跑、查状态。
    'timeout': {
      key: 'timeout', title: '检索耗时过长，可能范围过大', badge: '超时', tone: 'warn',
      desc: '建议缩小扫描范围、减少所选来源，或稍后重试；也可查看状态指示确认来源健康度。',
      actions: [
        { label: '重试', act: 'retry' },
        { label: '缩小范围', act: 'narrow' },
        { label: '查看状态', act: 'status' },
        { label: '返回', act: 'edit' }
      ],
      guidance: [
        '缩小范围：把「限制条数」调小、减少所选来源',
        '确认已选中模块并点击了「立即查询」',
        '查看状态指示，排除来源整体故障'
      ]
    },
    'network': {
      key: 'network', title: '演示环境连接异常', badge: '连接异常', tone: 'error',
      desc: '本复刻为纯前端演示，未发起任何真实网络请求；此状态用于复现网络异常时的反馈与出口。',
      actions: [ { label: '重试', act: 'retry' }, { label: '返回', act: 'edit' } ], guidance: []
    },
    'session-expired': {
      key: 'session-expired', title: '演示会话已失效，请重新进入', badge: '会话失效', tone: 'error',
      desc: '这是本地演示会话开关，不涉及任何真实凭证或鉴权。',
      actions: [ { label: '返回登录', act: 'signin' } ], guidance: []
    },
    'export-success': {
      key: 'export-success', title: '记录已导出', badge: '导出成功', tone: 'ok',
      desc: 'CSV 文件已生成。可继续复核结果，或返回工作台修改条件。',
      actions: [ { label: '继续复核', act: 'edit' } ], guidance: []
    },
    // F-03: 「关联线索为空」是独立状态；文档指出计数器可能与详情区矛盾，
    // 这里显式标注为「数据口径差异而非错误」，并提供可操作出口。
    'no-connections': {
      key: 'no-connections', title: '关联线索为空，但已找到直接线索', badge: '关联为空', tone: 'info',
      desc: '本次检索已得到直接命中与补充命中，但关联线索计数为 0。详情区与计数器可能出现口径不一致，这是统计范围差异，不是系统错误。',
      actions: [
        { label: '扩大来源', act: 'widen-sources' },
        { label: '重试', act: 'retry' },
        { label: '换搜索类型', act: 'switch-type' },
        { label: '返回修改', act: 'edit' }
      ],
      guidance: [
        '这是数据口径差异：关联线索按另一套聚合范围统计，故计数为 0 而详情区仍可能列出相关条目',
        '若需要关联线索，可换用「多源并查」并勾选更多来源后重新查询',
        '此为正常结果，不代表来源故障或查询失败'
      ]
    }
  };
  var PHASE_KEYS = Object.keys(PHASES);
  // RETRY 合法的终态集合（F-03 的关联为空也允许重试）
  var TERMINAL = ['success', 'noresults', 'partial', 'source-down', 'timeout', 'network', 'no-connections'];

  function initialResult() {
    return { phase: 'idle', message: PHASES.idle.title, meta: {} };
  }
  function makeState(phase, meta) {
    return { phase: phase, message: PHASES[phase] ? PHASES[phase].title : '', meta: meta || {} };
  }

  // X2 全状态：纯函数、不可变；非法迁移返回同一引用（便于断言 ===）。
  function reduceResult(state, action) {
    var s = state || initialResult();
    var a = action || {};
    var cur = s.phase;
    var p = a.payload || {};

    if (a.type === 'FORCE') {                       // 状态演练 / ?state=
      if (!PHASES[p.phase]) { return s; }
      return makeState(p.phase, p.meta);
    }
    if (a.type === 'SESSION_EXPIRED') { return makeState('session-expired', p.meta); }
    if (a.type === 'SIGNIN') {
      return cur === 'session-expired' ? initialResult() : s;
    }
    if (a.type === 'EXPORT') {
      return {
        phase: cur, message: s.message,
        meta: mergeMeta(s.meta, { exportSuccess: true, exportCount: p.count || 0 })
      };
    }
    if (a.type === 'RUN') {                          // 前置链：校验 → 额度 → 批量 → 加载
      if (cur !== 'idle') { return s; }
      var gate = p.gate || 'pass';
      if (gate === 'invalid')   { return makeState('invalid', { reasons: p.reasons || [] }); }
      if (gate === 'credits')   { return makeState('credits', { cost: p.cost, balance: p.balance }); }
      if (gate === 'bulkLimit') { return makeState('bulk-limit', {}); }
      return makeState('loading', { scenario: p.scenario || 'success', cost: p.cost || 0 });
    }
    if (a.type === 'CANCEL') { return cur === 'loading' ? initialResult() : s; }
    if (a.type === 'RESOLVE') {
      if (cur !== 'loading') { return s; }
      var o = p.outcome || 'success';
      return PHASES[o] ? makeState(o, p.meta) : s;
    }
    if (a.type === 'RETRY') {
      return TERMINAL.indexOf(cur) >= 0 ? makeState('loading', s.meta) : s;
    }
    if (a.type === 'EDIT') {
      if (cur === 'loading' || cur === 'session-expired') { return s; }
      return initialResult();
    }
    return s;                                       // 非法迁移 → 原样
  }

  // ==========================================================================
  // C1 查询校验（X1-步骤4 / X2-① / X2-校验失败）
  //   覆盖：空输入 / 仅空白 / 首尾空格 / 超长 / 含 URL / 特殊字符 / 各类型格式
  // ==========================================================================
  var MAX_INPUT = 128;
  var QUERY_RULES = {
    handle: { label: '账号标识', max: 32, min: 2, re: /^[A-Za-z0-9][A-Za-z0-9._-]{1,31}$/ },
    email:  { label: '邮件地址', max: 128, min: 3, re: /^[^\s@<>]+@[^\s@<>]+\.[A-Za-z0-9-]{2,}$/ },
    phone:  { label: '电话号码', max: 24, min: 6, re: /^[+0-9 ()-]{6,24}$/, needDigit: /\d/ },
    ip:     { label: '网络地址', max: 15, min: 7, re: /^(\d{1,3}\.){3}\d{1,3}$/, ipv4: true },
    domain: { label: '域名主体', max: 96, min: 3, re: /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/ },
    image:  { label: '图像溯源', max: 96, min: 2, re: /^[A-Za-z0-9][A-Za-z0-9._-]{1,95}$/ },
    wallet: { label: '链上地址', max: 96, min: 6, re: /^0x[A-Za-z0-9]{4,64}$/ },
    text:   { label: '通用文本', max: 128, min: 2, re: null }
  };
  function ruleFor(kind) { return QUERY_RULES[kind] || QUERY_RULES.text; }

  function fail(code, message, normalized, kind) {
    return { valid: false, code: code, message: message, normalized: normalized, kind: kind };
  }
  function validateQuery(kind, raw) {
    var k = QUERY_RULES[kind] ? kind : 'text';
    var rule = ruleFor(k);
    var s = (raw === null || raw === undefined) ? '' : String(raw);
    var trimmed = s.replace(/^\s+|\s+$/g, '');

    if (s.length === 0) { return fail('empty', '请输入查询内容，不能为空。', trimmed, k); }
    if (trimmed.length === 0) { return fail('whitespace', '输入仅含空白字符，请填写有效内容。', trimmed, k); }
    if (s !== trimmed) { return fail('whitespace', '输入含首尾空格，请去除后重试。', trimmed, k); }
    if (s.length > MAX_INPUT || s.length > rule.max) {
      return fail('tooLong', '输入过长（上限 ' + Math.min(MAX_INPUT, rule.max) + ' 字符），请精简。', trimmed, k);
    }
    // X2-①: 不要传完整 URL
    if (/(https?:|ftp:)?\/\//i.test(s) || /^www\./i.test(s) || /\bwww\./i.test(s)) {
      return fail('url', '请勿粘贴完整网址，只填写标识符本身。', trimmed, k);
    }
    // 特殊字符：引号、尖括号、反斜杠、控制字符、换行
    if (/[<>\"'`\\\r\n\t\x00-\x1f]/.test(s)) {
      return fail('special', '输入含不支持的特殊字符（引号、尖括号、换行等），请修改。', trimmed, k);
    }
    if (trimmed.length < rule.min) {
      return fail('format', rule.label + '至少需要 ' + rule.min + ' 个字符。', trimmed, k);
    }
    if (rule.re && !rule.re.test(trimmed)) {
      return fail('format', '内容格式与「' + rule.label + '」不匹配，请复核。', trimmed, k);
    }
    if (rule.needDigit && !rule.needDigit.test(trimmed)) {
      return fail('format', rule.label + '必须包含数字。', trimmed, k);
    }
    if (rule.ipv4) {
      var parts = trimmed.split('.');
      for (var i = 0; i < parts.length; i++) {
        if (Number(parts[i]) > 255 || /^0\d/.test(parts[i])) {
          return fail('format', 'IPv4 每段需在 0–255 之间，且不含多余前导零。', trimmed, k);
        }
      }
    }
    return { valid: true, code: 'ok', message: '', normalized: trimmed, kind: k };
  }

  // ==========================================================================
  // C2 成本计算（X1-步骤3/4、X1-步骤3、X1-Bulk）
  //   free=0 / fixed=固定值 / dynamic=所选来源之和；total = perSearch × 批量条数
  // ==========================================================================
  var COST_LABELS = { free: '免费', fixed: '固定', dynamic: '浮动' };
  function computeCost(module, selectedSourceIds, sources, batchCount) {
    var ids = isArr(selectedSourceIds) ? selectedSourceIds : [];
    var srcs = isArr(sources) ? sources : [];
    var n = clampBatch(batchCount);
    var m = module || { cost: { kind: 'free', value: 0 } };
    var kind = (m.cost && m.cost.kind) ? m.cost.kind : 'free';
    var per = 0, breakdown = [];

    if (kind === 'free') {
      per = 0;
    } else if (kind === 'fixed') {
      per = Number(m.cost.value) || 0;
      breakdown.push({ sourceId: null, label: '固定成本', cost: per });
    } else { // dynamic —— X1-步骤3: 成本为所选来源之和
      ids.forEach(function (id) {
        var s = findSource(srcs, id);
        if (s) { breakdown.push({ sourceId: s.id, label: s.name, cost: Number(s.cost) || 0 }); }
      });
      breakdown.forEach(function (b) { per += b.cost; });
    }
    return {
      perSearch: per,
      total: per * n,                       // X1-Bulk: 每条一次查询，成本累加
      kind: kind,
      label: COST_LABELS[kind] || kind,
      breakdown: breakdown,
      batchCount: n
    };
  }

  // ==========================================================================
  // C3 批量（X1-Bulk / X2-FAQ: 上限 5，第 6 条禁止并给出明确提示）
  // ==========================================================================
  var MAX_BATCH = 5;
  function addBatchItem(items, value) {
    var arr = isArr(items) ? items.slice() : [];
    var v = (value === null || value === undefined) ? '' : String(value);
    if (arr.length >= MAX_BATCH) {
      return {
        ok: false, items: arr,
        message: '单次最多 ' + MAX_BATCH + ' 条，无法添加第 ' + (arr.length + 1) + ' 条。'
      };
    }
    arr.push(v);
    return { ok: true, items: arr, message: '' };
  }
  function removeBatchItem(items, index) {
    var arr = isArr(items) ? items.slice() : [];
    if (index >= 0 && index < arr.length) { arr.splice(index, 1); }
    return arr;
  }
  function setBatchItem(items, index, value) {
    var arr = isArr(items) ? items.slice() : [];
    if (index >= 0 && index < arr.length) { arr[index] = String(value); }
    return arr;
  }

  // ==========================================================================
  // C5 结果组装（X1-结果字段三计数 / X2-数据源故障）
  //   零命中 / 整体故障 → 无行；部分故障 → 健康来源仍出行 + 故障来源单独列出。
  // ==========================================================================
  function buildResults(opts) {
    var o = opts || {};
    var seeds = isArr(o.seeds) ? o.seeds : [];
    var sources = isArr(o.sources) ? o.sources : [];
    var sel = isArr(o.selectedSourceIds) ? o.selectedSourceIds : [];
    var scenario = o.scenario || 'success';
    var batch = clampBatch(o.batchCount || 1);

    var active = [];
    if (sel.length) {
      sel.forEach(function (id) { var s = findSource(sources, id); if (s) { active.push(s); } });
    } else {
      active = sources.slice();
    }
    var down = [];
    if (scenario === 'source-down') { down = active.slice(); }
    else if (scenario === 'partial') {
      active.forEach(function (s) { if (!s.healthy) { down.push(s); } });
    }
    var downIds = {};
    down.forEach(function (s) { downIds[s.id] = true; });
    var healthy = active.filter(function (s) { return !downIds[s.id]; });

    var rows = [];
    if (scenario !== 'noresults' && scenario !== 'source-down' && healthy.length) {
      var healthyIds = {};
      healthy.forEach(function (s) { healthyIds[s.id] = true; });
      var base = seeds.filter(function (seed) { return !!healthyIds[seed.sourceId]; });
      for (var b = 0; b < batch; b++) {
        base.forEach(function (seed, idx) {
          var src = findSource(sources, seed.sourceId);
          rows.push({
            id: 'row-' + b + '-' + idx,
            identifier: batch > 1 ? (seed.identifier + ' · 第' + (b + 1) + '批') : seed.identifier,
            sourceId: seed.sourceId,
            sourceName: src ? src.name : seed.sourceId,
            category: seed.category,
            status: seed.status,
            confidence: seed.confidence,
            note: seed.note,
            entity: seed.entity || 'url'   // P01/P03: 实体页签的占位分类
          });
        });
      }
    }
    var counts = { found: 0, enriched: 0, connection: 0 };
    rows.forEach(function (r) {
      if (Object.prototype.hasOwnProperty.call(counts, r.category)) { counts[r.category] += 1; }
    });
    // F-03: 计数器按独立聚合口径统计，关联线索可为 0 而详情区仍列出相关条目。
    // 这是口径差异而非错误，显式返回标记供 UI 说明与自测断言。
    var counterMismatch = scenario === 'no-connections';
    if (counterMismatch) { counts.connection = 0; }
    return {
      rows: rows,
      counts: counts,
      counterMismatch: counterMismatch,
      counterMismatchNote: counterMismatch
        ? '关联线索计数按独立聚合口径统计，与下方详情区条数可能不一致；这是数据口径差异，不是错误。'
        : '',
      sourcesDown: down.map(function (s) { return { id: s.id, name: s.name }; }),
      total: rows.length,
      activeSourceIds: active.map(function (s) { return s.id; }),
      healthySourceIds: healthy.map(function (s) { return s.id; })
    };
  }
  var COUNT_LABELS = { found: '直接命中', enriched: '补充命中', connection: '关联线索' };

  // ==========================================================================
  // C6 来源筛选 / 分页（X1-步骤5 / G1）
  // ==========================================================================
  function filterBySource(rows, sourceId) {
    var arr = isArr(rows) ? rows : [];
    if (!sourceId || sourceId === 'all') { return arr.slice(); }
    return arr.filter(function (r) { return r.sourceId === sourceId; });
  }
  function paginate(rows, page, size) {
    var arr = isArr(rows) ? rows : [];
    var sz = Math.max(1, Math.floor(Number(size) || 5));
    var total = arr.length;
    var totalPages = Math.max(1, Math.ceil(total / sz));
    var p = Math.min(totalPages, Math.max(1, Math.floor(Number(page) || 1)));
    return {
      rows: arr.slice((p - 1) * sz, p * sz),
      page: p, size: sz, total: total, totalPages: totalPages
    };
  }

  // ==========================================================================
  // C7 额度（X2-额度不足 / X2-扣费）
  // ==========================================================================
  function canAfford(balance, cost) { return Number(balance) >= Number(cost); }
  function deductCredits(balance, cost) {
    var b = Number(balance), c = Number(cost);
    if (b < c) {
      return {
        ok: false, balance: b,
        message: '可用额度 ' + b + ' 点，低于本次成本 ' + c + ' 点，请先补充额度。'
      };
    }
    return { ok: true, balance: b - c, message: '' };
  }
  function topUpCredits(balance, amount) {
    var b = Number(balance), a = Math.max(0, Math.floor(Number(amount) || 0));
    return { ok: a > 0, balance: b + a, amount: a };
  }

  // 交易记录构造（X2: 时间 / 发起人 / 类型 / 金额 / 说明；说明含模块名与来源名）
  function makeDebitRecord(moduleName, sourceLabel, cost, time) {
    return {
      time: time || '—', initiator: '观澜工作台', type: '扣减',
      amount: -Math.abs(Number(cost) || 0),
      description: (moduleName || '查询') + ' · ' + (sourceLabel || '所选来源')
    };
  }
  function makeTopupRecord(amount, planLabel, time) {
    return {
      time: time || '—', initiator: '演示账号', type: '充值',
      amount: Math.abs(Number(amount) || 0),
      description: (planLabel || '单次充值') + ' · 额度补充'
    };
  }

  // ==========================================================================
  // C8 导出 CSV（X1-导出 / G1；含逗号/引号/换行转义）
  // ==========================================================================
  var CSV_HEADERS = ['标识', '来源', '状态', '置信度', '说明'];
  function csvCell(v) {
    var s = (v === null || v === undefined) ? '' : String(v);
    if (/[",\r\n]/.test(s)) { return '"' + s.replace(/"/g, '""') + '"'; }
    return s;
  }
  function toCSV(rows) {
    var arr = isArr(rows) ? rows : [];
    var lines = [CSV_HEADERS.join(',')];
    arr.forEach(function (r) {
      lines.push([
        csvCell(r.identifier), csvCell(r.sourceName), csvCell(r.status),
        csvCell(r.confidence), csvCell(r.note)
      ].join(','));
    });
    return lines.join('\n');
  }

  // ==========================================================================
  // C9 模式对历史的影响（X1-Cases/模式：保留模式写、隐私模式不写）
  // ==========================================================================
  var MODES = {
    keep:    { id: 'keep',    label: '保留模式', hint: '查询写入所选 Case 的历史' },
    private: { id: 'private', label: '隐私模式', hint: '不写入任何历史' }
  };
  function applyMode(mode, history, entry) {
    var h = isArr(history) ? history : [];
    if (mode === 'private') { return h; }          // 原样返回，不写入
    return h.concat([entry]);                      // 不可变追加
  }
  function makeHistoryEntry(o) {
    o = o || {};
    return {
      id: o.id || ('h-' + String(o.at || '')),
      at: o.at || '—', typeLabel: o.typeLabel || '查询',
      moduleName: o.moduleName || '—', query: o.query || '—',
      batchCount: o.batchCount || 1, cost: o.cost || 0,
      caseId: o.caseId || '', mode: o.mode || 'keep'
    };
  }

  // ==========================================================================
  // C10 切片 4 · 新增 UI 规格的纯逻辑（E.2 / P01 / P03 / F-09）
  //   - 两套列集按模块切换（H-4: 不声称唯一列集、不声称与原站列数一致）
  //   - 实体页签筛选、表头排序、加载态逐行流入（均为确定性纯函数，可 Node 断言）
  // ==========================================================================
  // 单源模块 -> single 列集；多源模块 -> multi 列集。
  function columnSetFor(module) {
    var m = module || {};
    var multi = (m.cost && m.cost.kind === 'dynamic') ||
      (isArr(m.sourceIds) && m.sourceIds.length > 1);
    return multi ? 'multi' : 'single';
  }
  // P01/P03: 实体页签按占位分类过滤；'all' 返回副本
  function filterByEntity(rows, tab) {
    var arr = isArr(rows) ? rows : [];
    if (!tab || tab === 'all') { return arr.slice(); }
    return arr.filter(function (r) { return (r.entity || 'url') === tab; });
  }
  var SORT_KEYS = ['identifier', 'sourceName', 'status', 'confidence', 'entity'];
  // 表头排序箭头：默认升序；非法 key 原样返回；始终返回新数组（不可变）
  function sortRows(rows, key, dir) {
    var arr = isArr(rows) ? rows.slice() : [];
    if (SORT_KEYS.indexOf(key) < 0) { return arr; }
    var sign = dir === 'desc' ? -1 : 1;
    return arr.sort(function (a, b) {
      var x = a[key], y = b[key];
      if (typeof x === 'number' && typeof y === 'number') { return (x - y) * sign; }
      x = String(x === null || x === undefined ? '' : x);
      y = String(y === null || y === undefined ? '' : y);
      if (x === y) { return 0; }
      return (x < y ? -1 : 1) * sign;
    });
  }
  // F-09: 结果异步逐步填充 —— 取前 n 行，n 被钳制到 [0, rows.length]
  function streamSlice(rows, n) {
    var arr = isArr(rows) ? rows : [];
    var k = Math.floor(Number(n));
    if (!isFinite(k) || k < 0) { k = 0; }
    if (k > arr.length) { k = arr.length; }
    return arr.slice(0, k);
  }

  // ==========================================================================
  // 汇总导出
  // ==========================================================================
  return {
    // 状态机
    PHASES: PHASES, PHASE_KEYS: PHASE_KEYS, TERMINAL: TERMINAL,
    initialResult: initialResult, makeState: makeState, reduceResult: reduceResult,
    // C1
    MAX_INPUT: MAX_INPUT, QUERY_RULES: QUERY_RULES, ruleFor: ruleFor, validateQuery: validateQuery,
    // C2
    COST_LABELS: COST_LABELS, computeCost: computeCost,
    // C3
    MAX_BATCH: MAX_BATCH, addBatchItem: addBatchItem,
    removeBatchItem: removeBatchItem, setBatchItem: setBatchItem, clampBatch: clampBatch,
    // C5
    COUNT_LABELS: COUNT_LABELS, buildResults: buildResults,
    // C6
    filterBySource: filterBySource, paginate: paginate,
    // C7
    canAfford: canAfford, deductCredits: deductCredits, topUpCredits: topUpCredits,
    makeDebitRecord: makeDebitRecord, makeTopupRecord: makeTopupRecord,
    // C8
    CSV_HEADERS: CSV_HEADERS, toCSV: toCSV, csvCell: csvCell,
    // C9
    MODES: MODES, applyMode: applyMode, makeHistoryEntry: makeHistoryEntry,
    // C10（切片 4 新增 UI 规格纯逻辑）
    SORT_KEYS: SORT_KEYS, columnSetFor: columnSetFor, filterByEntity: filterByEntity,
    sortRows: sortRows, streamSlice: streamSlice,
    // 工具
    findSource: findSource
  };
});
