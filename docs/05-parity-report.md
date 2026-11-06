# 阶段 4 一致性差异报告（独立验证员 · 严较真）— 最终复验收口版

> 判据：**同输入，同输出。** 全程不修改任何实现代码，只产出本报告与 `site/tests/verify-*.png` 截图；未 `git add / commit / push`。
>
> **组长裁决（本轮收口依据）**：正式交付入口 = **候选 B**（`site/index.html` + `data.js` / `core.js` / `app.js` / `styles.css`）；候选 A（`site/standalone.html`）降级为**非交付的备用原型**，其 7 条差异**不纳入 G4 门禁判定**，但如实保留并逐条标注「非交付物 / 已知问题」。
>
> **结论摘要（最终复验 `2026-11-06 23:01:53 – 23:21:50`，收口复跑 `23:26:39 – 23:28:16 +0800`）**：四轴中视觉 / 网络 / IPC 的不可比或不适用部分单列于「不可比项」；交互轴为「部分可比」，期望取自公开官方文档行为规格（`docs/01-recon-findings.md`、`recon/evidence-pack.md` §F）与本队 `docs/02-verification-plan.md` V-01～V-43、边界矩阵、`docs/01-blueprint.md` C1–C9 与状态机契约——**不是与真实目标页逐像素比对**（目标页一手证据为 0）。
> 7 条差异经本人按**原始复现步骤**重跑：**已消除 4 条（B-01、I-02、I-04、M-02）、未消除 3 条（I-01、I-03、M-01，均为 A 的非交付物已知问题）**；「候选 B 为骨架」的阻断级线索按当前磁盘状态重新判定为**已消除**。12 项补齐清单逐项实测全部已实现；移动端裁切经 CDP 真实 390 CSS px 视口独立复核，判定**非 CSS 缺陷**。收口复跑确认 A 的三项修复**未连带改坏 B**。
> **G4 门禁判定输入：候选 B 冻结版未解决阻断级差异 = 0 条**（亦无重要 / 次要差异）。
> **最终结论（无歧义）：候选 B 冻结版「达到可交付条件」。** 依据：阻断级清零；13 状态 `13/13`、12 项全实现、渲染 DOM 探针 `17/17`、自测 `55/0`、语法 OK、HTTP `6/6`、合规全 0；`23:26:39` 复核六文件 md5 与冻结值逐项一致。候选 A 的 3 条未消除差异属非交付备用原型，不构成阻断、不进 G4。

## 比对条件

| 项 | 值 |
| --- | --- |
| 参考站 | `https://usersearch.ai/m/search` —— 登录墙 + Cloudflare 403，用户明确禁止绕过登录 / 鉴权 / 访问限制；目标页一手 DOM、脚本、请求证据 **0** |
| 复刻品入口 A | `site/standalone.html` —— **非交付的备用原型**（零依赖单文件自包含），差异不进 G4 |
| 复刻品入口 B | `site/index.html` + `data.js` + `core.js` + `app.js` + `styles.css` —— **正式交付入口** |
| 视口 | 桌面 `1440×900`、移动 `390×844`；**最终复验另用 CDP `Emulation.setDeviceMetricsOverride` 强制真实 `390×844` CSS px、DPR=1、`mobile=true`** |
| 设备像素比 | DPR = 1 |
| 数据状态 | 全量合成占位数据；无后端、无网络、无构建工具；`file://` 直接打开 |
| 登录态 / 会话 | 演示会话：`?state=<id>#/search` / `?theme=dark\|light` / `?view=basic\|advanced\|agent` / `?modal=filter\|sources`；不带 `demo=1` 的会话失效回跳单独复验 |
| 时序 | Edge `--virtual-time-budget=2500～8000`；CDP 显式等待 `document.readyState === 'complete'` 后再采样；Node 自测同步执行 |
| 浏览器 / 运行时 | Microsoft Edge headless（含 `--remote-debugging-port` + Node 22 内置 `WebSocket` 走 CDP）；Node v22.22.2；Windows |
| 采集时间 | 首轮 `21:24` 起；上轮冻结 `22:46:57`；最终复验采集点 `23:01:53`、收口复核 `23:21:50`；**收口复跑 `23:26:39`（自测/合规/HTTP）、`23:27:31`（B 核心探针）、`23:28:16`（A 三项复验）** |

**最终冻结值（`23:01:53` 采集，`23:21:50` 与 `23:26:39` 两次复核 md5 逐项一致）**

