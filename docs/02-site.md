> 一句话：站点怎么构建、三视图各显示什么、构建坏了从哪查。

# 02 站点

## 命令

```bash
npm install       # marked + js-yaml
npm run site      # 只构建 → site/dist/
npm run dev       # 构建 + 本地服务（http://localhost:5173）
npm run check     # 只校验不写文件（含中文译文层）
npm run zh:check  # 只体检译文层（frontmatter / 节号 / en_sha 漂移 / 规范词）
npm run zh:status # 译文覆盖率报表：下一步译哪几节
```

`site/dist/` 是生成物，**永不手改，也不入库**（`.gitignore` 已排除）。

## 数据 → 页面

| 数据源 | 生成 | 视图 |
|---|---|---|
| `plan/plan.yaml` + `wiki/` 存在性 | `dist/index.html` | 学习计划（进度、下一步、wiki 支撑状态） |
| `wiki/**/*.md`（frontmatter + 正文） | `dist/wiki/<area>/<slug>.html`、`dist/wiki/index.html` | 知识库（含页尾反链、相关生词） |
| `vocab/*.yaml` | `dist/vocab.html` | 生词本（音标 + 发音 + 筛选 + 抽卡） |
| `sip/raw/rfc/rfc3261.txt` | `dist/raw/rfc3261.html` | **原文锁点页**：按节切分、剔页眉页脚，`§x.y` 可直跳 |
| `sip/zh/rfc3261/*.md` | 同上（每节嵌中文块） | **双语阅读器**：中文 / 原文 / 对照三态，见下 |
| `sip/labs/drills/*.md` | `dist/drills/<slug>.html` | 练习页（带证据锚点与相关 wiki） |
| `wiki/assets/*.svg` | 内联进对应页面 | 说明图（md 里写 `![说明](assets/x.svg)`，构建时把文件内容嵌进页面） |
| 以上全部正文 | `dist/search.json` | 全站子串搜索（几百页足够，不上向量） |

## 版式（VitePress 风格的自写外壳）

`site/build.mjs` 的 `shell()` 产出：顶栏（brand + 四个导航 + 搜索 + `Aa` 阅读偏好）+
左侧固定导航树 + 右侧「本页内容」大纲 + 页底上一页/下一页。

- **左侧栏**：学习计划 / 知识库（按 concepts → messages → flows → specs → questions 分组）/ RFC 原文 / 练习 / 生词本；
  顺序取自 `wiki/index.md` 的 wikilink 顺序，其余按字母补在后面（`wikiNavOrder()`）
- **右侧大纲**：从渲染后的 `h2/h3` 自动抽（`addHeadingIds()` 给标题补 id），
  `IntersectionObserver` 式的滚动高亮在 `app.js` 的 `outlineSpy()`
- **阅读偏好**：`Aa` 面板或快捷键 `s`（字号 4 档）/ `l`（行宽 3 档）；写进 `html[data-size|data-width]`
  与 localStorage，CSS 变量 `--read-size` / `--content-w` 承接。另有第三行「原文」控制 RFC 原文页正文宽度
  （满 / 宽 / 中 → `html[data-raww]` → `--raw-w`），默认满宽。无闪烁：`<head>` 里内联脚本先读 localStorage
- **移动端**：≤960px 侧栏变抽屉（汉堡键 + 遮罩），≤1280px 隐藏右侧大纲
- **RFC 原文页是 full-bleed**（`bare: true`）：不要左右栏，它自带 316 节目的节导航。
  整块**左对齐不居中**（`.layout.bare .doc{margin:0}`）——目录本身就是导航列，居中会在大屏左侧
  空出一大块。正文宽度默认**满宽**（吃满剩余空间），需要收窄时用 `Aa` 面板第三行「原文」（满 / 宽 / 中），
  存 `sip.raww`。**收窄后正文在可用区域内居中**（`.rawbody{justify-self:center}`）——左对齐会把空白
  全堆到右边，隐藏目录时尤其像"没写完"；页头 `.rawhead` 已移进正文列，与正文同宽同心（满宽时仍收 900px）
- **原文页目录树可调**：拖动右缘 8px 拖柄改宽度（150–480px，双击复位到 250），
  modebar 上的「隐藏目录」或快捷键 `[` 整块收起。宽度与显隐存 `localStorage`（`sip.tocw` / `sip.toc`），
  由 `<head>` 内联脚本先于绘制套用，不闪

## 双语原文阅读器

数据在 `sip/zh/rfc3261/<节号>.md`，约定见 `sip/zh/README.md` 与 ADR-0006。

- 每节渲染成「中文块 + `<details>` 折叠的英文原文」
- 顶部 `modebar` 三态：`中文`（默认，原文折叠）/ `原文` / `对照`（左右两栏）；快捷键 `t`，状态存 `sip.rmode`
- 未译节：英文照常显示 + 灰色「未译」徽标；原文变更过：红色虚线「原文已变」
- **英文不是逐行 `pre`**：`toBlocks()` 把散文按段落合并折行（行尾连字符直接粘连），
  表 / ABNF / 报文样例原样保留 —— 否则窄栏里全是断行
