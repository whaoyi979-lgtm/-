# 组长交叉验证 · 公开文档原文摘录

> 来源性质：**同品牌公开官方文档**（usersearch.com），非 `usersearch.ai/m/search` 目标页本体。
> 获取方式：WebFetch 直读公开页面（未登录、未绕过任何验证），时间 2026-11-06 20:58–21:00 GMT+8。
> 用途：作为「公开资料佐证」补强证据包；实现时**不复制**其中的品牌名、模块名、数据源名、价格与文案，一律换成占位资产。

---

## 证据 X1 · https://usersearch.com/resources/getting-started/searching

标题：`Search Techniques - UserSearch Investigation Guide`

**搜索流程（原文）**
> UserSearch follows a consistent flow: choose a Search type, select a Module, configure its data sources when available, enter a query, review the Credit cost and run the search.

5 步：
1. `Choose a Search type` — Select the top-level type that matches the identifier or subject you are investigating.
2. `Pick one Module` — A Module is the specific search tool. The selected Module determines its **input**, **data source or sources**, and **Credit cost**.
3. `Configure when available` — The **gear control** can expose **site filters** or a **Choose Data Source** window. **OneScan** lets you select several data sources for one input.
4. `Enter the query and review the cost` — Check the **Cost per search** line before selecting **Search Now**. Credit costs can be **free, fixed or dynamic**.
5. `Treat results as leads` — Review **data-source attribution** and corroborate important results. Third-party **Match Accuracy** is a confidence signal, not proof of identity.

**18 个 Search type（原文清单）**
`Username Intelligence` / `Email Intelligence` / `Phone Intelligence` / `People Intelligence` / `Corporate Intelligence` / `Cyber Intelligence` / `IP Intelligence` / `Product Intelligence` / `Chat Messaging` / `Public Forums` / `Picture` / `Cryptocurrency` / `Vehicle Lookup` / `Threat Intelligence` / `Wireless Device` / `Domain Intelligence` / `Breach Exposure` / `Court Records`

**OneScan / Bulk search（原文）**
> One input can run across several selected data sources. Results are merged with data-source attribution. Its dynamic Credit cost is the sum of the sources left selected.
> Up to five inputs can run through one Module. Each query is one search, and the Credit costs are added together. Bulk search and OneScan are independent and can be combined.

**结果字段（原文）**
> Result summaries separate what the selected data source found from information it enriched and the connections it identified. **Found** records the direct return, **Enriched** highlights added context, and **Connections** surfaces related identifiers or entities that may support another search.
> Some third-party sources provide a **Match Accuracy** indicator. Treat it as that provider's confidence signal rather than a UserSearch identity confirmation.

**Cases / 模式 / 导出（原文）**
> **Forensic Mode** stores search history in the selected Case. **Private mode** does not store that search history.
> Bookmarks retain useful results inside a Case... Reports organise selected findings for review, and documented export options include **XLSX**. A custom Case password can protect Case bookmarks.
> Global Credits are used for platform searches and Sarge Credits are used by the SargeBot AI Investigation Agent. Always review the displayed Credit cost before running a Module... the total reflects each query and each selected data source.

---

## 证据 X2 · https://usersearch.com/resources/documentation/help/troubleshooting-faq

标题：`Troubleshooting & FAQ | UserSearch Documentation`；页脚：`Verified against UserSearch v2.0.20`

**初始空状态（原文）**
> Search composer, Username Intelligence, empty state (**"No active search"**)
> Before any run, the results panel shows the empty state **No active search**.

**零结果（原文）**
> A **Found** count of zero is a normal, expected result — it means the selected **Module** queried its **data source** and no records matched your input, not that anything is broken.
> "Not found" and "found nothing to enrich" are **outcomes, not errors**. Treat a zero result as a prompt to widen sources (try **OneScan**), re-check the input, or switch **Search type**.

零结果的 5 条处置路径：①Check the input（去除多余空格、不要传完整 URL、字段名要与 Module 匹配，如 `Username` for OneScan / `Search query` for Username Search 3000+）②Confirm the Search type ③Widen the sources with OneScan（标记 **RECOMMENDED**）④Loosen any narrowing filters（**Choose Data Source** modal 默认 `Limit: Top 500 (Alexa)` / `Search type: Any` / `Website Country Origin: Any Country`，用 **Reset** 恢复默认再 **Apply Filters**）⑤Public Leaks 的实体类型 tab strip：`All, Email, Phone, IP, CIDR, MAC, Domain, URL, Bitcoin, IBAN`。