| 文件 | 字节数 | mtime | md5 | 归属 |
| --- | --- | --- | --- | --- |
| `site/index.html` | 9,611 | 22:25:13 | `9603fe6af6470c0a641c820a809ea14c` | B 交付 |
| `site/app.js` | 99,007 | 22:37:51 | `463b8a72436c722a254b2b3bf0bc3c89` | B 交付 |
| `site/core.js` | 28,998 | 22:11:29 | `4979963e0721e206b001f301e059c11a` | B 交付 |
| `site/data.js` | 21,199 | 22:10:24 | `e7ec8de27a92d63e11a0d5a4a69ab34b` | B 交付 |
| `site/styles.css` | 36,374 | 22:31:05 | `3ba97a7aad1d6b81c9c9ea6c9e4af1db` | B 交付 |
| `site/standalone.html` | **60,728** | **23:00:26** | **`7eeee3bb145eca739844fe70ce7d1009`** | A 非交付 |
| `site/tests/selftest.mjs` | 27,671 | 22:12:43 | — | B 自测 |

**「移动目标」取证声明**：候选 B 在早期验证期间持续修改（`app.js` 23,507→64,656→97,746→98,530→99,007 B，`styles.css` 23,262→36,374 B，自测 9/0→40/0→55/0），21:29 骨架快照 `main-workbench.png` 已失效，本报告从未据其下结论。**候选 A 在上轮报告出具后于 `23:00:26` 被修改**（60,369→60,728 B，md5 `0a648002…`→`7eeee3bb…`），因此 7 条差异**全部重新实测**，未沿用任何旧结论。候选 B 的 5 个文件自上轮冻结起哈希未变，实现工程师已 completed、之后无写入，符合「最终冻结版本」。收口复跑（`23:27:31`）在 B 冻结版上重跑两套自测与核心探针，结果与前轮一致，确认 A 的三项修复未连带改坏 B。

**截图证据**（本人产出，均位于 `site/tests/`）

| 文件 | 字节 | 内容 |
| --- | --- | --- |
| `verify-success-desktop.png` | 138,346 | 候选 A 成功态 1440×900 |
| `verify-noresults-desktop.png` | 118,268 | 候选 A 零命中 1440×900 |
| `verify-credits-desktop.png` | 113,978 | 候选 A 额度不足 1440×900 |
| `verify-mobile-390.png` | 59,986 | 候选 A `--window-size=390,844` 截图（受 headless clamp，见专节） |
| `verify-multi-columns.png` | 140,903 | 候选 A 多源列错位（修复前证据） |
| `verify-viewport-probe.png` | 55,961 | headless 真实视口数值探针（cw=518） |
| `verify-candidateB.png` / `verify-candidateB-noresults.png` | 144,367 / 139,784 | 候选 B 早期中间版本，仅存档 |
| `verify-candidateB-final.png` | 168,282 | **候选 B 冻结版**成功态 1440×900 |
| **`verify-cdp-A-390.png`** | **58,913** | **CDP 真实 390 CSS px 视口 · 候选 A** |
| **`verify-cdp-B-390.png`** | **55,240** | **CDP 真实 390 CSS px 视口 · 候选 B** |

渲染 DOM、探针脚本与原始输出保存于临时取证目录 `C:/Users/91464/AppData/Local/Temp/parity-dom/`（非交付物，供追溯）。

**四轴裁决**

| 轴 | 结论 |
| --- | --- |
| 视觉 | **不可比** —— 无参考截图，无法比布局 / 间距 / 字号 / 颜色 / 图标 / 层级；但「移动 390 CSS px 是否存在 CSS 溢出」已由 CDP 独立判定为**非缺陷**（见专节），不再是不可比项 |
| 交互 | **部分可比** —— 仅对照公开文档行为规格与本队 V-01～V-43 / 边界矩阵 / C1–C9 契约；候选 B 13 状态 13/13、12 项补齐清单逐项实测生效；候选 A（非交付物）残留 2 重要 + 1 次要 |
| 网络 | **不可比** —— 证据包 §C.4 / §E.4 为空表，参考侧 0 条请求捕获；复刻品纯前端占位，`fetch` / `XMLHttpRequest` / `WebSocket` 0 命中 |
| IPC | **不适用** —— 非 Electron 目标 |

## 不可比项（含原因）

| 项 | 原因 |
| --- | --- |
| 视觉逐项比对（布局 / 间距 / 字号字重 / 颜色 / 图标 / 层级遮挡） | 参考目标受登录墙 + Cloudflare 403 保护，G0 硬门禁禁止绕过；目标页参考截图 0 张。无同条件参考输出，不比对、不下结论。 |
| 网络比对（请求数量与顺序 / URL 与方法 / 状态码 / 响应字段形状 / 触发时机） | `recon/evidence-pack.md` §G-07 记录请求 / 接口迹象 0 条，§C.4 / §E.4 为空表；复刻品按路线要求纯前端占位、零外部请求。两侧均无可比请求序列。 |
| IPC 比对 | 交付物为静态网页，非 Electron 应用，无 IPC 通道、preload API 或主进程行为。 |
| 参考站服务端私有逻辑 / 真实 API 响应 / 登录态数据 / 随机数据 | 依赖登录后会话与私有接口，合规范围内不可观察（`docs/01-recon-findings.md` H-1 / H-2）。 |
| 参考站真实模块名 / 第三方数据源名 / 真实价格 / 受保护文案 | 路线明确要求不复刻、不对齐，且合规禁止出现。 |

