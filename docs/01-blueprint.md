# 阶段 2 · 实现蓝图（G2）

> 编制：程一码（replica-engineer） · 2026-11-06 21:0x GMT+8（21:5x 补并证据包）
> 依据：`docs/00-G0-scope.md`（G0 定界/验收/假设）、`recon/team-lead-crosscheck.md`（证据 X1 / X2 / X3）、`recon/github-crosscheck.md`（证据 G1–G4）、`recon/evidence-pack.md`（证据包 E/F/D/H/P 系列）。
> **证据包已合并**：初稿成文时 `recon/evidence-pack.md` 尚未落盘，按「不等待」原则先基于 X1/X2/X3 编制；证据包于 21:16 落盘后已按 §9「证据包合并补记」逐条对照补并（新增 F-01~F-18 状态、E.1~E.4 结果字段、D.1/D.2 输入项、G-01~G-09 技术特征、H-1~H-13 未知项），**结论未改变实现范围**，仅强化可追溯性与 H-13 范围级风险说明。蓝图内所有关于目标页结构的表述均为「基于公开文档的推断」，非一手观测。
>
> **合规总纲**：复刻对象仅为**外部可观察行为**（流程、状态、字段语义、交互反馈），不复制源码/构建产物/受版权保护素材；品牌、命名、文案、配色、图标、数据全部自有且合成；不含任何真实个人信息；不接原站后端、不调用其接口、不模拟其鉴权、不绕过任何访问限制；演示会话为纯前端本地开关。

---

## 1. 任务定界

- **复刻目标**：以「工具型检索工作台」为形态，复刻 X1 描述的五步查询流程、X2 描述的全部交互状态、X3 描述的登录入口可见结构；产出可本地运行、功能对齐、品牌与数据完全自有的静态网站。
- **授权依据**：G0 用户显式授权（仅公开可见行为 + 占位复刻），无登录/绕过要求；目标页本体不可直接观察，采用「公开文档驱动的行为复刻 + 全量占位数据」路线（crosscheck 结论 3）。
- **验收标准**（承 G0 §验收标准，落成可测点）：
  1. 每条事实级结论可指向 X1/X2/X3 编号或「推断」；
  2. 覆盖核心页面（登录/工作台/额度/留存）与全部交互状态，每状态有可复现触发路径；
  3. 无网络、无后端、无构建、`file://` 双击可运行；关键路径有自动化自测输出；
  4. 站内不含原站品牌、受保护内容、真实个人信息或私有数据；
  5. 独立验证员可逐项复现状态，出具分级差异报告。
- **明确不做**：真实 OSINT 检索、任何外部请求（含 CDN / 字体 / 图标库 / fetch 外部资源）、真实鉴权与会话、原站价格与额度金额、原站 18 类型名/模块名/第三方数据源名/Logo/配色/截图/字体、任何受版权保护文案的逐字翻译。

### 站内禁止清单（实现期逐条 grep 自检）

`UserSearch`、`usersearch.ai/.com/.org`、`S.A.R.G.E.`、`SargeBot`、原站 18 个搜索类型英文名、原站模块名（OneScan / Username Search 3000+ 等）、第三方数据源名（PIPL / EPIEOS / HaveIBeenPwned / HudsonRock / IntelX / Gravatar / Alexa 等）、原站价格与 Credits 金额、原站 Logo、coral-orange 配色、原站图标/截图/字体文件、原站英文文案逐字翻译。
替代：品牌「**观澜**」（代号 `Guanlan`）、自造类型/模块/数据源名、靛蓝+石板灰配色、全原创中文文案、内联 SVG 图标、`.invalid` 保留域与 `demo.*` 合成标识符。

---

## 2. 技术栈

- **选定**：原生 HTML + CSS + JavaScript（ES5 兼容语法为主），**传统 `<script src>` 标签 + UMD 风格全局导出**，零第三方依赖、零构建、零打包、零外部资源。
- **理由**：
  - `file://` 双击直接打开：ES module 的 `import` 在 `file://` 下受 CORS 限制会失败；传统 script 标签不受此限 → 满足「双击可运行」硬约束。
  - 能被 Node 自测脚本导入：`core.js` / `data.js` 采用 UMD —— 检测 `module.exports` 时导出给 Node（`createRequire` 或 `require`），否则挂到 `globalThis.ReplicaCore` / `globalThis.ReplicaData` 供浏览器 `<script>` 使用。一份源码，双端可用，零构建。
  - 纯静态、不 fetch：所有数据来自 `data.js` 内合成常量；无网络请求 → 满足「无网络可运行」「不调用原站接口」。
  - hash 路由（`#/signin`、`#/search`、`#/credits`、`#/cases`）：无需服务端 rewrite，`file://` 可用。
- **关键结构**：
  - `site/data.js` — 纯静态占位数据（UMD 导出 `ReplicaData`），**不含逻辑**。
  - `site/core.js` — 纯逻辑（UMD 导出 `ReplicaCore`），**不依赖 data.js、不碰 DOM**，全部为确定性纯函数，便于 Node 断言。
  - `site/app.js` — DOM 渲染 / 事件 / 路由 / 状态编排，读取上面两个全局。
  - `site/styles.css` — 浅色主题、靛蓝/石板灰、响应式。
  - `site/index.html` — 单页容器 + 顺序 `<script>` 引入（data → core → app）。
  - `site/tests/selftest.mjs` — Node 内置断言（`node:assert/strict`）+ `node:module` 的 `createRequire` 导入 core/data + `node:http` 起静态服务验证 200。
