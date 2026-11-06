# 证据包 · `https://usersearch.ai/m/search` 合规范围内逆向侦察

> 交付人：甄探源（recon-analyst）｜交付时间：2026-11-06 21:0x GMT+8
> 采集窗口：2026-11-06 20:57–21:07 GMT+8（Windows / Git Bash）
> 本文件是唯一的本次侦察交付物；所有结论必须能追溯到下方「附录 3 · 证据索引」中的 URL / 命令 / 检索结果。

---

## 0. 元信息

| 项 | 内容 |
|---|---|
| **参考目标** | `https://usersearch.ai/m/search`（UserSearch 2.0 搜索页） |
| **授权依据** | 主理人（team-lead）任务定界：「对公开可见页面 + 正常交互做逆向侦察」，并明确列出硬合规边界；目标为公开可访问的站点，未使用任何凭据 |
| **本次范围** | 未登录态下公开可达页面、公开文档、公开索引/第三方介绍、公开可达静态资源的 HTTP 状态 |
| **明确不做** | 登录/注册/提交表单、调用需鉴权接口、抓取用户私有数据、绕过 Cloudflare/人机验证、解包复制构建产物源码（详见 §I） |
| **采集通道** | **合规受限的降级通道**（WebFetch + WebSearch + 朴素 GET curl）。**未使用 REA 实时网络捕获，未使用 Playwright/CDP 抓真实流量**——原因见附录 1 |
| **登录态** | 全程刻意保持未登录 |

### 证据分级（全文强制使用，禁止混排）

| 标记 | 含义 | 判据 |
|---|---|---|
| **【实测】** | 本次亲自通过 WebFetch / 朴素 curl 直接观察到的结果 | 有 URL + 返回文本/状态码 |
| **【公开】** | 公开文档、官方营销页、第三方评测/索引的原文 | 有可核验的公开 URL 或检索结果标题 |
| **【推断】** | 由上述两类推出的结论，**未经验证** | 必须写明「待验证」与影响面 |

> ⚠️ **最关键的一条口径**：`/m/search` 本体在本次合规范围内**未登录不可见**，因此关于该页 DOM / 路由 / 脚本 / 接口的一手证据为 **0**。下文 §B–§F 中关于「搜索页」的结构与字段，**全部是同品牌公开文档的类比描述**，一律标【公开】或【推断】，绝不标【实测】。此点与 team-lead 交叉验证结论一致（`recon/team-lead-crosscheck.md` 第 93–98 行）。

> **「目标页直接证据」与「同品牌公开文档佐证」的界限**（team-lead 本轮补充要求）：
> - **目标页直接证据** = 仅指 `usersearch.ai` 域下本次亲自 WebFetch / 朴素 curl 观察到的结果（§A、附录 3 的 **E 系列**）。就 `/m/search` 而言，这部分只有「被导向登录页 / 被 challenge 拦截」，**没有任何搜索 UI 的一手证据**。
> - **同品牌公开文档佐证** = `usersearch.com` / `usersearch.org` 的公开营销页、帮助文档、第三方评测（附录 3 的 **P 系列**，及 `recon/team-lead-crosscheck.md` 的 X1/X2）。它们描述的是**另一套域名上的产品**，仅作行为类比，**不是** `/m/search` 的实测。
> - **`/m/` 前缀可能是移动版（mobile）布局**，因此更不能据此断言 `/m/search` 与 `.com` 文档描述的**桌面工作台**完全一致 —— 已作为 **H-13** 写入未知项清单（范围级风险）。
> - 文档中的**价格、模块名、第三方数据源名、品牌名与 UI 文案，一律只作为证据记录**；实现阶段用占位数据与自有命名替换（附录 2、team-lead 交叉验证笔记第 5 行）。

---

## A. 可访问性矩阵

> 时间戳：批次 ① 20:57、② 20:58–21:00、③ 21:00–21:04、④ 21:04–21:07 GMT+8。
> 「WebFetch」与「curl」是两条**行为不同**的通道，差异见附录 1，不做绕过解释。

### A.1 WebFetch 通道（读取公开页面文本）

| # | URL | 批次 | 结果 / 状态 | 可见内容摘要 | 证据 |
|---|---|---|---|---|---|
| A-01 | `https://usersearch.ai/m/search` | ① | **登录页**，标题 `Login \| UserSearch 2.0` | `Sign in to UserSearch` / `Enter your credentials to continue` / `Email` / `Password` / `Forgot password?`(→`/m/auth/reset-password`) / `Keep me signed in` / `Sign In` / `or` / `Email me a login link` / `Continue with Google`(Google 图标 `/assets/images/icons/google.png`) / `Don't have an account? Create one`(→`/m/auth/register`) | 【实测】E01 |
| A-02 | `https://usersearch.ai/m/auth/login` | ① | **登录页**，标题同上 | 与 A-01 逐字一致 | 【实测】E02 |
| A-03 | `https://usersearch.ai/m/auth/register` | ② | **Cloudflare challenge** | 仅 `Just a moment...`；无 `<title>`、无表单、无链接 → 记为**受限**，未重试 | 【实测】E03 |
| A-04 | `https://usersearch.ai/m/auth/reset-password` | ② | **公开内容页**，标题 `Reset password \| UserSearch 2.0` | `Password Recovery` / `Enter your email below to get a code` / `Email` / `Send Code` | 【实测】E04 |
| A-05 | `https://usersearch.ai/m/search?q=test` | ② | **登录页**（带 query 参数仍被登录墙拦截） | 除 A-01 全部文案外，暴露更完整 HTML：2 个 logo、/m/auth 链接、`Support`→`usersearch.com/contact`、`Toggle theme`、`Join Now`、`Privacy Policy` / `Terms of Service` / `DPA` / `Compliance`（均指向 `usersearch.com/*`）、`© 2026 UserSearch` | 【实测】E12 |
| A-06 | `https://usersearch.ai/pricing` | ① | **登录页**（回退，无独立定价内容） | 同 A-01 | 【实测】E07 |
| A-07 | `https://usersearch.ai/pricing/` | ④ | **登录页**（回退） | 同 A-05 完整 HTML | 【实测】E24 |
| A-08 | `https://usersearch.ai/` | ④ | **Cloudflare challenge** | 仅 `Just a moment...` → **受限** | 【实测】E19 |
| A-09 | `https://usersearch.ai/m/` | ④ | 标题 `AI Agent \| UserSearch 2.0` | 仅 `No chat history yet`；无登录表单、无 challenge | 【实测】E20（含义**未验证**，见 H-7） |
| A-10 | `https://usersearch.ai/api` | ④ | **Cloudflare challenge** | 仅 `Just a moment...`；**未出现任何 JSON / endpoint 文本** → **受限**，未推断接口 | 【实测】E21 |
| A-11 | `https://usersearch.ai/help` | ② | **公开 Wiki（DokuWiki）**，标题 `wiki_front_page [UserSearch Wiki]` | `BETA 2.0` / `2.0.20` / `Version: 2.0.22` / 旧域名 `usersearch.io`（已 deprecated）/ `hello@usersearch.com` / Quick Links 11 个分区 | 【实测】E08 |
| A-12 | `https://usersearch.ai/help/doku.php?do=index` | ③ | **公开 Wiki Sitemap** | 15 个页面 id：`account_management, advanced_dashboard, basic_dashboard, bookmarks, case_management, features, history, monitor, privacy, reports, roadmap, settings, subscriptions, terms, wiki_front_page` | 【实测】E13 |
| A-13 | `.../doku.php?id=features` | ③ | 公开 Wiki 页，`Last modified: 2023/12/20` | Reverse Username/Email Searching、Internal Profile Browser、AI Profile Analysis、Results Bookmarking、Bookmark Reporting、Live Monitor、Image Forensics、Future Plans | 【实测】E14 |
| A-14 | `.../doku.php?id=basic_dashboard` | ③ | 公开 Wiki 页，`Last modified: 2023/12/08` | Basic Dashboard：输入类型 username / email / phone / image；5 步使用说明；Limitations（无高级过滤） | 【实测】E15 |
| A-15 | `.../doku.php?id=advanced_dashboard` | ③ | 公开 Wiki 页，`Last modified: 2023/12/21` | Search Table / Search Results / View Profile / Bookmarks / Details / Monitors Table（7/15/30 天刷新）/ Case Table / Case History Table / Interface Management | 【实测】E16 |
| A-16 | `.../doku.php?id=roadmap` | ③ | 公开 Wiki 页，`Last modified: 2026/10/30` | `Current Version: 2.0.23`、`Last Update: 19.09.26`；2.0.24(30.10.26, OneQuery API / Consensus / New Data Partner)、2.0.23(IP Search)、2.0.22(Domain Search)、2.0.20(Dashboard Refresh / Cyber Intelligence / Bulk Searching)… 直至 1.0.0(22.12.23) | 【实测】E17 |
| A-17 | `.../doku.php?id=privacy` | ④ | 公开 Wiki 页，`Last modified: 2023/12/25` | 「inherits from our parent webpage at `https://usersearch.org/privacy.php`」；「for this specific **premium version**」；默认记录 individual searches；可用 VPN / 临时邮箱 | 【实测】E22 |
| A-18 | `.../doku.php?id=subscriptions` | ④ | 公开 Wiki 页 | 4 种会员：`Free $0` / `Monthly $18.97` / `1-Time Payment for 3 Months` / `Yearly $159.97`；Stripe；提到 `https://usersearch.ai/pricing/`；`Membership > Pricing` 菜单路径 | 【实测】E23 |
| A-19 | `https://usersearch.ai/robots.txt` | ① | **404** `404 Not Found` | `The requested URL was not found on this server.` | 【实测】E05 |
| A-20 | `https://usersearch.ai/sitemap.xml` | ① | **404** `404 Not Found` | 同上（WebFetch 通道） | 【实测】E06 |
| A-21 | `https://usersearch.ai/about` / `/terms` / `/privacy` | ② | **404** `404 Not Found` ×3 | 同上 | 【实测】E09/E10/E11 |
| A-22 | `https://usersearch.ai/.well-known/security.txt` | ② | **404**（curl） | — | 【实测】E18 |

