> 一句话：append-only 时间线。每次会话一条，前缀固定，可 grep。

# journal

格式固定，便于 `grep "^## \[" journal.md | tail -5`：

```markdown
## [YYYY-MM-DD] 里程碑 | 标题
- 做：
- 变：
- 留：
```

---

## [2026-11-12] M1 | 目录骨架 + rfc3261 入库 + 站点三视图

- 做：`sip/ media/ wiki/ plan/ vocab/ site/ docs/ scripts/` 骨架；`AGENTS.md`；`docs/` 全套
  （ADR 0001–0003 + memory 四件）；rfc3261.txt 入库并记 sha256；`wiki/` 三页样板
  （concepts/transaction、messages/headers/via、flows/basic-call）；`vocab/terms.yaml` 5 条；
  `plan/plan.yaml` 2 项；`site/build.mjs` 生成三视图
- 变：站点确定为自写生成器（ADR-0002）；wiki 定为全局单层（ADR-0001）；取消 `other/`
- 留：M2 的阶段任务表、第一个 drill、生词晋升流程 → `open-threads.md`

## [2026-11-12] M1.1 | 生词本加音标与发音

- 做：`vocab/schema.md` 新增 `phonetic`（转必填）/`say`/`audio` 三字段；5 条词条补英美音标；
  卡片加 🔊、工具栏加 US/UK 与慢速、抽卡自动先读一遍；构建支持 `vocab/audio/` 本地音频
- 变：发音走浏览器 `speechSynthesis`（零外部依赖），本地 mp3 为可选增强
- 留：`phonetic` 现在是必填，新词条漏写会被 `npm run check` 拦住（已实测）

## [2026-11-12] M2 | 目标定格 + 章节地图 + 计划改按里程碑

- 做：`wiki/specs/rfc3261.md`（四类文档分类 + 28 节地图 + 三条阅读路线 + 陷阱清单）；
  `plan.yaml` 重写为 α–ε 里程碑（17 个任务，全部带可验证 `done_when`）；
  `sip/labs/drills/` 首批 3 个（msg-parse / options-uas / transaction-timers）+ README 格式约定；
  ADR-0004；`docs/01-workflow.md` 增“读 spec 的时机”
- 变：**目标从“学 SIP”定格为“自研 SIP 栈 → FreeSWITCH-like 组件”**；计划组织从“按章节”改为“按可运行里程碑”；
  `media/` 从“学完再说”改为与 sip 并行（δ 里程碑需要 SDP/RTP）
- 留：α-1 尚未开工 → `open-threads.md`

## [2026-11-12] M2.1 | 把“设计过程”落地成 ADR + 方法篇

- 做：`docs/adr/0005-learning-milestones-over-linear-reading.md`（列出 4 个被否决的备选 + 重估触发条件）；
  `docs/03-learning-method.md`（四分类法/里程碑切法/验收物三分/反模式/迁移到 media）；
  `01-workflow` 瘦身（方法移入 03，只留动作清单）；`docs/README` 加索引与“新增文档的判据”
- 变：确立边界——**规用则在 docs，实例在 wiki**；讨论过程不留存，只留判断 + 依据
- 留：无

## [2026-11-12] M2.3 | 加 Phase 0 认知地基（修分类漏洞）

- 触发：用户质疑"介绍性章节是不是也得看" → 发现自己给 §1–§3 标"跳"时**未读正文，只看了标题**，
  违反 `AGENTS.md` §3
- 做：`plan.yaml` 新增 Phase 0（p0-1..p0-5，通读 §1–§3/§5、精读 §6/§4、通读 §24、产出心智模型页）；
  新建 `wiki/concepts/sip-mental-model.md`（draft，五题待答）+ `sip/labs/drills/mental-model.md`；
  章节地图 §1–§3 从"跳"改"通读"并标未核对；`03-learning-method.md` 改成**四种读法**（补"通读"档）；
  ADR-0005 加"修订"节；`AGENTS.md` 加第 9 条"计划是假设不是承诺"
- 变：学习路线前面多了一环**不产代码的前置**；读法从三档变四档
- 留：Phase 0 未开工

## [2026-11-12] M2.4 | 阶段重排：现象 → 原理 → 模仿 → 实现