- **备选与不选理由**：
  - ES module + Vite/打包器：构建产物、`file://` 需 http server、违背零构建 → 不选。
  - React/Vue（CDN 版）：引入外部 CDN（离线不可用 + 外部资源）→ 不选。
  - localStorage 持久化会话：非必需且 `file://` 各浏览器策略不一 → 采用内存态演示会话，刷新即复位，行为更可控。
- **未验证项（标注「未验证」）**：
  - 各目标浏览器对 `file://` 下 hash 路由 + `URLSearchParams(location.search)` 的一致性 —— 主流 Chromium/Edge 预期可用，未在本次环境逐一实测；验证方式：本机 Edge 打开 `site/index.html?state=loading#/search` 观察。
  - `Blob` + `URL.createObjectURL` 触发 CSV 下载在 `file://` 下的行为 —— 预期可用，未实测；验证方式同上，点击导出观察下载。
  - 以上均不影响 Node 侧纯逻辑自测（不依赖浏览器）。

---

## 3. 组件树映射（逐行对应证据编号）

> 「推断」= 无一手证据，依 X1/X2/X3 语义或工具型界面常识补齐，仅对齐行为语义不照抄任何名称/文案。

| # | 证据编号 | 参考/证据里的这一块 | 我方模块 / 组件 | 职责 | 数据来源 |
|---|---|---|---|---|---|
| M1 | X3 / F1 | 登录页可见结构：邮箱、密码、记住登录、登录按钮、`或` 分隔、邮件登录链接、第三方登录按钮、注册与忘记密码链接 | `SignInView`（`signinForm` / `keepSigned` / `emailLinkBtn` / `oauthBtn` / `registerLink` / `forgotLink`） | 可见结构与 X3 对齐；纯前端演示登录 | `ReplicaData.brand` |
| M2 | F1（登录墙） | 未登录不可见工作台 | `AuthGuard` | 本地内存演示会话开关（非真实鉴权）；含会话失效跳回登录 | 内存态 |
| M3 | X1-步骤1 / X1-18类 | 选搜索类型（18 类） | `TypeNav`（18 类，≥8 类可交互） | 左侧导航；切换联动模块列表 | `ReplicaData.searchTypes` |
| M4 | X1-步骤2 | 选 Module，决定 input / 数据源 / 成本 | `ModuleList` + `ModuleCard` | 每卡：名称、说明、成本类型标签（免费/固定/浮动）、成本、推荐标记、选中高亮 | `ReplicaData.modules` |
| M5 | X1-步骤3 / X1-步骤3(多源并查) / X2-④ | 齿轮 → 「选择数据源 / 过滤器」窗口；多来源合并；默认 `Limit/Search type/Country`；`Reset`/`Apply Filters` | `SourceFilterModal` | 多选数据源（浮动成本=所选来源之和，实时更新）、扫描范围/类型/地区过滤、`重置`/`应用筛选`、总成本显示 | `ReplicaData.sources` + `core.computeCost` |
| M6 | X1-步骤4 / X2-② | 输入查询、`Cost per search` 行、`Search Now` 主按钮 | `QueryComposer` | 按类型切占位符/校验规则、单次成本行、立即查询 | `core.validateQuery` / `core.computeCost` |
| M7 | X1-Bulk / X2-FAQ | 批量开关，最多 5 条，成本累加 | `BatchController` | 1–5 条输入、第 6 条禁止 + 明确提示、成本按条数累加 | `core.addBatchItem` / `MAX_BATCH` |
| M8 | X1-Cases/模式 / X2-交易 | 保留模式写历史 / 隐私模式不写；Case 选择；书签 | `ModeSwitch` / `CasePicker` / `CasesView` | 模式切换、Case 选择、历史与书签 | `core.applyMode` |
| M9 | X1-步骤5 / X1-结果字段 / G1–G3 | 结果面板：来源归因、三计数（Found/Enriched/Connections）、置信信号、结果行 标识/来源/状态 | `ResultPanel` + `ResultTable` + `CountTrio` | 列头齐全（标识/来源/状态/置信度/操作）、三计数、状态实心标签、分页、按来源筛选、书签、导出 CSV、重试、失败数据源提示 | `core.buildResults` / `core.paginate` / `core.toCSV` |
| M10 | X1-结果行 | 以线索再发起查询 | 行操作「以此线索再查」 | 跳回工作台并预填 | app 编排 |
| M11 | X2-初始空态 | `No active search` | `idle` 态「尚未开始查询」 | 语义对齐、文案原创 | `core.PHASES` |
| M12 | X2-加载 | Search Results 面板未填充 | `loading` 态 | 骨架 + 进度 + 可取消 | `core.reduceResult` |
| M13 | X2-零结果 | Found=0 是结果不是错误；5 条处置路径 | `noresults` 态 | 明确「这是结果不是错误」+ 扩大来源/复核输入/换类型引导 | `core.PHASES` |
| M14 | X2-额度不足 | coral-orange 余额 pill + 顶栏镜像；不足则先充值 | `CreditPill`（改靛蓝/石板灰） + `credits` 态 | 余额 < 单次成本时阻止 + 充值入口 | `core.canAfford` |
| M15 | X2-充值 | 预设金额 / 自定义滑块 / 单次或周期 / 确认 | `CreditsView`（`TopupPanel`） | 充值面板 | `ReplicaData.credits` |
| M16 | X2-扣费 | `Transaction history`（Time/Initiated by/Type/Amount/Description，DEBIT） | `TransactionTable` | 交易记录表格（时间/发起人/类型/金额/说明） | `ReplicaData.transactions` + 运行时追加 |
| M17 | X2-Status pill / 数据源故障 | 状态 pill 标记 faulty；个别数据源不可用；健康来源结果仍出、故障来源单独提示 | `StatusPill` + `partial` / `source-down` 态 | 全状态标记 + 故障来源独立提示 | `ReplicaData.status` |
| M18 | X2-卡住/超时 | 缩小范围、重跑、查状态 | `timeout` 态 | 可重试 + 检查范围/状态建议 | `core.PHASES` |
| M19 | 推断 | 网络异常 | `network` 态 | 明确文案 + 重试出口 | `core.PHASES` |
| M20 | 推断 | 会话失效 / 无权限 | `AuthGuard` → `session-expired` | 跳回登录 | 内存态 |
| M21 | 推断（为验证便利自造） | 无对应（验证脚手架） | `StateDemo`（状态演练下拉） + `?state=` 解析 | 一键把结果面板切到指定状态，供独立验证员逐项复现 | `core.PHASES` |
| M22 | A1（`/m/` 暗示移动版） | 移动优先布局 | 全站 CSS | 移动端优先、桌面适配 | `styles.css` |
| M23 | G1–G4 | 站点级命中列表 + 来源 + 导出 | `ResultTable` / `toCSV` | 交互范式佐证（第三方公开清单，非目标页直接证据） | `core.buildResults` |