> **移动 390 CSS px 已从「不可比」转为「已判定」**：上轮因 Edge headless `--window-size=390` 被 clamp 到 492/518 CSS px 而列为取证限制。本轮改用 CDP `Emulation.setDeviceMetricsOverride` 获得 `iw=cw=sw=390` 的真实视口并完成元素级归因，结论见「移动端裁切独立复核」专节，故不再作为不可比项。与**参考站移动版**的视觉对齐仍不可比。

## 阻断级

> **当前未解决阻断级差异：0 条。**
> **归属声明（表下加注，逐条适用）**：下表 B-01、B-00 两条**全部归属候选 A（非交付备用原型 / 已知问题）**，不纳入 G4 门禁判定；**候选 B（正式交付入口）无任何阻断级差异**。B-00 是初始任务线索的重新判定，B-01 为已修复的历史记录。

| # | 现象 | 复现步骤 | 证据 | 期望 vs 实际 | 级别 |
| --- | --- | --- | --- | --- | --- |
| B-01 | `[A·非交付]` 候选 A 多源模块结果表列头与单元格系统性错配（`6` 表头 / `7` 单元格，「置信度」列显示来源名、「操作」列显示百分比）。 | Edge 打开 `standalone.html?state=success&demo=1#/search`，切到 `t1` / 模块 `t1-m2`，检查渲染后 `<th>` 与 `<tbody>` 首行 `<td>` 数及文本。 | 修复前：`verify-multi-columns.png`、`verify-A.mjs` 输出 `th=6 / td=7 / 列数一致: NO`。**收口复验 `23:28:16` `A-verify-out.html`**：`B-01 th数 = 6`、`B-01 td数 = 6`、`B-01 列数一致 = YES`、`表头 = 书签、已补充、命中标识、命中来源、置信度、操作`、`首行 = ☆、否、demo.handle.01、北向索引、92%、以此线索再查`、`置信度列值 = 92%`、`操作列值 = 以此线索再查`。 | **期望**：列头与单元格一一对应。**修复前实际**：6/7 错配。**收口实际**：6/6 且字段对应正确 → **已消除**。 | 阻断（已消除，A 非交付物） |
| B-00（线索） | `[A/B 重新判定]` 初始任务线索：「候选 B 是切片 1 骨架，核心流程不可用」。 | 用当前磁盘文件打开 `site/index.html?state=success#/search`，`--dump-dom` + 截图检查是否含查询构成 / 模块卡 / 结果表 / 三计数。 | 上轮 `22:05` 团队已告知旧快照失效；**收口复跑 `23:27:31`**：`probe-B.mjs` `命中 17 / 17`、13 状态 `13 / 13`、`selftest.mjs` `55 / 0`、12 项全实现、`verify-candidateB-final.png`（168,282 B）为完整工作台。 | **期望**：主实现为可用工作台。**当前磁盘实际**：完整工作台，无骨架占位 → **已消除**。该线索从未列入上轮分级表（按 `22:05` 指示以当前磁盘状态为准），本轮按 team-lead 要求单独重新判定。 | 阻断（已消除） |

## 重要级

> **归属声明（表下加注，逐条适用）**：下表 I-01、I-02、I-03、I-04 四条**全部归属候选 A（非交付备用原型 / 已知问题）**，不纳入 G4 门禁判定；**候选 B（正式交付入口）无任何重要级差异**（对应能力均已实测实现，见 12 项清单）。