- 触发：用户反馈"计划直接就让写代码，我对整体概念根本不了解"
- 诊断：p0（读 2–3h）→ α-1（写 parser + 字节级 round-trip）跳了三个台阶：没见过真实报文 /
  没有工具反馈 / round-trip 对初学是第二周任务
- 做：`plan.yaml` 重排为 **L0 骨架(1–1.5h) → L1 观察(3–5h) → L2 原理(2–3h) → L3 模仿(2–4h) → α–ε**，
  共 31 任务；前三段 `code: false`；α-1 判据拆两档（基线=解析并打印，加强=round-trip）；
  阶段加 `timebox`/`est`，站点显示"不写代码 · 约 3–5h"；`AGENTS.md` 加第 10 条；
  `03-learning-method.md` 加"阶段顺序"原则；ADR-0005 加修订二；章节地图阅读路线改成五条
- 变：**通读 §1–§6 从"最前"移到 L2**（有现象之后再读），L0 只留 §4 + §24
- 留：L0-1 尚未开工

## [2026-11-12] M2.5 | 图表能力：svg-diagram 技能 + 首个 SIP 时序图

- 触发：希望 agent 生成说明时能配图（类似 WorkBuddy 的架构图），并提炼成可复用技能
- 做：项目级技能 `.agents/skills/svg-diagram/`（SKILL.md 硬规则 + references/tokens.md 调色板几何 +
  references/archetypes.md 五类骨架 + scripts/svg-check.mjs 机械校验 + scripts/render.mjs 截图 +
  assets/skeleton.svg）；产出 `wiki/assets/ladder-basic-call.svg` 并内联进 `wiki/flows/basic-call`
- 关键：**脚本查"错"（几何/文字溢出/类未定义/marker），截图查"难看"**——模型能自己看图，闭环才成立
- 变：构建支持 `![说明](assets/x.svg)` 内联；`AGENTS.md` 加 §7 图表规则（`dg-` 前缀等）
- 变更：技能改为**全局可用**——源码移到 `tools/skills/svg-diagram/`（纳入 git，且不在技能发现路径，避免重名），
  `scripts/install-skills.sh` 负责装到 `~/.pi/agent/skills/`；已安装并自检通过

## [2026-11-12] M2.2 | 计划页 chip 可点：原文锁点页 + 练习页

- 做：`site/build.mjs` 新增 `rfcSections()`（按节切分、剔页眉页脚、生成 `#sec-x.y` 锁点）与
  `renderDrillPage()`；`sources` chip 链到原文、`drills` chip 链到练习页；导航加“RFC 原文”
- 变：**原文也进了站点**（之前只能 grep txt）；`npm run check` 新增“plan/wiki 引用的 drill 必须存在”
- 坑：首版标题正则要求 `[A-Z]` 开头，漏了 54 个以数字开头的节（如 `13.2.2.1 1xx Responses`）；
  改为 `[A-Za-z0-9]` + 首段≤30 过滤后对齐到 314 个编号节 + 附录 A
- 留：无

## [2026-11-12] M2.7 | L1 实验环境方案定稿（未动手）

- 触发：L1-0 要 sipsak/sipp/tshark，用户建议统一用 docker 镜像做测试环境
- 做：`docs/04-lab-toolbox.md`——镜像内容、网络/挂载约定、三层结构（Dockerfile/run.sh/recipes）、
  recipe 与 drill 的分工、v1 范围（镜像 + recipes 00/01/02）、明确不做的事、两个待验证点
- 决定：**recipe 里的命令允许是草案，但第一次跑完必须把实测结果写回**（否则它就是"看上去对的文档"）
- 实测：本机三件套都没装；docker 29.7.2 可用；sudo 需密码 → 镜像路线成立
- 留：镜像尚未构建（用户要求先完善方案）

## [2026-11-13] M3.0 | 生词录入：表单 + 缺口标记 + 批量补全闭环