> 覆盖检查：X1（五步 + 18 类 + OneScan + Bulk + 结果字段 + Cases/模式/导出）→ M3–M10；X2（全状态 + 充值 + 交易 + Status + 故障）→ M11–M18；X3（登录可见结构）→ M1；F1 → M2；G1–G4 → M9/M23；A1 → M22。证据包第 2 节所有页面/模块待补并后再核一次。

---

## 4. 数据契约

> 本项目**无任何网络请求**（G0 硬边界）。因此「请求/响应」落为**纯函数契约 C1–C9** 与**内存态数据形状**；错误分支即 X2 各状态。所有输入输出均为确定性、可 Node 断言。

### 4.1 内存态数据形状（`ReplicaData`，合成占位，无真实个人信息）

```js
{
  brand:   { name:'观澜', product:'线索检索工作台', version:'演示版 1.0' },
  status:  { overall:'operational'|'degraded', sources:[{ id, name, healthy:boolean }] }, // 自造数据源名
  credits: { balance:Number, unit:'点', topupPresets:[Number], slider:{min,max,step}, plans:['single','cycle'] },
  cases:   [ { id, name, color } ],
  searchTypes: [ { id, label, icon, inputKind, placeholder, hint, moduleIds:[...] } ],   // 18 类，自造名
  modules: [ { id, typeId, name, desc, cost:{ kind:'free'|'fixed'|'dynamic', value, min, max },
               recommended:boolean, sourceIds:[...] } ],
  sources: [ { id, name, cost:Number, healthy:boolean, category } ],                    // 自造名，如 北向索引/灯塔名录/回声档案…
  resultSeeds: [ { identifier, sourceId, category:'found'|'enriched'|'connection',
                   status, confidence:Number, note } ],                                // demo.* 合成串
  transactions: [ { time, initiator, type:'扣减'|'充值', amount:Number, description } ],
  bookmarks: [ { id, identifier, sourceName, savedAt } ]
}
```

- 标识符示例（全部合成）：`demo.handle.01`、`demo.mail.03@north.invalid`、`demo.phone.07`、`demo.domain.02`、`img.demo.04`、`0xDEMO...04d2`。均使用 `.invalid` 保留域或明显占位串，不含真实个人信息。
- 成本：`free`=0；`fixed`=固定点数；`dynamic`=所选来源 `cost` 之和（X1：dynamic cost 为所选来源之和）。

### 4.2 纯函数契约（`ReplicaCore`）