| # | 现象 | 复现步骤 | 证据 | 期望 vs 实际 | 级别 |
| --- | --- | --- | --- | --- | --- |
| I-01 | `[A·非交付]` 候选 A 表头排序未实现（V-20）。 | 候选 A `success` 态点击结果表列头，比较前后行序；检索源码排序处理器。 | **收口复验 `23:28:16` `A-verify-out.html`**：`I-01 排序控件数 = 0`、`I-01 点击列头前行序 = ☆,☆,☆,☆,☆,☆`、`I-01 点击列头后行序 = ☆,☆,☆,☆,☆,☆`、`I-01 行序是否变化 = NO`；`interaction-harness.mjs` `FINDING V-20 表头可排序：源码无 sort 处理器 → 未实现`；源码 grep 0 命中。 | **期望**：点击列头改变行序。**实际**：无处理器、点击无响应 → **未消除（非交付物，保留）**。对照：候选 B 多源 3 / 单源 4 个 `data-act="sort"` 控件，补测 `是否出现不同行序 = YES`，故不影响 G4。 | 重要（未消除，A 非交付物） |
| I-02 | `[A·非交付]` 候选 A 执行查询后切换模块，结果列集滞后。 | 候选 A 用多源模块得到 `success`，不重新查询直接切到单源模块，观察列头。 | **收口复验 `23:28:16` `A-verify-out.html`**：`I-02 切单源后表头 = 书签、标识、站点、状态、置信度、操作`、`I-02 切单源后 th/td = 6/6`、`I-02 仍为多源列集(滞后) = NO`、`I-02 切回多源表头 = 书签、已补充、命中标识、命中来源、置信度、操作`。 | **期望**：两套列集随模块即时切换。**修复前实际**：滞后。**收口实际**：即时且双向正确 → **已消除**。 | 重要（已消除，A 非交付物） |
| I-03 | `[A·非交付]` 候选 A 实体类型页签与过滤器不参与结果组装。 | 候选 A `success` 态点击「邮箱」等实体页签，比较结果行数。 | **收口复验 `23:28:16` `A-verify-out.html`**：`I-03 实体页签数 = 7`、`I-03 行数 before/after = 6 -> 6`、`I-03 是否收窄 = NO`；`standalone.html:775` 仍为 `case 'entity': S.entity=id; note('…（演示筛选不改动占位数据）。'); break;`。 | **期望**：按所选实体 / 过滤器收窄结果。**实际**：仅弹出提示，结果行不变 → **未消除（非交付物，保留）**。对照：候选 B 7 页签实测 `5 → 2` 收窄，故不影响 G4。 | 重要（未消除，A 非交付物） |
| I-04 | `[A·非交付]` 候选 A 会话失效回跳登录页缺少失效原因提示。 | Edge 打开 `standalone.html?state=session-expired#/search`（**不带** `&demo=1`），读取可见文本。 | **收口复验 `23:28:16` `A-session-final.html`**：`会话已失效: 3`、`请重新登录: 3`；可见文本含「会话已失效，请重新登录演示会话。」。修复前 `verify-A.mjs` 为 `NO`。 | **期望**：回跳登录页给出失效原因。**修复前实际**：无提示。**收口实际**：明确提示 → **已消除**。 | 重要（已消除，A 非交付物） |

## 次要级

> **归属声明（表下加注，逐条适用）**：下表 M-01、M-02 两条**全部归属候选 A（非交付备用原型 / 已知问题）**，不纳入 G4 门禁判定；**候选 B（正式交付入口）无任何次要级差异**。

| # | 现象 | 复现步骤 | 证据 | 期望 vs 实际 | 级别 |
| --- | --- | --- | --- | --- | --- |
| M-01 | `[A·非交付]` 同一特殊字符输入，两个候选给出不同校验结果。 | 查询输入分别填 `'` `"` `&` `/` `\`，两候选各触发一次校验。 | **收口复验 `23:28:16` `A-verify-out.html`**：`M-01 text "'" = 放行 code=ok`，`"` `&` `/` `\` 均 `放行 code=ok`，仅 `<` `>` 为 `拦截 code=special`；候选 B `selftest.mjs` E2「特殊字符拦截（引号 / 尖括号 / 换行 / 控制字符）」通过，B 的 `core.js` md5 未变。 | **期望**：验证计划边界矩阵列有「特殊字符」但未枚举具体集合，期望口径不完全定义；按「同输入同输出」两入口应一致。**实际**：A 放行引号类与 `&` / 斜杠 / 反斜杠，B 拦截引号类 → **未消除（非交付物，保留）**。因规格未定义集合、且 A 非交付物，不升级、不影响 G4。 | 次要（未消除，A 非交付物） |
| M-02 | `[A·非交付]` 自测文档记录与实测断言数不一致（51/0 vs 52/0）。 | 运行 `node site/tests/standalone-selftest.mjs`，对照**正确的记录对象** `docs/03a-standalone-selftest.md`（上轮误查为 `docs/03-selftest.md`，本轮更正）。 | **收口复核 `23:26:39`**：实测 `通过 52 项，失败 0 项`（EXIT=0）；`docs/03a-standalone-selftest.md:28` 已为「通过 52 项，失败 0 项」，`:32` / `:34` 出现的 `51/0` **仅为 49→50→51→52 的历史演进说明**且明确写「已按脚本真实输出校正为 52/0」；`docs/04-delivery-report.md §1.4`（`:41`）为 `52/52`。 | **期望**：文档记录与实测一致。**修复前实际**：51/0 vs 52/0 矛盾。**收口实际**：当前记录为 52/0，与实测一致 → **已消除**。 | 次要（已消除，A 非交付物） |