- 规范词不译：`MUST` / `SHOULD` 等保留英文原词，`npm run zh:check` 逐节核对数量

## 三类 chip 的行为

计划页与 wiki 页上的 chip 不是同一种东西：

| chip | 外观 | 行为 |
|---|---|---|
| `RFC3261 §7.1` | 等宽、实线 | 可点，跳 `raw/rfc3261.html#sec-7.1` |
| `RFC3581（待入库）` | 虚线 | 不可点——原文没入库，没有可跳的目标 |
| `✓ specs/rfc3261` | 绿色 | 可点，跳 wiki 页（✓ = 页已存在） |
| `drill: msg-parse` | 实线 | 可点，跳练习页 |
| `drill: xxx`（虚线） | 虚线 | 不可点——练习文件还没建 |

## wiki 页面约定

```markdown
---
id: concepts/transaction          # 必填，等于相对 wiki/ 的无扩展路径
title: Transaction（事务）         # 必填
topics: [sip]                     # 必填
status: current                   # draft | current | superseded
specs: ["RFC3261 §17"]            # 证据锚点，必须能在 raw 里 grep 到
drills: []                        # 关联 labs
updated: 2026-11-12
---

正文。交叉引用写 [[concepts/dialog]]。规范性论断写：

> 原文引用……
（RFC 3261 §17）
```

反向链接由构建脚本扫描全站 `[[...]]` 自动生成，**不要手写"相关页面"清单**。

## 生词本发音

三层回退：**本地 `audio` 文件 → 在线词典音频（有道）→ 浏览器 TTS 合成**。

- 卡片上的「读」按钮、抽卡时自动念一遍
- 工具栏：`US`/`UK` 口音、`慢速`、`在线发音` 开关（均存 `localStorage`）
- **本机没有 TTS 语音时，页面顶部会出现提示条，并自动切到在线发音**
- 缩写词务必写 `say`：`CSeq` 不写会念成字母串
- 要摆本地音频：mp3 放到 `vocab/audio/`，词条加 `audio: audio/fork.mp3`；构建会拷到 `dist/audio/`

### 没有声音怎么查

1. 控制台跑 `speechSynthesis.getVoices().length`。**返回 0 就是系统没装语音**（WSL / 精简 Linux 很常见）
2. 本地合成装包：`sudo apt install speech-dispatcher espeak-ng`，然后**重启浏览器**
3. 不想装包：打开工具栏「在线发音」（需联网，只把单词发给有道）
4. 仍未响：看控制台是否有 autoplay / 跨域错误；音频必须在用户点击后触发

## 生词录入（dev 模式专有）

`npm run dev` 启动的本地服务暴露三个只在本机可用的接口：

| 端点 | 作用 | 边界 |
|---|---|---|
| `GET /api/ping` | 面板探测：`{ok, write}` | 只读 |
| `GET /api/vocab/lookup?word=x&mode=online\|offline` | 服务端代查（避开 CORS）：dictionaryapi → 失败自动回退 CMUdict | 只读 |
| `POST /api/vocab/candidate` | 写 `vocab/candidates.yaml`（含可选下载 mp3 到 `vocab/audio/`） | 仅 POST、≤64KB、来源限本机/私有网段、路径白名单 |

- **静态打开**（`file://` 或纯静态托管）：表单仍可查词（浏览器直连 dictionaryapi），但**不能写入**
- CMUdict 首次使用会下载到 `vocab/data/`（已 gitignore），之后完全离线
- 写入后 `missing` 自动算出；缺项后续可交 agent 批量补全（见 `vocab/schema.md` 状态机）

## 字体与排版

不引框架，但照抄成熟文档站的排版结论（VitePress 官方主题 / VuePress 默认主题）：

| 用途 | 字体 | 说明 |
|---|---|---|
| 正文 + UI | **Inter**（自托管，latin 变量字重，48 KB） | 不加载时 Linux 上拉丁字符落到 DejaVu Sans、中文落到 Noto Sans CJK，两套字形混排，字重/x-height/基线都不齐 |
| 中文 | **系统 CJK 栈**：`PingFang SC` → `HarmonyOS Sans SC` → `MiSans` → `Source Han Sans SC` → `Noto Sans CJK SC` → `Microsoft YaHei` | 中文 webfont 即使子集化也 1–3 MB，主流中文文档站都不加载 |
| 代码 / RFC 原文 | **JetBrains Mono**（自托管，21 KB） | RFC 的 72 列文本与 ABNF 靠等宽，DejaVu Sans Mono 在小字号下偏糊 |

字体文件在 `site/assets/fonts/`（含 OFL 许可与 `SOURCE.md` 记录来源/版本/更新命令），构建时整体拷到
`dist/assets/fonts/`；`<head>` 里 `preload` Inter，`font-display: swap`。