| 契约 | 输入 | 输出 / 字段形状 | 错误分支 | 证据 |
|---|---|---|---|---|
| C1 `validateQuery(kind, raw)` | kind∈{handle,email,phone,ip,domain,image,wallet,text}, raw:string | `{ valid, code, message, normalized }` | 空输入 / 格式错 / 首尾空格 / 超长(>上限) / 含 URL(`http(s)://`,`www.`) / 特殊字符(`<>`、换行、控制字符) → `valid:false` + 中文 `message` | X1-步骤4 / X2-① / X2-校验失败 |
| C2 `computeCost(module, selectedSourceIds, sources, batchCount)` | module, 选中来源 id[], 来源表, 批量条数 | `{ perSearch, total, kind, label, breakdown:[{sourceId,cost}] }`；`total = perSearch × batchCount` | 浮动且未选来源 → perSearch=0 并标注；batchCount 越界 → 钳制到 `[1,5]` | X1-步骤3/4 / X1-步骤3(多源并查) / X1-Bulk |
| C3 `addBatchItem(items, value)` / `MAX_BATCH=5` | 当前条目[], 新值 | `{ ok, items, message }` | 第 6 条 → `ok:false` + 「最多 5 条」明确提示 | X1-Bulk / X2-FAQ |
| C4 `reduceResult(state, action)` | `state={phase,message,meta}`, `action={type,payload}` | 新 `state`（不可变） | 非法迁移 → 原样返回（可断言） | X2 全状态 |
| C5 `buildResults(opts)` | `{ seeds, sources, selectedSourceIds, scenario, batchCount }` | `{ rows, counts:{found,enriched,connection}, sourcesDown:[...], total }` | scenario='noresults' → rows=[]、counts 全 0；'partial'/'source-down' → 故障来源不出行、健康来源仍出行 | X1-结果字段 / X2-数据源故障 |
| C6 `filterBySource(rows, sourceId)` / `paginate(rows, page, size)` | 结果行 + 条件 | 过滤/分页后行 + 分页元信息 | 越界页 → 钳制 | X1-步骤5 / G1 |
| C7 `canAfford(balance, cost)` / `deductCredits(balance, cost)` | 余额, 成本 | bool / `{ ok, balance, message }` | `balance<cost` → `ok:false` + 「额度不足」+ 充值入口标记 | X2-额度不足 / X2-扣费 |
| C8 `toCSV(rows)` | 结果行[] | 字符串：首行表头 `标识,来源,状态,置信度,说明`，随后转义后的数据行 | 空数组 → 仅表头；字段含逗号/引号/换行 → 双引号包裹转义 | X1-导出 / G1 CSV |
| C9 `applyMode(mode, history, entry)` | mode∈{keep,private}, 历史[], 条目 | 新 history（不可变） | `private` → 原样返回不写入；`keep` → 追加 | X1-Cases/模式 |

### 4.3 状态演练契约（验证脚手架，`?state=` + 下拉，M21）

| `?state=` 值 | 结果面板 phase | 界面必备元素 | 可操作出口 |
|---|---|---|---|
| `success` | `success` | 结果表 + 三计数 + 列头 | 重试 / 导出 / 以此线索再查 |
| `loading` | `loading` | 骨架 + 进度 + 取消 | 取消 → idle |
| `noresults` | `noresults` | 「这是结果不是错误」+ 3 条引导 | 扩大来源 / 复核输入 / 换类型 |
| `credits` | `credits` | 余额不足文案 | 前往充值 / 返回 |
| `source-down` | `source-down` | 数据源整体故障文案 + 故障来源清单 | 切换到健康来源 / 重试 / 查看状态 |
| `partial` | `partial` | 健康来源结果仍出 + 故障来源单独提示 + 三计数 | 关闭故障来源 / 重试 |
| `timeout` | `timeout` | 超时文案 + 检查范围/状态建议 | 重试 / 缩小范围 / 返回 |
| `network` | `network` | 网络异常文案 | 重试 / 返回 |
| `invalid` | `invalid` | 校验失败文案（列出原因） | 修改输入 |
| `idle` | `idle` | 「尚未开始查询」 | 开始查询 |
| `bulk-limit` | `bulk-limit` | 批量上限文案 | 修改输入 |
| `session-expired` | `session-expired` | 会话失效文案 | 返回登录 |

- **本地处理 / 降级**：全部状态为内存态切换，无缓存、无重试网络调用；`重试`=重新进入 `loading` 并按当前 scenario 落地；`取消`=`idle`。

### 4.4 交互的输入输出与错误分支（页面级）

- 登录：输入 `email(非空) + password(≥6)` → `AuthGuard` 置会话 → 跳 `#/search`；否则 `#signinError` 显示中文校验提示（不真实提交）。
- 查询执行：`RUN` 前置链 = C1 校验 → C7 额度 → C2 成本 → `loading` → C5 组装 → 终态。`invalid`/`credits`/`bulk-limit` 为前置拦截，不进入 `loading`。
- 扣费：进入 `success`/`partial` 时 C7 扣减并追加 `transactions`（时间/发起人=当前演示账号/类型=扣减/金额/说明含模块名与来源名，全部自造）。

---

## 5. 交互规格（触发 → 预期结果，可测）