### A.2 朴素 GET（curl）通道 — 单次请求、无重试、无自定义 header / Cookie / 代理

命令（E18 / E25）：
`BASE="https://usersearch.ai"; for p in ...; do curl -sS -L -o /dev/null -w "code=%{http_code} type=%{content_type} size=%{size_download} path=$p" --max-time 20 "$BASE$p"; done`

| path | code | content-type | size | 判读 | 证据 |
|---|---|---|---|---|---|
| `/assets/images/icons/google.png` | **200** | `image/png` | 382 B | 公开可达静态资源 | 【实测】E18 |
| `/favicon.ico` | **200** | `image/x-icon` | 20848 B | 公开可达静态资源 | 【实测】E18 |
| `/robots.txt` | **404** | `text/html; charset=iso-8859-1` | 355 B | 不存在 | 【实测】E18 |
| `/.well-known/security.txt` | **404** | `text/html; charset=iso-8859-1` | 355 B | 不存在 | 【实测】E18 |
| `/sitemap.xml` | **403** | `text/html; charset=UTF-8` | 5383 B | 与已确认的 Cloudflare challenge 页特征一致 → **受限** | 【实测】E18 + 【推断】I-1 |
| `/assets/` | **403** | `text/html; charset=UTF-8` | 5371 B | 同上 → **受限** | 【实测】E18 + 【推断】I-1 |
| `/` | **403**（lead 已实测） | `text/html` | — | Cloudflare `Just a moment...`（lead 起点事实 2/3） | 【公开】X3（team-lead-crosscheck） |
| `/m/search` | **403** | `text/html` | 5374 B | Cloudflare `Just a moment...`（lead 已逐字确认正文 + `challenges.cloudflare.com` CSP）→ **受限，未重试绕过** | 【实测】E25 + 【公开】X3 |
| `/m/` `/pricing/` `/help/` `/m/auth/login` `/m/auth/reset-password` | **403** ×5 | `text/html` | 5356–5434 B | 同批 challenge 特征 → **受限，未重试绕过** | 【实测】E25 + 【推断】I-1 |

> **通道差异（如实记录，不解释成因）**：curl 朴素 GET 对 `.ai` 几乎所有路径返回 403；WebFetch 却能拿到登录页、重置密码页、整站 Wiki 的文本。**原因未验证**，本次未做任何绕过尝试。此差异本身是证据，不能把 WebFetch 拿到的内容说成「curl 也能拿到」。
> **一致性**：A-01 登录墙、A-03/A-08 challenge、A-19~A-21 的 404 与 lead 起点事实 1–3 完全吻合（`recon/team-lead-crosscheck.md` 第 85–89 行 X3）。

---

## B. 页面结构（导航 / 区块 / 表单 / 按钮 / 链接层级）

### B.1 【实测】未登录态下唯一能直接看到的页面：登录页 `/m/search`、`/m/auth/login`、`/m/search?q=*`、`/pricing*`

```
页头
├─ logo（深/浅两版，见附录 2）
├─ Support            → https://usersearch.com/contact
├─ Toggle theme        （明暗主题切换控件，实测存在）
└─ Join Now            （链接文本；href 未在返回片段中出现 → 未知）

主卡片：Sign in to UserSearch
├─ 副标题：Enter your credentials to continue
├─ 字段  Email        （input，type/name/required 未在文本中暴露 → 未知）
├─ 字段  Password     （input；同行链接 Forgot password? → /m/auth/reset-password）
├─ 复选  Keep me signed in
├─ 按钮  Sign In
├─ 分隔  or
├─ 动作  Email me a login link
└─ 动作  Continue with Google（图标 /assets/images/icons/google.png）

页脚
├─ Don't have an account? Create one → /m/auth/register
├─ Privacy Policy → https://usersearch.com/privacy-policy
├─ Terms of Service → https://usersearch.com/terms-of-service
├─ DPA → https://usersearch.com/dpa
├─ Compliance → https://usersearch.com/compliance
└─ © 2026 UserSearch
```
证据：【实测】E01 / E02 / E12 / E24。
> 该页是**认证页，不是搜索页**。把它写进 §B 只是因为它是在合规范围内唯一可直连观察的 `/m/` 应用 HTML。

### B.2 【实测】公开可达的重置密码页 `/m/auth/reset-password`

`Password Recovery` → `Enter your email below to get a code` → 字段 `Email` → 按钮 `Send Code`。
证据：【实测】E04。未提交该表单（合规）。

### B.3 【实测】`/help/` 是独立的 DokuWiki 站点（与 `/m/` SPA 是两套系统）

- 路由形态：`/help/doku.php?id=<page_id>`，索引 `/help/doku.php?do=index` 列出 15 个页面（A-12）。
- 首页含 `BETA 2.0`、`2.0.20`、`Version: 2.0.22`、旧域名 `usersearch.io`、`roadmap` / `subscriptions` 等链接。
- 证据：【实测】E08 / E13。
- ⚠️ **年代混杂**：`features` / `basic_dashboard` / `advanced_dashboard` / `privacy` 均为 **2023 年**文案（描述 Basic/Advanced Dashboard、Search Table、Monitors Table），`roadmap` 是 **2026-10-30** 更新（2.0.23）。**不可把 2023 的旧 UI 描述当作当前 `/m/search` 的事实**（见 H-10）。

### B.4 【公开】同品牌官方文档描述的搜索页结构（**不是 `/m/search` 实测**）

以下逐字来自 `usersearch.com` 官方文档，页脚标注 `Verified against UserSearch v2.0.20`：

- **全局 chrome**：logo + 版本、`Theme toggle`、`Command palette`(Ctrl+K)、`Notifications`、`Apps grid`、`Account menu`；左侧导航 `Credits/Top-up, My Team, Dashboard, Bookmarks, Reports, History, Case Management, Help, Logout`。【公开】P08（Glossary）/ P14（chrome-and-navigation）
- **Dashboard header row**：标题 `Dashboard`、`Status (N)` pill、`Mobile` pill、`VIEW:` 分段控件（`Normal` / `Advanced` / `AI Agent`）、`Case:`、`Forensic Mode`。【公开】P07 / P14
- **Normal view 左栏 Search panel（即「search composer」）**，头部从左到右：`Search` 标题(放大镜图标) → `Search type selector`(下拉 + chevron) → `Bulk search` 复选 → 珊瑚橙 `Credits` pill → 竖三点溢出菜单；其下：`Module` 卡片网格（约 4 列）→ `description panel` → `query input` + `Search Now` 按钮 → `Cost per search` 行。【公开】P01（how-it-works）/ P07（view-modes）
- **右栏 Results panel**：`Search Results` / `Bookmarks` 两个 tab；`FOUND` / `ENRICHED` / `CONNECTIONS` 三个计数 tile；`Filter: Found` 下拉；动作按钮 `AI Analyse` / `AI Ask` / `Export` / `Clear`；结果表；下方 `Details` / `Profile View` / `Graph` 三个 detail tab。【公开】P05 / P07 / P08
- **Module 卡片解剖**：data source icon、`Title`、灰字 `data-source sub-label`（如 `(Data: Pipl - Social)` / `(Data: IntelX)` / `Search 3000+ sites` / `(OneScan)`）、`Descriptor`（如 `Multi-source scan`）；每卡 `?` info 图标，部分卡有 `gear` 设置图标与 filmstrip 图标；选中态为珊瑚橙边框/浅橙底/橙字，**单选**；`OneScan` 带 `RECOMMENDED` 徽章。【公开】P01
- **Choose Data Source 模态框**（gear 打开）：标题 `Choose Data Source`，副标 `Settings`，红色关闭；两种变体 —— ①过滤变体（3 个下拉 `Limit` / `Search type` / `Website Country Origin`，默认 `Top 500 (Alexa)` / `Any` / `Any Country`）；②数据源开关变体（逐行复选框 + 单项成本 + `Total cost` + `Remember my choice and hide this from future searches` 复选）；底部 `Close` / `Reset` / `Apply Filters`。【公开】P01 / P03
- **Entity-type tabs**（Public Leaks）：`All, Email, Phone, IP, CIDR, MAC, Domain, URL, Bitcoin, IBAN, Card Numbe…`；右侧 `Filter` 齿轮。【公开】P01 / P03
- **Advanced view**：在 Normal 基础上加 `Case panel`（`Select a Case`、`+ Add New`、Bookmarks 数、`Last Update`）与 `Case History panel`（`Keep Track on your case history`，两列 `EVENT` / `TIME`）。**AI Agent view**：整页替换为居中的 `AI Investigation Agent` 推广卡 + `Open AI Agent →` 按钮。【公开】P07 / P14

