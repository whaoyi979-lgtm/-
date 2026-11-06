# 自测与运行证据 · 自包含备用入口

> 对象：`site/standalone.html`（组长编制的零依赖单文件备用入口）+ `site/tests/standalone-selftest.mjs`
> 环境：Windows 11 / Node v22.22.2 / Microsoft Edge（headless）/ 2026-11-06 21:24–21:29 GMT+8
> 说明：主实现 `site/index.html` + `data.js` + `core.js` + `app.js` + `styles.css` 由实现工程师负责，其自测与独立验证另见 `docs/05-parity-report.md`。本文只记录备用入口的运行证据。

## 1. 自动化自测

命令：

```bash
node site/tests/standalone-selftest.mjs
```

脚本用 `node:vm` 在隔离沙箱中执行 HTML 内联脚本（提供 document/window/location/localStorage 的最小 stub），取出 `CORE` 纯逻辑做断言，再用 `node:http` 起本地服务验证静态文件可达。零第三方依赖。

**真实输出（末次运行）**

```
=== 1. 输入校验 C1 ===     11 项全通过
=== 2. 成本 C2 / 批量 C3 === 8 项全通过
=== 3. 状态机 C4 ===        7 项全通过
=== 4. 结果组装 C5 / C6 === 7 项全通过
=== 5. 额度 C7 / CSV C8 / 模式 C9 === 8 项全通过
=== 6. 合规与结构 ===        4 项全通过
=== 7. HTTP 可达性 ===       7 项全通过
========================================
通过 52 项，失败 0 项
========================================
```

> 数字变化如实说明：首次运行 **49 通过 / 1 失败** —— 失败项是 `noresults → 0 行且计数全 0`，原因不是实现缺陷，而是 `assert.deepEqual` 跨 `vm` context 时对象原型不同（错误信息 `Values have same structure but are not reference-equal`）。改为逐字段断言后为 **50/0**；随后实现工程师落盘 `styles.css`，HTTP 可达性检查多了一项文件，为 **51/0**；最终 HTTP 组补齐到 `app.js` / `core.js` / `data.js` / `index.html` / `standalone.html` / `styles.css` 六项 200 检查 + 一项「含应用根节点」结构检查，共 7 项，总数 **52/0**。每次运行的退出码均为 0。
>
> 早期版本本文曾记为 51/0（第 5 组误记 9 项、第 7 组误记 5 项），已按脚本真实输出校正为 52/0；该记录偏差曾被独立验证员列为次要差异 M-02，见 `docs/05-parity-report.md` 复验记录。

### 覆盖内容

| 组 | 断言要点 |
|---|---|
| 输入校验 | 空值、纯空格、首尾空格归一化、完整 URL、`www.` 前缀、超长(>256)、特殊字符、邮箱/号码/域名/IP 格式、合法输入 |
| 成本与批量 | 免费=0、固定=8、浮动=所选来源之和、关闭来源成本下降、批量 3×8=24、条数钳制到 [1,5]、第 5 条允许 / 第 6 条拒绝 |
| 状态机 | 13 个状态齐全；RUN 的四条前置分支（有效/无效/额度不足/批量超限）、CANCEL、非法迁移保持原状态 |
| 结果组装 | 三计数与行数自洽、零命中全 0、部分故障排除故障来源且健康来源仍出行、整体故障 0 行、无关联线索、按来源过滤、分页越界钳制 |
| 额度 / CSV / 模式 | 余额等于成本可付、差 0.01 不可付、扣减成功/失败、CSV 表头与逗号/引号转义、隐私模式不写历史、保留模式追加 |
| 合规与结构 | 不含 13 个原站品牌/模块/第三方数据源禁用词、无 `<script src>` / `<link href>` 外部资源、含自有品牌与 `.invalid` 占位域、13 个状态演练值全部可复现 |
| HTTP | `app.js`、`core.js`、`data.js`、`index.html`、`standalone.html`、`styles.css` 六个文件均返回 200 且内容非空；另检查 `standalone.html` 含应用根节点 |

## 2. 真实浏览器截图

使用 Edge 无头模式（零额外依赖）：

```bash
"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless --disable-gpu \
  --no-sandbox --hide-scrollbars --window-size=1440,900 --virtual-time-budget=3000 \
  --screenshot="site/tests/workbench.png" \
  "file:///C:/Users/91464/WorkBuddy/2026-11-06-20-52-57/site/standalone.html?state=success&demo=1#/search"
```