| # | 交互 | 触发条件 | 预期结果（请求/内存操作 + DOM 变化） | 边界情况 | 证据 |
|---|---|---|---|---|---|
| I1 | 选搜索类型 | 点击 `TypeNav` 某一类 | 该类型高亮；`ModuleList` 联动为该类型模块；`QueryComposer` 占位符/校验规则切换 | 未实现交互的类型给出「演示占位」提示，不报错 | X1-步骤1 |
| I2 | 选模块 | 点击 `ModuleCard` | 卡片高亮（自有强调边框）；显示名称/说明/成本类型标签/成本/推荐；成本行更新 | 免费模块成本行显示 0 | X1-步骤2 |
| I3 | 打开齿轮配置 | 点击模块齿轮 | `SourceFilterModal` 打开；列出可选数据源、扫描范围/类型/地区过滤项、总成本 | 固定/免费模块也可查看成本构成（只读来源） | X1-步骤3 / X2-④ |
| I4 | 多选数据源 | 勾选/取消来源 | 浮动成本=所选来源之和**实时更新**；总成本显示同步 | 全不选 → 成本 0 + 提示至少选一个来源 | X1-步骤3(多源并查) |
| I5 | 重置 / 应用筛选 | 点 `重置` / `应用筛选` | 重置=恢复默认过滤；应用筛选=关闭弹窗并保存选择，成本重算 | 重置后再应用不丢已选模块 | X2-④ |
| I6 | 查询输入校验 | 输入并失焦/点查询 | 按类型显示占位符与提示；C1 给出合法/非法反馈 | 空 / 格式错 / 首尾空格 / 超长 / 含 URL / 特殊字符 | X1-步骤4 / X2-① |
| I7 | 单次成本行 | 任何影响成本的操作后 | `单次成本` 行实时反映 C2 | 浮动未选来源 → 0 + 提示 | X1-步骤4 |
| I8 | 立即查询 | 点主按钮 | 走 4.4 前置链 → `loading` → 终态 | 前置拦截不进 loading | X1-步骤4 |
| I9 | 批量开关 | 打开批量 | 出现 1–5 条输入；成本按条数累加 | 第 6 条禁止 + 明确提示（C3） | X1-Bulk / X2-FAQ |
| I10 | 模式 / Case | 切换保留/隐私、选 Case | 保留模式写历史、隐私模式不写（C9）；当前 Case 显示于顶栏 | 隐私模式下 `#/cases` 历史不新增 | X1-Cases/模式 |
| I11 | 取消加载 | `loading` 点取消 | 回到 `idle` | 取消后不扣费 | X2-加载 |
| I12 | 结果三计数 / 表格 | 成功态 | 顶部三计数；表格列头齐全；状态实心标签 | 零命中显示 0/0/0 与引导 | X1-结果字段 |
| I13 | 分页 / 按来源筛选 | 点页码 / 选来源 | 表格按 C6 更新 | 越界钳制、空结果给提示 | X1-步骤5 / G1 |
| I14 | 书签 / 以此线索再查 | 点行内操作 | 书签写入；再查=跳回工作台并预填 | 重复书签去重 | X1-结果行 |
| I15 | 导出 CSV | 点导出 | C8 生成文件下载 + 「导出成功」提示 | 空结果仅表头 | X1-导出 / G1 |
| I16 | 重试 | 终态点重试 | 回 `loading` 再落地 | 不改变已选模块/来源 | X2-③ |
| I17 | 状态演练 | 选下拉项 / 带 `?state=` 打开 | 结果面板切到指定 phase（4.3） | 未知值 → 回落 `idle` | 验证脚手架 |
| I18 | 充值 | 额度页点确认 | 余额增加 + 交易记录追加 + 「充值成功」 | 自定义滑块越界钳制 | X2-充值 |
| I19 | 会话失效 | 顶栏「演示：会话失效」 | 清会话 → `#/signin` + 提示 | 不与真实鉴权关联 | 推断 |
| I20 | 导航 | 顶栏/菜单点各页 | hash 路由切换 4 个视图 | 未登录访问非登录页 → 回 `#/signin` | F1 / 推断 |

---

## 6. 素材与资产清单

> **无外部素材**：不引用任何外部图片 / 字体 / 图标库 / CDN / 截图。全部自制或纯 CSS。

| 资产 | 处置 | 来源 / 替换方案 |
|---|---|---|
| 品牌名 / 产品名 | 自制 | 「观澜 · 线索检索工作台」，代号 `Guanlan`；替代原站品牌 |
| Logo | 自制 | 内联 SVG（同心弧 + 定位点几何图形），靛蓝单色 |
| 配色 | 自制 | 靛蓝 `#4f46e5`/`#4338ca` + 石板灰 `#0f172a`/`#334155`/`#f1f5f9`；浅色主题；**不用 coral-orange** |
| 图标（导航/齿轮/搜索/书签/下载/重试/状态等） | 自制 | 内联 SVG `<symbol>` 雪碧图或纯 CSS 绘制，约 12 个；不引用图标库 |
| 字体 | 系统字体栈 | `-apple-system, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`；不加载字体文件 |
| 搜索类型 / 模块 / 数据源命名 | 自制 | 18 类自造中文名 + 自造模块名 + 自造数据源名（北向索引 / 灯塔名录 / 回声档案 / 星图登记 / 潮汐记录 …）；避开原站与第三方真实名 |
| 全部界面文案 | 原创中文 | e.g. 初始空态「尚未开始查询」，不逐字翻译 `No active search` 等 |
| 演示数据（标识符/来源/结果/交易/书签） | 自制合成 | `demo.*` 串 + `.invalid` 保留域；无真实个人信息 |
| 截图 / 参考图 | 不使用 | 交付物中不含任何原站截图 |
| 音效 / 动效素材 | 无 | 仅 CSS 骨架微动效（可 prefers-reduced-motion 关闭），不堆渐变/花哨动画 |