> **探针自身误判的更正（不计入实现差异）**：① B12 探针「多源排序生效 = NO」是只点击 1 次所致，B12b 按每个 `sort` 控件点击 2 次后多源 / 单源均 `是否出现不同行序 = YES`，排序功能已实现。② B12 / cost2 / cost3 探针「取消来源后成本未实时变化」是**漏点「应用筛选」**所致——弹窗用草稿态 `draftSourceIds`（`app.js:638/890`），须经 `filter-apply`（`app.js:806`）写回 `selectedSourceIds`；按正确路径 `cost4-out.html` 实测弹窗成本 `6 → 4` 实时、应用后主界面 `6 → 4`、执行实际扣减 `4` 点，三者一致，**无差异**。③ `?demo=1` 未被候选 B 识别导致 cost3 首次落在登录页，改用 `?state=idle` 后恢复正常。④ 收口复跑时逐行流入探针首次误用 `?state=success` 得到 `skeletonLike=0`，改用正确 `?state=loading` 后复现 `2 → 8 → 14`。

## 12 项补齐清单逐项实测（候选 B · 正式交付入口，不预设已实现）

| # | 项 | 实测结果 | 证据 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | 主题切换 + localStorage | 点击 `theme-toggle`：`data-theme light → dark`，写 `guanlan-demo-theme=dark`；`?theme=dark` → `data-theme="dark"`、`?theme=light` → `data-theme="light"` | `B12-out.html` / `u-dark.html` / `u-light.html` | 已实现 |
| 2 | 三视图分段 | 3 个按钮 `basic/advanced/agent`，`active` 正确迁移；`?view=` 文本长度 `1699 / 1947 / 514`，`basic vs advanced = DIFF`、`basic vs agent = DIFF`，agent 为「整页替换为推广卡与进入按钮」 | `B12-out.html` / `check-urls.mjs` | 已实现 |
| 3 | `#/reset` | 「重置演示密码」「填写演示邮箱后获取验证码…不会发送任何真实邮件，也不连接外部服务」「发送验证码 / 返回登录」 | `u-reset.html`（216 字） | 已实现 |
| 4 | 结果 / 书签双 tab | 2 个 tab「结果 / 书签 1」，切换后行数 `5 → 1` | `B12-out.html` | 已实现 |
| 5 | 两套结果列集 + 排序 | 单源 `7` 列 → 点「多源并查」→ `6` 列，且两套 `th/首行td = 7/7`、`6/6` 一致；`sort` 控件多源 3 / 单源 4，多源与单源补测均 `是否出现不同行序 = YES` | `B12-out.html` / `B12b-out.html` / `B3-out.html` / `B-final.html` | 已实现 |
| 6 | 实体类型页签 | 7 个（全部 / 邮箱 / 电话 / IP / 域名 / URL / 钱包），点击后 `5 → 2` 收窄 | `B12-out.html` | 已实现 |
| 7 | 关联线索为空独立状态 | `?state=no-connections` 含「关联线索为空，但已找到直接线索」1 次、「口径差异」3 次；`?state=success` 对照该短语 0 次 | `u-noconn.html` / `u-dark.html` | 已实现 |
| 8 | 加载逐行流入 | `?state=loading` 骨架占位 `t0=2 → t600=8 → t1600=14` 递增（收口复跑 `23:27:31` 用正确 URL 复现） | `stream-final2.html` / `stream-final.html` | 已实现 |
| 9 | 配置弹窗双变体 | `?modal=filter`（1938 字）vs `?modal=sources`（1997 字）`DIFF`；弹窗内「过滤条件 / 来源开关」两 tab；两个 `gear` 对应固定成本 / 浮动成本文案不同；11 个来源勾选项 | `u-mfilter.html` / `u-msources.html` / `B2-interact-out.html` | 已实现 |
| 10 | Case 历史面板 | `#/cases` 含「留存 Case」「搜索历史」「暂无历史。执行一次保留模式的查询后会写入这里。」及 Case 面板（日常核查 / 专题线索 A / 临时留存） | `u-cases.html` / `B2-cases-out.html` | 已实现 |
| 11 | 输入 label 随模块 | 模块 0 `检索词`、模块 1 `用户名`、模块 2 `待核查线索`；③ label 与描述面板「输入项：」一致，三个互不相同 | `B12-out.html` | 已实现 |
| 12 | 成本三档区间 | 免费（`0`）/ 固定（`min=max`）/ 浮动（`浮动区间 1 – 9 点`）；取消来源：弹窗总成本 `6 → 4` 实时、应用后主界面 `6 → 4`、执行扣减 `4` 点，三者一致 | `B12-out.html` / `cost4-out.html` / `data.js:203-225` / `app.js:635-694` | 已实现 |

> 12 项**按实际结果分级：全部无差异**，且均归属候选 B（正式交付入口）。附加参数 `?theme=` / `?view=` / `?modal=` 经 `app.js:1818-1839` 实现并由 URL 批量复验生效，未预设。

## 移动端裁切独立复核（不照抄工程师结论）

**方法**：不依赖 `--window-size=390,844`（已证实被 clamp 到 `cw=518`）。改用 Edge `--remote-debugging-port` + Node 22 内置 `WebSocket` 直连 CDP，调用 `Emulation.setDeviceMetricsOverride({width:390,height:844,deviceScaleFactor:1,mobile:true})`，再用 `Runtime.evaluate` 逐元素测量 `getBoundingClientRect()` 并**回溯祖先的 computed `overflow-x`** 分类，同时 `Page.captureScreenshot` 存图。