### B.5 【推断·待验证】域名关系

| 结论 | 依据 | 级别 |
|---|---|---|
| `.ai` 登录应用与 `.com` 官网/文档同属 UserSearch 产品 | 登录页 HTML 内 `Support`/`Privacy Policy`/`Terms`/`DPA`/`Compliance` **全部指向 `usersearch.com/*`** | 【实测】E12 + 【推断】 |
| `.ai` 是「premium version」，`.org` 是「parent webpage」 | `.ai` Wiki privacy 页原文「inherits from our parent webpage at `https://usersearch.org/privacy.php`」「for this specific **premium version**」 | 【实测】E22 + 【推断】 |
| 三个域名为同一产品族分工 | `usersearch.org` 首页原文：「Professional OSINT platform **UserSearch.ai** Premium Intelligence Platform」「To search an email address today, use our upgraded site **UserSearch.com**. This page (.org) is for username searches only」；第三方文章直接把 `https://usersearch.ai/` 定位为用户名反查站点 | 【公开】P11 / G4（`recon/github-crosscheck.md` 第 45–49 行） |
| **因此** `.com` 文档描述的 v2.0.20 search composer **很可能**就是 `.ai/m/search` 登录后的页面 | 品牌同名（登录页标题 `Login \| UserSearch 2.0`）+ 上述链接互指 | 【推断】**待验证，影响面见 H-1 / H-8** |

---

## C. 搜索流程（一次查询从输入到结果的可观察步骤）

### C.1 【公开】官方器文档逐字描述的流程（`Verified against UserSearch v2.0.20`）

**6 步版（how-it-works）**【公开】P01：
1. `Choose the Search type`（composer 头部下拉）
2. `Pick one Module`（点击卡片 → 加载其 description / cost line / query form）
3. `Optionally configure it in the Choose Data Source modal`（gear → `Apply Filters`）
4. `Type your query`
5. `Click Search Now` → `Search Results` panel 填充

（该页另一处给出 6 步细化版：①选 Search type ②点 Module 卡 ③可选开 `Choose Data Source` ④可选启用 `Bulk search`（≤5 输入）与 entity-type tab ⑤输入并确认 `Cost per search` ⑥`Search Now`。）

**5 步版（getting-started/searching）**【公开】P02 / X1：
1. `Choose a Search type` 2. `Pick one Module` 3. `Configure when available`（gear 可开 site filters 或 `Choose Data Source`）4. `Enter the query and review the cost`（核对 `Cost per search` 后再按 `Search Now`）5. `Treat results as leads`（复核 data-source attribution 与 Match Accuracy）

**18 个 Search type（原文清单）**【公开】P02 / X1：
`Username Intelligence, Email Intelligence, Phone Intelligence, People Intelligence, Corporate Intelligence, Cyber Intelligence, IP Intelligence, Product Intelligence, Chat Messaging, Public Forums, Picture, Cryptocurrency, Vehicle Lookup, Threat Intelligence, Wireless Device, Domain Intelligence, Breach Exposure, Court Records`

> ⚠️ **官方器文档内部数字不一致（如实记录，不挑一个当事实）**：`getting-started/searching` 与 product 页写 **18** Search types / **~107 visible Modules**；而 `Glossary` 写「At v2.0.20 there are **17** Search types」「roughly **80+** Modules」。【公开】P02 / P08 / P09。见 H-4。

### C.2 【实测】本次能直接观察到的「流程」只有一条：访问搜索页 → 被导向登录

`GET /m/search`（含 `?q=test`）→ 返回 `Login | UserSearch 2.0` 登录页，**不出现任何搜索表单、结果表、计数器或结果数据**。【实测】E01 / E12。
`GET /m/auth/register`、`GET /`、`GET /api` → Cloudflare challenge，记为受限。【实测】E03 / E19 / E21。
朴素 curl `GET /m/search` → 403 challenge（lead 已逐字确认）。【公开】X3 + 【实测】E25。

### C.3 【推断·待验证】完整查询链路

`登录 → Dashboard(Normal view) → 选 Search type → 选 Module（单选，默认最左卡预选）→ 可选 gear 配置 → 输入 query → 核对 Cost per search → Search Now → 右侧 Results panel 填充 Found/Enriched/Connections 计数与结果表 → 选中行看 Details/Profile View/Graph → 可 AI Analyse / AI Ask / Export / Clear / Bookmark`。
依据：P01/P02/P04/P05/P07 拼装；**未登录实测，全链路均待验证**。影响面 H-1、H-2。

### C.4 交互 → 请求 → 脚本 对照表（rea-recon 模板第 3 节）— **本次为空表**

| 交互 | 触发的请求 | 发起脚本 | DOM 变化 | 证据 |
|---|---|---|---|---|
| — | — | — | — | **无** |

**空表原因（不是遗漏，是合规边界的必然结果）**：
1. `/m/search` 未登录不可见，无法在真实页面上执行任何搜索交互；【实测】E01/E12
2. 本次禁止调用需鉴权接口、禁止登录、禁止绕过 challenge；【授权边界】
3. 本次未使用 REA / CDP / Playwright 实时网络捕获（见附录 1），因此**没有任何 XHR/fetch 请求记录、状态码、响应体、JSON 形状、发起脚本**。

> 依 `rea-recon` 证据标准，「它发了这个请求」需要请求记录；「这段脚本做了 X」需要脚本源码。**本次两者皆无，故不写任何请求/脚本结论**，全部归入 H-2。这是诚实的小证据包，不是编造的契约。

---

## D. 输入项清单

### D.1 【实测】认证页输入项（可直连观察，但**不是搜索页输入项**）

| 字段 / 控件 | 控件类型 | 占位符 | 约束/必填 | 出现页 | 证据 |
|---|---|---|---|---|---|
| `Email` | input（文本渲染） | 未在返回文本中暴露 | 未暴露（type/name/required 均未知） | 登录页、重置密码页 | 【实测】E01/E04 |
| `Password` | input | 未暴露 | 未暴露 | 登录页 | 【实测】E01 |
| `Keep me signed in` | checkbox | — | 可选 | 登录页 | 【实测】E01 |
| `Sign In` | button | — | — | 登录页 | 【实测】E01 |
| `Email me a login link` | 动作/链接 | — | — | 登录页 | 【实测】E01 |
| `Continue with Google` | 按钮（Google 图标） | — | — | 登录页 | 【实测】E01 |
| `Forgot password?` | 链接 → `/m/auth/reset-password` | — | — | 登录页 | 【实测】E01 |
| `Create one` | 链接 → `/m/auth/register` | — | — | 登录页 | 【实测】E01 |
| `Toggle theme` | 控件 | — | — | 登录页 | 【实测】E12 |
| `Email` / `Send Code` | input / button | 未暴露 | 未暴露 | 重置密码页 | 【实测】E04 |

### D.2 【公开】官方文档描述的搜索页输入项（**非 `/m/search` 实测**）