| 文件 | 视口 / 状态 | 观察结论 |
|---|---|---|
| `site/tests/workbench.png` | 1440×900 · `?state=success` | **页面正常渲染**：中文清晰无缺字；顶栏（状态、额度、案件、模式、主题）、左导航、检索类型、模块卡网格、单次成本行、结果面板双 tab、三计数 tile、带列头的结果表与操作按钮全部可见；无报错文本 |
| `site/tests/credits-state.png` | 1280×800 · `?state=credits` | 额度不足状态可经 URL 参数复现（文件已生成） |
| `site/tests/mobile-noresults.png` | 390×844 · `?state=noresults` | 单列布局、中文可读；**但模块卡网格第二列右侧仍有裁切**，见下方差异记录 |

### 已记录但未消除的次要差异

- **D-1（已撤销，非缺陷）**：390px 视口下，模块卡网格与构成区头部的部分内容在右侧被裁切。曾尝试两轮 CSS 收敛（窄屏固定两列、隐藏占位撑开元素、`1fr` 改为 `minmax(0,1fr)`），重截后截图字节数未变化。本文初版判定「收敛未生效或裁切另有成因，未继续深挖」，后续曾单列为「不可比」。
  **最终独立验证结论**（`docs/05-parity-report.md`「移动端裁切独立复核」专节 + `site/tests/verify-cdp-A-390.png` / `verify-cdp-B-390.png`）：验证员改用 Edge `--remote-debugging-port` + Node 22 内置 WebSocket 直连 CDP，调用 `Emulation.setDeviceMetricsOverride` 强制**真实 390 CSS px** 视口，实测 A/B 均为 `innerWidth = clientWidth = scrollWidth = 390, dpr = 1`、`docOverflow = false`；超出右边界的 47 个（A）/ 114 个（B）元素**全部位于 `overflow-x:auto` 的横向可滚动容器内**（A：`.card.sidenav`；B：`.table-scroll` 51 + `.type-nav` 44），`CLIPPED = 0`、`NO_ANCESTOR = 0`。故**不存在不可达内容，D-1 不作为实现 CSS 缺陷计入差异，该差异撤销**。
  另有取证工具限制需区分：`--window-size=390,844` 下 Edge headless 会把 CSS 视口 clamp 到约 518 px（实测 `cw=iw=sw=518`、`outerWidth=552`），而输出 PNG 仅 390 px 宽，右侧约 128 CSS px 被**截图裁剪**——这是上一轮 `verify-mobile-390.png` 出现裁切的根因，与真实窄视口下的页面行为是两回事。备用入口仍保留 `min-width:0` / `minmax(0,1fr)` 防御加固。
- **D-2（说明）**：零命中状态位于结果面板，390×844 首屏截图只显示查询构成区，需向下滚动才能看到状态盒；这不是缺陷，是视口高度限制。
- 未执行 `playwright-core` 相关验证：本机未安装该依赖，且备用入口要求零第三方依赖。

## 3. 合规自检

- 页面不发起任何网络请求（无 `fetch`、无外部 `src`/`href`、无 CDN、无字体/图标库）。
- 所有标识符为 `demo.*` 合成串或 `.invalid` 保留域；无真实个人信息。
- 品牌「观澜」、靛蓝+石板灰配色、内联 SVG 图标、原创中文文案，均为自有/自制。
- 演示会话为纯前端内存态；不接原站后端、不模拟其鉴权、不绕过任何访问限制。

## 4. 结论

备用入口 `site/standalone.html` **可直接双击运行**，纯逻辑自测 52/52 通过，桌面浏览器渲染正常，13 个交互状态可经 `?state=` 复现，合规自检通过。初版记录的移动端窄屏裁切（D-1）经独立验证员用 CDP 强制真实 390 CSS px 视口复核，确认 `scrollWidth === clientWidth === 390`、所有超界元素均在可横向滚动容器内、`CLIPPED=0`，**判定非 CSS 缺陷，D-1 撤销**；早期截图裁切来自 Edge headless 视口 clamp 与 PNG 宽度限制。

> **交付定位**：本入口经组长裁决降级为**非交付的备用原型**，正式交付入口为候选 B（`site/index.html` + 分文件实现）。因此本入口在 `docs/05-parity-report.md` 中记录的 7 条差异**不纳入 G4 门禁判定**。最终复验后：B-01 / I-02 / I-04 / M-02 已消除（前三项于 2026-11-06 23:00 修复，文件 md5 `0a648002…` → `7eeee3bb…`；M-02 为本文的数字口径修正），I-01 / I-03 / M-01 未消除并保留为已知项。**当前未解决阻断级差异为 0**，详见差异报告「复验记录」。