**实测数据（真实 390 CSS px）**

| 项 | 候选 A（非交付） | 候选 B（交付） |
| --- | --- | --- |
| `innerWidth / clientWidth / scrollWidth / outerWidth / dpr` | `390 / 390 / 390 / 390 / 1` | `390 / 390 / 390 / 390 / 1` |
| `docOverflow`（`scrollWidth > clientWidth`） | `false` | `false` |
| 超出右边界元素数 | 47 | 114 |
| 祖先分类 | `SCROLLABLE: 47`、`CLIPPED: 0`、`NO_ANCESTOR: 0` | `SCROLLABLE: 114`、`CLIPPED: 0`、`NO_ANCESTOR: 0` |
| 主要滚动容器 | `auto@card sidenav` ×24、`auto@DIV` ×23（body 为 `hidden`） | `auto@table-scroll` ×51、`auto@type-nav` ×44（另有 svg 内 `hidden`，但其祖先仍有 `auto`） |
| `maxRight` | 1709 | 1941 |
| CDP 截图 | `site/tests/verify-cdp-A-390.png` | `site/tests/verify-cdp-B-390.png` |

**结论**：在真实 390 CSS px 视口下，两个候选**均无文档级 CSS 横向溢出**（`scrollWidth === clientWidth === 390`）；所有 `rect.right > 390` 的元素**全部位于 `overflow-x:auto` 的横向可滚动容器内**（侧栏导航、18 类类型导航、结果表 `.table-scroll`），没有被 `overflow:hidden` 永久裁剪、也不存在无滚动祖先约束的真实溢出，用户可横向滑动查看。CDP 截图显示 A 为单列 + 2 列模块卡网格、B 为单列 + 横向类型导航，右侧无内容被切断。**因此 D-1 不作为实现 CSS 缺陷计入差异。**

**与工程师说法的逐条比对**

| 工程师说法 | 我的独立结论 |
| --- | --- |
| `innerWidth≈492/518` 且 `scrollWidth` 相等 | **成立**。`--window-size=390` 下实测 `cw=iw=sw=518`、`outerWidth=552`，headless 最小 CSS 视口约 492–518，PNG 仅 390 宽，右侧约 128 CSS px 被截图裁剪——`verify-viewport-probe.png` 亦为 `518`。 |
| 「无 CSS 横向溢出，是工具限制而非页面缺陷」 | **结论成立，且推进到真实 390 CSS px 视口下验证**：`docOverflow=false`、溢出元素全部 `SCROLLABLE`。 |
| 「offenders 全部是 `.type-item`（18 类导航 `overflow-x:auto` 内条目）」 | **不准确**。候选 B 的 114 个溢出元素中，51 个祖先是 `auto@table-scroll`（结果表）、44 个是 `auto@type-nav`；按 class 统计为 `type-item:15`、`(none):79`、`grid:1`、`th-sort:2`、`sort-arrow:2`、`link-btn:5`、`tiny:4`、`tag tag-warn:1` 等。候选 A 的 47 个全是 `.navitem`（`.card.sidenav`），**根本不是 `.type-item`**。归因范围被缩小，但不影响「非缺陷」结论。 |

> 说明：`--window-size=390` 的 PNG 裁切与 CDP 真实 390 视口是两个不同现象；前者是取证工具限制，后者证明页面在真实窄视口下也不产生不可达内容。二者共同支持 D-1 不成立。

## 自测重跑记录（命令 + 真实输出摘要 + 退出码）