| 字段 / 控件 | 控件类型 | 标签 / 占位符 | 约束 / 默认值 | 证据 |
|---|---|---|---|---|
| `Search type selector` | 下拉（带 chevron） | 显示当前 Search type，如 `Username Intelligence`(person 图标) / `Public Leaks`(放大镜) | 切换会整组替换 Module；珊瑚橙高亮 | 【公开】P01 |
| `Bulk search` | 复选框（header 内，labelled checkbox） | `Bulk search` | 上限 **5 queries per search**；启用后 query input 接受列表；可与 OneScan 组合 | 【公开】P01/P02/P03 |
| `Module` 卡片网格 | 单选卡片（约 4 列） | 卡片 `Title` + 子标签 + Descriptor | **single-select**；每个 Search type 最左卡为固定出厂默认（非上次记忆）；选中态珊瑚橙 | 【公开】P01/P04 |
| `gear` 图标 | 图标按钮（部分卡片） | — | 打开 `Choose Data Source` 模态框 | 【公开】P01 |
| `?` info 图标 | 图标（每卡） | — | 打开 Module-specific help（内容未文档化） | 【公开】P01 |
| `Limit` | 下拉（Choose Data Source 过滤变体） | — | 默认 `Top 500 (Alexa)`；选项全集未文档化 | 【公开】P01/P03 |
| `Search type`（模态内） | 下拉 | — | 默认 `Any`；选项全集未文档化 | 【公开】P01/P03 |
| `Website Country Origin` | 下拉 | — | 默认 `Any Country`；部分子标签带国旗 glyph | 【公开】P01/P03 |
| 数据源逐行复选框 | checkbox + 单项 cost | 如 `Username Search (Data: Predicta)` `$0.50`、`(Data: OsintIndustries)` `$0.70` | 控制 `Total cost`（示例 `$1.20`） | 【公开】P01 |
| `Remember my choice and hide this from future searches` | checkbox | helper: `You can always come here from the [gear] menu.` | 是否持久化未确认 | 【公开】P01 |
| `Apply Filters` / `Reset` / `Close` | 按钮（模态底部） | — | `Reset` 恢复默认 | 【公开】P01 |
| **query input** | 文本输入 | **label 随 Module 变化**：`Search query`(Username Search 3000+) / `Username`(OneScan) / `Search Query`(Public Leaks) / `Reddit Username`(Public Forums)；**placeholder**：`Enter a search term` 或 `Enter a search query` | 必填性未文档化；文档建议「去除多余空格」「不要传完整 URL」「字段名要与 Module 匹配」 | 【公开】P01/P04/P19 |
| `Search Now` | 主按钮（珊瑚橙 + 放大镜图标） | — | 运行当前 Module | 【公开】P01/P04 |
| `Cost per search` | 只读文本行 | `Cost per search: Free` / `$1.20 \| Dynamic (0.50 - 1.20)` | 三档 `free` / `fixed` / `dynamic` | 【公开】P01/P03 |
| Entity-type tab strip | 横向 tab（Public Leaks） | `All, Email, Phone, IP, CIDR, MAC, Domain, URL, Bitcoin, IBAN, Card Numbe…` | 默认 `All`；可横向滚动，右侧有 `Filter` 齿轮 | 【公开】P01/P03 |
| `Filter: Found` | 下拉（Results 子头） | — | 收窄可见行；完整选项未文档化 | 【公开】P05 |

#### D.2b 【公开】官网首页 `usersearch.com/` 的输入类型 chips 与模块示例（本轮补充线索，已复核）

来源：WebSearch `usersearch.ai "UserSearch 2.0" what is it features` 结果 #1（P10/P12）逐字原文；**属官网营销落地页控件，不是 `/m/search` 的输入项**。

| 项 | 逐字内容 | 证据 |
|---|---|---|
| 输入类型 chips | `Username` / `Email` / `Phone` / `Picture` / `Name` / `Crypto` / `Businesses` / `Domains` / `SecurityInfo` | 【公开】P10/P12 |
| 入口文案 | `Search for Usernames`、`Advanced search`、示例值 `fred@example.com`、按钮 `Search Now`、`OneScan` / `selected sources` | 【公开】P10/P12 |
| 模块示例（含成本标签） | `Dynamic / Breach Exposure / HaveIBeenPwned / Free`；`Email threat / HudsonRock / Free`；`Name search / PIPL / $1.00`；`ProtonMail analyse / ProtonMail / Free`；`Email-to-name / Gravatar / Free`；`Scam database / ScamSearch / Free` | 【公开】P10/P12 |
| 辅助信息 | `500K+ users every month`、`AI-Enhanced Results`、`Source attribution`、`Case bookmarks` / `XLSX report`、`S.A.R.G.E.` AI agent | 【公开】P10/P12 |
| 第三方评测定价 | 免费计划、Premium `$18.97`/月（含 `$10` credits）、`$159.97`/年；Bulk 最多 5 输入；团队共享 credits | 【公开】P16 |

> `$18.97` / `$159.97` 与 `.ai` Wiki 订阅页【实测 E23】数值**跨来源吻合**（但套餐结构是否一致未验证）。以上均为**营销落地页**文案，与 §D.2 的 v2.0 文档字段**不是同一套 UI，不可合并成一张输入项表**。

### D.3 【推断·待验证】

- 上述 D.2 的字段**是否就是 `/m/search` 的真实输入项**、字段 `name` / `type` / 前端校验规则 / 必填性 / 空输入与超长输入行为，**全部未验证**（H-1、H-6）。
- `.ai` 2023 Wiki 的 `basic_dashboard` 只给出 4 类输入（username / email / phone / image）与「Choose Your Search Type → Enter Search Details → 点击 search button → Review Results」【实测 E15，属旧版文档】，**不能**用来推断当前 2.0 的字段集。

---

## E. 结果展示字段清单

> **全部为【公开】官方文档的类比描述，`/m/search` 未产出任何一条实测结果数据。**

### E.1 头部计数器（三档，颜色固定）

| 字段 | 含义 | 示例值 | 颜色 | 证据 |
|---|---|---|---|---|
| `Found` | 标识符在某站点/数据源上被定位（存在匹配 profile） | `Found 207`（子头 `207 found / 161 not found`）；OneScan `Found 546`（状态行 `Success. Found 546 results`） | 绿 | 【公开】P05/P06 |
| `Enriched` | Found 记录中 UserSearch 持有额外元数据的条数（严格子集） | `Enriched 18` of 207；OneScan `Enriched 545` of 546 | 橙 | 【公开】P05/P06 |
| `Connections` | 结果间实体关联/链接簇数量 | `Connections 15`；OneScan `Connections 0`（`CONNECTIONS 0`） | 白 | 【公开】P05/P06/P08 |

### E.2 结果表列（**随 Module 变化**，且官方文档三处描述不一致 — 见 H-4）

| 变体 | 列 | 单元格内容 / 示例 | 证据 |
|---|---|---|---|
| `Search 3000+ sites` Module | `Bookmark · Site · Enriched · Connection · Profile URL` | `Site`=站点 favicon+名称（Mozilla Support / WordPress / Imgur / Trello / GitHub / SoundCloud / YouTube / TikTok）；`Enriched`/`Connection`=布尔勾或红 X（互相独立）；`Profile URL`=`Visit Profile` 外链；`Site`/`Enriched`/`Connection` 表头有排序箭头，`Bookmark`/`Enriched`/`Connection` 有 `?` 图标 | 【公开】P05/P06 |
| `OneScan` Module | `Bookmark · Enriched · Found On · Data Source` | `Found On`=平台（35photo / ao3 / dribbble / aboutme / clubhouse / youtube / truthsocial / trello）；`Data Source`=`OSINT Industries` / `Predicta Search`；**无** `Site`/`Connection`/`Profile URL` | 【公开】P05/P06 |
| Glossary 定义 | `Found On, Data Source, Status, Enriched` | `Found On`=记录所在站点；`Data Source`=给出该命中的第三方源 | 【公开】P08 |
| View-modes「Normal view」 | `# · USERNAME · SOURCE · STATUS · ENRICHED` | 未给示例值 | 【公开】P07/P14 |

> ⚠️ 以上 4 组列集合**互相不一致**（`Status` 只出现在后两组；`Site`/`Profile URL` 只在第一组）。官方文档自身声明「columns adapt to the Module」，但 Glossary 与 view-modes 又给出概括列。**不可据此断定唯一列集**（H-4）。

### E.3 其他结果区字段 / 控件 / 文案