---

## 7. 待验证假设

> 承 G0 §显式假设清单；X3 目标页不可直接观察为根本约束。

| # | 假设 | 依据 | 影响面 | 验证方式 | 状态 |
|---|---|---|---|---|---|
| H1（=X3） | 目标页 `/m/search` 本体 DOM / 路由 / 脚本 / 接口在合规范围内**不可直接观察**；工作台内部结构全部基于公开文档推断 | X3 / F2 / F3（403 + Cloudflare）、crosscheck 结论 1 | **全站结构**：所有组件映射仅行为语义对齐，字段/布局可能与真实页不同 | 已有 403/登录页实测；无法进一步验证（不绕过），列为交付遗留项 | **阻塞性→已隔离**：以「公开文档驱动」路线规避，交付报告明示遗留 |
| H2（=A1） | `/m/` 前缀为移动/轻量版，信息架构与桌面工作台大体一致，布局/可见字段可能不同 | A1 / F1 | 页面布局、字段清单取舍 | 无法直连目标页；采用「移动优先 + 桌面适配」双布局覆盖两种可能 | 待验证（不影响可交付） |
| H3（=A2） | 同品牌公开文档描述的流程/状态/成本模型可作为行为佐证，但**不等于**目标页本体直接观测 | A2 / X1 / X2 | 流程细节、状态文案、字段命名 | 文档已逐字摘录可追溯；真实页差异无法核对 | 待验证（已在文档标注「基于公开文档的推断」） |
| H4（=A3） | 目标页为客户端渲染 SPA，具体脚本/路由/接口契约不可获取 | A3 | 前端技术特征 | 不可验证；本项目用 hash 路由静态实现覆盖可观察行为 | 不可验证，列未知项 |
| H5（=A4） | 所有价格/模块名/数据源名/结果数值在实现中替换为占位 | A4 | 实现资产 | 实现期 grep 自检（见 §1 禁止清单） | 已确定 / 实现期核 |
| H6 | 三计数语义（直接命中/补充/关联）对应 X1 的 Found/Enriched/Connections | X1-结果字段 | 结果汇总数值含义 | 与 X1 逐条对照；验证员按行为复现 | 待验证（行为对齐，不照抄命名） |
| H7 | `file://` 下 hash 路由 / `?state=` / Blob 下载可用 | 技术常识，未在本环境逐一实测 | 双击可运行、演练、导出 | 本机 Edge 打开 `site/index.html?state=success#/search` 实测；无浏览器时如实记录 | 未验证 |
| H8 | 18 类的占位符/校验规则按标识符通用形态设计 | 推断（工具型界面常识） | 输入校验体验 | 自测覆盖各类型边界；验证员复核 | 待验证（推断） |
| H9 | 证据包与本蓝图引用的 X1/X2/X3 一致 | 证据包 21:16 落盘 | 全蓝图 | 已按 §9 逐条对照 F/E/D/G/H 编号 | **已合并**（无冲突，见 §9） |
| H10（=证据包 H-13） | **`/m/` 前缀是否代表移动版布局**；若是，则公开文档描述的桌面工作台与 `/m/search` 可能**整体错位**（列数、左右面板并排方式、控件密度、视图分段控件都可能不存在） | 证据包 H-13（组长本轮明确提醒）；与 H-1/H-8 叠加 | **范围级风险**：不是局部字段差异，而是 §3 组件树按桌面三栏类比的整体有效性 | 需授权登录后按不同视口比对，或由主理人确认 `/m/` 语义；本次**不推断** | **待验证·范围级**：已用「移动优先 + 桌面适配」双布局对冲（移动端单列堆叠、≥900px 三栏），使两种可能都被覆盖 |

> **阻塞性处置**：H1 是根本阻塞（无一手证据），按 crosscheck 结论 3 采用「公开文档驱动的行为复刻 + 全量占位」路线，并把「目标页直接证据缺失」作为明确交付遗留项上报，**不带着空白猜测目标页 DOM**。H10 属范围级风险，用双布局对冲而非猜测单一布局。其余假设均可在此路线下工，无需回炉补侦察。
> 证据包 §H 明列 H-1（登录后 DOM 不可见）与 H-2（真实 API 契约为空）为**无法绕开的阻塞性假设**，并已交回主理人决策；本次按主理人既定「公开文档驱动 + 全量占位」路线执行，未擅自补授权或绕过访问限制。

---

## 8. 状态机设计（结果面板主状态机，`core.reduceResult`）

### 8.1 状态集合（`PHASES`）