- 触发：希望页面里输入单词自动记录音标与发音；机器拿不到的信息要能标记、之后交 agent 批量补全
- 做：`scripts/vocab-lookup.mjs`（在线 dictionaryapi + 离线 CMUdict + ARPAbet→IPA）；
  dev 服务加三个接口（`/api/ping`、`/api/vocab/lookup`、`POST /api/vocab/candidate`，含 mp3 下载）；
  生词本页加「录词」面板（dev 可写、静态只查）；候选池按「待补全 / 待复核」分组；
  新字段 `missing`/`drafted_by`/`lookup`/`audio_source`；四级状态机；`check` 加四条硬校验；
  `AGENTS.md` 新增「批量补全候选词」动作
- 实测：`glare` 在线 → `BrE /ɡlɛə/ · AmE /ɡlɛəɹ/` + uk.mp3 可用；`provisional` 离线 → `/prəvˈɪʒənəl/`；
  POST 重复词被拒（glare 已在正式本）；`retransmission` 走完整链路 candidate → drafted（missing=[]）
- 边界：写接口只在本机/私有网段、只写 vocab 两个 yaml、≤64KB；AI 永远不许写 terms.yaml
- 留：`retransmission` 处于 drafted（等你复核）；`baresip/pjsua` 包名待验

## [2026-11-13] M3.1 | 修：录词成功但页面看不到

- 症状：用户录 `Standards` 提示成功，刷新生词本页不显示
- 根因：`dist/` 是生成物，dev 服务只服务静态文件，**写入 yaml 后没有重建**
- 修：抽出 `buildSite()`，`POST /api/vocab/candidate` 成功后立即 `rebuild()`；日志打 "↻ 已重建 dist"
- 附带：`phonetic` 为空时拒绝写入（否则 check 必报错，用户会以为"存成功了却报错"）
- 验证：POST `forking` → 响应 ok + 日志重建 + `dist/vocab.html` 立即能查到（测试条目已删）

## [2026-11-16] M4.0 | 站点外壳 VitePress 化（自写生成器，不迁框架）

- 触发：想要 walkinglabs / icyfenix.cn 那种文档站观感；查证结果是两站分别用 VitePress 1.6.4 与 VuePress 1.9.10 的**默认主题**
- 选择：留在自写生成器（ADR-0002 current），只补主题层能力；否决了真迁 VitePress（§chip / drill / 生词表单 / check 都要改插件，收益只有主题本身）
- 做：`shell()` 重写为 顶栏 + 左侧导航树 + 右侧大纲 + 页底上下页；`addHeadingIds()` 给 md 标题补 id（marked v15 不再生成）；
  `wikiNavOrder()` 用 `wiki/index.md` 的 wikilink 顺序排导航；`Aa` 阅读偏好（字号/行宽，`s`/`l` 键，`html[data-*]` + localStorage，head 内联脚本防闪烁）；
  移动端抽屉；`style.css` 重写为布局 + 组件两段
- 踩坑：`.layout.bare .doc{grid-template-columns:1fr}` 只改了内层，外层 `.layout` 仍按 `264px 1fr` 排 → 原文页正文被挤进 264px 首列。
  修法是 `.layout.bare` 自己也改列
- 验收：105 处 `§chip` 全部命中 316 个 `#sec-*`；900px 抽屉；暗色变量两套；无 JS 报错

## [2026-11-16] M4.1 | 中文译文层 `sip/zh/` + 双语阅读器

- 触发：英语阅读慢，需要"中文先上手、再回原文核对"的对照读法；且规范性措辞不能被翻译改写
- 决定：ADR-0006（译文单独一层、一节一文件、`en_sha` 检测过期、agent 只到 `draft`）
- 做：`scripts/rfc-sections.mjs`（切节 + `sectionSha` + `toBlocks` 散文折行）/ `scripts/zh.mjs`（读入与校验）/
  `zh-check.mjs`（规范词保留、节号、`en_sha` 漂移）/ `zh-status.mjs`（覆盖率）；
  原文页三态 modebar（`zh`/`en`/`dual`，`t` 键切换）；`GLOSSARY.md` 8 条硬规则 + 60 个词条译法