| 项 | 内容 | 证据 |
|---|---|---|
| Tab | `Search Results`（默认激活）/ `Bookmarks`；detail tabs `Details` / `Profile View` / `Graph` | 【公开】P05/P07/P08 |
| 动作按钮 | `AI Analyse`（UK 拼写）、`AI Ask`、`Export`、`Clear`；`Visit Profile` | 【公开】P05/P08 |
| 状态 / 提示文案 | `No active search`（未运行空态）、`No connections found`、`CONNECTIONS 0`、`207 found / 161 not found`、`Success. Found 546 results`、`Filter: Found` | 【公开】P01/P03/P05/P06 |
| `Status (N)` pill | 全站集成/数据集的实时健康度（分钟级），与当前结果表无关；N 的具体含义未说明 | 【公开】P03/P05/P14 |
| Details panel 区块 | `ALL CONNECTIONS`（按匹配值分组，大小写敏感 — 文档标注为 inferred）、`CONNECTIONS`（含 `MATCH ACCURACY` 列，另有 `INFORMATION IN COMMON` / `SITES`）、`INFORMATION` / `INFORMATION (CONTINUED)` | 【公开】P06 |
| 富化元数据字段（示例） | platform、username、user id、account creation date、follower counts、photo counts、avatar link、canonical user id、possible names、linked emails | 【公开】P06 |
| `Match Accuracy` | 由**第三方数据源**给出（非 UserSearch 计算）；显示格式（百分比/档位/标签）未确认；未捕获到填充值 | 【公开】P02/P06/P08 |
| 导出 / 报告 | `Export` = 当前结果的临时下载；`Report` = 保存到 Case 的生成物，观察到 `.xlsx`；product 页另称 `PDF · DOC · EXCEL` / `PDF · CSV` | 【公开】P02/P05/P08/P09 |
| 滚动 / 分页 | 两个截帧都有竖直滚动条「indicates more rows exist below the viewport」；**未文档化任何分页控件** | 【公开】P05 |

#### E.3b 【公开】产品页工作台示意文本、官网首页结果表与成本表（本轮补充线索，已复核）

来源：WebSearch 结果 `https://www.usersearch.com/product/usersearch-2.0/?ref=usersearch.com`（P09）与 `https://www.usersearch.com/`（P10/P12）逐字原文。**均为营销页的示意文本 / 示例数据，不是真实查询结果，也不是 `/m/search` 实测。**

| 位置 | 逐字示例值 |
|---|---|
| 顶栏 / 上下文 | `Enterprise` · `Live data` · `Case: Mark` · `Forensic Mode` · `Credits $14.88`；VIEW `Normal` / `Advanced` / `AI Agent`；左导航 `Dashboard` / `Bookmarks` / `Reports` / `History` / `Case Management` / `My Team` |
| Composer | `Email Intelligence` · `fred@example.com` · `Search $3.10`；`Email OneScan 5 modules $3.10` |
| 模块行（含成本） | `UserSearch / Email Search / Free` · `EPIEOS / Email Search / $1.40` · `HaveIBeenPwned / Breach Exposure / Free` |
| 结果区计数 / 动作 | `27 Found` · `12 Enriched` · `9 Connections`；`AI Analyse` · `AI Ask` · `Export` |
| 结果行（值 \| 来源 \| 状态） | `fred@example.com \| UserSearch \| Found` · `fred@example.com \| EPIEOS \| Enriched` · `fred@example.com \| HudsonRock \| Threat` · `fred@example.com \| IntelX \| Exposure` |
| **官网首页结果表列头** | `Username` / `Source` / `Status`；示例行 `alex_walker_88 \| GitHub \| Found enriched`、`alexw_88 \| Telegram \| Linked`、`alex.walker \| Forum archive \| Archived`、`alex_walker_88 \| X / Twitter \| Found enriched` |
| 产品页 6 步平台工作流 | `01 Choose a Search type` → `02 Run OneScan` → `03 Run a Bulk search` → `04 Retain the work` → `05 Apply account controls` → `06 Work with a team` |

**成本表（【公开】P15 `reference/credits-and-pricing` 逐字摘录，仅作证据记录）**：
`Username Intelligence / Username Search (3000+ sites) / free / Free`；`Phone Intelligence / Background Check (US) / fixed / $0.40`；`People Intelligence / Person (Pipl – Social) / fixed / $1.00`；`Corporate Intelligence / Company Search (OpenCorporates) / fixed / $0.50`；`Cyber Intelligence / IP Host Lookup / fixed / $0.20`；`Public Leaks / Public Leaks (IntelX) / fixed / $0.20`；`Vehicle Lookup / Vehicle Lookup (UK Only, Enriched) / fixed / $5.00`；`Court Records / Court Records (OneScan) / dynamic / $0.60 (range $0.12 – $0.60)`。
OneScan 动态成本拆解：`$1.20 = Predicta $0.50 + OSINT Industries $0.70`（Username Intelligence）；Court Records OneScan `$0.60 (range $0.12–$0.60)`。

> ⚠️ 官网首页列集 `Username/Source/Status` 与 §E.2 的 4 组列集**再次不一致**（另有 Glossary 的 `Found On/Data Source/Status/Enriched`、results-table 的两套 Module 专属列）。这是**营销示意 vs 文档说明 vs 版本差异**的混合，**不能合并成唯一结果表定义**（H-4）。所有价格 / 数据源名 / 品牌名 / 文案**只作证据记录**，实现时用占位资产（附录 2）。

### E.4 数据契约（rea-recon 模板第 4 节）— **本次为空**

本次**没有捕获到任何真实请求**：无 URL、无 method、无请求载荷、无响应状态码、无响应 JSON 形状、无错误分支、无发起脚本。因此不产出任何数据契约条目。
- 原因见 §C.4 与附录 1；影响面见 **H-2（最阻塞）**。
- 【公开】层面仅有一条产品级信息：官方 FAQ 称「A customer-facing API, webhooks, connectors and SSO aren't part of the documented setup yet」【公开】P09；roadmap 2.0.24 列出 `OneQuery API`【实测 E17，Wiki 版本记录】。**这些是产品公告，不是我调用到的接口，不得当作接口契约。**

---

## F. 交互状态与边界情况（逐条标注证据强度）

