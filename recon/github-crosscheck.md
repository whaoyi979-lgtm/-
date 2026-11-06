# GitHub 通道使用记录与公开资源交叉验证

> 用户在本轮明确要求「加载 github 的技能协助」并告知「GitHub 已连接」。本文件记录**实际用到**的 GitHub/Git 能力与公开资源佐证，不含任何私有仓库或凭据。

## 1. 连接与环境实测（2026-11-06 21:00 GMT+8）

| 检查项 | 结果 |
|---|---|
| 连接器 `github` | `status: connected`、`bound: true`、`enabled: true`、`pluginName: github@workbuddy-connector-plugins-official`、`skills: ["github"]`、`mcpServer: github` |
| `github` 技能 | 已加载（提供 `gh` CLI 的 PR / run / api / JSON 输出用法） |
| `gh --version` | **command not found**（本机未安装 gh CLI，PATH 中不存在） |
| `GH_*` / `GITHUB_*` 环境变量 | 未设置 |
| 本会话暴露的 GitHub MCP 写入工具 | **未见**（工具检索未返回任何 `mcp__github__*` 工具） |
| `git --version` | `2.55.0.windows.3`（可用） |

**结论**：连接已建立，但本会话没有可用的**远端写入通道**（既无 gh CLI，也无 GitHub MCP 写工具与 token）。因此本次 GitHub 协助落在两件可验证的事上：① 按 Git/GitHub 工作流规范管理交付物（.gitignore、分阶段提交、可复现仓库结构）；② 用 GitHub 上的**公开仓库/公开索引**补充交叉验证。不擅自创建或推送远端仓库。

## 2. 已执行的 Git 工作流

- 工作区初始化为 Git 仓库（`git init -b main`），仅设置**仓库级**身份（`Replica Delivery <replica-delivery@local.invalid>`），未改动全局配置。
- `.gitignore`：排除 node_modules / dist / build / coverage / test-results / playwright-report / *.log / .env* / `.workbuddy/` / `recon/raw/`。
- 首个提交 `603034e`：`docs: add G0 scope, authorization gate and public-doc crosscheck evidence`（含 .gitignore、G0 定界、公开文档原文摘录）。
- 后续按阶段继续提交（侦察证据包 / 蓝图 / 网站实现 / 验证报告 / 交付报告），交付时给出完整 `git log`。

## 3. GitHub 公开资源交叉验证（WebSearch，2026-11-06）

### 证据 G1 · https://github.com/soxoj/osint-namecheckers-list （MIT，773 stars）
公开清单中将该类在线工具归为「OSINT online tools」，条目原文：
> `Usersearch — ~120 popular sites, 100+ generic forums, 6 dating sites, crypto forums.`

并描述同类工具共性：
> `WhatsMyName App — 732 sites; full web UI with guides, tutorials, step-by-step walkthroughs, and CSV export. Browser-based, no login required.`

**佐证方向**：结果展示的核心是「站点级命中列表 + 来源」，并常有导出；与官方公开文档的 `Data Source column` / `Source attribution` / XLSX 导出一致。**证据等级：公开第三方清单，非目标页直接证据。**

### 证据 G2 · https://github.com/m4lal0/userSearch （Shell 工具）
> `Herramienta para comprobar nombre de usuario en más de 100 sitios web, foros y redes sociales.`
> `Al ejecutar la herramienta, preguntará por el nombre de usuario a buscar, una vez finalizado guarda los links donde se encontró el nombre de usuario en un archivo.`

### 证据 G3 · https://github.com/codassassin/UserSearch （Python，MIT）
> `searches for a specific username specified by the user on 76 different popular social media sites.`

G2/G3 **佐证方向**：同类「用户名反查」工具的通用交互骨架 = 单个标识符输入 → 逐站检查 → 命中链接/站点列表输出。**证据等级：同类开源工具，仅用于交互范式参考，不能作为 usersearch.ai 的行为证据。**

### 证据 G4 · https://cn-sec.com/archives/2841437.html （第三方公开文章，2024-06-12）
> `usersearch近期更新支持了非常多站点，像telegram、wordpress、trello、github、tiktok、twitch等等top站点都有，反查这个功能也是免费的`
> `地址:https://usersearch.ai/`

**佐证方向**：`usersearch.ai` 的公开定位是「按用户名反查注册站点」，覆盖社交/论坛/加密社区等站点，且存在免费的基础反查。**证据等级：第三方公开介绍，非目标页直接证据。**

## 4. 对复刻范围的约束

- G1–G4 只用于**确认交互范式与结果字段方向**，实现时不得照搬任何仓库代码、站点清单、Logo 或文案。
- 这些资料**不能**替代对 `usersearch.ai/m/search` 的直接观察；目标页仍需登录，本次在合规范围内无法直接侦察，该事实写入未知项与交付遗留项。
- 未对任何 GitHub 仓库执行 clone / fork / push / PR 操作；未使用任何私有数据。