- 翻译：§4、§7.1、§7.2、§7.3、§8.1.1.7、§17.1.1.1、§24.1、§24.2（8 节，全部 draft）
- 校验：故意写一份把 MUST 全译成中文的假译文，`zh:check` 报 7 个 error（22 处 MUST 一个都没保留），链路确认有效
- 踩坑：① 英文按 `pre` 原样搬进窄栏会碎成断行 → 用"散文按段落合并、预格式化块原样保留"的分类器；
  ② RFC 行尾连字符（`start-` / `line`）合并时不能插空格，但连字符要留；③ 散文里 `non-INVITE` 同理
- 留：批次 1 还差 §16/§17 主体（见 open-threads）

## [2026-11-16] M4.2 | 原文页目录树可拖宽 / 可隐藏

- 触发：RFC 原文页左侧 316 节目录固定 250px，长标题折行，且读正文时嫌占地方
- 做：`.rawlayout` 变 3 列（目录 / 8px 拖柄 / 正文），拖柄 `col-resize` + 指针捕获，150–480px，
  双击复位；modebar 加「隐藏目录」按钮，快捷键 `[`；宽度与显隐存 `sip.tocw` / `sip.toc`，
  head 内联脚本先于绘制套用（无闪烁）
- 踩坑：隐藏时用 `0 0 1fr` 三列，正文被填进 0 宽首列 —— `display:none` 的网格项不让出列。改成单列
- 校验：合成 PointerEvent 模拟拖动 +150px → `sip.tocw=400`；点按钮 → `sip.toc=off`、按钮文案翻转、网格变 1116px 单列

## [2026-11-16] M4.3 | 原文页改左对齐，回收左侧空白

- 症状：1560px 宽下原文页左侧空出约 190px，目录树被推到页面中间
- 根因：`bare` 页仍沿用 `.doc{max-width:1180px;margin:0 auto}` 的居中规则
- 修：`.layout.bare .doc{margin:0;max-width:none;padding:0 24px 0 20px}` + `.rawbody{max-width:calc(--content-w + 80px)}`；
  ≤960px 恢复占满
- 结果：目录贴左边缘，正文 840px 左右，右侧留白随窗口增长

## [2026-11-16] M4.4 | 原文页正文默认满宽，页头单独收窄

- 触发：左对齐后右侧仍留一大块空白（正文封顶 840px），用户觉得浪费
- 做：正文改 `max-width: var(--raw-w)`，`Aa` 面板新增第三行「原文」= 满 / 宽（1040）/ 中（content+60），默认满，
  存 `sip.raww`；页头（crumb + h1 + 说明）包进 `.rawhead` 收到 900px，避免长行
- 权衡：满宽时英文行长 ~1300px（约 140 字符），长于可读区间 45–90；所以保留「宽/中」两档一键收

## [2026-11-16] M4.5 | 上线 GitHub Pages（Actions artifact 部署）

- 触发：仓库 public、origin 已配好，想有个随时能看的地址
- 做：`.github/workflows/pages.yml`（check → site → upload-pages-artifact → deploy-pages），
  `site/dist` 继续不入库；`docs/02-site.md` 加「部署」一节
- 关键前提：全站相对路径，子路径 `/sip-starter/` 下不会碎链（扫过 dist，0 处 `/assets` 绝对引用）
- 降级：静态托管没有 `/api/*`，录词表单自动显示「静态模式」（只查不写）
- 待办：Settings → Pages → Source 选 GitHub Actions 才真正出站

## [2026-11-16] M4.5.1 | Pages 首次部署踩坑：configure-pages 在未启用 Pages 时必失败

- 症状：push 后第一次 Actions 跑到 `configure-pages` 就 failure，`upload-pages-artifact` 与 deploy 全 skipped
- 根因：仓库当时还没开 Pages（`has_pages=false`），`configure-pages` 拿不到环境信息
- 修：API 建 Pages `POST /repos/{o}/{r}/pages -d '{"build_type":"workflow"}'` → 201，再 `workflow_dispatch` 重跑 → success
- 结果：`https://zyp461476492.github.io/sip-starter/` 200；`raw/rfc3261.html` 717KB / `assets/style.css` / `search.json` /
  `drills/*` / `vocab.html` 全部 200；本地与线上渲染一致
- 结论：**先启用 Pages，再 push** 能省一次失败构建；顺序反了只需重跑一次 workflow，不影响产物

## [2026-11-16] M4.6 | 字体与排版向 VitePress/VuePress 靠

