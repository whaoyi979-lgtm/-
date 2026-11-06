/* =============================================================================
 * data.js — 合成占位数据（无任何真实个人信息 / 无任何外部素材 / 无任何网络请求）
 *
 * 合规说明（对应 docs/00-G0-scope.md 与合规硬边界）：
 *  - 品牌、类型名、模块名、数据源名、文案全部自造，均为原创中文；
 *  - 标识符使用 demo.* 合成串、.invalid 保留域（RFC 2606）、192.0.2.x 文档保留
 *    地址段（RFC 5737）、0xDEMO... 占位串，不含任何真实个人数据；
 *  - 成本单位为自造「点」，不含原站价格、额度金额或货币符号；
 *  - UMD：浏览器中挂 globalThis.ReplicaData（供 <script> 使用），
 *    Node 中通过 module.exports 导出（供 selftest.mjs 的 createRequire 导入）。
 *
 * 证据对齐：X1-步骤1(18 类) / X1-步骤2(模块决定输入·来源·成本) /
 *   X1-步骤3(多选数据源) / X1-Cases / X2-Status pill / X2-交易记录字段 /
 *   X2-充值面板 / 推断(状态演练选项)。所有结构均为「基于公开文档的推断」。
 * ========================================================================== */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;          // Node（selftest.mjs）
  } else {
    root.ReplicaData = api;        // 浏览器（<script src>，含 file://）
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ---- 品牌（自造） --------------------------------------------------------
  var brand = {
    name: '观澜',
    product: '线索检索工作台',
    version: '演示版 1.0',
    tagline: '把零散线索，汇成可复核的脉络',
    account: '演示账号'
  };

  // ---- 自造数据源（浮动成本 = 所选来源之和；healthy=false 用于故障演示） ----
  // X1-步骤3: 一个输入可跨多个所选来源；X2: 个别数据源可不可用、健康来源结果仍出。
  var sources = [
    { id: 'north',     name: '北向索引', cost: 2, healthy: true,  category: '目录' },
    { id: 'beacon',    name: '灯塔名录', cost: 1, healthy: true,  category: '名录' },
    { id: 'echo',      name: '回声档案', cost: 3, healthy: true,  category: '档案' },
    { id: 'starmap',   name: '星图登记', cost: 2, healthy: true,  category: '登记' },
    { id: 'tide',      name: '潮汐记录', cost: 1, healthy: true,  category: '记录' },
    { id: 'prism',     name: '棱镜目录', cost: 3, healthy: true,  category: '目录' },
    { id: 'dune',      name: '沙丘账本', cost: 2, healthy: true,  category: '账本' },
    { id: 'milestone', name: '界碑索引', cost: 2, healthy: true,  category: '索引' },
    { id: 'mistwatch', name: '晨雾观测', cost: 1, healthy: false, category: '观测' }, // 故障源
    { id: 'forge',     name: '熔炉名录', cost: 3, healthy: true,  category: '名录' }
  ];

  // ---- 状态指示 pill（X2: 分钟级状态、标记 faulty 来源） -------------------
  var status = {
    overall: 'degraded',
    label: '1 项来源异常',
    sources: sources.map(function (s) {
      return { id: s.id, name: s.name, healthy: s.healthy };
    })
  };

  // ---- 额度（自造「点」，无金额/货币） ------------------------------------
  var credits = {
    balance: 128,
    unit: '点',
    topupPresets: [20, 50, 100, 200],
    slider: { min: 10, max: 500, step: 10 },
    plans: [
      { id: 'single', label: '单次充值' },
      { id: 'cycle',  label: '按周期自动补充' }
    ]
  };

  // ---- 留存 Case（自造） ---------------------------------------------------
  var cases = [
    { id: 'case-daily', name: '日常核查', color: '#4f46e5' },
    { id: 'case-topic', name: '专题线索 A', color: '#0f766e' },
    { id: 'case-temp',  name: '临时留存', color: '#b45309' }
  ];

  // ---- 18 类搜索类型（自造命名；语义对齐 X1 的 18 类，但名称与文案不照抄） ----
  // inputKind 决定校验规则：8 种规则覆盖「至少 5 类不同校验」要求。
  var searchTypes = [
    { id: 'handle',  label: '账号标识', icon: 'user',     inputKind: 'handle', placeholder: '例如 demo.handle.01',              hint: '填写账号名或昵称标识，勿粘贴完整网址' },
    { id: 'email',   label: '邮件地址', icon: 'mail',     inputKind: 'email',  placeholder: '例如 demo.mail.03@north.invalid', hint: '填写完整邮件地址' },
    { id: 'phone',   label: '电话号码', icon: 'phone',    inputKind: 'phone',  placeholder: '例如 +00 000 000 001',            hint: '可含国家码、空格或短横线' },
    { id: 'person',  label: '人物档案', icon: 'user',     inputKind: 'text',   placeholder: '例如 demo.record.07',             hint: '填写待核查的称谓或编号' },
    { id: 'org',     label: '机构主体', icon: 'building', inputKind: 'text',   placeholder: '例如 demo.org.02',                hint: '填写机构名称或登记编号' },
    { id: 'asset',   label: '网络资产', icon: 'grid',     inputKind: 'text',   placeholder: '例如 demo.asset.05',              hint: '填写资产标识或编号' },
    { id: 'netaddr', label: '网络地址', icon: 'globe',    inputKind: 'ip',     placeholder: '例如 192.0.2.14',                 hint: '填写 IPv4 地址，勿带协议头' },
    { id: 'product', label: '商品编码', icon: 'tag',      inputKind: 'text',   placeholder: '例如 demo.sku.09',                hint: '填写商品编码或序列号' },
    { id: 'chat',    label: '会话账号', icon: 'chat',     inputKind: 'handle', placeholder: '例如 demo.handle.02',              hint: '填写会话账号标识' },
    { id: 'forum',   label: '社区足迹', icon: 'message',  inputKind: 'handle', placeholder: '例如 demo.handle.04',              hint: '填写社区昵称标识' },
    { id: 'image',   label: '图像溯源', icon: 'image',    inputKind: 'image',  placeholder: '例如 img.demo.04.png',             hint: '填写图像文件名或占位哈希' },
    { id: 'chain',   label: '链上地址', icon: 'link',     inputKind: 'wallet', placeholder: '例如 0xDEMO0001',                 hint: '填写链上地址占位串' },
    { id: 'vehicle', label: '车辆登记', icon: 'car',      inputKind: 'text',   placeholder: '例如 demo.plate.03',              hint: '填写登记编号或占位标识' },
    { id: 'threat',  label: '风险线索', icon: 'shield',   inputKind: 'text',   placeholder: '例如 demo.signal.06',             hint: '填写风险信号编号' },
    { id: 'device',  label: '设备指纹', icon: 'device',   inputKind: 'text',   placeholder: '例如 demo.device.08',             hint: '填写设备指纹占位串' },
    { id: 'domain',  label: '域名主体', icon: 'globe',    inputKind: 'domain', placeholder: '例如 demo.domain.invalid',         hint: '填写域名，勿带协议头或路径' },
    { id: 'leak',    label: '暴露记录', icon: 'alert',    inputKind: 'email',  placeholder: '例如 demo.mail.05@north.invalid', hint: '以邮件地址作为核查入口' },
    { id: 'record',  label: '公开卷宗', icon: 'file',     inputKind: 'text',   placeholder: '例如 demo.docket.11',             hint: '填写卷宗编号或关键词' }
  ];

  // ---- 模块：每类 3 个（免费 / 固定 / 浮动），名称与成本全部自造 ----------
  // X1-步骤2: Module 决定 input、data source、Credit cost；
  // X1-步骤4: 成本可为 free / fixed / dynamic；
  // X1-步骤3: 浮动成本 = 所选来源之和。
  var fixedCosts = [2, 3, 4, 5];
  var modules = [];
  searchTypes.forEach(function (t, i) {
    var srcIds = sources.map(function (s) { return s.id; });
    modules.push({
      id: t.id + '-basic', typeId: t.id, name: '基础核验 · ' + t.label,
      desc: '对「' + t.label + '」做一次快速核验，结果来自公开登记，不消耗额度。',
      cost: { kind: 'free', value: 0, min: 0, max: 0 },
      recommended: false, sourceIds: [srcIds[0]], filters: null
    });
    modules.push({
      id: t.id + '-focus', typeId: t.id, name: '定向核查 · ' + t.label,
      desc: '在单一登记源上做定向复核，成本固定，适合快速复核已知线索。',
      cost: { kind: 'fixed', value: fixedCosts[i % fixedCosts.length],
              min: fixedCosts[i % fixedCosts.length], max: fixedCosts[i % fixedCosts.length] },
      recommended: false, sourceIds: [srcIds[(i + 1) % srcIds.length]], filters: null
    });
    modules.push({
      id: t.id + '-multi', typeId: t.id, name: '多源并查 · ' + t.label,
      desc: '一次输入并行检索多个所选来源，结果按来源归因合并；成本随所选来源实时变化。',
      cost: { kind: 'dynamic', value: 0, min: 1, max: 9 },
      recommended: true, sourceIds: srcIds,
      filters: { limit: '前 500 项', scope: '不限', region: '不限地区' }
    });
  });

  // ---- 过滤器默认值（X2-④ Reset 恢复默认；文案原创，不照抄原站） ----------
  var filterDefaults = {
    limit: '前 500 项',
    scope: '不限',
    region: '不限地区',
    limitOptions: ['前 100 项', '前 500 项', '全部范围'],
    scopeOptions: ['不限', '公开目录', '登记记录', '社区公开帖'],
    regionOptions: ['不限地区', '华北', '华东', '华南', '境外公开']
  };

  // ---- 合成结果种子（全部占位，无真实个人信息） ---------------------------
  // category: found(直接命中) / enriched(补充命中) / connection(关联线索)
  // X1-结果字段: 结果需带来源归因、状态、置信信号；三计数由 core.buildResults 汇总。
  var resultSeeds = [
    { identifier: 'demo.handle.01', sourceId: 'north',     category: 'found',      status: '直接命中', confidence: 96, note: '公开目录登记一致' },
    { identifier: 'demo.handle.01', sourceId: 'beacon',    category: 'found',      status: '直接命中', confidence: 91, note: '名录条目匹配' },
    { identifier: 'demo.mail.03@north.invalid', sourceId: 'echo', category: 'enriched', status: '补充命中', confidence: 78, note: '补充了关联登记时间' },
    { identifier: 'demo.handle.07', sourceId: 'starmap',   category: 'connection', status: '关联线索', confidence: 64, note: '可据此发起新的账号标识核查' },
    { identifier: 'demo.domain.invalid', sourceId: 'tide', category: 'found',      status: '直接命中', confidence: 88, note: '记录中存在相同主体' },
    { identifier: 'demo.asset.05', sourceId: 'prism',      category: 'enriched',   status: '补充命中', confidence: 72, note: '补充了分类标签' },
    { identifier: '0xDEMO0001', sourceId: 'dune',          category: 'connection', status: '关联线索', confidence: 59, note: '疑似同批登记，建议复核' },
    { identifier: 'demo.sku.09', sourceId: 'milestone',    category: 'found',      status: '直接命中', confidence: 83, note: '索引条目匹配' },
    { identifier: 'demo.handle.02', sourceId: 'forge',     category: 'enriched',   status: '补充命中', confidence: 70, note: '补充了公开备注字段' },
    { identifier: 'demo.record.07', sourceId: 'north',     category: 'connection', status: '关联线索', confidence: 55, note: '与其他线索存在共同来源' },
    { identifier: 'img.demo.04.png', sourceId: 'beacon',   category: 'found',      status: '直接命中', confidence: 90, note: '图像占位标识匹配' },
    { identifier: 'demo.org.02', sourceId: 'echo',         category: 'found',      status: '直接命中', confidence: 85, note: '机构登记一致' },
    { identifier: 'demo.signal.06', sourceId: 'prism',     category: 'enriched',   status: '补充命中', confidence: 66, note: '补充了状态变更记录' },
    { identifier: 'demo.handle.04', sourceId: 'mistwatch', category: 'connection', status: '关联线索', confidence: 61, note: '来自故障观测源的暂存线索' }
  ];

  // ---- 交易记录（X2: Time / Initiated by / Type / Amount / Description） ----
  // 字段语义对齐，文案与数值全部自造；amount 正为充值、负为扣减（单位：点）。
  var transactions = [
    { time: '2026-11-06 20:41', initiator: '观澜工作台', type: '扣减', amount: -4, description: '定向核查 · 账号标识 · 灯塔名录' },
    { time: '2026-11-06 20:12', initiator: '观澜工作台', type: '扣减', amount: -6, description: '多源并查 · 邮件地址 · 北向索引+回声档案' },
    { time: '2026-11-05 18:30', initiator: '演示账号',   type: '充值', amount: 100, description: '单次充值 · 预设额度包' },
    { time: '2026-11-05 17:02', initiator: '观澜工作台', type: '扣减', amount: -2, description: '定向核查 · 域名主体 · 星图登记' },
    { time: '2026-11-04 09:15', initiator: '观澜工作台', type: '扣减', amount: -3, description: '多源并查 · 电话号码 · 潮汐记录' }
  ];

  // ---- 书签初始数据（自造） -----------------------------------------------
  var bookmarks = [
    { id: 'bm-1', identifier: 'demo.handle.01', sourceName: '北向索引', savedAt: '2026-11-06 20:41' }
  ];

  // ---- 状态演练选项（验证脚手架，推断；对应蓝图 4.3 的全部 phase） --------
  // X2: 每个状态都要有可复现触发路径；?state= 与下拉共用这张表。
  var stateDemoOptions = [
    { value: 'idle',            label: '初识空态' },
    { value: 'loading',         label: '加载中（可取消）' },
    { value: 'success',         label: '成功有结果' },
    { value: 'noresults',       label: '零命中（结果不是错误）' },
    { value: 'partial',         label: '部分来源故障 · 健康结果仍出' },
    { value: 'source-down',     label: '数据源整体故障' },
    { value: 'invalid',         label: '校验失败' },
    { value: 'credits',         label: '额度不足' },
    { value: 'bulk-limit',      label: '批量上限' },
    { value: 'timeout',         label: '查询超时 / 卡住' },
    { value: 'network',         label: '网络异常' },
    { value: 'session-expired', label: '会话失效' },
    { value: 'export-success',  label: '导出成功' }
  ];

  return {
    brand: brand,
    status: status,
    credits: credits,
    cases: cases,
    searchTypes: searchTypes,
    modules: modules,
    sources: sources,
    filterDefaults: filterDefaults,
    resultSeeds: resultSeeds,
    transactions: transactions,
    bookmarks: bookmarks,
    stateDemoOptions: stateDemoOptions,
    // 便于自测/编排的派生视图
    modulesByType: function (typeId) {
      return modules.filter(function (m) { return m.typeId === typeId; });
    },
    sourceById: function (id) {
      for (var i = 0; i < sources.length; i++) { if (sources[i].id === id) { return sources[i]; } }
      return null;
    }
  };
});
