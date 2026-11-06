/* =============================================================================
 * app.js — 视图 / 事件 / 路由 / 状态编排（浏览器专用；传统 script 标签加载）
 *
 * 依赖：globalThis.ReplicaData（data.js）、globalThis.ReplicaCore（core.js）
 * 合规：纯前端演示会话（内存开关，不模拟任何真实鉴权）；无 fetch / 无外部请求。
 *
 * 切片推进（每片结束留一条运行证据，见 docs/03-selftest.md）：
 *   S1 骨架：外壳 + 路由 + 登录（X3）+ 顶栏 + 工作台布局 + 状态演练入口
 *   S2 查询：类型联动 / 模块 / 数据源过滤器 / 校验 / 成本 / 批量 / 模式（X1 五步）
 *   S3 结果：状态机全状态 + 结果表 + 额度页 + 留存页 + 演练落地（X2）
 *
 * 代码内注释标注证据编号（X1 / X2 / X3 / 推断），便于验证员逐条追溯。
 * ========================================================================== */
(function () {
  'use strict';

  var D = globalThis.ReplicaData;
  var C = globalThis.ReplicaCore;
  var app = document.getElementById('app');
  var ROUTES = ['signin', 'search', 'credits', 'cases'];

  // ---------------------------------------------------------------------------
  // 内存态（刷新即复位；无任何真实凭证、无任何持久化副作用）
  // ---------------------------------------------------------------------------
  var state = {
    signedIn: false,
    route: 'signin',
    signinEmail: '', signinPassword: '', keepSigned: false, signinError: '',

    // 工作台
    activeTypeId: D.searchTypes[0].id,
    activeModuleId: D.modulesByType(D.searchTypes[0].id)[0].id,
    selectedSourceIds: ['north', 'beacon', 'echo'],
    filters: {
      limit: D.filterDefaults.limit,
      scope: D.filterDefaults.scope,
      region: D.filterDefaults.region
    },
    query: '',
    batchOn: false,
    batch: [''],
    mode: 'keep',
    caseId: D.cases[0].id,

    // 结果面板
    result: C.initialResult(),
    scenario: 'success',          // 演练 / 执行落地场景
    forceState: null,             // ?state= 初始值
    resultData: null,
    page: 1,
    pageSize: 5,
    sourceFilter: 'all',
    lastCost: 0,

    // 账户 / 留存
    credits: D.credits.balance,
    transactions: D.transactions.slice(),
    bookmarks: D.bookmarks.slice(),
    history: [],
    topupAmount: D.credits.topupPresets[1],
    topupPlan: 'single',

    // UI
    modalOpen: false,
    menuOpen: false,
    toast: '', toastOk: false,
    toastTimer: null,
    runTimer: null
  };

  // ---------------------------------------------------------------------------
  // 通用工具
  // ---------------------------------------------------------------------------
  function esc(v) {
    return String(v === null || v === undefined ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function icon(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  }
  function nowStr() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function showToast(msg, ok) {
    state.toast = msg; state.toastOk = !!ok;
    if (state.toastTimer) { clearTimeout(state.toastTimer); }
    render();
    state.toastTimer = setTimeout(function () {
      state.toast = ''; state.toastOk = false; render();
    }, 2600);
  }
  function currentType() {
    for (var i = 0; i < D.searchTypes.length; i++) {
      if (D.searchTypes[i].id === state.activeTypeId) { return D.searchTypes[i]; }
    }
    return D.searchTypes[0];
  }
  function modulesForType() { return D.modulesByType(state.activeTypeId); }
  function currentModule() {
    var list = modulesForType();
    for (var i = 0; i < list.length; i++) { if (list[i].id === state.activeModuleId) { return list[i]; } }
    return list[0] || null;
  }
  function batchCount() { return state.batchOn ? Math.max(1, state.batch.length) : 1; }
  function currentCost() {
    var m = currentModule();
    if (!m) { return C.computeCost(null, [], D.sources, batchCount()); }
    var ids = m.cost.kind === 'dynamic' ? state.selectedSourceIds : m.sourceIds;
    return C.computeCost(m, ids, D.sources, batchCount());
  }
  function caseById(id) {
    for (var i = 0; i < D.cases.length; i++) { if (D.cases[i].id === id) { return D.cases[i]; } }
    return D.cases[0];
  }
  function routeFromHash() {
    var h = String(location.hash || '').replace(/^#\/?/, '').split('?')[0];
    return ROUTES.indexOf(h) >= 0 ? h : null;
  }

  // ---------------------------------------------------------------------------
  // S1 渲染：登录视图（X3 可见结构；品牌与文案全部自有）
  // ---------------------------------------------------------------------------
  function renderSignin() {
    // X3: 邮箱 / 密码 / 记住登录 / 登录按钮 / or 分隔 / 邮件登录链接 /
    //     第三方登录按钮 / 注册与忘记密码链接
    return '' +
      '<div class="signin-wrap"><div class="signin-card">' +
        '<div class="signin-brand">' +
          '<div class="signin-logo">' + icon('logo', 'ic-lg') + '</div>' +
          '<div><p class="signin-title">' + esc(D.brand.name) + ' · ' + esc(D.brand.product) + '</p>' +
          '<p class="signin-sub">' + esc(D.brand.tagline) + '</p></div>' +
        '</div>' +
        '<h1 class="h2" style="margin-bottom:4px">进入工作台</h1>' +
        '<p class="tiny" style="margin:0 0 16px">使用演示会话继续。本页不提交任何数据到服务器。</p>' +
        '<form data-act="signin-form" autocomplete="off">' +
          '<label class="field"><span class="field-label">邮箱</span>' +
            '<input class="input" type="text" data-field="signin-email" placeholder="例如 demo@north.invalid" value="' + esc(state.signinEmail) + '"></label>' +
          '<label class="field"><span class="field-label">密码</span>' +
            '<input class="input" type="password" data-field="signin-password" placeholder="至少 6 位" value="' + esc(state.signinPassword) + '"></label>' +
          (state.signinError ? '<div class="field-error" role="alert">' + esc(state.signinError) + '</div>' : '') +
          '<div class="signin-actions">' +
            '<label class="check"><input type="checkbox" data-field="keep-signed"' + (state.keepSigned ? ' checked' : '') + '>记住本次登录</label>' +
          '</div>' +
          '<button class="btn btn-primary btn-block" type="submit" data-act="signin-submit">登录</button>' +
        '</form>' +
        '<div class="or-line">或</div>' +
        '<button class="btn btn-block" type="button" data-act="email-link" style="margin-bottom:8px">' + icon('mail') + '发送登录链接到邮箱</button>' +
        '<div class="oauth-list">' +
          '<button class="btn btn-block" type="button" data-act="oauth" data-provider="云枢账号">' + icon('user') + '使用云枢账号继续</button>' +
          '<button class="btn btn-block" type="button" data-act="oauth" data-provider="星钥身份">' + icon('shield') + '使用星钥身份继续</button>' +
        '</div>' +
        '<div class="signin-foot">' +
          '<button class="link-btn" type="button" data-act="register">还没有账号？创建一个</button>' +
          '<button class="link-btn" type="button" data-act="forgot">忘记密码？</button>' +
        '</div>' +
        '<div class="signin-note">演示说明：任意非空邮箱 + 至少 6 位密码即可进入；这是本地演示会话，不涉及真实凭证或外部鉴权。</div>' +
      '</div></div>';
  }

  // ---------------------------------------------------------------------------
  // S1 渲染：顶栏（自有品牌、状态 pill、额度 pill、Case、模式、用户菜单）
  // ---------------------------------------------------------------------------
  function renderTopbar() {
    // X2: Status pill 标记 faulty 来源；额度 pill 在顶栏与构成区镜像。
    var stTone = D.status.overall === 'degraded' ? 'pill-warn' : 'pill-ok';
    var dotCls = D.status.overall === 'degraded' ? 'dot-warn' : 'dot-ok';
    return '' +
      '<header class="topbar">' +
        '<div class="brand">' +
          '<div class="brand-logo">' + icon('logo') + '</div>' +
          '<div><div class="brand-name">' + esc(D.brand.name) + '</div>' +
          '<div class="brand-product">' + esc(D.brand.product) + '</div></div>' +
        '</div>' +
        '<div class="topbar-tools">' +
          '<button class="pill ' + stTone + '" type="button" data-act="status" title="查看来源健康度">' +
            '<span class="dot ' + dotCls + '"></span>状态 · ' + esc(D.status.label) + '</button>' +
          '<a class="pill pill-indigo" href="#/credits">' + icon('wallet', 'ic-sm') + '额度 ' + state.credits + ' ' + esc(D.credits.unit) + '</a>' +
          '<a class="pill" href="#/cases" title="当前 Case">' + icon('list', 'ic-sm') + esc(caseById(state.caseId).name) + '</a>' +
          '<div class="seg" role="group" aria-label="查询模式">' +
            '<button type="button" data-act="mode" data-mode="keep" class="' + (state.mode === 'keep' ? 'active' : '') + '">保留模式</button>' +
            '<button type="button" data-act="mode" data-mode="private" class="' + (state.mode === 'private' ? 'active' : '') + '">隐私模式</button>' +
          '</div>' +
          '<div class="menu-wrap">' +
            '<button class="btn btn-sm btn-icon" type="button" data-act="menu" aria-label="用户菜单">' + icon('menu') + '</button>' +
            (state.menuOpen ?
              '<div class="menu">' +
                '<div class="menu-item" style="color:var(--slate-600)">' + icon('user', 'ic-sm') + esc(D.brand.account) + '（演示）</div>' +
                '<button class="menu-item" type="button" data-act="menu-session">' + icon('alert', 'ic-sm') + '演练：会话失效</button>' +
                '<button class="menu-item" type="button" data-act="menu-signout">' + icon('logout', 'ic-sm') + '退出演示会话</button>' +
              '</div>' : '') +
          '</div>' +
        '</div>' +
      '</header>';
  }

  function renderSubnav() {
    var items = [
      { id: 'search', label: '检索工作台', icon: 'search' },
      { id: 'credits', label: '额度与记录', icon: 'wallet' },
      { id: 'cases', label: '留存与书签', icon: 'bookmark' }
    ];
    var out = '<nav class="subnav" aria-label="主导航">';
    items.forEach(function (it) {
      out += '<a href="#/' + it.id + '" class="' + (state.route === it.id ? 'active' : '') + '">' +
        icon(it.id === 'search' ? 'search' : it.id === 'credits' ? 'wallet' : 'bookmark', 'ic-sm') + esc(it.label) + '</a>';
    });
    return out + '</nav>';
  }

  // 状态演练条（验证脚手架，推断；仅工作台显示）
  function renderDemoBar() {
    var opts = D.stateDemoOptions.map(function (o) {
      return '<option value="' + esc(o.value) + '"' + (o.value === state.scenario ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');
    return '' +
      '<div class="demo-bar">' +
        '<label for="demo-state">' + icon('spark', 'ic-sm') + ' 状态演练</label>' +
        '<select id="demo-state" class="select" data-field="demo-state">' + opts + '</select>' +
        '<span>用于逐项复现交互状态；也可用 <span class="mono">?state=</span> 参数直接打开</span>' +
        '<button class="btn btn-sm" type="button" data-act="demo-reset">回到初始空态</button>' +
      '</div>';
  }

  function renderFooter() {
    return '<div class="footer-note">' + esc(D.brand.name) + ' · ' + esc(D.brand.version) +
      '　|　纯前端演示 · 全部数据为合成占位 · 无任何外部请求</div>';
  }

  // 通用状态卡：任何 phase 都有明确标题、说明、徽标与可操作出口（X2 全状态）
  function renderStateCard(res) {
    var p = C.PHASES[res.phase] || C.PHASES.idle;
    var acts = p.actions.map(function (a) {
      var primary = a.act === 'retry' || a.act === 'focus-query' || a.act === 'topup' || a.act === 'signin';
      return '<button class="btn ' + (primary ? 'btn-primary' : '') + ' btn-sm" type="button" data-act="' + esc(a.act) + '">' +
        esc(a.label) + '</button>';
    }).join('');
    var guidance = p.guidance && p.guidance.length
      ? '<ol class="guidance">' + p.guidance.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ol>'
      : '';
    var reasons = res.meta && res.meta.reasons && res.meta.reasons.length
      ? '<ul class="reason-list">' + res.meta.reasons.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>'
      : '';
    var skeleton = res.phase === 'loading'
      ? '<div class="skeleton"><div class="sk-line w90"></div><div class="sk-line w70"></div><div class="sk-line w50"></div></div>' +
        '<div class="progress"><i></i></div>'
      : '';
    return '' +
      '<div class="state-card">' +
        '<div class="state-head">' +
          '<div class="state-icon tone-' + p.tone + '">' +
            icon(res.phase === 'loading' ? 'clock' :
                 res.phase === 'success' || res.phase === 'export-success' ? 'check' :
                 res.phase === 'idle' ? 'search' : 'info') + '</div>' +
          '<div style="flex:1">' +
            '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
              '<span class="tag tag-' + (p.tone === 'error' ? 'err' : p.tone === 'warn' ? 'warn' : p.tone === 'ok' ? 'ok' : p.tone === 'info' ? 'info' : 'neutral') + '">' + esc(p.badge) + '</span>' +
              '<span class="state-title">' + esc(p.title) + '</span>' +
            '</div>' +
            '<p class="state-desc">' + esc(p.desc) + '</p>' +
          '</div>' +
        '</div>' +
        reasons + guidance + skeleton +
        '<div class="state-actions">' + acts + '</div>' +
      '</div>';
  }

  // ---------------------------------------------------------------------------
  // S1 渲染：搜索视图布局（三栏，移动端堆叠；结果面板在右/下）
  // ---------------------------------------------------------------------------
  function renderSearchView() {
    return '<div class="workbench">' + renderTypeNav() + renderComposer() + renderResult() + '</div>';
  }

  /* ==== SLICE2:BEGIN ==== *
   * X1 五步：① 选类型 → ② 选模块 → ③ 齿轮配置数据源/过滤器 → ④ 输入 + 成本 → ⑤ 执行
   * X1-步骤3: 浮动成本 = 所选来源之和；X1-Bulk: 上限 5 条、成本累加；
   * X1-Cases/模式: 保留模式写历史、隐私模式不写。
   * ======================================================================== */
  state.batchNotice = '';
  state.draftSourceIds = state.selectedSourceIds.slice();
  state.draftFilters = {
    limit: D.filterDefaults.limit, scope: D.filterDefaults.scope, region: D.filterDefaults.region
  };
  state.modalModuleId = null;

  function costDetail(c, m) {
    if (c.kind === 'free') { return '免费模块，不消耗额度'; }
    if (c.kind === 'fixed') { return '固定成本 ' + c.perSearch + ' 点'; }
    if (!c.breakdown.length) { return '浮动成本：尚未选择来源（0 点）'; }
    return '浮动成本 = 所选来源之和：' + c.breakdown.map(function (b) {
      return b.label + ' ' + b.cost;
    }).join(' ＋ ');
  }

  // X1-步骤1: 18 类搜索类型导航（全部可交互，切换联动模块列表）
  function renderTypeNav() {
    var out = '<section class="panel"><div class="panel-head"><h2 class="h3">① 搜索类型</h2>' +
      '<span class="pill">' + D.searchTypes.length + ' 类</span></div><div class="type-nav">';
    D.searchTypes.forEach(function (t) {
      out += '<button class="type-item' + (t.id === state.activeTypeId ? ' active' : '') +
        '" type="button" data-act="type" data-type-id="' + esc(t.id) + '" title="' + esc(t.hint) + '">' +
        icon(t.icon) + '<span>' + esc(t.label) + '</span></button>';
    });
    return out + '</div></section>';
  }

  // X1-步骤2: 模块卡（名称 / 说明 / 成本类型标签 / 成本 / 推荐 / 选中高亮 / 齿轮）
  function renderModuleCard(m) {
    var ids = m.cost.kind === 'dynamic' ? state.selectedSourceIds : m.sourceIds;
    var c = C.computeCost(m, ids, D.sources, 1);
    var tagCls = m.cost.kind === 'free' ? 'tag-free' : m.cost.kind === 'fixed' ? 'tag-fixed' : 'tag-dynamic';
    return '<div class="module-card' + (m.id === state.activeModuleId ? ' active' : '') +
      '" data-act="module" data-module-id="' + esc(m.id) + '">' +
      '<div class="module-top"><div class="module-name">' + esc(m.name) + '</div>' +
        (m.recommended ? '<span class="tag tag-rec">推荐</span>' : '') +
        '<button class="gear-btn" type="button" data-act="gear" data-module-id="' + esc(m.id) +
          '" title="选择数据源 / 过滤器" aria-label="配置数据源与过滤器">' + icon('gear', 'ic-sm') + '</button>' +
      '</div>' +
      '<div class="module-desc">' + esc(m.desc) + '</div>' +
      '<div class="module-meta">' +
        '<span class="tag ' + tagCls + '">' + esc(C.COST_LABELS[m.cost.kind]) + '</span>' +
        '<span class="module-cost">' + (m.cost.kind === 'free' ? '0 点' : c.perSearch + ' 点') + '</span>' +
        (m.id === state.activeModuleId ? '<span class="pill pill-indigo">已选中</span>' : '') +
      '</div></div>';
  }

  function selectField(field, label, options, cur) {
    return '<label class="field"><span class="field-label">' + esc(label) + '</span>' +
      '<select class="select" data-field="' + field + '">' +
      options.map(function (o) {
        return '<option value="' + esc(o) + '"' + (o === cur ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('') + '</select></label>';
  }

  // X1-步骤4: 查询构成区（按类型切占位符/校验规则、单次成本行、批量、模式、Case、立即查询）
  function renderComposer() {
    var t = currentType(), m = currentModule(), c = currentCost(), n = batchCount();
    var h = '<section class="panel"><div class="panel-head">' +
      '<h2 class="h3">② 模块与查询 · ' + esc(t.label) + '</h2>' +
      '<button class="pill pill-indigo" type="button" data-act="gear" data-module-id="' + esc(m.id) + '">' +
        icon('gear', 'ic-sm') + '配置数据源</button></div><div class="panel-body">';

    // X1-步骤2: 模块列表联动当前类型
    h += '<div class="module-list">' + modulesForType().map(renderModuleCard).join('') + '</div>';
    h += '<div class="divider"></div>';

    // X1-步骤4: 输入（占位符与校验规则随类型切换；至少 8 种规则）
    h += '<label class="field"><span class="field-label">③ 查询内容（校验规则：' +
      esc(C.ruleFor(t.inputKind).label) + '）</span>' +
      '<input class="input" type="text" data-field="query" placeholder="' + esc(t.placeholder) +
      '" value="' + esc(state.query) + '"' + (state.batchOn ? ' disabled' : '') + '></label>';
    h += '<div class="field-hint">' + esc(t.hint) + '；请勿粘贴完整网址，注意首尾空格与超长内容。</div>';

    // X1-Bulk / X2-FAQ: 批量开关，最多 5 条，成本按条数累加
    h += '<div style="margin-top:12px"><label class="check"><input type="checkbox" data-field="batch-on"' +
      (state.batchOn ? ' checked' : '') + '>开启批量查询（最多 ' + C.MAX_BATCH + ' 条，成本按条数累加）</label></div>';
    if (state.batchOn) {
      h += '<div style="margin-top:10px">';
      state.batch.forEach(function (v, i) {
        h += '<div class="batch-row"><span class="batch-index">' + (i + 1) + '</span>' +
          '<input class="input" type="text" data-field="batch-item" data-index="' + i +
          '" placeholder="' + esc(t.placeholder) + '" value="' + esc(v) + '">' +
          '<button class="btn btn-sm btn-icon" type="button" data-act="batch-remove" data-index="' + i +
          '" aria-label="删除该条">' + icon('close', 'ic-sm') + '</button></div>';
      });
      h += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        '<button class="btn btn-sm" type="button" data-act="batch-add">' + icon('plus', 'ic-sm') + '添加一条</button>' +
        '<span class="tiny">已 ' + state.batch.length + ' / ' + C.MAX_BATCH + ' 条</span></div>';
      if (state.batchNotice) {
        h += '<div class="field-error" role="alert">' + esc(state.batchNotice) + '</div>';
      }
      h += '</div>';
    }

    // X1-步骤4: 单次成本行（成本 + 批量合计，实时反映来源/条数）
    h += '<div class="cost-row"><div>' +
      '<div class="field-label" style="margin:0">④ 单次成本（' + esc(c.label) + '）</div>' +
      '<div class="tiny">' + esc(costDetail(c, m)) + '</div></div>' +
      '<div style="text-align:right"><div class="cost-value">' + c.perSearch + ' 点 / 条</div>' +
      '<div class="tiny">共 ' + n + ' 条 → 本次合计 ' + c.total + ' 点</div></div></div>';

    // X1-Cases/模式: 模式切换 + Case 选择
    h += '<div class="composer-grid">' +
      '<label class="field"><span class="field-label">查询模式</span><select class="select" data-field="mode-select">' +
        '<option value="keep"' + (state.mode === 'keep' ? ' selected' : '') + '>保留模式（写入 Case 历史）</option>' +
        '<option value="private"' + (state.mode === 'private' ? ' selected' : '') + '>隐私模式（不写历史）</option>' +
      '</select></label>' +
      '<label class="field"><span class="field-label">留存 Case</span><select class="select" data-field="case-select">' +
      D.cases.map(function (cs) {
        return '<option value="' + esc(cs.id) + '"' + (cs.id === state.caseId ? ' selected' : '') + '>' +
          esc(cs.name) + '</option>';
      }).join('') + '</select></label></div>';
    h += '<div class="hint-box">' + esc(C.MODES[state.mode].hint) + '；当前 Case：' +
      esc(caseById(state.caseId).name) + '。</div>';

    h += '<button class="btn btn-primary btn-block" type="button" data-act="run" style="margin-top:12px">' +
      icon('search') + '立即查询</button>';
    return h + '</div></section>';
  }

  // X1-步骤3 / X1-步骤3 / X2-④: 齿轮 → 选择数据源 / 过滤器弹窗
  function renderSourceModal() {
    if (!state.modalOpen) { return ''; }
    var m = currentModule(), draft = state.draftSourceIds || [], f = state.draftFilters || {};
    var c = C.computeCost(m, m.cost.kind === 'dynamic' ? draft : m.sourceIds, D.sources, batchCount());
    var fd = D.filterDefaults;
    var h = '<div class="modal-mask" data-act="modal-mask"><div class="modal" role="dialog" aria-modal="true" ' +
      'aria-label="选择数据源与过滤器" data-act="modal-inner">' +
      '<div class="modal-head"><div><h2 class="h2">选择数据源 / 过滤器</h2>' +
        '<div class="tiny">' + esc(m.name) + '</div></div>' +
        '<button class="btn btn-icon btn-sm" type="button" data-act="modal-close" aria-label="关闭">' +
          icon('close') + '</button></div><div class="modal-body">' +
      '<div class="hint-box">' + icon('info', 'ic-sm') + ' 一次输入可跨多个所选来源（X1-步骤3）；' +
        (m.cost.kind === 'dynamic'
          ? '浮动成本 = 所选来源之和，勾选时实时更新。'
          : '当前模块成本为' + esc(C.COST_LABELS[m.cost.kind]) + '，来源选择仅影响结果范围。') + '</div>' +
      '<div class="section-title" style="margin-top:12px">数据源（可多选）</div><div class="source-list">';
    D.sources.forEach(function (s) {
      var checked = draft.indexOf(s.id) >= 0;
      h += '<label class="source-item' + (checked ? ' checked' : '') + '">' +
        '<input type="checkbox" data-field="src-toggle" data-src-id="' + esc(s.id) + '"' +
          (checked ? ' checked' : '') + '>' +
        '<span class="source-name">' + esc(s.name) +
          (s.healthy ? '' : ' <span class="pill pill-warn">暂不可用</span>') + '</span>' +
        '<span class="tiny">' + esc(s.category) + '</span>' +
        '<span class="source-cost">' + s.cost + ' 点</span></label>';
    });
    h += '</div><div class="divider"></div>' +
      '<div class="section-title">扫描范围 / 类型 / 地区</div><div class="filter-grid">' +
      selectField('filter-limit', '限制条数', fd.limitOptions, f.limit) +
      selectField('filter-scope', '扫描类型', fd.scopeOptions, f.scope) +
      selectField('filter-region', '地区范围', fd.regionOptions, f.region) +
      '</div></div>' +
      '<div class="modal-foot"><div><div class="tiny">总成本（含 ' + batchCount() + ' 条批量）</div>' +
        '<div class="cost-value">' + c.total + ' 点</div>' +
        '<div class="tiny">' + esc(costDetail(c, m)) + '</div></div>' +
        '<div style="display:flex;gap:8px">' +
          '<button class="btn" type="button" data-act="filter-reset">重置</button>' +
          '<button class="btn btn-primary" type="button" data-act="filter-apply">应用筛选</button>' +
        '</div></div></div></div>';
    return h;
  }

  // 执行链：校验 → 额度 → 批量上限 → loading → 结果落地（X1-步骤5 / X2 前置拦截）
  function runQuery() {
    var t = currentType(), c = currentCost();
    var inputs = state.batchOn ? state.batch : [state.query];
    var reasons = [];
    inputs.forEach(function (v, i) {
      var r = C.validateQuery(t.inputKind, v);
      if (!r.valid) { reasons.push('第 ' + (i + 1) + ' 条：' + r.message); }
    });
    var gate = 'pass';
    if (reasons.length) { gate = 'invalid'; }
    else if (state.batchOn && state.batch.length > C.MAX_BATCH) { gate = 'bulkLimit'; }
    else if (!C.canAfford(state.credits, c.total)) { gate = 'credits'; }

    state.result = C.reduceResult(state.result, {
      type: 'RUN',
      payload: { gate: gate, reasons: reasons, cost: c.total, balance: state.credits, scenario: state.scenario }
    });
    state.resultData = null;
    render();
    if (gate !== 'pass') { return; }

    if (state.runTimer) { clearTimeout(state.runTimer); }
    state.runTimer = setTimeout(function () {
      state.runTimer = null;
      var outcomes = ['success', 'noresults', 'partial', 'source-down', 'timeout', 'network'];
      finishQuery(outcomes.indexOf(state.scenario) >= 0 ? state.scenario : 'success');
    }, 900);
  }

  // 结果落地：状态机 RESOLVE + 结果组装 + 扣费记账 + 模式对历史的影响
  function finishQuery(outcome) {
    var t = currentType(), m = currentModule(), c = currentCost();
    state.result = C.reduceResult(state.result, {
      type: 'RESOLVE', payload: { outcome: outcome, meta: { cost: c.total } }
    });
    state.resultData = C.buildResults({
      seeds: D.resultSeeds, sources: D.sources,
      selectedSourceIds: m.cost.kind === 'dynamic' ? state.selectedSourceIds : m.sourceIds,
      scenario: outcome === 'noresults' ? 'noresults' : outcome === 'partial' ? 'partial'
        : outcome === 'source-down' ? 'source-down' : 'success',
      batchCount: batchCount()
    });
    state.page = 1;

    // X2-扣费: 每次检索按成本行扣减并写入交易记录（超时/网络/整体故障不扣）
    if (c.total > 0 && ['success', 'noresults', 'partial'].indexOf(outcome) >= 0) {
      var d = C.deductCredits(state.credits, c.total);
      if (d.ok) {
        state.credits = d.balance;
        var srcLabel = m.cost.kind === 'dynamic'
          ? (state.selectedSourceIds.length + ' 个所选来源')
          : (C.findSource(D.sources, m.sourceIds[0]) || { name: '所选来源' }).name;
        state.transactions = [C.makeDebitRecord(m.name, srcLabel, c.total, nowStr())]
          .concat(state.transactions);
      }
    }
    // X1-Cases/模式: 保留模式写历史，隐私模式不写
    state.history = C.applyMode(state.mode, state.history, C.makeHistoryEntry({
      id: 'h-' + Date.now(), at: nowStr(), typeLabel: t.label, moduleName: m.name,
      query: (state.batchOn ? state.batch.join(' / ') : state.query) || '—',
      batchCount: batchCount(), cost: c.total, caseId: state.caseId, mode: state.mode
    }));
    render();
  }

  // S2 动作与字段处理（在 actions / fieldHandlers 定义之后由 Object.assign 注册）
  var S2_ACTIONS = {
    'type': function (node) {
      state.activeTypeId = node.getAttribute('data-type-id');
      var mods = modulesForType();
      state.activeModuleId = mods.length ? mods[0].id : null;
      state.query = ''; state.batch = ['']; state.batchNotice = '';
      state.result = C.initialResult(); state.resultData = null;
      render();
    },
    'module': function (node) { state.activeModuleId = node.getAttribute('data-module-id'); render(); },
    'gear': function (node) {
      state.activeModuleId = node.getAttribute('data-module-id') || state.activeModuleId;
      var m = currentModule();
      state.modalModuleId = m.id;
      state.draftSourceIds = (m.cost.kind === 'dynamic' ? state.selectedSourceIds : m.sourceIds).slice();
      state.draftFilters = {
        limit: state.filters.limit, scope: state.filters.scope, region: state.filters.region
      };
      state.modalOpen = true;
      render();
    },
    'modal-close': function () { state.modalOpen = false; render(); },
    'modal-mask': function () { state.modalOpen = false; render(); },
    'modal-inner': function () { /* 阻止冒泡到遮罩关闭 */ },
    'filter-reset': function () {
      // X2-④: Reset 恢复默认过滤项 + 全部健康来源
      state.draftFilters = {
        limit: D.filterDefaults.limit, scope: D.filterDefaults.scope, region: D.filterDefaults.region
      };
      state.draftSourceIds = D.sources.filter(function (s) { return s.healthy; })
        .map(function (s) { return s.id; });
      render();
      showToast('已恢复默认过滤项与全部健康来源（X2-④ 重置）');
    },
    'filter-apply': function () {
      state.selectedSourceIds = (state.draftSourceIds || []).slice();
      state.filters = {
        limit: state.draftFilters.limit, scope: state.draftFilters.scope, region: state.draftFilters.region
      };
      state.modalOpen = false;
      render();
      showToast('已应用筛选，成本已重算（X2-④ 应用筛选）', true);
    },
    'run': function () { runQuery(); },
    'batch-add': function () {
      var r = C.addBatchItem(state.batch, '');
      if (!r.ok) {
        // X1-Bulk: 第 6 条禁止添加，并切到「批量上限」状态（可复现）
        state.batchNotice = r.message;
        state.result = C.reduceResult(state.result, {
          type: 'FORCE', payload: { phase: 'bulk-limit' }
        });
        state.resultData = null;
        render();
        showToast(r.message);
        return;
      }
      state.batch = r.items; state.batchNotice = '';
      render();
    },
    'batch-remove': function (node) {
      state.batch = C.removeBatchItem(state.batch, Number(node.getAttribute('data-index')));
      if (!state.batch.length) { state.batch = ['']; }
      state.batchNotice = '';
      render();
    },
    'cancel': function () {
      if (state.runTimer) { clearTimeout(state.runTimer); state.runTimer = null; }
      state.result = C.reduceResult(state.result, { type: 'CANCEL' });
      render();
      showToast('已取消查询，未扣减额度');
    },
    'retry': function () {
      state.result = C.initialResult();
      state.resultData = null;
      runQuery();
    },
    'edit': function () {
      state.result = C.initialResult();
      state.resultData = null;
      render();
    },
    'focus-query': function () {
      var el = document.querySelector('[data-field="query"]');
      if (el && !el.disabled) { el.focus(); }
      else { showToast('请先在上方选择类型与模块'); }
    }
  };

  var S2_FIELDS = {
    'query': function (el) { state.query = el.value; },
    'batch-item': function (el) {
      state.batch = C.setBatchItem(state.batch, Number(el.getAttribute('data-index')), el.value);
    },
    'batch-on': function (el) {
      state.batchOn = !!el.checked;
      if (state.batchOn && !state.batch.length) { state.batch = ['']; }
      state.batchNotice = '';
      render();
    },
    'mode-select': function (el) {
      state.mode = el.value === 'private' ? 'private' : 'keep';
      render();
    },
    'case-select': function (el) { state.caseId = el.value; render(); },
    'src-toggle': function (el) {
      // X1-步骤3: 勾选实时更新浮动成本与总成本
      var id = el.getAttribute('data-src-id');
      var arr = (state.draftSourceIds || []).slice();
      var i = arr.indexOf(id);
      if (el.checked && i < 0) { arr.push(id); }
      if (!el.checked && i >= 0) { arr.splice(i, 1); }
      state.draftSourceIds = arr;
      render();
    },
    'filter-limit': function (el) { state.draftFilters.limit = el.value; },
    'filter-scope': function (el) { state.draftFilters.scope = el.value; },
    'filter-region': function (el) { state.draftFilters.region = el.value; }
  };
  /* ==== SLICE2:END ==== */

  /* ==== SLICE3:BEGIN ==== *
   * X2 全状态 + 结果表（列头/三计数/分页/来源筛选/书签/CSV/重试/故障提示）
   * + 额度页（充值/交易记录） + 留存页（Case/书签/历史） + 状态演练落地
   * ======================================================================== */
  // 默认选中「多源并查」模块，便于开箱演示浮动成本与来源归因（X1-步骤3）
  (function () {
    var multi = D.modulesByType(state.activeTypeId).filter(function (m) {
      return m.cost.kind === 'dynamic';
    })[0];
    if (multi) { state.activeModuleId = multi.id; }
  })();
  // 演练态结果表使用的来源集合（全量，含一个故障源以复现 partial）
  state.tableSourceIds = D.sources.map(function (s) { return s.id; });

  var TABLE_PHASES = ['success', 'partial', 'source-down', 'noresults', 'export-success'];

  // 需要表格的状态若无数据，即时构造合成演示数据（不扣费、不写历史）
  function ensureResultData() {
    if (TABLE_PHASES.indexOf(state.result.phase) < 0) { return null; }
    if (state.resultData) { return state.resultData; }
    var p = state.result.phase;
    var scenario = p === 'partial' ? 'partial'
      : p === 'source-down' ? 'source-down'
      : p === 'noresults' ? 'noresults' : 'success';
    state.resultData = C.buildResults({
      seeds: D.resultSeeds, sources: D.sources,
      selectedSourceIds: state.tableSourceIds,
      scenario: scenario, batchCount: batchCount()
    });
    return state.resultData;
  }

  function categoryTag(r) {
    var cls = r.category === 'found' ? 'tag-ok'
      : r.category === 'enriched' ? 'tag-info' : 'tag-warn';
    return '<span class="tag ' + cls + '">' + esc(r.status) + '</span>';
  }

  function renderCountTrio(data) {
    var c = data.counts;
    return '<div class="count-trio">' +
      '<div class="count-box c-found"><div class="count-num">' + c.found +
        '</div><div class="count-label">' + esc(C.COUNT_LABELS.found) + '</div></div>' +
      '<div class="count-box c-enriched"><div class="count-num">' + c.enriched +
        '</div><div class="count-label">' + esc(C.COUNT_LABELS.enriched) + '</div></div>' +
      '<div class="count-box c-connection"><div class="count-num">' + c.connection +
        '</div><div class="count-label">' + esc(C.COUNT_LABELS.connection) + '</div></div>' +
      '</div>';
  }

  function renderPagination(pg) {
    var h = '<div class="pagination"><span>共 ' + pg.total + ' 条 · 第 ' + pg.page +
      ' / ' + pg.totalPages + ' 页</span><div class="page-btns">';
    h += '<button class="page-btn" type="button" data-act="page" data-page="' + (pg.page - 1) + '"' +
      (pg.page <= 1 ? ' disabled' : '') + '>‹</button>';
    for (var i = 1; i <= pg.totalPages; i++) {
      h += '<button class="page-btn' + (i === pg.page ? ' active' : '') +
        '" type="button" data-act="page" data-page="' + i + '">' + i + '</button>';
    }
    h += '<button class="page-btn" type="button" data-act="page" data-page="' + (pg.page + 1) + '"' +
      (pg.page >= pg.totalPages ? ' disabled' : '') + '>›</button></div></div>';
    return h;
  }

  function renderResultTable(data) {
    var scoped = C.filterBySource(data.rows, state.sourceFilter);
    var pg = C.paginate(scoped, state.page, state.pageSize);
    var h = '<div class="result-tools">' +
      '<select class="select topbar-select" data-field="source-filter" aria-label="按来源筛选">' +
        '<option value="all"' + (state.sourceFilter === 'all' ? ' selected' : '') + '>全部来源</option>' +
        D.sources.map(function (s) {
          return '<option value="' + esc(s.id) + '"' +
            (state.sourceFilter === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>';
        }).join('') + '</select>' +
      '<span class="spacer"></span>' +
      '<button class="btn btn-sm" type="button" data-act="export">' +
        icon('download', 'ic-sm') + '导出 CSV</button>' +
      '<button class="btn btn-sm" type="button" data-act="retry">' +
        icon('retry', 'ic-sm') + '重试</button></div>';
    h += renderCountTrio(data);
    // X2-数据源故障: 健康来源结果仍出，故障来源单独提示
    if (data.sourcesDown.length) {
      h += '<div class="fail-note">' + icon('alert', 'ic-sm') + ' 以下来源暂未返回：' +
        esc(data.sourcesDown.map(function (s) { return s.name; }).join('、')) +
        '；其余健康来源的结果已正常展示。</div>';
    }
    if (!pg.rows.length) {
      return h + '<div class="empty-mini">当前来源筛选下没有结果行。可切换来源，或使用上方状态卡的出口继续。</div>';
    }
    h += '<div class="table-scroll"><table class="grid"><thead><tr>' +
      '<th>标识</th><th>来源</th><th>状态</th><th>置信度</th><th>操作</th>' +
      '</tr></thead><tbody>';
    pg.rows.forEach(function (r) {
      h += '<tr><td class="cell-id">' + esc(r.identifier) + '</td>' +
        '<td>' + esc(r.sourceName) + '</td>' +
        '<td>' + categoryTag(r) + '</td>' +
        '<td class="cell-conf">' + r.confidence + '%</td>' +
        '<td><div class="row-acts">' +
          '<button class="btn btn-sm btn-icon" type="button" data-act="bookmark" data-identifier="' +
            esc(r.identifier) + '" data-source="' + esc(r.sourceName) + '" title="加入书签">' +
            icon('bookmark', 'ic-sm') + '</button>' +
          '<button class="btn btn-sm btn-icon" type="button" data-act="requery" data-identifier="' +
            esc(r.identifier) + '" title="以该线索发起新查询">' + icon('search', 'ic-sm') + '</button>' +
        '</div></td></tr>';
    });
    return h + '</tbody></table></div>' + renderPagination(pg);
  }

  // X2 全状态: 状态卡（每个状态有明确文案与出口）+ 结果表
  function renderResult() {
    var data = ensureResultData();
    var meta = C.PHASES[state.result.phase] || C.PHASES.idle;
    var h = '<section class="panel"><div class="panel-head"><h2 class="h3">⑤ 检索结果</h2>' +
      '<span class="pill">' + esc(meta.badge) + '</span></div>' + renderStateCard(state.result);
    if (state.result.phase === 'export-success' && state.result.meta.exportCount !== undefined) {
      h += '<div class="panel-body" style="padding-top:0"><div class="hint-box">' +
        icon('check', 'ic-sm') + ' 本次导出 ' + state.result.meta.exportCount +
        ' 条记录；文件内容为合成占位数据。</div></div>';
    }
    if (data) {
      h += '<div class="panel-body" style="border-top:1px solid var(--slate-200)">' +
        renderResultTable(data) + '</div>';
    }
    return h + '</section>';
  }

  // ---------------------------------------------------------------------------
  // 额度页（X2-额度不足 / X2-充值 / X2-交易记录）
  // ---------------------------------------------------------------------------
  function renderCreditsView() {
    var presets = D.credits.topupPresets.map(function (a) {
      return '<button class="preset-btn' + (state.topupAmount === a ? ' active' : '') +
        '" type="button" data-act="preset" data-amount="' + a + '">' + a + ' 点</button>';
    }).join('');
    var plans = D.credits.plans.map(function (p) {
      return '<button type="button" data-act="topup-plan" data-plan="' + esc(p.id) + '"' +
        (state.topupPlan === p.id ? ' class="active"' : '') + '>' + esc(p.label) + '</button>';
    }).join('');
    var tx = state.transactions.map(function (t) {
      var amt = (t.amount >= 0 ? '+' : '') + t.amount + ' ' + esc(D.credits.unit);
      return '<tr><td class="nowrap">' + esc(t.time) + '</td><td>' + esc(t.initiator) + '</td>' +
        '<td><span class="tag ' + (t.type === '充值' ? 'tag-ok' : 'tag-warn') + '">' +
          esc(t.type) + '</span></td>' +
        '<td class="cell-conf">' + esc(amt) + '</td><td>' + esc(t.description) + '</td></tr>';
    }).join('');

    return '<div class="h1" style="margin-bottom:4px">额度与记录</div>' +
      '<p class="tiny" style="margin:0 0 14px">每次检索按成本行扣减额度；以下为演示账本，' +
      '单位为自造「点」，不含任何真实金额或支付。</p>' +
      '<div class="page-grid two">' +
        '<div class="panel"><div class="panel-head"><h2 class="h2">当前额度与补充</h2></div>' +
          '<div class="panel-body">' +
            '<div class="balance-big">' + state.credits + ' <span style="font-size:14px">' +
              esc(D.credits.unit) + '</span></div>' +
            '<div class="tiny">顶栏额度指示与此处同步</div><div class="divider"></div>' +
            '<div class="field-label" style="margin-bottom:7px">预设额度包</div>' +
            '<div class="preset-grid">' + presets + '</div>' +
            '<label class="field" style="margin-top:14px"><span class="field-label">自定义数量（滑块）</span>' +
              '<input class="range" type="range" min="' + D.credits.slider.min +
              '" max="' + D.credits.slider.max + '" step="' + D.credits.slider.step +
              '" value="' + state.topupAmount + '" data-field="topup-range"></label>' +
            '<div class="tiny">当前选择：<span class="strong" data-role="topup-value">' +
              state.topupAmount + ' 点</span></div>' +
            '<div class="field-label" style="margin:14px 0 7px">补充方式</div>' +
            '<div class="seg" role="group" aria-label="补充方式">' + plans + '</div>' +
            '<button class="btn btn-primary btn-block" type="button" data-act="topup-confirm" ' +
              'style="margin-top:14px">确认补充 ' + state.topupAmount + ' 点</button>' +
            '<div class="hint-box" style="margin-top:10px">演示环境不产生真实支付，' +
              '仅更新本地余额并写入一条交易记录。</div>' +
          '</div></div>' +
        '<div class="panel"><div class="panel-head"><h2 class="h2">交易记录</h2>' +
          '<span class="pill">' + state.transactions.length + ' 条</span></div>' +
          '<div class="panel-body"><div class="table-scroll"><table class="grid">' +
            '<thead><tr><th>时间</th><th>发起人</th><th>类型</th><th>金额</th><th>说明</th></tr></thead>' +
            '<tbody>' + tx + '</tbody></table></div>' +
            '<div class="hint-box" style="margin-top:10px">字段与 X2 记录的账本结构一致：' +
              '时间 / 发起人 / 类型 / 金额 / 说明；说明中标注模块与来源（均为自造名）。</div>' +
          '</div></div>' +
      '</div>';
  }

  // ---------------------------------------------------------------------------
  // 留存页（X1-Cases / 书签 / 模式对历史的影响）
  // ---------------------------------------------------------------------------
  function renderCasesView() {
    var cases = D.cases.map(function (cs) {
      var active = cs.id === state.caseId;
      return '<button class="case-item' + (active ? ' active' : '') + '" type="button" ' +
        'data-act="case-pick" data-case-id="' + esc(cs.id) + '">' +
        '<span class="case-dot" style="background:' + esc(cs.color) + '"></span>' +
        '<span style="flex:1">' + esc(cs.name) + '</span>' +
        (active ? '<span class="pill pill-indigo">当前</span>' : '') + '</button>';
    }).join('');
    var bm = state.bookmarks.length
      ? '<div class="table-scroll"><table class="grid"><thead><tr>' +
        '<th>标识</th><th>来源</th><th>保存时间</th><th>操作</th></tr></thead><tbody>' +
        state.bookmarks.map(function (b) {
          return '<tr><td class="cell-id">' + esc(b.identifier) + '</td><td>' +
            esc(b.sourceName) + '</td><td class="nowrap">' + esc(b.savedAt) + '</td>' +
            '<td><button class="btn btn-sm" type="button" data-act="bookmark-remove" data-id="' +
            esc(b.id) + '">移除</button></td></tr>';
        }).join('') + '</tbody></table></div>'
      : '<div class="empty-mini">还没有书签。可在结果表中点书签图标保存线索。</div>';
    var hist = state.history.length
      ? '<div class="table-scroll"><table class="grid"><thead><tr>' +
        '<th>时间</th><th>类型</th><th>模块</th><th>查询</th><th>条数</th><th>成本</th>' +
        '</tr></thead><tbody>' +
        state.history.slice().reverse().map(function (e) {
          return '<tr><td class="nowrap">' + esc(e.at) + '</td><td>' + esc(e.typeLabel) + '</td>' +
            '<td>' + esc(e.moduleName) + '</td><td class="cell-id">' + esc(e.query) + '</td>' +
            '<td>' + e.batchCount + '</td><td class="cell-conf">' + e.cost + ' 点</td></tr>';
        }).join('') + '</tbody></table></div>'
      : '<div class="empty-mini">暂无历史。执行一次保留模式的查询后会写入这里。</div>';

    return '<div class="h1" style="margin-bottom:4px">留存与书签</div>' +
      '<p class="tiny" style="margin:0 0 14px">保留模式把查询写入所选 Case 的历史；' +
      '隐私模式不写入任何历史，因此不会出现在下方表格中。</p>' +
      '<div class="page-grid two">' +
        '<div class="panel"><div class="panel-head"><h2 class="h2">留存 Case</h2></div>' +
          '<div class="panel-body"><div class="case-list">' + cases + '</div>' +
            '<div class="hint-box" style="margin-top:12px">当前模式：' +
              esc(C.MODES[state.mode].label) + ' —— ' + esc(C.MODES[state.mode].hint) +
              '。可在顶栏或工作台查询区切换。</div></div></div>' +
        '<div style="display:grid;gap:14px">' +
          '<div class="panel"><div class="panel-head"><h2 class="h2">书签</h2>' +
            '<span class="pill">' + state.bookmarks.length + ' 条</span></div>' +
            '<div class="panel-body">' + bm + '</div></div>' +
          '<div class="panel"><div class="panel-head"><h2 class="h2">搜索历史</h2>' +
            '<span class="pill">' + state.history.length + ' 条</span></div>' +
            '<div class="panel-body">' + hist +
              (state.history.length
                ? '<div style="margin-top:10px"><button class="btn btn-sm" type="button" ' +
                  'data-act="history-clear">清空历史（仅本地演示）</button></div>'
                : '') + '</div></div>' +
        '</div>' +
      '</div>';
  }

  // CSV 下载（浏览器 API；file:// 下用 Blob + createObjectURL，未验证项见 docs/01-blueprint.md §2）
  function downloadCSV(text) {
    try {
      var blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'guanlan-results.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return true;
    } catch (e) { return false; }
  }

  // S3 动作（覆盖 S2 的 retry，补齐全部状态出口 / 结果表操作 / 充值 / 留存）
  var S3_ACTIONS = {
    'retry': function () {
      // X2-③: 重试 —— 回到加载中再落地成功结果（演练态不依赖输入，不重复扣费）
      state.scenario = 'success';
      state.resultData = null;
      state.page = 1;
      state.result = C.reduceResult(state.result, { type: 'FORCE', payload: { phase: 'loading' } });
      render();
      if (state.runTimer) { clearTimeout(state.runTimer); }
      state.runTimer = setTimeout(function () {
        state.runTimer = null;
        state.result = C.reduceResult(state.result, {
          type: 'RESOLVE', payload: { outcome: 'success' }
        });
        render();
      }, 700);
    },
    'export': function () {
      var data = ensureResultData();
      var rows = data ? C.filterBySource(data.rows, state.sourceFilter) : [];
      var ok = downloadCSV(C.toCSV(rows));
      state.result = C.reduceResult(state.result, {
        type: 'FORCE', payload: { phase: 'export-success', meta: { exportCount: rows.length } }
      });
      state.scenario = 'export-success';
      render();
      showToast(ok ? ('已导出 ' + rows.length + ' 条记录（CSV）')
        : ('已生成 ' + rows.length + ' 条 CSV 内容'), true);
    },
    'page': function (node) { state.page = Number(node.getAttribute('data-page')); render(); },
    'bookmark': function (node) {
      var id = node.getAttribute('data-identifier'), src = node.getAttribute('data-source');
      var dup = state.bookmarks.some(function (b) {
        return b.identifier === id && b.sourceName === src;
      });
      if (dup) { showToast('该线索已在书签中'); return; }
      state.bookmarks = [{
        id: 'bm-' + Date.now(), identifier: id, sourceName: src, savedAt: nowStr()
      }].concat(state.bookmarks);
      render();
      showToast('已加入书签，可在「留存与书签」页查看', true);
    },
    'bookmark-remove': function (node) {
      var id = node.getAttribute('data-id');
      state.bookmarks = state.bookmarks.filter(function (b) { return b.id !== id; });
      render();
    },
    'history-clear': function () { state.history = []; render(); showToast('已清空本地演示历史'); },
    'requery': function (node) {
      // X1-结果行: 以该线索发起新查询（跳回工作台并预填）
      state.query = node.getAttribute('data-identifier') || '';
      state.batchOn = false; state.batch = [''];
      state.result = C.initialResult(); state.resultData = null;
      state.scenario = 'success'; state.page = 1; state.sourceFilter = 'all';
      state.route = 'search';
      location.hash = '#/search';
      render();
      showToast('已把线索预填到查询框，可调整条件后重新查询');
    },
    'topup': function () {
      state.route = 'credits';
      location.hash = '#/credits';
      render();
      showToast('请在充值面板补充额度后返回工作台重试');
    },
    'widen-sources': function () {
      // X2-零结果 ③: 扩大来源（推荐）
      var multi = D.modulesByType(state.activeTypeId).filter(function (m) {
        return m.cost.kind === 'dynamic';
      })[0];
      if (multi) { state.activeModuleId = multi.id; }
      state.selectedSourceIds = D.sources.filter(function (s) { return s.healthy; })
        .map(function (s) { return s.id; });
      state.tableSourceIds = state.selectedSourceIds.slice();
      state.result = C.initialResult(); state.resultData = null;
      render();
      showToast('已扩大到全部健康来源（推荐处置），请重新查询');
    },
    'recheck-input': function () {
      // X2-零结果 ①: 复核输入
      state.result = C.initialResult(); state.resultData = null;
      state.route = 'search';
      render();
      var el = document.querySelector('[data-field="query"]');
      if (el) { el.focus(); }
      showToast('请复核输入：去除多余空格、勿粘贴完整网址、确认字段与模块匹配');
    },
    'switch-type': function () {
      // X2-零结果 ②: 换一个搜索类型
      var idx = 0;
      D.searchTypes.forEach(function (t, i) { if (t.id === state.activeTypeId) { idx = i; } });
      var next = D.searchTypes[(idx + 1) % D.searchTypes.length];
      state.activeTypeId = next.id;
      state.activeModuleId = D.modulesByType(next.id)[0].id;
      state.query = ''; state.result = C.initialResult(); state.resultData = null;
      render();
      showToast('已切换到「' + next.label + '」，请重新输入查询');
    },
    'disable-down': function () {
      // X2-数据源故障 ③: 关闭故障来源并重算成本
      var bad = D.sources.filter(function (s) { return !s.healthy; })
        .map(function (s) { return s.id; });
      state.selectedSourceIds = state.selectedSourceIds.filter(function (id) {
        return bad.indexOf(id) < 0;
      });
      state.tableSourceIds = D.sources.filter(function (s) { return s.healthy; })
        .map(function (s) { return s.id; });
      state.resultData = null;
      state.result = C.reduceResult(state.result, {
        type: 'FORCE', payload: { phase: 'success' }
      });
      state.scenario = 'success';
      render();
      showToast('已关闭故障来源，成本已重算', true);
    },
    'use-healthy': function () {
      state.selectedSourceIds = D.sources.filter(function (s) { return s.healthy; })
        .map(function (s) { return s.id; });
      state.tableSourceIds = state.selectedSourceIds.slice();
      state.resultData = null;
      state.result = C.reduceResult(state.result, {
        type: 'FORCE', payload: { phase: 'success' }
      });
      state.scenario = 'success';
      render();
      showToast('已切换到健康来源，结果已恢复', true);
    },
    'narrow': function () {
      // X2-卡住/超时: 缩小扫描范围
      state.filters.limit = '前 100 项';
      state.result = C.initialResult(); state.resultData = null;
      render();
      showToast('已把限制条数收窄为「前 100 项」，可重新查询');
    },
    'case-pick': function (node) {
      state.caseId = node.getAttribute('data-case-id');
      render();
      showToast('已切换当前 Case：' + caseById(state.caseId).name, true);
    },
    'preset': function (node) {
      state.topupAmount = Number(node.getAttribute('data-amount'));
      render();
    },
    'topup-plan': function (node) {
      state.topupPlan = node.getAttribute('data-plan');
      render();
    },
    'topup-confirm': function () {
      var r = C.topUpCredits(state.credits, state.topupAmount);
      var plan = D.credits.plans.filter(function (p) { return p.id === state.topupPlan; })[0];
      state.credits = r.balance;
      state.transactions = [
        C.makeTopupRecord(r.amount, plan ? plan.label : '单次充值', nowStr())
      ].concat(state.transactions);
      render();
      showToast('已补充 ' + r.amount + ' 点额度（演示，无真实支付）', true);
    }
  };

  var S3_FIELDS = {
    // X2: 状态演练一键切到指定 phase（?state= 与下拉共用）
    'demo-state': function (el) {
      var v = el.value;
      state.scenario = v;
      state.resultData = null;
      state.page = 1;
      state.sourceFilter = 'all';
      var meta = v === 'invalid' ? {
        reasons: [
          '示例：输入为空或仅含空白字符',
          '示例：含首尾空格、超长内容或粘贴了完整网址',
          '示例：含引号 / 尖括号 / 换行等特殊字符，或格式与所选类型不匹配'
        ]
      } : (v === 'credits' ? { cost: state.lastCost + 1, balance: state.credits } : {});
      state.result = C.reduceResult(state.result, {
        type: 'FORCE', payload: { phase: v, meta: meta }
      });
      render();
    },
    'source-filter': function (el) {
      state.sourceFilter = el.value;
      state.page = 1;
      render();
    },
    'topup-range': function (el) {
      // 就地更新，不整体重渲染，避免打断滑块拖动
      state.topupAmount = Number(el.value);
      var lab = document.querySelector('[data-role="topup-value"]');
      if (lab) { lab.textContent = state.topupAmount + ' 点'; }
      var btn = document.querySelector('[data-act="topup-confirm"]');
      if (btn) { btn.textContent = '确认补充 ' + state.topupAmount + ' 点'; }
      D.credits.topupPresets.forEach(function (a) {
        var b = document.querySelector('[data-act="preset"][data-amount="' + a + '"]');
        if (b) { b.classList.toggle('active', a === state.topupAmount); }
      });
    }
  };
  /* ==== SLICE3:END ==== */

  // ---------------------------------------------------------------------------
  // 主渲染
  // ---------------------------------------------------------------------------
  function render() {
    if (!state.signedIn || state.route === 'signin') {
      app.innerHTML = renderSignin();
      return;
    }
    var body = state.route === 'credits' ? renderCreditsView()
      : state.route === 'cases' ? renderCasesView()
      : renderSearchView();
    app.innerHTML = '' +
      '<div class="shell">' +
        renderTopbar() +
        renderSubnav() +
        (state.route === 'search' ? renderDemoBar() : '') +
        '<main class="view' + (state.route === 'search' ? '' : ' view-narrow') + '">' + body + '</main>' +
        renderFooter() +
      '</div>' +
      renderSourceModal() +
      (state.toast ? '<div class="toast' + (state.toastOk ? ' ok' : '') + '">' +
        icon(state.toastOk ? 'check' : 'info', 'ic-sm') + esc(state.toast) + '</div>' : '');
  }

  // ---------------------------------------------------------------------------
  // 动作表（S1 基础；S2/S3 通过 Object.assign 追加/覆盖）
  // ---------------------------------------------------------------------------
  var actions = {
    'signin-submit': function () {
      var email = String(state.signinEmail || '').replace(/^\s+|\s+$/g, '');
      var pwd = String(state.signinPassword || '');
      if (!email) { state.signinError = '请填写邮箱。'; render(); return; }
      if (email.indexOf('@') < 0) { state.signinError = '邮箱格式不正确，请包含 @。'; render(); return; }
      if (pwd.length < 6) { state.signinError = '密码至少需要 6 位。'; render(); return; }
      state.signinError = '';
      state.signedIn = true;
      state.route = 'search';
      location.hash = '#/search';
      render();
    },
    'email-link': function () {
      showToast('演示环境不会真的发送邮件，请使用邮箱 + 密码进入。');
    },
    'oauth': function (node) {
      showToast('「' + (node.getAttribute('data-provider') || '第三方') + '」为演示占位入口，请使用邮箱登录。');
    },
    'register': function () { showToast('演示环境不提供注册流程，可用任意邮箱直接进入。'); },
    'forgot': function () { showToast('演示环境不提供密码找回，可用任意 6 位以上密码进入。'); },
    // X2: Status pill —— 查看来源健康度
    'status': function () {
      var bad = D.status.sources.filter(function (s) { return !s.healthy; });
      showToast(bad.length ? ('异常来源：' + bad.map(function (s) { return s.name; }).join('、') + '（其余来源正常）') : '全部来源正常', false);
    },
    // X1-Cases/模式：模式切换（隐私模式不写历史，见 S3 的 applyMode）
    'mode': function (node) {
      state.mode = node.getAttribute('data-mode') === 'private' ? 'private' : 'keep';
      render();
      showToast(state.mode === 'keep' ? '已切换保留模式：查询会写入 Case 历史' : '已切换隐私模式：查询不写入任何历史');
    },
    'menu': function () { state.menuOpen = !state.menuOpen; render(); },
    'menu-session': function () {
      state.menuOpen = false;
      state.result = C.reduceResult(state.result, { type: 'SESSION_EXPIRED' });
      render();
      showToast('已触发会话失效状态（可用状态面板的「返回登录」出口复现）');
    },
    'menu-signout': function () {
      state.menuOpen = false;
      state.signedIn = false;
      state.route = 'signin';
      location.hash = '#/signin';
      render();
    },
    // 状态面板通用出口（focus-query / retry / edit 的完整行为由 S2、S3 注册覆盖）
    'signin': function () {
      state.signedIn = false; state.route = 'signin';
      state.result = C.initialResult();
      location.hash = '#/signin';
      render();
    },
    'demo-reset': function () {
      state.scenario = 'success';
      state.result = C.initialResult();
      state.resultData = null;
      render();
    }
  };
  Object.assign(actions, S2_ACTIONS);      // 切片 2 动作（X1 五步 / 成本 / 批量 / 过滤器）
  Object.assign(actions, S3_ACTIONS);      // 切片 3 动作（X2 全状态出口 / 结果表 / 额度 / 留存）

  // ---------------------------------------------------------------------------
  // 字段处理表（input / change 事件；S2/S3 追加）
  // ---------------------------------------------------------------------------
  var fieldHandlers = {
    'signin-email': function (el) { state.signinEmail = el.value; },
    'signin-password': function (el) { state.signinPassword = el.value; },
    'keep-signed': function (el) { state.keepSigned = !!el.checked; },
    'demo-state': function (el) {
      var v = el.value;
      state.scenario = v;
      // X2: 状态演练一键切到指定 phase（FORCE 迁移，任何状态可达）
      state.result = C.reduceResult(state.result, { type: 'FORCE', payload: { phase: v } });
      state.resultData = null;
      render();
    }
  };
  Object.assign(fieldHandlers, S2_FIELDS); // 切片 2 字段（查询 / 批量 / 模式 / 来源 / 过滤）
  Object.assign(fieldHandlers, S3_FIELDS); // 切片 3 字段（状态演练 / 来源筛选 / 充值滑块）

  function dispatchField(e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-field]') : null;
    if (!el) { return; }
    var f = el.getAttribute('data-field');
    var h = fieldHandlers[f];
    if (h) { h(el, e); }
  }
  function onClick(e) {
    var node = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
    if (!node) {
      if (state.menuOpen) { state.menuOpen = false; render(); }
      return;
    }
    var act = node.getAttribute('data-act');
    if (act === 'signin-form') { e.preventDefault(); return; }
    var fn = actions[act];
    if (fn) {
      if (node.tagName === 'BUTTON') { e.preventDefault(); }
      fn(node, e);
    }
  }
  function onInput(e) {
    if (e.target && (e.target.tagName === 'SELECT' || e.target.type === 'checkbox')) { return; }
    dispatchField(e);
  }
  function onChange(e) { dispatchField(e); }

  function onHashChange() {
    var r = routeFromHash();
    if (!r) { return; }
    if (!state.signedIn && r !== 'signin') {
      location.hash = '#/signin';
      state.route = 'signin';
      render();
      return;
    }
    state.route = r;
    state.menuOpen = false;
    render();
  }

  // ---------------------------------------------------------------------------
  // 启动：解析 ?state= 参数（验证脚手架），初始化路由
  // ---------------------------------------------------------------------------
  function boot() {
    var qs = new URLSearchParams(location.search || '');
    var st = qs.get('state');
    var hashRoute = routeFromHash();

    if (st && C.PHASES[st]) {
      // 带状态参数打开时自动进入演示会话，便于独立验证员一键复现（纯前端开关）
      state.signedIn = true;
      state.forceState = st;
      state.scenario = st;
      state.route = (hashRoute && hashRoute !== 'signin') ? hashRoute : 'search';
      state.result = C.reduceResult(state.result, { type: 'FORCE', payload: { phase: st } });
    } else {
      state.route = hashRoute || 'signin';
      state.signedIn = state.route !== 'signin' ? false : false;
      if (state.route !== 'signin') {
        state.signedIn = false;
      }
    }

    app.addEventListener('click', onClick);
    app.addEventListener('input', onInput);
    app.addEventListener('change', onChange);
    window.addEventListener('hashchange', onHashChange);
    render();
  }

  boot();
})();