- 症状：自写外壳的字"不好看"，对比 icyfenix.cn 觉得不齐、不够文档感
- 根因：字体栈里全是 macOS/Windows 专有字体（`-apple-system`/`PingFang SC`/`Microsoft YaHei`），
  Linux 上一个都不命中 → 拉丁回落到 DejaVu Sans、中文回落到 Noto Sans CJK，**两套字形混排**；
  另外 `pre` 没设 font-family，RFC 原文直接用浏览器默认等宽
- 做：自托管 **Inter**（latin 变量字重 48KB）+ **JetBrains Mono**（21KB），OFL 许可与 `SOURCE.md` 一起入库；
  `--font-sans` 拉丁在前、系统 CJK 栈在后；`pre/kbd/code` 统一 `--font-mono`；
  字号阶梯改成 h1 2em/650、h2 1.5em/600（上 2.2em 下边框）、h3 1.2em、段落 1em
- 顺手：去掉 wiki 页 h1 的 2px 绿下划线（框架默认主题都没有），正文色 #24292f
- 踩坑：往 style.css 里插 `:root{--font-sans…}` 时忘了闭合，后面整块 `:root` 被嵌进去 → 布局全塌（侧栏变整行）。
  CSS 嵌套语法让这种错误不报错而是静默生效，改完必须截一张图看

## [2026-11-16] M4.7 | 原文页收窄时居中 + 页头移进正文列

- 触发：隐藏目录后选「宽/中」，正文仍贴左，右侧一大片空白；页头还停在页面最左边，与正文脱节
- 改：`.rawbody{width:100%;max-width:var(--raw-w,none);justify-self:center}`；`rawhead` 从 grid 外移进
  `.rawbody` 顶部（TOC 只管左边，页头与正文同宽同心）
- 结果：满宽时不变；宽/中时在可用区域内居中；≤960px 仍占满

## [2026-11-16] 里程碑 | L0-1 验收暴露两个结构性缺陷，wiki 补齐 dialog 层

- L0-1 的 `done_when` 要求"说出 UAC/UAS/代理/registrar 各自维护什么状态"，但 `sources` 只有
  §4/§24.1/§24.2 —— §4 讲拓扑不讲状态，判据在该材料下**无法完成**。按 AGENTS §3 第 9 条件当场改计划：
  决定拆成 l0-1（画图 + 方向/逐跳/端到端）+ 新增 l0-3（三层状态），片段已交给用户（plan.yaml 仅人可写）
- 第二个缺陷：站点"✓ 已支撑"只校验 slug 存在（`site/build.mjs:757`），绿勾骗人
- wiki 侧：新建 `concepts/dialog.md`；`flows/basic-call.md` 补「各角色维护什么状态」
  「为什么 ACK/BYE 可以贯穿全场」两节，F 表改按 §24.2 重编
- 学习侧：两版手绘图对比 —— 第一版 ACK/200 OK 顺序与方向全反、多画了 Bob 的 100 Trying；
  第二版全部对上 §24.2（编号、方向、逐跳/端到端）

同日补记：用户授权 agent 代改 `plan/plan.yaml`（§2 例外，仅此一次）—— l0-1 判据收窄并标 `done`，
新增 l0-3（sources 补 §6/§10.3/§12.1.1/§12.1.2/§17.1.3/§18.2.1）。`npm run check` → 0 错误 0 提醒，任务数 31 → 32。

同日：用户质疑"plan.yaml 为什么仅人可写"，经核查 ADR-0003 并无此依据（§2 是把 terms.yaml 的禁令并过来了）。
开 ADR-0007：元数据（title/sources/wiki/est、新增任务）人+agent 可写；`done_when`、`status`、阶段
`code`/`timebox` 仅人——把"被校验的客观事实"与"评分刻度"分开。待用户同意后改 AGENTS.md §2 表格。

ADR-0007 落地：`AGENTS.md` §2 目录表已由一行拆为三行（元数据人+agent / `done_when`+`status` 仅人 / `terms.yaml` 仅人）。
之后 agent 可直接补计划的 sources/wiki/est 与新增任务，只把判据和状态留给人。

## [2026-11-16] M4.9 | L0–L1 涉及的节全部译完（8 → 49 节）