| # | 状态 / 边界 | 可观察表现（原文） | 证据强度 | 出处 |
|---|---|---|---|---|
| F-01 | **未运行 / 初始空态** | Results panel 空态读作 `No active search` | 【公开】强（官方文档逐字，v2.0.20） | P01 / P03 / P05 |
| F-02 | **零结果 / not found** | `A Found count of zero is a normal, expected result`；`"Not found" and "found nothing to enrich" are outcomes, not errors`；`207 found / 161 not found` | 【公开】强 | P03 / P05 / P06 |
| F-03 | **Connections 空** | detail 区读 `No connections found` / `CONNECTIONS 0`；**计数器可能与 detail 矛盾**（曾出现 counter=15 但 detail 为空），官方文档明说「do not assume a populated graph until it is verified」 | 【公开】强（含官方自述的未确认项） | P05 / P06 / P08 |
| F-04 | **Credits 不足** | `You do not have enough Credits` → `Account Credits & Team Licenses` → `Credit Top-up` 预设 / `Custom Selection` 滑块(10–200) → `One Time` / `Monthly` → `Proceed to Checkout`；`Auto-topup` | 【公开】强 | P03 / P15 |
| F-05 | **搜索卡住 / 不返回** | `A search seems stuck`：①确认已选 Module 并按 `Search Now` ②检查 query 与 `Cost per search` ③缩小范围（关掉部分 OneScan 数据源 / 降低 `Limit`）④重跑，仍失败联系 Help/Contact Us | 【公开】强 | P03 |
| F-06 | **数据源故障** | `A data source appears to be down` → 查 `Status` pill / 切 OneScan（健康源结果仍显示，`Data Source` 列标来源）/ 在模态里关掉故障源（同时从 `Total cost` 移除）/ 换同类型单源 Module | 【公开】强 | P03 / P05 |
| F-07 | **意外扣费** | `You see an unexpected charge` → `Transaction history (Last 100)`，列 `Time, Initiated by, Type, Amount, Description`，每行为 `DEBIT`，描述如 `Cost for search: Username - Username Search (OsintIndustries)` | 【公开】强 | P03 / P15 |
| F-08 | **输入校验 / 纠错建议** | 文档建议：确认输入填到与 Module 匹配的字段（`Username` for OneScan / `Search query` for 3000+）、去除多余空格、`not including a full URL when a bare username or email is expected`、确认 Search type 接受该标识符 | 【公开】中（是**处置建议**，非实测校验规则/报错文案） | P03 |
| F-09 | **加载 / 异步填充** | `.ai` Wiki：`The search operates asynchronously, meaning users can observe the results populating live`；roadmap：`1.0.20 ... New Streaming response`、`1.0.4 / 1.0.20 Load results Async` | 【实测】E14/E17 为**旧版 Wiki 文字**；【推断】当前 2.0 是否同机制待验证。**无** spinner / 骨架屏 / 进度条的实测 | E14 / E17 + H-6 |
| F-10 | **限额 / 上限** | `Bulk search` ≤ **5 queries per search**；`.ai` 2023 Wiki：Live Monitor 每账户 ≤ **5 monitors**；Credits 为预付费货币 | 【公开】强（Bulk）/【实测】E14 但**旧版文案**（Monitor 上限，当前是否仍为 5 未验证） | P01/P02/P03 / E14 |
| F-11 | **未登录 / 登录墙** | `GET /m/search`（含带 query 参数）→ `Login \| UserSearch 2.0` 登录页，无任何搜索 UI；`GET /m/auth/register`、`/`、`/api` → Cloudflare `Just a moment...`；朴素 curl 全域 403 | **【实测】最强** | E01/E03/E12/E19/E21/E25 + X3 |
| F-12 | **验证码 / 人机验证** | 认证页文本中**未出现**验证码相关文案；Cloudflare challenge 页仅 `Just a moment...`；challenge 之后的流程**未观察**（禁止绕过） | 【实测】仅限「未出现」；**challenge 内部状态未知** | E01/E03/E19 + H-9 |
| F-13 | **分页 / 大数据集** | 仅见「竖直滚动条提示下方还有更多行」，**未文档化分页控件、每页条数、总数上限** | 【公开】弱（仅一条滚动描述） | P05 + H-6 |
| F-14 | **导出** | `Export` 按钮；`documented export options include XLSX`；Report 观察到 `.xlsx`；product 页称 `PDF · CSV` / `PDF · DOC · EXCEL` | 【公开】中（多页表述不完全一致） | P02/P05/P08/P09 |
| F-15 | **网络异常 / 5xx / 超时** | 官方文档未给出任何 HTTP 错误分支文案；本次无网络捕获 | **无证据 → 未知** | H-2 / H-6 |
| F-16 | **空输入 / 超长 / 特殊字符 / 多结果** | 官方文档只给「零结果」与输入纠错建议，未描述空输入提交、长度上限、特殊字符转义、多结果排序 | **无证据 → 未知** | H-6 |
| F-17 | **结果行状态（官网首页示意）** | 列头 `Username / Source / Status`；状态示例 `Found` / `Found enriched` / `Linked` / `Archived`；产品页示意另有 `Enriched` / `Threat` / `Exposure` | 【公开】弱（营销示意文本，非真实状态枚举） | P09/P10 |
| F-18 | **搜索深度 / 速度分层（.org 站）** | `usersearch.org/features.php` 述 `Lightning / Instant / Deep / Complete` 分层、`Bookmark / Save / Collections / Reporting`、免登录的 username 查询 | 【公开·由 team-lead 提供，**本人未复核该 URL**】；且 `.org` 自述「仅 username 查询、免费、无需注册」，与 `.ai` premium 版不是同一界面 | P20 + H-13 |

> F-17/F-18 只作**交互范式参考**，不得据此推断 `/m/search` 的状态枚举或分层控件。

---

## G. 网络与前端技术特征（**仅记录公开可见者**）

| # | 特征 | 判据 | 级别 |
|---|---|---|---|
| G-01 | `/m/` 是 **SPA / 构建产物**入口 | 登录页 HTML 引用 `/m/assets/logo-black-orange-C7UUUPwA.jpg`、`/m/assets/logo-white-orange-BpNvLmUY.png` —— 文件名带 **8 位内容哈希**（Vite 风格产物命名） | 【实测】E12/E24 + 【推断】构建工具未验证 |
| G-02 | `/m/` 存在客户端路由 | `WebFetch /m/` 返回标题 `AI Agent \| UserSearch 2.0` 与 `No chat history yet`，而 `/m/auth/login`、`/m/search` 返回登录页 —— 同前缀不同渲染结果 | 【实测】E20/E01/E12 + 【推断】含义未验证（H-7） |
| G-03 | 支持**明暗主题切换** | 登录页出现 `Toggle theme` 控件；Glossary 记 `Theme toggle`，并称「documented default and all published screenshots are the **dark theme**」 | 【实测】E12 + 【公开】P08 |
| G-04 | `/help/` 与 `/m/` 是**两套独立系统** | `/help/doku.php?id=…` 为 DokuWiki 路由（含 `Last modified:` / `doku.php?do=index` Sitemap），`/m/` 为带哈希资源的 SPA | 【实测】E08/E12/E13 |
| G-05 | 静态资源公开路径 | `/assets/images/icons/google.png`(200, 382B)、`/favicon.ico`(200, 20848B)、2 个 `/m/assets/logo-*`（仅从 HTML 观察到路径，**未下载/未解包**） | 【实测】E18/E12 |
| G-06 | 前端存在 **Ctrl+K 命令面板、全局 Notifications / Apps grid / Account menu、左导航** | Glossary / chrome-and-navigation 逐字描述 | 【公开】P08/P14 |
| G-07 | 请求 / 接口迹象 | **0 条**。本次未捕获任何 XHR/fetch；`/api` 返回 challenge 且未暴露任何 endpoint 文本；未下载任何 JS bundle、未解包、未读 source map | 【实测】E21 + 合规声明 §I |
| G-08 | 版本线索 | `.ai` 登录页标题含 `UserSearch 2.0`；`.ai` Wiki roadmap：`Current Version 2.0.23`（19.09.26）、2.0.24 计划 30.10.26；`.com` 文档页脚 `Verified against UserSearch v2.0.20`；Wiki 首页却写 `BETA 2.0.20` / `Version 2.0.22` | 【实测】E01/E08/E17 + 【公开】P03 → **版本口径互相矛盾**（H-3） |
| G-09 | 第三方依赖 / 支付线索 | `.ai` Wiki 订阅页称平台由 **Stripe** 支付；`.com` 文档列出第三方数据源 EPIEOS / PredictaSearch / OSINT.Industries / IntelX / Dehashed / HaveIBeenPwned / Shodan / CompaniesHouse / OpenSanctions / FaceCheck.id / TinEye / Pipl / Gravatar / ProtonMail | 【实测】E23 + 【公开】P08/P15 |

> **明确未做**：未请求任何 `/m/assets/*.js` 或 `.css` bundle，未解包构建产物，未读 source map —— 合规边界禁止「解包并复制受版权保护的构建产物源码」。

---

## H. 未知项清单（无法在合规范围内验证；逐条写明影响面）

| # | 未知项 | 影响面 | 建议的下一步（**均需主理人另行授权，本次不执行**） |
|---|---|---|---|
| **H-1** | **`/m/search` 登录后的真实 DOM、路由、组件树、布局、真实输入项与结果列** —— 登录墙保护，未登录完全不可见 | **阻塞性**：§B/§C/§D/§E/§F 的所有结构描述都只是「公开文档类比」，无法确认与线上一致；蓝图只能按文档近似 | 由用户提供**自有测试账号**并在授权范围内登录观察；或提供官方设计稿/截图 |
| **H-2** | **真实 API 契约**：请求 URL / method / 参数位置(query vs body) / 载荷形状 / 响应 JSON 字段与类型 / 可空性 / 错误分支 / 发起脚本 | **最阻塞**：`rea-recon` 的「交互→请求→脚本对照表」与「数据契约」本次全空；`spa-contract-rebuild` 的核心产物无法交付 | 需授权后在登录态用 REA/CDP 观察窗口逐交互采集；本次合规明令禁止绕过 challenge 取流量 |
| **H-3** | **当前线上真实版本**（`2.0.20` 文档 / `2.0.23` roadmap / `2.0.24` 计划 / Wiki 首页 `2.0.22`）不一致 | 文档描述的控件、Search type 数量、Module 数量可能与线上不同 | 登录后读取页面版本号；或向官方确认 |
| **H-4** | **官方器文档内部矛盾**：17 vs 18 Search types；80+ vs ~107 Modules；4 组互不一致的结果表列集 | 组件规模、列数、导航项数量无法定稿 | 登录后实测计数；以线上为准 |
| **H-5** | **结果数据的真实 JSON 形状 / 字段名 / 类型 / 可空性** | 无法写可实现的类型定义与 mock 数据契约 | 同 H-2 |
| **H-6** | **边界情况的真实表现**：空输入提交、超长输入、特殊字符转义、多结果排序、分页/无限滚动、加载态 UI（spinner/骨架/进度）、网络异常/超时/5xx 的错误文案、导出文件格式 | §F 只能给文档级描述，缺少可复刻的精确状态文案与行为 | 登录后逐项做输入对照实验（单变量） |
| **H-7** | `WebFetch /m/` 返回 `AI Agent \| UserSearch 2.0` + `No chat history yet` 的**含义**（是否未登录即可访问 AI Agent 壳？是否缓存/渲染差异？） | 影响对 `/m/` 路由与鉴权边界的判断 | 在授权范围内用浏览器直接观察；本次不推断 |
| **H-8** | **`.ai/m/search` 与 `.com` 文档描述的 v2.0.20 UI 是否完全一致** | 【推断】B.5 若成立才能把文档当蓝图输入；若不成立，整个类比失效 | 登录后视觉/结构比对 |
| **H-9** | Cloudflare challenge 之后的首屏行为、Cookie/会话机制、是否有人机验证后续步骤 | 影响「未登录」状态的完整复刻 | **禁止绕过**，本次不采集 |
| **H-10** | `.ai` 2023 年 Wiki 的 Basic/Advanced Dashboard 描述是否为**已废弃的旧版 UI**（与 v2.0 文档冲突） | 若误当现行 UI，会复刻出错误布局 | 登录后比对；默认按 v2.0 文档处理 |
| **H-11** | WebFetch 与朴素 curl 通道结果差异的成因 | 只影响证据表述，不影响功能复刻 | 属环境行为，无需复刻 |
| **H-12** | `Join Now` 链接的 href、`Email me a login link` 的实现、各 input 的 `name`/`type`/`required`、注册页真实内容（被 challenge 挡住） | 认证页复刻细节 | 登录后 / 授权后观察 |
| **H-13** | **`/m/` 前缀是否代表移动版（mobile）布局**，以及 `/m/search` 与 `.com` 文档描述的**桌面工作台**是否为同一套 UI | **team-lead 本轮明确提醒**：若 `/m/` 是移动端布局，则 §B–§E 全部按桌面文档做的类比会**整体错位**（列数、左右面板并排方式、控件密度、VIEW 分段控件可能都不存在）。与 H-1/H-8 叠加，属**范围级风险**，不是局部字段差异 | 授权登录后按不同视口比对；或由主理人确认 `/m/` 语义。本次不推断 |

