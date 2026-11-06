# 阶段 3 · 自测与运行证据

- 环境：Windows / Node **v22.22.2** / 零第三方依赖 / 工作目录 `C:/Users/91464/WorkBuddy/2026-11-06-20-52-57`
- 网站入口：`site/index.html`（纯静态，`file://` 双击可运行；也可用 Node 内置 http server 访问）
- 自测入口：`node site/tests/selftest.mjs`（`node:assert/strict` + `node:module#createRequire` + `node:http`，零第三方）
- 状态复现：`site/index.html?state=<状态>#/search`（同时提供工作台「状态演练」下拉）
  支持值（**14 个**，切片 4 新增 `no-connections`）：`idle / loading / success / noresults / no-connections / partial / source-down / invalid / credits / bulk-limit / timeout / network / session-expired / export-success`
- 附加复现参数（切片 4 验证脚手架，可与 `?state=` 叠加）：`?theme=dark|light`、`?view=basic|advanced|agent`、`?modal=filter|sources`；`site/index.html#/reset` 直达重置密码页。

> 本文所有输出均为**实际执行的真实 stdout/stderr**，未编造。切片按 S1→S2→S3 推进，每片一条证据。

---

## E1 · 切片 1（登录 + 工作台骨架）

命令：

```
cd C:/Users/91464/WorkBuddy/2026-11-06-20-52-57
node site/tests/selftest.mjs
```

真实输出：

```

[E1 · UMD 双端导出（S1 骨架）]
  ✓ core.js 导出为对象且含状态机
  ✓ data.js 导出为对象且含 18 类 / 模块 / 来源 / 结果种子
  ✓ 状态机每个 phase 都有明确文案与可操作出口（X2 全状态）
  ✓ 占位数据不含真实个人信息的合成标识（.invalid / demo.* / 保留地址段）

[E1 · 静态服务 200（Node 内置 http server）]
  ✓ index.html -> 200 且内容非空 (8821 字节)
  ✓ styles.css -> 200 且内容非空 (22289 字节)
  ✓ data.js -> 200 且内容非空 (11835 字节)
  ✓ core.js -> 200 且内容非空 (21217 字节)
  ✓ app.js -> 200 且内容非空 (21122 字节)

----------------------------------------
通过 9 / 失败 0
----------------------------------------
```

结论：**通过 9 / 失败 0**。UMD 双端导出成立（同一份 `core.js` / `data.js` 既被浏览器 `<script>` 加载、又被 Node `createRequire` 导入）；5 个站点文件均返回 200 且内容非空。

---

## E2 · 切片 2（查询流程：校验 / 成本 / 批量 / 模式）

命令（先做 3 个源文件的语法检查，再跑自测）：

```
cd C:/Users/91464/WorkBuddy/2026-11-06-20-52-57
node --check site/core.js && node --check site/data.js && node --check site/app.js
node site/tests/selftest.mjs
```

真实输出：

```
--- syntax OK ---

[E1 · UMD 双端导出（S1 骨架）]
  ✓ core.js 导出为对象且含状态机
  ✓ data.js 导出为对象且含 18 类 / 模块 / 来源 / 结果种子
  ✓ 状态机每个 phase 都有明确文案与可操作出口（X2 全状态）
  ✓ 占位数据不含真实个人信息的合成标识（.invalid / demo.* / 保留地址段）

[E2 · C1 查询校验（各类型 / 边界，X1-步骤4 + X2-①）]
  ✓ 8 种校验规则均存在且合法样例通过
  ✓ 空输入 / 仅空白 / 首尾空格 分别拦截
  ✓ 超长输入拦截（> 上限）
  ✓ 含 URL 拦截（http/https/www/协议相对）
  ✓ 特殊字符拦截（引号 / 尖括号 / 换行 / 控制字符）
  ✓ 格式错按类型拦截（邮箱缺 @、IPv4 越界、域名缺点、钱包缺 0x）

[E2 · C2 成本计算（免费 / 固定 / 浮动 / 批量累加，X1-步骤3/4）]
  ✓ 免费模块成本为 0
  ✓ 固定模块成本 = 固定值，批量累加 total = perSearch × 条数
  ✓ 浮动成本 = 所选来源之和（实时随勾选变化）
  ✓ 浮动未选来源 -> 0；批量条数被钳制到 [1,5]

[E2 · C3 批量上限 5（X1-Bulk / X2-FAQ）]
  ✓ 添加 1..5 条成功，第 6 条被禁止并给出明确提示
  ✓ remove / set 不改变原数组（不可变）

[E2 · C9 模式对历史的影响（X1-Cases/模式）]
  ✓ 保留模式追加历史且不可变；隐私模式原样返回不写入

[E1 · 静态服务 200（Node 内置 http server）]
  ✓ index.html -> 200 且内容非空 (8821 字节)
  ✓ styles.css -> 200 且内容非空 (22289 字节)
  ✓ data.js -> 200 且内容非空 (11835 字节)
  ✓ core.js -> 200 且内容非空 (21217 字节)
  ✓ app.js -> 200 且内容非空 (37656 字节)

----------------------------------------
通过 22 / 失败 0
----------------------------------------
```