- 触发：用户「把 L0 和 L1 涉及的章节都翻译了」；`status.md` 的下一步本来就是批次 1
- 做法：按 `plan/plan.yaml` 里 l0-*/l1-* 的 `sources` 逐条列出节号，减去已译的（§4/§7.3/§17.1.1.1/§24.1/§24.2），
  剩下 10 组一次译完：§6、§9 全节、§10.3、§12.1.1/12.1.2、§17.1.3、§18.2.1、§20.42、§21.4 整个 4xx 块、§22.1、附录 A
- 口径（这次定下的边界）：**父节只有引言时连子节一起译**（§9 → 9.1/9.2；§21.4 → 21.4.1–21.4.28），
  兄弟节若与该任务无关则不译（§10.1/10.2、§12.2、§21 的其他类）
- 附录 A 只译 Table 4；紧随其后的 Acknowledgments / Authors' Addresses / Copyright 在译文里显式标注"未译"
- 收尾：`npm run zh:check` → 0 错误 0 提醒（修了 3 处规范词计数不符）；`npm run check`/`site` → 0 错误

## [2026-11-16] M4.9 补 | §7.3 的子节也译了（7.3.1 / 7.3.2 / 7.3.3）

- 触发：用户「7.3 下面的子目录也都翻译了」——上一批只译了 §7.3 的主干（头域语法与合并规则），
  子节（字段格式与空白规则、请求/响应头域分类、紧凑形式）还是空的
- 重要内容：**§7.3.1 的"多行同名头域何时可合并"例外清单**（WWW-Authenticate/Authorization/Proxy-Authenticate/
  Proxy-Authorization 不得合并）、以及"逗号合并会改变语义"的三个 Route 反例 —— l0-2 逐头标注时要用
- 结论：`sip/zh/` 覆盖 52 节（17%）；`npm run zh:check` 0 错误 0 提醒

## [2026-11-17] query | 「隐式空白」看不懂 → 补出 wiki 的头域语法层

- 用户的困惑点是**文法形式**而不是协议行为：RFC 3261 §7.3 说 SIP 头域语义抄 HTTP，但 HTTP 用
  "implicit whitespace and folding"、SIP 用 RFC 2234 的 "explicit" 写法——不熟 ABNF 完全读不出差别
- 讲清顺序（两次问答迭代出来的）：先给「同一件事两种写法」的对照 → 再补 ABNF 记号与 core rules 字节
  → 最后逐条拆 `LWS`/`SWS`/`HCOLON`。**先记法后规则**，反过来一定看不懂
- 落成 `wiki/messages/headers/format.md`（current），并在页里把「折行不是全局许可」写成判据：
  折行只出现在具体产生式的 `LWS` 上，`Call-ID` 的 `callid` 里没有 `LWS` → 文法层面不许折
- 未核对：RFC 2616 §2.1/§4.2、RFC 2234 §6.1——**两篇都没入库**，页里已显式标注

## [2026-11-16] M4.10 | L2 涉及的节译完（52 → 68 节）：§1/2/3/5 + §17 全块

- 触发：用户「L2 涉及的也翻译」；按 l2-1/l2-2/l2-3 的 `sources` 清单算差集，剩下 §1/2/3/5 与 §17 整块
- §17 全块共 13 个有正文的节，含三张 ASCII 状态图（Figure 5/6/7/8）——图**原样进 code fence**，
  只在外面写中文；事务状态名（Calling/Proceeding/Completed/Confirmed/Terminated、Trying）保留英文，
  与定时器名 A–K 一致（GLOSSARY 的思路：标识符不译）
- 踩坑又一次：§17.1.1.2 第一版少了 1 个 MUST、1 个 MAY —— 一个英文 MUST 带并列动词
  （`MUST retransmit ... and MUST reset`）时中文容易省掉第二个；`T1 MAY be chosen larger` 被写成"也可以选得更大"
- 结果：`npm run zh:check` 0 错误 0 提醒；覆盖 68/302（23%）；L0–L2 的 `sources` 全部有中文
- 未动：`wiki/messages/headers/format.md`、`wiki/index.md`、`wiki/log.md`（另一条线的工作，未提交）