> **无阻塞性假设被偷偷带入**：以上每一项都未被「验证掉」，全部显式保留为未知。按 `replica-blueprint` 步骤 6，H-1/H-2 属于**无法绕开的阻塞性假设**——应交回主理人决策（要么补授权回到侦察阶段，要么明确接受「公开文档驱动的行为复刻 + 全量占位数据」路线，与 team-lead 交叉验证结论第 97 行一致）。

---

## I. 合规声明

### I.1 本次**做了**什么

1. 用 **WebFetch** 读取公开可达页面：`usersearch.ai` 的 22 个路径/参数组合（登录页、重置密码页、`/help` DokuWiki 及其 7 个子页、若干 404 路径、带 `?q=test` 的搜索页），以及 `usersearch.com` 的 8 个**公开官方文档页**。
2. 用 **WebSearch** 检索公开索引、官方文档、第三方评测与介绍（检索式见附录 3）。
3. 用**朴素 `curl` GET** 记录公开静态资源的 HTTP 状态码 / content-type / 大小：单次请求、**无重试**、**未设置任何自定义 header**、**未带 Cookie/Token**、**未使用代理**、**未伪装 UA**。
4. 对一切返回 `403` / `Just a moment...` 的路径**如实记为「受限」并停止**，未做任何重试或绕过尝试。
5. 读取（未修改）team-lead 的两份交叉检查笔记，仅用于口径对齐，出处已标注。

### I.2 本次**明确没有做**什么

- ❌ 未尝试登录、注册、重置密码的**提交**动作；未填写或提交任何表单；未做爆破/撞库；未伪造任何 Cookie / Token / 凭据。
- ❌ 未调用任何需要鉴权的接口；未抓取任何用户私有数据 / 搜索结果真实数据。
- ❌ **未绕过 Cloudflare / 人机验证 / 任何访问限制**：未使用 headless 浏览器或 Playwright 去「通过」challenge，未用 REA 连远程调试浏览器人工操作，未禁用 JS 校验，未用代理池，未伪造 UA 骗过校验，未对 403 重试。
- ❌ 未解包、未下载、未复制任何受版权保护的构建产物 JS 源码（尽管观察到带 hash 的资源路径）；未读 source map。
- ❌ 未修改工作区其他文件：只新建/写入本文件 `recon/evidence-pack.md`；`recon/github-crosscheck.md`、`recon/team-lead-crosscheck.md` 仅读取。
- ❌ 未把【推断】包装成【实测】：`/m/search` 的一手 DOM / 请求 / 脚本证据为 0，已全文显式声明（§0 口径、§C.4、§E.4、H-1/H-2）。

---

## 附录 1 · 采集通道与限制（对齐 `rea-recon` 证据包模板第 7 节）

| 项 | 内容 |
|---|---|
| **本次通道** | **合规受限的降级通道** = WebFetch（公开页面文本） + WebSearch（公开索引） + 朴素 GET curl（静态资源状态）。**显式标注：本次未使用 REA。** |
| **为何不用 REA** | REA 网站通道需以 `--remote-debugging-port` 打开浏览器并人工操作页面、开观察窗口抓网络。本站存在 Cloudflare challenge 与登录墙，人工操作会涉及「通过 challenge」；合规边界明令禁止绕过，且本次可用工具集中也无 REA MCP。故按要求退到降级通道。 |
| **为何不用 Playwright/CDP 兜底** | `spa-contract-rebuild` 铁律 3「抓不到的地方用 Playwright 抓真实流量」在本次被主理人**明确排除**：不得为了拿流量而绕过访问限制；拿不到就如实写进未知项。 |
| **与 REA 的能力差距** | 拿不到：实时 Network 域请求记录、请求发起者脚本、JSON body 形状、source map、按交互的观察窗口、按状态截图、DOM 层次捕获片段、可访问性树。因此 §C.4 与 §E.4 为空表。 |
| **观察窗口** | **无实时观察窗口**；采集为离散的公开页面读取，时间 20:57–21:07 GMT+8。 |
| **不在窗口内的请求** | **全部**（未建立任何网络捕获会话）。 |
| **截图** | **0 张**（无浏览器渲染通道）。后续视觉比对无基线。 |
| **环境** | Windows / Git Bash；工具自带通道；**未登录态**（刻意保持）；无 Cookie / Token。 |
| **通道差异（如实记录）** | 朴素 curl 对 `.ai` 几乎所有路径返回 403（~5.3–5.4 KB HTML）；WebFetch 能取到登录页、重置密码页、整站 Wiki 文本。成因未验证，未做任何绕过解释或尝试。 |
| **已知 lead 起点事实** | ①WebFetch `/m/search` → 登录页 ②`curl -sS -L /m/search` → 403 + Cloudflare `Just a moment...`（CSP 含 challenges.cloudflare.com）③WebFetch `/` 与 `/m/auth/register` → `Just a moment...`。**本次全部复现并一致**（A-01/A-03/A-08/E25）。 |

---

## 附录 2 · 素材与资产清单（对齐 `rea-recon` 模板第 5 节）

| 资产 | 类型 | 来源 / URL | 处置建议（**一律不复制参考站受版权保护资产**） |
|---|---|---|---|
| Google 图标 | PNG, 382 B | `https://usersearch.ai/assets/images/icons/google.png`【实测 E01/E18, 200】 | 第三方品牌资产；用自有「第三方登录」通用图标或按品牌规范自制，不照搬 |
| 深色 logo | JPG（带 hash `C7UUUPwA`） | `https://usersearch.ai/m/assets/logo-black-orange-C7UUUPwA.jpg`【实测 E12/E24，仅观察到路径，未下载】 | 目标方自有受版权保护资产 → **必须替换为自制占位 logo** |
| 浅色 logo | PNG（带 hash `BpNvLmUY`） | `https://usersearch.ai/m/assets/logo-white-orange-BpNvLmUY.png`【实测 E12/E24，仅观察到路径，未下载】 | 同上 |
| favicon | ICO, 20848 B | `https://usersearch.ai/favicon.ico`【实测 E18, 200】 | 目标方自有 → 替换为自制 favicon |
| 珊瑚橙主色 / 深色主题 | 设计特征（非文件） | 官方文档逐字描述 `coral-orange`、默认 dark theme【公开 P01/P08】 | 可用等价配色，但**照抄品牌视觉识别有风险**；建议自定义主题色 |
| 品牌名 / 模块名 / 数据源名 / 价格 / 文案 | 文本 | 全篇【公开】文档 | **全部换成占位资产**（与 team-lead 交叉验证笔记第 5 行约束一致），不出现 `UserSearch` / `OneScan` / `S.A.R.G.E.` / `OSINT Industries` / `$18.97` 等原名 |