字号阶梯（贴 VuePress/VitePress 的文档感）：

- 正文 `--read-size`（默认 16px）/ 行高 1.7；段落 `margin: 1em 0`
- `h1` 2em / 650 / 字距 -0.022em；`h2` 1.5em / 600 / 上边距 2.2em + 下边框；`h3` 1.2em / 600
- wiki 页 `h1` 的下划线已去掉（框架默认主题都没有），标题行只用字重与间距区隔
- 所有拉丁文都有 `letter-spacing: -.011em`（Inter 在小字号下更紧），中文不受影响（负字距对 CJK 几乎不可见）

## 部署（GitHub Pages）

仓库 public → Pages 免费。`site/dist/` **不入库**，由 `.github/workflows/pages.yml` 每次 push 到 `main`
时跑 `npm run check && npm run site`，再把 `site/dist` 作为 artifact 发布（不走 `gh-pages` 分支）。

- 地址：`https://<user>.github.io/sip-starter/`
- 首次启用：仓库 Settings → Pages → Source 选 **GitHub Actions**（一次即可，之后自动）
- **不需要 `base` 配置**：全站链接都是相对路径（`../`），子路径托管不会碎链；
  图片内联、搜索走 `document.baseURI`，也不受影响
- 静态托管的两处降级：① 生词录入只读（`/api/*` 不存在，页面自动显示"静态模式"）；
  ② 没有服务端，别想在线写 yaml
- 体积/流量：站点约 1 MB，Pages 上限 1 GB / ~100 GB 月流量，远够

校验与构建都在 CI 里跑：`npm run check` 失败会直接挡住部署（锚点、wikilink、译文层的 error 都算）。

## 构建失败排查

| 现象 | 先查 |
|---|---|
| 某个 `[[x/y]]` 变成红字 | `wiki/x/y.md` 是否存在（slug 大小写、连字符） |
| 页面没出现 | 是否缺 `id` / `title` / `topics` frontmatter |
| 计划页某项显示"未支撑" | 该 task 的 `wiki:` 列表里的 slug 是否都能解析 |
| 词条不显示 | `vocab/terms.yaml` 里的 `status` 值是否在枚举内 |
| 点了「读」没声音 | 控制台 `speechSynthesis.getVoices().length`：0 = 系统无语音 → 开「在线发音」或装 `speech-dispatcher` |
| 某个词读得不对 | 给词条加 `say` 字段覆盖朗读文本 |
| 端口占用 | `--serve` 换端口：`node site/build.mjs --serve 5174` |
| `§x.y` 点了 404 / 跳不到 | 章节号不在原文抽出的集合里（`H`）——先用 `grep -n "^x.y" sip/raw/rfc/rfc3261.txt` 确认写法 |
| 原文页缺某节 | 标题行以数字开头但首段>30（被当作正文）；或标题以非字母数字字符开头 |
| chip 变成虚线灰块 | 对应的 raw 原文或 drill 文件不存在——这是设计如此，不是 bug |
| 图没显示出来 | md 里的路径相对 `wiki/`（`assets/x.svg`），文件实际在 `wiki/assets/` |
| 页面样式被图里串改 | SVG 内的类名没加 `dg-` 前缀（内联后 `<style>` 是全局作用域）；构建会 warn |
| 录词面板显示"静态模式" | 没跑 `npm run dev`；静态托管无写接口 |
| 保存报 "已存在" | 该词已在候选池或正式本（防重复，正常行为） |
| 查词一直"查询中…" | 在线词典被墙/超时 → 勾「离线 CMUdict」；首次会下载约 3.6MB |
| 音标是自动转换的 | `lookup.source: cmudict`，ARPAbet→IPA 近似转换，与词典标注可能有差异 |
| 图排版变形/文字重叠 | 跑 `node ~/.pi/agent/skills/svg-diagram/scripts/svg-check.mjs <svg>`，再用 `render.mjs` 截图看 |
| 中文块不显示 / 显示"未译" | `sip/zh/rfc3261/<节号>.md` 是否存在，`sec` 是否等于文件名 |
| 译文标了「原文已变」 | 原文改过 → 重跑 `npm run zh:check` 看该节，复核后更新 `en_sha` |
| `zh:check` 报"规范词一处都没保留" | 译文把 MUST/SHOULD 译成了纯中文 → 改回 `必须（MUST）` 这类写法 |
| 对照模式右栏空白 | 浏览器没执行 JS（`<details>` 由脚本展开）；或该节未译 |
| 原文页目录树挤成一条/正文被压扁 | 隐藏目录时网格必须换成单列（`display:none` 的格子不会让出列），见 `html[data-toc='off'] .rawlayout` |
| 侧栏里某页缺失 | 该页 frontmatter `id` 与路径不一致，或落在 `WIKI_GROUPS` 未登记的目录（会归到"其他"） |