| 命令 | 真实输出摘要 | 退出码 |
| --- | --- | --- |
| `node site/tests/standalone-selftest.mjs` | `通过 52 项，失败 0 项`（7 组：C1 校验 / C2-C3 成本批量 / C4 状态机 / C5-C6 结果 / C7-C9 额度 CSV 模式 / 合规结构 / HTTP 可达性）；**收口复跑 `23:26:39` 同为 52/0** | 0 |
| `node site/tests/selftest.mjs` | `通过 55 / 失败 0`（E1 UMD、E2 C1/C2/C3/C9、E3 C4/C5/C7/C8、E4 F-03 / E.2 / P01 / P03 / F-09 / P07-P14 / 合规 grep / 静态 200）；**收口复跑 `23:26:39` 同为 55/0** | 0 |
| `node --check site/data.js site/core.js site/app.js` | `ALL_SYNTAX_OK`（`23:26:39` 复跑） | 0 |
| 自建 `http-check.mjs`（Node 内置 http server） | `HTTP 检查：6/6 通过`；`standalone.html 60728 / index.html 9611 / styles.css 36374 / data.js 21199 / core.js 28998 / app.js 99007` 全部 `status=200` 且非空（`23:26:39` 复跑） | 0 |
| 合规重扫（`23:26:39`） | `禁用词=0 外部引用=0 fetch类=0` | — |
| 自建 `interaction-harness.mjs`（Node `vm`，候选 A V-01～V-43 + 边界矩阵） | `通过 81 项，失败 0 项`；`FINDING V-20 表头可排序：源码无 sort 处理器 → 未实现` | 0 |
| 自建 `A-verify.html` 探针（7 条差异按原步骤复验） | 收口复跑 `23:28:16`：见「阻断级 / 重要级 / 次要级」各表证据列 | — |
| 自建 `B12.html` / `B12b.html` / `cost4.html` / `B2-stream.html` | 12 项实测 / 排序补测 / 成本正确路径 / 逐行流入；**收口复跑 `23:27:31`**：`B12-out` 主题/视图/tab/双列集/实体页签/label/成本档一致，`B12b-out` 多源 3 / 单源 4 控件均 `YES`，`cost4-out` 弹窗 `6→4`、主界面 `6→4`、扣减 `4`，`stream-final2.html` 骨架 `2→8→14` | — |
| Edge `--dump-dom` 候选 B `?state=success` + `probe-B.mjs` | **收口复跑 `23:27:31`：`命中 17 / 17`**、结果表 7 列、非登录页 | — |
| Edge `--dump-dom` 候选 B 13 个 `?state=` + `check-states.mjs` | **收口复跑 `23:27:31`：`状态复验: 13 / 13`** | — |
| 11 组参数化 URL `--dump-dom` + `check-urls.mjs` | `?theme=` / `?view=` / `?modal=` 全部生效；三视图 `DIFF`、弹窗双变体 `DIFF`；`#/reset`、`#/cases`、`no-connections`、`loading` 可复现 | — |
| CDP `cdp-390.mjs` / `cdp-overflow.mjs` | 真实 390 CSS px：`docOverflow=false`、`SCROLLABLE 47/114`、`CLIPPED 0`、`NO_ANCESTOR 0`；截图 2 张 | — |

> **收口复跑结论（`23:26:39 – 23:28:16`）**：候选 B 冻结版六文件 md5 与 `23:01:53` 冻结值逐项一致；在其上重跑两套自测、语法、HTTP、合规、17 项 DOM 探针、13 状态遍历、12 项 / 排序 / 成本 / 逐行流入探针，结果与前轮完全一致。**A 的三项修复仅改 `standalone.html`，未连带改坏 B。**

**覆盖情况**：正常路径（选类型 → 选模块 → 配置来源并应用 → 输入校验 → 成本 → 执行 → 结果 / 三计数 / 双 tab / 导出 / 书签 / 额度扣减）、空状态（idle / noresults / no-connections / 空历史 / 空书签）、错误态（credits / source-down / partial / timeout / network / invalid / bulk-limit / session-expired）、边界输入（空值 / 纯空格 / 首尾空格 / 完整 URL / `www.` / 超长 >256 / 特殊字符 / 中文 / emoji / 邮箱 / 号码 / 域名 / 批量 1·5·6 / 余额等于成本 / 余额差 0.01 / 数据源全关 / 过滤器全收紧 / 翻页末页）均已跑到。

## 合规复核结果

扫描范围 `site/*.html`、`site/*.js`、`site/*.css`（不含 `site/tests/` 与临时取证目录），`23:26:39` 收口复跑重扫。

| 项 | 结果 |
| --- | --- |
| 禁用词（`UserSearch` `usersearch` `OneScan` `S.A.R.G.E` `PIPL` `EPIEOS` `HaveIBeenPwned` `HudsonRock` `IntelX` `Alexa` `Gravatar` `coral-orange`） | **0 命中** |
| 外部资源引用 `(src\|href)="(https?:)?//"` | **0 命中** |
| `fetch(` / `XMLHttpRequest` / `new WebSocket` | **0 命中** |
| `https?://` 字面量 | 3 处，均为内联 SVG 的 `xmlns="http://www.w3.org/2000/svg"`（`styles.css:142/434` 的 data-URI、`index.html:14` 的 svg-sprite），XML 命名空间标识符，不发起网络请求 |
| 邮箱形态 | 全部为 `demo*@north.invalid` / `demo@north.invalid`（RFC 2606 保留 `.invalid` TLD）合成占位，**无真实个人信息** |
| 真实价格 / 受保护文案 / 第三方数据源名 / 鉴权绕过逻辑 | 0 命中；成本点数均为占位数值；仅存在 `?state=` / `?theme=` / `?view=` / `?modal=` 演示脚手架 |
| 入口依赖 | `index.html` 仅引用本地 `styles.css` + `data.js` / `core.js` / `app.js`；`standalone.html` 零外部引用 |

结论：**合规复核通过**。

## 复验记录（7 条，已回填）