---

## 附录 3 · 证据索引（每条结论可回溯到此处）

### 【实测】E 系列 — 本人本次亲自执行

| 编号 | 来源（URL / 命令） | 批次 |
|---|---|---|
| E01 | `WebFetch https://usersearch.ai/m/search` | ① |
| E02 | `WebFetch https://usersearch.ai/m/auth/login` | ① |
| E03 | `WebFetch https://usersearch.ai/m/auth/register` | ② |
| E04 | `WebFetch https://usersearch.ai/m/auth/reset-password` | ② |
| E05 | `WebFetch https://usersearch.ai/robots.txt` | ① |
| E06 | `WebFetch https://usersearch.ai/sitemap.xml` | ① |
| E07 | `WebFetch https://usersearch.ai/pricing` | ① |
| E08 | `WebFetch https://usersearch.ai/help` | ② |
| E09/E10/E11 | `WebFetch https://usersearch.ai/about` / `/terms` / `/privacy` | ② |
| E12 | `WebFetch https://usersearch.ai/m/search?q=test` | ② |
| E13 | `WebFetch https://usersearch.ai/help/doku.php?do=index` | ③ |
| E14 | `WebFetch https://usersearch.ai/help/doku.php?id=features` | ③ |
| E15 | `WebFetch https://usersearch.ai/help/doku.php?id=basic_dashboard` | ③ |
| E16 | `WebFetch https://usersearch.ai/help/doku.php?id=advanced_dashboard` | ③ |
| E17 | `WebFetch https://usersearch.ai/help/doku.php?id=roadmap` | ③ |
| E18 | `Bash: curl -sS -L -o /dev/null -w "code=%{http_code} type=%{content_type} size=%{size_download}" --max-time 20` × 6 静态/元路径 | ② |
| E19 | `WebFetch https://usersearch.ai/` | ④ |
| E20 | `WebFetch https://usersearch.ai/m/` | ④ |
| E21 | `WebFetch https://usersearch.ai/api` | ④ |
| E22 | `WebFetch https://usersearch.ai/help/doku.php?id=privacy` | ④ |
| E23 | `WebFetch https://usersearch.ai/help/doku.php?id=subscriptions` | ④ |
| E24 | `WebFetch https://usersearch.ai/pricing/` | ④ |
| E25 | `Bash: curl ...` × 6 关键路径 + `date "+captured_at=..."`（21:07:28） | ④ |

### 【公开】P 系列 — 公开文档 / 官方页 / 第三方资料

| 编号 | 来源 | 获取方式 |
|---|---|---|
| P01 | `https://usersearch.com/resources/documentation/concepts/how-it-works` — *How UserSearch works: Search type, Module, data source* | WebFetch 原文 |
| P02 | `http://usersearch.com/resources/getting-started/searching` — *Search Techniques - UserSearch Investigation Guide* | WebFetch 原文 |
| P03 | `https://usersearch.com/resources/documentation/help/troubleshooting-faq` — *Troubleshooting & FAQ*（页脚 `Verified against UserSearch v2.0.20`） | WebFetch 原文 |
| P04 | `https://usersearch.com/resources/documentation/guides/username` — *Username search: overview* | WebFetch 原文 |
| P05 | `https://usersearch.com/resources/documentation/reference/results-table` — *Results table, counters and statuses* | WebFetch 原文 |
| P06 | `https://usersearch.com/resources/documentation/concepts/found-enriched-connections` — *Found, Enriched, Connections and Match Accuracy* | WebFetch 原文 |
| P07 | `https://usersearch.com/resources/documentation/concepts/view-modes` — *View modes: Normal, Advanced, AI Agent* | WebFetch 原文 |
| P08 | `https://usersearch.com/resources/documentation/reference/glossary` — *Glossary* | WebFetch 原文 |
| P09 | `https://www.usersearch.com/product/usersearch-2.0` — *UserSearch 2.0 - Next-Generation OSINT Platform* / 产品页 FAQ | WebSearch 结果摘录 |
| P10 | `https://www.usersearch.com/` 与 `http://usersearch.com/` — 官网首页 | WebSearch 结果摘录 |
| P11 | `http://www.usersearch.org/` — 首页（含 `UserSearch.ai Premium Intelligence Platform` 与 `.com` 升级说明） | WebSearch 结果摘录 |
| P12 | WebSearch `usersearch.ai "UserSearch 2.0" what is it features` — 5 条结果（usersearch.com 首页 / product 页 / usersearch.org/landing / adverse-media 博客） | WebSearch |
| P13 | WebSearch `usersearch.ai /m/search search page fields tutorial` — 含 *How UserSearch works*、*Getting Started*、MrTechKing 评测 | WebSearch |
| P14 | `https://usersearch.com/resources/documentation/reference/chrome-and-navigation` — *Global chrome and navigation* | WebSearch 结果摘录 |
| P15 | `https://usersearch.com/resources/documentation/reference/credits-and-pricing` / `.../reference/account-billing-settings` | WebSearch 结果摘录 |
| P16 | `https://www.mrtechking.com/usersearch` — *UserSearch* 第三方评测（Freemium / $18.97 / $159.97 / $10 credits） | WebSearch 结果摘录 |
| P17 | `https://techyorker.com/products/usersearch/review` — *UserSearch Review (2026)* | WebSearch 结果摘录 |
| P18 | `https://www.usersearch.com/resources/getting-started/introduction` / `.../guides/email` / `.../guides/forums` | WebSearch 结果摘录 |
| P19 | `https://usersearch.com/resources/documentation/guides/forums` — *Public forums search: overview*（`Reddit Username` 字段、`$0.20`） | WebSearch 结果摘录 |
| X1/X2/X3 | `recon/team-lead-crosscheck.md`（team-lead 交叉验证笔记，非本人实测；X1=getting-started、X2=troubleshooting-faq、X3=目标页可达性） | 读取，未修改 |
| G1–G4 | `recon/github-crosscheck.md`（team-lead 笔记：GitHub `soxoj/osint-namecheckers-list` 的 `Usersearch — ~120 popular sites...`、`m4lal0/userSearch`、`codassassin/UserSearch`、`cn-sec.com/archives/2841437.html` 的 `地址:https://usersearch.ai/`） | 读取，未修改 |
| P20 | `https://www.usersearch.org/features.php` — 分层 `Lightning/Instant/Deep/Complete`、`Bookmark/Save/Collections/Reporting`、免登录 username 查询 | **【公开】由 team-lead 2026-11-06 消息提供，本人未复核 URL 可见性**（遵守「不再扩展新 URL 探测」指令）；仅作范式参考，见 F-18 |

> **本轮补充线索的复核状态（逐条自证）**：team-lead 提供的 6 组公开资料中 —— ①`getting-started/searching`、②`troubleshooting-faq`、③`product/usersearch-2.0`、④`usersearch.com` 首页、⑤`credits-and-pricing`、⑥`mrtechking` —— **均已由本人此前亲自 WebFetch / WebSearch 取得**（对应 P02/X1、P03/X2、P09、P10/P12、P15、P16），并已分别归位到 §C.1 / §F / §E.3b / §D.2b / §E.3b / §D.2b；**仅 `usersearch.org/features.php`（P20）为单方提供、未本人复核**，已如实标注。team-lead 的两份逐字原文摘录（X1/X2，`recon/team-lead-crosscheck.md`）按其要求**以引用方式纳入、不重抄大段原文**。

---

## 附录 4 · 质量自检

- [x] A–I 九节齐全（主理人指定结构）
- [x] 对齐 `rea-recon` 模板七节：§1→§0、§2→§B、§3→§C.4（空表并说明）、§4→§E.4（空表并说明）、§5→附录 2、§6→§H、§7→附录 1
- [x] 每条结论带证据引用（【实测 E…】/【公开 P…】/【推断 I…】），且引用可回溯到附录 3 的 URL / 命令 / 检索结果标题
- [x] 事实与推测分开写；【推断】均标「待验证」
- [x] 未知项单列（H-1…H-12），含影响面与建议下一步；阻塞性假设 H-1/H-2 已显式交回主理人
- [x] **降级通道已显式标注**（附录 1），并写明与 REA 的能力差距
- [x] 「交互→请求→脚本对照表」与「数据契约」为空表且写明原因，未编造字段与接口
- [x] 素材逐项有处置方案，未使用参考站受版权保护资产（附录 2）
- [x] 合规声明区分「做了 / 明确没做」（§I）
- [x] 未修改工作区其他文件