**额度不足（原文）**
> Searches are paid from your **Credits** balance, shown as a **coral-orange pill** in the composer header (for example `$22.88`) and mirrored in the top bar. If your balance is lower than a Module's **Cost per search**, top up before running the search.
> `Account Credits & Team Licenses` → `Credit Top-up` 预设金额 / `Custom Selection` 滑块（**10–200**）→ `One Time` 或 `Monthly` → `Proceed to Checkout`；另有 `Auto-topup`。
> The **Global** search-credits pool and the **S.A.R.G.E.** (AI Agent) pool are separate wallets...
> On a **team** account, members draw on **one common pool**...

**搜索卡住 / 加载（原文）**
> If a search does not return and the **Search Results** panel does not populate:
> 1. Confirm you selected a Module and pressed **Search Now**. A Module must be highlighted (**coral-orange border**) and you must click the **coral-orange Search Now button with the magnifier icon**.
> 2. Check the input and **Cost per search** line beneath it.
> 3. Reduce the scope of a broad search（OneScan 会对每个开启的数据源做工作；Limit 高于 Top 500 (Alexa) 更重）。
> 4. Re-run the search... contact support via **Help** or **Contact Us**.
> The **Status** pill in the header shows a live, minute-by-minute status of all UserSearch integrations and data sets, and flags any that are faulty.

**数据源故障（原文）**
> An individual data source can be unavailable even when UserSearch itself is working.
> ①Check the **Status** pill ②Switch to **OneScan**（健康来源的结果仍出现，**Data Source column** 显示每行来源）③Open the **Choose Data Source** modal (gear icon), toggle off the affected data source, and **Apply Filters**. This also removes that data source's cost from the **Total cost** ④Pick a different single-source Module.

**成本与扣费（原文）**
> Every search deducts **Credits** from the **Global** pool by the amount shown on its **Cost per search** line, and each charge is recorded in **Transaction history** (`Time, Initiated by, Type, Amount, Description`；每行是 **DEBIT**；描述命名 Module 和 data source)。
> Some Modules are **free** (0 Credits), some are **fixed**, and **OneScan** is **dynamic**.
> OneScan 成本行示例：**`$1.20 | Dynamic (0.50 - 1.20)`**。
> FAQ: **Bulk search — the toggle in the composer header — runs many inputs through one Module, and is capped at 5 queries per search.**
> FAQ: The **Status (N)** pill is a live, minute-by-minute status of all integrations and data sets.
> FAQ: `Choose Data Source` modal 默认 `Limit: Top 500 (Alexa)` / `Search type: Any` / `Website Country Origin: Any Country`，`Apply Filters` / `Reset`。

---

## 证据 X3 · 目标页可达性（组长实测，见 docs/00-G0-scope.md F1–F3）

| 操作 | 结果 |
|---|---|
| `WebFetch https://usersearch.ai/m/search` | **登录页**：`Login \| UserSearch 2.0`、`Sign in to UserSearch`、`Enter your credentials to continue`、Email / Password / `Forgot password?` / `Keep me signed in` / `Sign In` / `or` / `Email me a login link` / `Continue with Google` / `Don't have an account? Create one`。搜索页受登录墙保护。 |
| `curl -sS -L https://usersearch.ai/m/search` | HTTP 403 + Cloudflare `Just a moment...`（CSP 指向 challenges.cloudflare.com）。**记为访问限制，未重试绕过**。 |
| `WebFetch https://usersearch.ai/`、`/m/auth/register` | 均只返回 `Just a moment...`。 |

---

## 交叉验证结论（供 G1 门禁判断）

1. 目标页 `/m/search` 本体在合规范围内**无法直接观察**，因此关于其 DOM、路由、脚本、接口的一手证据为 0；不得声称已侦察到。
2. 但同品牌**官方公开文档**对「搜索流程 / 输入项 / 结果字段 / 状态文案 / 边界情况」有逐字级描述，足以支撑一个**行为对齐的功能复刻**，且每条都可追溯到公开 URL。
3. 因此本次采用「公开文档驱动的行为复刻 + 全量占位数据」路线，并在交付报告中把「目标页直接证据缺失」列为**明确遗留项**，而非隐瞒或猜测。