| phase | 含义 | 界面锚点文案（原创中文） | 出口动作 |
|---|---|---|---|
| `idle` | 初识空态 | 尚未开始查询 · 选择类型与模块后点击「立即查询」 | 开始查询 |
| `loading` | 加载中 | 正在检索所选来源…（骨架 + 进度） | 取消 |
| `success` | 成功有结果 | 检索完成 | 重试 / 导出 / 再查 |
| `noresults` | 零命中 | 未发现匹配记录 —— 这是结果，不是错误 | 扩大来源 / 复核输入 / 换类型 |
| `partial` | 部分数据源故障 | 部分来源暂不可用，以下为健康来源的结果 | 关闭故障来源 / 重试 |
| `source-down` | 数据源整体故障 | 所选来源暂不可用 | 切换健康来源 / 重试 / 查状态 |
| `invalid` | 校验失败 | 输入未通过校验（列出原因） | 修改输入 |
| `credits` | 额度不足 | 当前额度不足以完成本次查询 | 前往充值 / 返回 |
| `bulk-limit` | 批量上限 | 单次最多 5 条，无法继续添加 | 修改输入 |
| `timeout` | 查询超时/卡住 | 检索耗时过长，可能范围过大 | 重试 / 缩小范围 / 查状态 |
| `network` | 网络异常 | 演示环境连接异常 | 重试 / 返回 |
| `session-expired` | 会话失效 | 演示会话已失效，请重新进入 | 返回登录 |
| `export-success` | 导出成功（叠加提示） | 已导出 N 条记录 | 关闭 / 继续 |

### 8.2 迁移表（`action.type`）

| 当前 phase | 事件 | 条件 / payload | 下一 phase |
|---|---|---|---|
| `idle` | `RUN` | 校验失败 | `invalid` |
| `idle` | `RUN` | 额度不足 | `credits` |
| `idle` | `RUN` | 批量超限 | `bulk-limit` |
| `idle` | `RUN` | 前置通过 | `loading` |
| `loading` | `CANCEL` | — | `idle` |
| `loading` | `RESOLVE` | `outcome∈{success,noresults,partial,source-down}` | 对应终态（并扣费/写历史） |
| `loading` | `RESOLVE` | `outcome=timeout` | `timeout` |
| `loading` | `RESOLVE` | `outcome=network` | `network` |
| `success`/`noresults`/`partial`/`source-down`/`timeout`/`network` | `RETRY` | — | `loading` |
| `invalid`/`credits`/`bulk-limit` | `EDIT` | 修改输入 | `idle` |
| 任意 | `FORCE` | `payload.phase`（状态演练 / `?state=`） | 指定 phase |
| 任意 | `SESSION_EXPIRED` | — | `session-expired` |
| `session-expired` | `SIGNIN` | — | `idle`（并切路由至登录） |
| 任意（success/partial 上） | `EXPORT` | — | 保持 phase + `meta.exportSuccess=true` |
| 任意 | 非法迁移 | — | 原样返回（可断言） |

- 状态机为**纯函数、不可变**：`reduceResult(state, action) -> newState`，`state={phase,message,meta}`；Node 自测逐条断言合法与非法迁移。
- `loading → 终态` 在 app 层用 `setTimeout` 模拟耗时（可取消），落地 scenario 由「状态演练选择」或「默认 success」决定；这是纯前端时序模拟，无网络。

---

## 9. 切片清单（依赖顺序 + 验证点）

> 实现期按「一次一个薄垂直切片」推进，每片自测留一条运行证据，代码注释标证据编号。

| # | 切片 | 依赖 | 做完后能验证什么（运行证据） |
|---|---|---|---|
| S1 | 骨架：`data.js` + `core.js`(基础) + `index.html` + `styles.css` + `app.js`(路由/AuthGuard/SignInView/工作台顶栏与三栏布局骨架) | — | `file://`/http 起得来；UMD 双端可导入（Node `createRequire` 拿到 core/data）；4 个 hash 路由可切；登录结构对齐 X3；E1 = Node 断言 core 导出非空 + http 200 |
| S2 | 查询流程：`TypeNav`+`ModuleList`+`SourceFilterModal`+`QueryComposer`+`BatchController`+`ModeSwitch`（X1 五步 + 成本/批量/过滤器） | S1 | 类型联动、模块成本标签、齿轮多选实时成本、校验各类型/边界、批量上限 5、成本累加；E2 = Node 断言 C1/C2/C3/C9 全通过 |
| S3 | 结果状态机 + 全状态 + 留存/额度页 + 状态演练：`ResultPanel`/`ResultTable`/三计数/分页/筛选/书签/CSV/重试/行操作、`CreditsView`/`TransactionTable`、`CasesView`、`StateDemo` + `?state=` | S1,S2 | 4.3 全部 phase 可一键复现且各有文案与出口；三计数、扣费、交易、模式对历史的影响；E3 = 全量 `selftest.mjs` 通过 + http 200 + `docs/03-selftest.md` 真实输出 |

- `site/tests/selftest.mjs`（S3 收口，S1/S2 增量可跑）：Node 内置断言覆盖 C1–C9 + 状态机 + http 200；命令与真实输出写入 `docs/03-selftest.md`。
- 提交粒度：每片一个可独立读懂的增量；最终统一 `git add`，**不 commit / 不 push**（组长统一提交）。

---

## 10. 证据编号 → 代码注释约定

实现期注释**只用证据编号 + 原创中文**，不写原站专有名词（避免合规 grep 命中）：
`// X1-步骤3: 浮动成本 = 所选来源之和` · `// X1-步骤4: 单次成本行` · `// X1-Bulk: 上限 5 条、成本累加` · `// X2-零结果: 这是结果不是错误` · `// X2-数据源故障: 健康来源结果仍出` · `// X3: 登录页可见结构` · `// 推断: 状态演练脚手架` —— 便于独立验证员逐条追溯。