结论：**通过 22 / 失败 0**，3 个源文件 `node --check` 均通过。C1 覆盖 8 种校验规则与 6 类边界；C2 覆盖免费/固定/浮动与批量累加；C3 验证第 6 条禁止；C9 验证隐私模式不写历史。

---

## E3 · 切片 3（结果状态机 / 结果表 / 额度 / 留存）

命令同 E2。切片 3 收口时的真实结果为 **通过 40 / 失败 0**（初次 39/1，失败项 `success 文案不足`；未放宽断言，而是把 `core.js` 的 `PHASES.success.title` 从「检索完成」改为「检索完成，已汇总所选来源的线索」后复跑通过）。该次 stdout 未单独存档；E3 的分组（C4 状态机 / C5 结果组装三计数 / C7 额度 / C8 CSV / 状态演练覆盖）在下方 E4 全量输出中逐条可见，分组名与断言未变。

---

## E4 · 切片 4 收口（全量 55 项断言 + 新增 UI 规格 + 合规硬边界）

命令：

```
cd C:/Users/91464/WorkBuddy/2026-11-06-20-52-57
node --check site/data.js && node --check site/core.js && node --check site/app.js
node site/tests/selftest.mjs
```

真实输出（`--- syntax OK (3 files) ---` + `exit=0`）：

