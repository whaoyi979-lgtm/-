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

  // ---- 切片 4 · 新增 UI 规格数据（全部自造，对应证据包 P01/P03/P05/P07/P08/E12/E04） ----
  // P07/P14: 工作台顶栏三种视图分段（自造中文名，非原站命名）
  var views = [
    { id: 'basic',    label: '普通视图', hint: '标准检索工作台' },
    { id: 'advanced', label: '高级视图', hint: '在普通视图之上增加 Case 面板与 Case 历史' },
    { id: 'agent',    label: '智能体视图', hint: '整页替换为推广卡与进入按钮' }
  ];
  // P01/P03: 实体类型横向页签，默认「全部」，右侧带过滤齿轮
  var entityTabs = [
    { id: 'all',    label: '全部' },
    { id: 'email',  label: '邮箱' },
    { id: 'phone',  label: '电话' },
    { id: 'ip',     label: 'IP' },
    { id: 'domain', label: '域名' },
    { id: 'url',    label: 'URL' },
    { id: 'wallet', label: '钱包' }
  ];
  // E.2 / H-4: 官方文档有 4 组互相矛盾的列集 —— 这里只做两套「占位列集」，
  // 按模块（单源 / 多源）切换，不声称是唯一列集、不声称与原站列数一致。
  var columnSets = {
    single: {
      id: 'single', label: '单源模块列集',
      headers: [
        { key: 'bookmark',   label: '书签' },
        { key: 'site',       label: '站点' },
        { key: 'enriched',   label: '已补充' },
        { key: 'connection', label: '关联' },
        { key: 'profile',    label: '档案链接' }
      ]
    },
    multi: {
      id: 'multi', label: '多源模块列集',
      headers: [
        { key: 'bookmark',   label: '书签' },
        { key: 'enriched',   label: '已补充' },
        { key: 'platform',   label: '命中平台' },
        { key: 'source',     label: '数据源' }
      ]
    }
  };
  // P05/P07/P08: 结果双 tab、动作按钮、三个详情 tab
  var resultTabs = [
    { id: 'results',   label: '结果' },
    { id: 'bookmarks', label: '书签' }
  ];
  var detailTabs = [
    { id: 'detail',  label: '详情' },
    { id: 'profile', label: '档案视图' },
    { id: 'graph',   label: '关系图' }
  ];
  // P01/P03: 配置弹窗两种变体
  var modalVariants = [
    { id: 'filter',  label: '过滤条件' },
    { id: 'sources', label: '来源开关' }
  ];
  // P07/P14: 高级视图的 Case 历史面板（事件 / 时间两列），全部合成占位
  var caseEvents = [
    { event: '创建留存 Case', at: '2026-11-06 20:02' },
    { event: '加入 1 条书签', at: '2026-11-06 20:41' },
    { event: '执行一次保留模式查询', at: '2026-11-06 20:12' },
    { event: '补充额度 100 点', at: '2026-11-05 18:30' }
  ];
  // G-03 / E12: 主题切换，默认浅色；持久化键为自造前缀（file:// 下用 try/catch 兜底）
  var theme = { defaultTheme: 'light', storageKey: 'guanlan-demo-theme' };
  // E12 / E01: 登录页页头与页脚（自造入口名，不复制参考站文案）
  var signinHeader = [
    { id: 'support', label: '帮助与支持' },
    { id: 'join',    label: '了解演示' }
  ];
  var signinFooter = [
    { id: 'privacy',    label: '隐私说明' },
    { id: 'terms',      label: '使用条款' },
    { id: 'dpa',        label: '数据处理约定' },
    { id: 'compliance', label: '合规说明' }
  ];
  // E04: 重置密码页（本地演示，不发送任何真实邮件）
  var resetCopy = {
    title: '重置演示密码',
    desc: '填写演示邮箱后获取验证码。本页为纯前端占位，不会发送任何真实邮件，也不连接外部服务。',
    codeSent: '验证码已生成（演示）：000000。本环境不发送邮件，可直接返回登录。'
  };
  // P14: 智能体视图整页推广卡（自造文案）
  var agentPromo = {
    tag: '功能预览',
    title: '让智能体替你串起线索',
    desc: '把重复的核查步骤交给自动化流程，由你复核每一步结论。当前为纯前端演示视图，不含任何真实自动化服务。',
    points: ['自动归并同一线索的多来源结果', '按置信度生成可复核的核查清单', '保留完整的人工确认环节']
  };

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
    // D.2: 输入框 label 随「模块」变化（不只是随搜索类型变化）
    var focusLabel = (t.inputKind === 'handle')
      ? (t.id === 'forum' || t.id === 'chat' ? '论坛账号' : '用户名')
      : t.label + '标识';
    modules.push({
      id: t.id + '-basic', typeId: t.id, name: '基础核验 · ' + t.label,
      desc: '对「' + t.label + '」做一次快速核验，结果来自公开登记，不消耗额度。',
      inputLabel: '检索词', inputHint: '填写待核查的检索词或编号',
      cost: { kind: 'free', value: 0, min: 0, max: 0 },
      recommended: false, sourceIds: [srcIds[0]], filters: null
    });
    modules.push({
      id: t.id + '-focus', typeId: t.id, name: '定向核查 · ' + t.label,
      desc: '在单一登记源上做定向复核，成本固定，适合快速复核已知线索。',
      inputLabel: focusLabel, inputHint: '填写单一来源上的' + focusLabel,
      cost: { kind: 'fixed', value: fixedCosts[i % fixedCosts.length],
              min: fixedCosts[i % fixedCosts.length], max: fixedCosts[i % fixedCosts.length] },
      recommended: false, sourceIds: [srcIds[(i + 1) % srcIds.length]], filters: null
    });
    modules.push({
      id: t.id + '-multi', typeId: t.id, name: '多源并查 · ' + t.label,
      desc: '一次输入并行检索多个所选来源，结果按来源归因合并；成本随所选来源实时变化。',
      inputLabel: '待核查线索', inputHint: '一次输入并行检索多个所选来源',
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
  // entity: 供「实体类型横向页签」做占位分类（P01/P03），不是真实数据类型判定。
  var resultSeeds = [
    { identifier: 'demo.handle.01', sourceId: 'north',     category: 'found',      status: '直接命中', confidence: 96, note: '公开目录登记一致', entity: 'url' },
    { identifier: 'demo.handle.01', sourceId: 'beacon',    category: 'found',      status: '直接命中', confidence: 91, note: '名录条目匹配', entity: 'url' },
    { identifier: 'demo.mail.03@north.invalid', sourceId: 'echo', category: 'enriched', status: '补充命中', confidence: 78, note: '补充了关联登记时间', entity: 'email' },
    { identifier: 'demo.handle.07', sourceId: 'starmap',   category: 'connection', status: '关联线索', confidence: 64, note: '可据此发起新的账号标识核查', entity: 'url' },
    { identifier: 'demo.domain.invalid', sourceId: 'tide', category: 'found',      status: '直接命中', confidence: 88, note: '记录中存在相同主体', entity: 'domain' },
    { identifier: 'demo.asset.05', sourceId: 'prism',      category: 'enriched',   status: '补充命中', confidence: 72, note: '补充了分类标签', entity: 'url' },
    { identifier: '0xDEMO0001', sourceId: 'dune',          category: 'connection', status: '关联线索', confidence: 59, note: '疑似同批登记，建议复核', entity: 'wallet' },
    { identifier: 'demo.sku.09', sourceId: 'milestone',    category: 'found',      status: '直接命中', confidence: 83, note: '索引条目匹配', entity: 'url' },
    { identifier: 'demo.handle.02', sourceId: 'forge',     category: 'enriched',   status: '补充命中', confidence: 70, note: '补充了公开备注字段', entity: 'url' },
    { identifier: 'demo.record.07', sourceId: 'north',     category: 'connection', status: '关联线索', confidence: 55, note: '与其他线索存在共同来源', entity: 'url' },
    { identifier: 'img.demo.04.png', sourceId: 'beacon',   category: 'found',      status: '直接命中', confidence: 90, note: '图像占位标识匹配', entity: 'url' },
    { identifier: 'demo.org.02', sourceId: 'echo',         category: 'found',      status: '直接命中', confidence: 85, note: '机构登记一致', entity: 'url' },
    { identifier: 'demo.signal.06', sourceId: 'prism',     category: 'enriched',   status: '补充命中', confidence: 66, note: '补充了状态变更记录', entity: 'url' },
    { identifier: 'demo.handle.04', sourceId: 'mistwatch', category: 'connection', status: '关联线索', confidence: 61, note: '来自故障观测源的暂存线索', entity: 'url' },
    { identifier: '+00 000 000 002', sourceId: 'tide',     category: 'found',      status: '直接命中', confidence: 81, note: '公开号码占位条目', entity: 'phone' },
    { identifier: '192.0.2.31', sourceId: 'starmap',       category: 'enriched',   status: '补充命中', confidence: 74, note: '保留地址段占位条目', entity: 'ip' },
    { identifier: 'demo.mail.08@north.invalid', sourceId: 'forge', category: 'found', status: '直接命中', confidence: 87, note: '目录条目匹配', entity: 'email' },
    { identifier: '0xDEMO0002', sourceId: 'prism',         category: 'connection', status: '关联线索', confidence: 58, note: '疑似同批登记，建议复核', entity: 'wallet' }
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
    // F-03: 关联线索为空是独立状态，计数器与详情区可能出现口径差异
    { value: 'no-connections',  label: '关联线索为空（计数口径差异）' },
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
    // 切片 4 新增 UI 规格数据（P01/P03/P05/P07/P08/P14/E01/E04/E12/G-03）
    views: views,
    entityTabs: entityTabs,
    columnSets: columnSets,
    resultTabs: resultTabs,
    detailTabs: detailTabs,
    modalVariants: modalVariants,
    caseEvents: caseEvents,
    theme: theme,
    signinHeader: signinHeader,
    signinFooter: signinFooter,
    resetCopy: resetCopy,
    agentPromo: agentPromo,
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