| 差异 # | 复验结果 | 复验时间 | 复验证据（命令 / 输出 / 截图） | 归属 |
| --- | --- | --- | --- | --- |
| B-01（多源列错位，阻断） | **已消除** | `2026-11-06 23:28:16 +0800` | `node make-A-verify.mjs` + Edge `--dump-dom` → `A-verify-out.html`：`B-01 th数=6 / td数=6 / 列数一致=YES`，`置信度列值=92%`、`操作列值=以此线索再查`；对照修复前 `site/tests/verify-multi-columns.png`；`standalone.html` md5 `7eeee3bb…` | A 非交付 |
| I-01（表头排序，重要） | **未消除（非交付物，保留）** | `23:28:16` | `A-verify-out.html`：`排序控件数=0`、点击前后行序均 `☆,☆,☆,☆,☆,☆`、`行序是否变化=NO`；`interaction-harness.mjs` FINDING 仍在；源码 grep 0 命中。B 有 3/4 个 sort 控件且 `B12b-out` 补测 `YES` → **不影响 G4** | A 非交付 |
| I-02（列集滞后，重要） | **已消除** | `23:28:16` | `A-verify-out.html`：切单源 `书签、标识、站点、状态、置信度、操作` 且 `6/6`、`仍为多源列集(滞后)=NO`、切回多源恢复多源列头 | A 非交付 |
| I-03（实体页签/过滤器，重要） | **未消除（非交付物，保留）** | `23:28:16` | `A-verify-out.html`：`实体页签数=7 / 行数 6→6 / 收窄 NO`；`standalone.html:775` 仍只 `note(...)`。B 实测 `5→2` 收窄 → **不影响 G4** | A 非交付 |
| I-04（会话失效提示，重要） | **已消除** | `23:28:16` | Edge `--dump-dom` `standalone.html?state=session-expired#/search`（无 `demo=1`）→ `A-session-final.html`：`会话已失效: 3`、`请重新登录: 3`，可见「会话已失效，请重新登录演示会话。」 | A 非交付 |
| M-01（特殊字符口径，次要） | **未消除（非交付物，保留）** | `23:28:16` | `A-verify-out.html`：`'` `"` `&` `/` `\` 全部 `放行 code=ok`，仅 `<` `>` 拦截；B `core.js` md5 未变、E2 仍拦截引号类。规格未定义集合且 A 非交付 → **不影响 G4** | A 非交付 |
| M-02（文档数字漂移，次要） | **已消除** | `2026-11-06 23:26:39 +0800` | 正确对象 `docs/03a-standalone-selftest.md:28` 已为「通过 52 项，失败 0 项」；`:32`/`:34` 的 `51/0` 仅为 49→50→51→52 历史演进说明且写明「已按脚本真实输出校正为 52/0」；`docs/04-delivery-report.md §1.4(:41)` 为 `52/52`；实测 `standalone-selftest.mjs` 52/0 EXIT=0 | A 非交付 |

> **M-02 备注**：组长「明确不修」清单中曾列出该项，但当前磁盘文档已实际修正，故按实测判定「已消除」；上轮报告误把 `docs/03-selftest.md` 当作记录对象，本轮已更正为 `docs/03a-standalone-selftest.md`。无论是否消除，该差异均属 A 的非交付物问题，不进 G4。
>
> **B-00（候选 B 骨架线索，阻断级）**：不在上述 7 条差异表内，按 team-lead 要求单独重新判定为 **已消除**（`23:27:31`：`17/17` DOM 探针、`13/13` 状态、`55/0`、12 项全实现、`verify-candidateB-final.png`）。
>
> **3 条未消除项为何不影响 G4**：I-01 / I-03 / M-01 全部归属候选 A（非交付备用原型），按组长裁决不纳入 G4 门禁；候选 B 已实现对应能力（表头排序、实体页签收窄、特殊字符引号类拦截），且无核心流程不可用、无数据错误、无阻断级差异。
>
> **复验纪律**：以上结论均由本人按各条**原始复现步骤**重新采集，未采信任何「已修好」声明；对探针自身 4 处口径误判（排序点击次数、漏点「应用筛选」、`?demo=1` 未被识别、stream 误用 `?state=success`）已主动更正并标注，未计入实现差异。若后续 `standalone.html` 再次变更，须由本人重跑并回填。

---

> **G4 门禁判定输入（报告结尾）**：候选 B 冻结版（`index.html` 9,611 B / `app.js` 99,007 B / `core.js` 28,998 B / `data.js` 21,199 B / `styles.css` 36,374 B，md5 与 `23:26:39` 冻结值逐项一致）**不存在未解决阻断级差异（0 条）**，亦无任何重要 / 次要差异；13 状态 `13/13`、12 项补齐清单逐项实测全部已实现、渲染 DOM 探针 `17/17`、自测 `55/0`、语法 OK、HTTP `6/6`、合规通过。**最终结论：达到可交付条件。**