```
[E1 · UMD 双端导出（S1 骨架）]
  ✓ core.js 导出为对象且含状态机
  ✓ data.js 导出为对象且含 18 类 / 模块 / 来源 / 结果种子
  ✓ 状态机每个 phase 都有明确文案与可操作出口（X2 全状态）
  ✓ 占位数据不含真实个人信息的合成标识（.invalid / demo.* / 保留地址段）

[E2 · C1 查询校验（各类型 / 边界，X1-步骤4 + X2-①）]
  ✓ 8 种校验规则均存在且合法样例通过
  ✓ 空输入 / 仅空白 / 首尾空格 分别拦截
  ✓ 超长输入拦截（> 上限）
  ✓ 含 URL 拦截（http/https/www/协议相对）
  ✓ 特殊字符拦截（引号 / 尖括号 / 换行 / 控制字符）
  ✓ 格式错按类型拦截（邮箱缺 @、IPv4 越界、域名缺点、钱包缺 0x）

[E2 · C2 成本计算（免费 / 固定 / 浮动 / 批量累加，X1-步骤3/4）]
  ✓ 免费模块成本为 0
  ✓ 固定模块成本 = 固定值，批量累加 total = perSearch × 条数
  ✓ 浮动成本 = 所选来源之和（实时随勾选变化）
  ✓ 浮动未选来源 -> 0；批量条数被钳制到 [1,5]

[E2 · C3 批量上限 5（X1-Bulk / X2-FAQ）]
  ✓ 添加 1..5 条成功，第 6 条被禁止并给出明确提示
  ✓ remove / set 不改变原数组（不可变）

[E2 · C9 模式对历史的影响（X1-Cases/模式）]
  ✓ 保留模式追加历史且不可变；隐私模式原样返回不写入

[E3 · C4 状态机迁移（X2 全状态，不可变）]
  ✓ idle --RUN(pass)--> loading --RESOLVE(success)--> success
  ✓ RUN 前置拦截：invalid / credits / bulkLimit / pass
  ✓ loading --CANCEL--> idle；终态 --RETRY--> loading；非法迁移原样返回
  ✓ FORCE 可切到全部 14 个 phase；SESSION_EXPIRED / SIGNIN 闭环
  ✓ X2 要求的每个状态都有明确文案 + 至少一个可操作出口
  ✓ 零命中状态明确「这是结果不是错误」并带 3 条引导

[E3 · C5 结果组装与三计数（X1-结果字段 / X2-数据源故障）]
  ✓ success 组装出行，三计数之和 = 行数
  ✓ noresults：零行、三计数全 0（结果而非错误）
  ✓ partial：健康来源结果仍出 + 故障来源单独提示
  ✓ source-down：全部所选来源故障、无结果行
  ✓ 批量 3 条 -> 行数 ×3；分页与来源筛选正确

[E3 · C7 额度扣减与不足判定 + 交易记录（X2-额度不足 / 扣费）]
  ✓ 足额扣减成功、不足判定为 false 且给出提示
  ✓ 扣减记录字段形状（时间/发起人/类型/金额/说明）
  ✓ 充值记录与额度增加

[E3 · C8 导出 CSV 内容形状（X1-导出 / G1）]
  ✓ 首行为列头，行数 = 表头 + 数据行；空结果仅表头
  ✓ 字段含逗号 / 引号 / 换行时正确转义

[E3 · 状态演练选项与 ?state= 覆盖（验证脚手架）]
  ✓ 演练下拉覆盖 X2 要求的全部状态值
  ✓ 18 类类型 / 每类 3 模块 / 三种成本类型齐备

[E4 · F-03 关联线索为空（独立状态 + 计数口径差异）]
  ✓ no-connections 有明确文案、口径差异说明与可操作出口
  ✓ buildResults(no-connections)：关联计数 0，详情区仍有相关行，显式标记口径差异
  ✓ RESOLVE 可落到 no-connections，且 RETRY 可回到 loading

[E4 · E.2/H-4 两套结果列集（按模块切换，不声称唯一列集）]
  ✓ columnSets 恰有两套且列头形状不同
  ✓ columnSetFor：单源模块 -> single，多源/浮动模块 -> multi

[E4 · P01/P03 实体页签 / 表头排序 / F-09 逐行流入]
  ✓ filterByEntity：all 全量，其余按占位分类过滤
  ✓ sortRows：按置信度升降序、非法 key 原样副本、不可变
  ✓ streamSlice：前 n 行且 n 被钳制到 [0, length]

[E4 · P07/P14/P05/E12/E04/G-03 新增 UI 规格数据形状]
  ✓ 三种视图分段、默认普通视图；高级视图数据齐备
  ✓ 7 个实体页签默认全部；结果双 tab / 三详情 tab / 弹窗双变体
  ✓ 主题默认浅色且有自造持久化键；登录页头/页脚、重置页文案齐备
  ✓ D.2 输入 label 随「模块」变化：每类 3 个模块给出 3 个不同 label

[E4 · 合规硬边界（站点 5 文件，逐条 grep 自检）]
  ✓ 站点 5 文件不含原站品牌 / 模块名 / 数据源名 / 暖橙配色词
  ✓ index.html 不使用 ES module / fetch / CDN / 外部图片
  ✓ ?state= 每个演练值都能被 FORCE 接受（14 个状态可复现）

[E1 · 静态服务 200（Node 内置 http server）]
  ✓ index.html -> 200 且内容非空 (9356 字节)
  ✓ styles.css -> 200 且内容非空 (34912 字节)
  ✓ data.js -> 200 且内容非空 (16431 字节)
  ✓ core.js -> 200 且内容非空 (24212 字节)
  ✓ app.js -> 200 且内容非空 (88470 字节)

----------------------------------------
通过 55 / 失败 0
----------------------------------------
```

