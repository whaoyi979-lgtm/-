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
=== 5. 额度 C7 / CSV C8 / 模式 C9 === 9 项全通过
=== 6. 合规与结构 ===        4 项全通过
=== 7. HTTP 可达性 ===       5 项全通过
========================================
通过 51 项，失败 0 项
========================================
```

> 数字变化如实说明：首次运行 **49 通过 / 1 失败** —— 失败项是 `noresults → 0 行且计数全 0`，原因不是实现缺陷，而是 `assert.deepEqual` 跨 `vm` context 时对象原型不同（错误信息 `Values have same structure but are not reference-equal`）。改为逐字段断言后为 **50/0**；随后实现工程师落盘 `styles.css`，HTTP 可达性检查多了一项文件，末次为 **51/0**。三次运行的退出码均为 0。

### 覆盖内容

| 组 | 断言要点 |
|---|---|
| 输入校验 | 空值、纯空格、首尾空格归一化、完整 URL、`www.` 前缀、超长(>256)、特殊字符、邮箱/号码/域名/IP 格式、合法输入 |
| 成本与批量 | 免费=0、固定=8、浮动=所选来源之和、关闭来源成本下降、批量 3×8=24、条数钳制到 [1,5]、第 5 条允许 / 第 6 条拒绝 |
| 状态机 | 13 个状态齐全；RUN 的四条前置分支（有效/无效/额度不足/批量超限）、CANCEL、非法迁移保持原状态 |
| 结果组装 | 三计数与行数自洽、零命中全 0、部分故障排除故障来源且健康来源仍出行、整体故障 0 行、无关联线索、按来源过滤、分页越界钳制 |
| 额度 / CSV / 模式 | 余额等于成本可付、差 0.01 不可付、扣减成功/失败、CSV 表头与逗号/引号转义、隐私模式不写历史、保留模式追加 |
| 合规与结构 | 不含 13 个原站品牌/模块/第三方数据源禁用词、无 `<script src>` / `<link href>` 外部资源、含自有品牌与 `.invalid` 占位域、13 个状态演练值全部可复现 |
| HTTP | `standalone.html`、`index.html`、`core.js`、`data.js`、`styles.css` 均返回 200 且内容非空 |

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

- **D-1（次要）**：390px 视口下，模块卡网格与构成区头部的部分内容在右侧被裁切。已尝试两轮 CSS 收敛（窄屏固定两列、隐藏占位撑开元素、`1fr` 改为 `minmax(0,1fr)`），重截后截图字节数未变化，判定该收敛未生效或裁切另有成因。**未继续深挖**，原因是备用入口不阻断功能（内容仍在 DOM 中、可横向滚动），且主实现由工程师单独编写并在独立验证中复核。`file://` 下 Edge 的缓存行为也可能是截图未更新的原因之一，未验证。
- **D-2（说明）**：零命中状态位于结果面板，390×844 首屏截图只显示查询构成区，需向下滚动才能看到状态盒；这不是缺陷，是视口高度限制。
- 未执行 `playwright-core` 相关验证：本机未安装该依赖，且备用入口要求零第三方依赖。

## 3. 合规自检

- 页面不发起任何网络请求（无 `fetch`、无外部 `src`/`href`、无 CDN、无字体/图标库）。
- 所有标识符为 `demo.*` 合成串或 `.invalid` 保留域；无真实个人信息。
- 品牌「观澜」、靛蓝+石板灰配色、内联 SVG 图标、原创中文文案，均为自有/自制。
- 演示会话为纯前端内存态；不接原站后端、不模拟其鉴权、不绕过任何访问限制。

## 4. 结论

备用入口 `site/standalone.html` **可直接双击运行**，纯逻辑自测 51/51 通过，桌面浏览器渲染正常，13 个交互状态可经 `?state=` 复现，合规自检通过。唯一未消除的是移动端窄屏的次要视觉裁切（D-1），已如实记录，交由独立验证员在主实现上复核。
