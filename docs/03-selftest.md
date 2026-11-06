# 阶段 3 · 自测与运行证据

- 环境：Windows / Node **v22.22.2** / 零第三方依赖 / 工作目录 `C:/Users/91464/WorkBuddy/2026-11-06-20-52-57`
- 网站入口：`site/index.html`（纯静态，`file://` 双击可运行；也可用 Node 内置 http server 访问）
- 自测入口：`node site/tests/selftest.mjs`（`node:assert/strict` + `node:module#createRequire` + `node:http`，零第三方）
- 状态复现：`site/index.html?state=<状态>#/search`（同时提供工作台「状态演练」下拉）
  支持值：`idle / loading / success / noresults / partial / source-down / invalid / credits / bulk-limit / timeout / network / session-expired / export-success`

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

（E3 随切片 3 追加）