> 注：上方 HTTP 200 括号内的数字是响应体 UTF-8 解码后的**字符数**，与磁盘 `wc -c` 的字节数不同（中文多字节），非矛盾。

结论：**通过 55 / 失败 0**（≥ team-lead 要求的 30 项）。覆盖 C1–C10 全部纯函数、14 个状态迁移与出口、结果组装三计数、额度/交易、CSV 转义、模式对历史、两套列集、实体页签、排序、逐行流入、新增 UI 数据形状，以及「站点 5 文件不含禁止词 / 不使用 ES module / fetch / CDN / 外部图片」的合规硬边界。

独立 grep 复核（真实输出）：

```
$ grep -oiE "UserSearch|usersearch|S\.A\.R\.G\.E\.|SargeBot|OneScan|HaveIBeenPwned|HudsonRock|IntelX|Gravatar|coral-orange|PIPL|EPIEOS" site/index.html site/styles.css site/data.js site/core.js site/app.js
PASS: 未发现禁止词
```

> 说明：`#/credits` 路由与 `?state=credits` 是自造路由/状态标识，页面 UI 显示为「额度」；`site/standalone.html` 与 `site/tests/standalone-selftest.mjs` 由 team-lead 维护，本合规检查**未包含、未修改**这两份旁支文件。

---

## E5 · 真实浏览器证据（Edge 无头 CLI，零第三方依赖）

环境探测真实输出：

```
--- edge/chrome ---
/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe
--- playwright-core ---
playwright-core NOT FOUND
```

未安装任何第三方依赖、未联网。改用 Edge 内置 `--headless=new --screenshot` / `--dump-dom` 对 `file://` 页面直接取证。命令模板（每张截图使用**独立的 `--user-data-dir`**，避免 localStorage 主题偏好跨次污染）：

```
"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --headless=new --disable-gpu --no-sandbox --no-first-run \
  --no-default-browser-check --disable-extensions --hide-scrollbars \
  --user-data-dir="<每次独立目录>" --window-size=<W,H> --virtual-time-budget=2600 \
  --screenshot="<OUT>/<name>.png" \
  "file:///C:/Users/91464/WorkBuddy/2026-11-06-20-52-57/site/index.html?state=success#/search"
```

生成并逐张查看的截图（真实文件大小）：

| 文件 | 视口 | 大小 | 观察结论 |
|---|---|---|---|
| `s4-success-desktop.png` | 1440×1000 | 190381 B | 三栏工作台；状态卡 / 结果 / 书签双 tab / 三计数 / 两套列集之一 / 表头排序箭头 / 动作按钮全部可见 |
| `s4-success-tall.png` | 1440×1500 | 221939 B | 结果表与分页完整可见 |
| `s4-no-connections.png` | 1440×1000 | 198039 B | 关联线索计数 0、口径差异说明、详情区仍列关联行 |
| `s4-loading.png` | 1440×1000 | 163631 B | 加载态逐行流入 + 骨架/进度 |
| `s4-dark.png` | 1440×1000 | 192060 B | 深色主题，正文对比度可读 |
| `s4-advanced.png` | 1440×1000 | 191677 B | 高级视图分段选中（Case 面板在首屏下方，见 tall 图 / DOM 核验） |
| `s4-advanced-tall.png` | 1440×1500 | 243471 B | Case 面板 + Case 历史（事件/时间两列） |
| `s4-agent.png` | 1280×900 | 69368 B | 智能体视图整页推广卡 + 进入按钮 |
| `s4-modal-filter.png` | 1440×1000 | 194609 B | 配置弹窗过滤变体：三下拉 + 记住选择 + 三按钮 |
| `s4-modal-sources.png` | 1440×1000 | 199649 B | 来源开关变体：逐行勾选 + 单项成本 + 总成本 + 记住选择 |
| `s4-signin.png` | 1280×900 | 56275 B | 登录页页头（品牌/支持/主题/加入）、表单、页脚（注册/隐私/条款/数据处理/合规/版权） |
| `s4-reset.png` | 1280×900 | 37341 B | `#/reset` 邮箱 + 发送验证码 |
| `s4-mobile-390.png` | 390×844 | 54507 B | 见下方「移动端溢出核查」说明 |
| `s4-mobile-492.png` | 492×844 | 61824 B | 窄视口 1:1，顶部「回到初始空态」按钮与模块卡**完整可见、无右侧裁切** |