---

## 11. 证据包合并补记（21:5x，对 `recon/evidence-pack.md`）

> 证据包于 21:16 落盘，逐条对照后**未发现与 X1/X2/X3 冲突的结论**，因此**不改变实现范围与切片划分**；仅补强可追溯性，并把 H-13 升级为显式范围级假设（见 §7 H10）。

### 11.1 证据编号对照（本蓝图 → 证据包）

| 本蓝图 | 证据包 | 结论 |
|---|---|---|
| X1（五步流程 / 18 类 / 成本模型 / Bulk / Cases） | C.1（P01 六步版、P02/X1 五步版）、C.2（实测仅"访问→被导向登录"）、D.2（P01 输入项） | 一致；证据包额外指出官方文档**内部数字不一致**（17 vs 18 类、80+ vs ~107 模块，H-4）→ 本实现按组长定界的 18 类，不卷入该矛盾 |
| X2（全状态 / 成本 / 故障 / 充值 / 交易） | F-01~F-18（逐条标证据强度）、E.1（三计数）、E.2（结果列）、E.3（结果区控件） | 一致；证据包把 F-15（网络异常/5xx/超时）、F-16（空输入/超长/特殊字符）标为**「无证据 → 未知」** → 本实现按组长明确要求的"推断"处理，界面文案为原创中文，不冒充原站实测 |
| X3（登录页可见结构 / 403） | A-01/A-02/A-05/E12/E24（登录页逐字）、E25（curl 403）、F-11（登录墙，【实测】最强）、D.1（认证页输入项） | 一致且**被加强**：登录页含 `Toggle theme`（G-03）、`Support/Privacy/Terms` 链接等；本实现按组长定界只复刻「可见结构对齐」，不引入主题切换等额外功能（最小实现） |
| F1 / G1–G4 | B.1 / B.3 / B.4（P01/P05/P07/P14）、G-01~G-09 | 证据包 B.4 给出更细的桌面工作台 chrome（状态 pill、Case、模式、视图分段、左导航），**均为【公开】非实测** → 与 §3 组件树映射一致，未新增实现项 |
| A1（`/m/` 移动版） | **H-13**（范围级风险） | 已升级为 §7 H10，用双布局对冲 |

### 11.2 合并后对实现的处置（逐条可核）

1. **不新增功能**：证据包 B.4/G-06 提到的命令面板、通知中心、应用网格、视图分段控件、AI 视图等，均为【公开】文档描述且**不在组长定界内**，按「最小实现」原则不纳入（额外想法单独提，不顺手做）。
2. **不冒充实测**：F-15/F-16 明确"无证据"，但组长任务书**明确要求**实现网络异常、超时、校验失败等状态 → 按其要求以「推断」实现，且状态卡文案明确写「演示环境未发起真实网络请求」，不伪装成原站行为。实现里 `network` 态原文即此。
3. **加载态**：证据包 F-09 指出无 spinner/骨架/进度条实测 → 本实现的骨架屏按「推断·工具型界面常识」处理，蓝图 §8 已标 `loading` 为推断态。
4. **结果列**：证据包 E.2 指出官方文档四处结果表列不一致（H-4）→ 本实现按组长定界固定为「标识 / 来源 / 状态 / 置信度 / 操作」，不照抄任何一版原站列名。
5. **合规**：证据包 G-05/G-09 提到的真实静态资源路径与第三方数据源清单，仅作证据记录；实现侧全部替换为自造名与内联 SVG，未下载任何资源。
6. **H-1 / H-2 阻塞性**：证据包 §H 已交回主理人决策；本蓝图沿用主理人既定路线，未擅自补授权、未绕过任何访问限制。

### 11.3 合并结论

**无冲突、无回炉需求**。证据包把「目标页一手证据为 0」从 X3 的交叉验证结论升级为完整分级证据体系（E/F/P/H 编号 + 【实测】/【公开】/【推断】三级标注），进一步支撑了本蓝图的根本前提；唯一需要显式升级的是 H-13 的**范围级**性质（已写入 H10）。

---

## 质量自检

- [x] 技术栈选型有理由，UMD 双端导出/零构建/`file://` 约束已说明；未验证项（H7/§2）已标注并给验证方式
- [x] 组件映射覆盖 X1/X2/X3/F1/G1–G4/A1 全部页面/模块；**证据包 B/D/E/F/G 已补并**（§11）
- [x] 每个交互有数据契约（C1–C9 + 4.3/4.4，含错误分支）
- [x] 每个交互有规格（I1–I20，含边界情况）
- [x] 素材逐项处置，明确「无外部素材」，未使用参考站受版权保护资产
- [x] 未知项已全部转成假设（H1–H10），阻塞性 H1/H-1/H-2 已用「公开文档驱动」路线隔离并明示遗留，范围级 H10 用双布局对冲
- [x] 切片按依赖排序（S1→S2→S3），各有独立验证点
- [x] 证据包已合并，逐条对照记录于 §11，冲突/回炉结论明确