`--dump-dom` 六视图核验（真实输出）：

```
advanced                   dom= 33201  ALL PRESENT
agent                      dom= 14178  ALL PRESENT
modal-filter               dom= 34013  ALL PRESENT
modal-sources              dom= 35356  ALL PRESENT
reset                      dom= 11890  ALL PRESENT
no-connections             dom= 32118  ALL PRESENT
```

（分别核验 `Case 面板/Case 历史/新建 Case/书签数/最后更新`、`让智能体替你串起线索/进入智能体视图`、`过滤条件/来源开关/扫描上限/检索类型/站点地区/记住我的选择/应用筛选`、`单项成本之和`、`重置演示密码/发送验证码`、`关联线索为空/口径差异`。）

`?state=success` 的 `--dump-dom` 关键字计数（证明新 UI 真实渲染、非 JS 崩溃后的空壳）：`普通视图 2 / 高级视图 1 / 智能体视图 1 / 多源并查 1 / 线索标识 1 / 直接命中 3 / 智能分析 1 / 追问 1 / 关系图 1 / result-tab 5 / detail-tab 12 / th-sort 4`，DOM 共 35157 字节。

**中文渲染**：所有截图中中文均为可读字形，**未出现方框 / 缺字（tofu）**，无需额外说明。

### 移动端横向溢出核查（如实记录）

早期 390px 截图右侧出现「回到初始空态」按钮与模块卡文字被裁切。为定位根因，临时构造了一个只用于诊断的 `_probe.html`（复用同目录 CSS/JS，读取 `innerWidth` / `scrollWidth` / 超界元素），`--dump-dom` 真实输出：

```
=== --window-size=390,844 ===                     PROBE innerWidth=518 scrollWidth=518 offenders=92
=== --window-size=390,844 --force-device-scale-factor=1 ===  PROBE innerWidth=492 scrollWidth=492 offenders=97
=== --window-size=500,844 --force-device-scale-factor=1 ===  PROBE innerWidth=492 scrollWidth=492 offenders=97
```

结论：`scrollWidth == innerWidth`，**文档层没有 CSS 横向溢出**；列出的 `offenders` 全部是 `.type-item`（18 类导航的 `overflow-x:auto` 横向滚动条内的条目，属预期）。真实原因是 **Edge headless 最小 CSS 视口约 492–518 px**，`--window-size=390` 仍按该视口布局，而 PNG 只有 390 px 宽，右侧约 100 CSS px 被截图裁剪 —— 属无头截图工具限制，不是页面缺陷。诊断探针与临时 profile 目录均已删除，未留交付物。

仍按防御性原则做了 CSS 加固：`.panel/.panel-body/.view/.shell` 加 `min-width:0`、`.workbench` 用 `minmax(0,1fr)` 且子项 `min-width:0`、`.table-scroll{max-width:100%}`、`.demo-bar > * {min-width:0}`、`@media (max-width:420px)` 收紧内边距并把构成区标题换行。`s4-mobile-492.png` 为 1:1 窄视口证据，按钮与卡片均完整可见。

**未执行 playwright 截图，原因：`playwright-core` 未安装，且用户明令不联网装依赖**；已用 Edge 无头 CLI 等价替代。

---

## 交付核对

- [x] `file://` 直接打开：`index.html` 仅用传统 `<script src>`，无 ES module / fetch / CDN / 外部图片（自测断言 + grep 复核）
- [x] 14 个状态均可经 `?state=` 或「状态演练」下拉复现，每个状态有明确文案与可操作出口
- [x] X1 五步主流程、成本 / 批量 / 双变体弹窗 / 模式 / Case 全部接入
- [x] 站点 5 文件禁止词 grep 通过；素材全部自制，无外部资源
- [x] 命令与输出均为真实执行结果，未编造

