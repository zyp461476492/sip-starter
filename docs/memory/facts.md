> 一句话：确定性事实与坑。每条格式：症状 → 结论 → 证据。带日期，过期即删。

# facts

## RFC 3261 原文抓取（2026-11-12）

- 症状：想当然用 `webfetch`/`raw.githubusercontent` 那套抓 RFC，部分路径不稳
- 结论：`curl -sS --compressed --retry 3 --retry-all-errors --max-time 90 -A "Mozilla/5.0"` 抓
  `https://www.rfc-editor.org/rfc/rfc3261.txt` 稳定，200 / 172181 字节 / 15067 行
- 证据：`sip/raw/rfc/MANIFEST.md` 的 sha256；脚本 `scripts/fetch-rfc.sh`

## RFC 3261 的章节锚点可以直接 grep（2026-11-12）

- 症状：担心章节号只能靠记忆或 PDF 目录
- 结论：正文里章节标题以 `^数字` 顶格出现（如 `17 Transactions`、`8.1.1.7 Via`、`20.42 Via`、
  `24.1 Registration`），`grep -nE "^[0-9]+(\.[0-9]+)*\.?[[:space:]]+[A-Z]"` 即可拿到行号；
  定时器默认值集中在附录 `A Table of Timer Values`（T1=500ms、T2=4s、T4=5s、Timer B/F/H/J=64*T1…）
- 证据：本仓库已按此方式核对 `wiki/` 三页样板的全部锚点

## 页码行会打断续行（2026-11-12）

- 症状：从 raw 里 `sed -n` 取一段，中间夹着 `Rosenberg, et. al. ... [Page 122]` 和
  `RFC 3261   SIP: ... June 2002` 两行噪声
- 结论：引用原文时必须手工剔除页眉页脚；跨页的段落要拼接后再引用，不能把噪声一起抄进 wiki
- 证据：`wiki/concepts/transaction.md` 的 §17 引用

## 发音用 Web Speech API，不依赖外部服务（2026-11-12）

- 症状：想给生词本加发音，但又不想依赖在线词典 API（隐私/离线/失效）
- 结论：默认走 `speechSynthesis` 合成；`vocab/audio/*.mp3` 存在时优先播本地文件（`audio` 字段）。
  两个坑：① 多数浏览器要求**用户手势**后才能发声，所以只能在按钮/抽卡点击里调，不能页面加载自动读；
  ② `getVoices()` 首次可能返回空数组，必须监听 `voiceschanged` 重取
- 证据：`site/assets/app.js` 的 `speak()` / `loadVoices()`；口音与语速存 `localStorage`（`sip.acc` / `sip.rate`）

## TTS 会读错缩写（2026-11-12）

- 症状：`CSeq`、`SDP` 这类缩写被念成字母串或被当普通单词乱读
- 结论：词条加 `say` 字段覆盖朗读文本（如 `CSeq` → `say: C see cue`）；无 `say` 时才能回退 `term`
- 证据：`vocab/schema.md` 的发音小节

## WSL2 下 Chrome 没有 TTS 语音（2026-11-12）

- 症状：生词本点朗读完全无反应（不报错）
- 结论：WSL2 里没装 `speech-dispatcher` / `espeak`，Chrome 的 `speechSynthesis.getVoices()` **返回空数组**，
  `speak()` 静默失败。修法：`sudo apt install speech-dispatcher espeak-ng` 后重启浏览器；
  或走站点内置的在线发音（有道 `dictvoice`）
- 证据：本机 `dpkg -l | grep -i speech-dispatcher` 无输出；`site/assets/app.js` 的 `ensureVoices()`

## 有道 dictvoice 可用作在线发音回退（2026-11-12）

- 结论：`GET https://dict.youdao.com/dictvoice?audio=<word>&type=2` 返回 mp3（实测 200 / 10029 字节 / audio/mpeg），
  无需 key，`<audio>` 直接播（不需要 CORS）
- 代价：联网 + 把单词发给第三方，所以做成**可开关**，且只在检测到本机无语音时自动开
- 证据：`curl -o /tmp/fork.mp3` 测试；`site/assets/app.js` 的 `ONLINE_URL`

## 不要用 emoji 做按钮图标（2026-11-12）

- 症状：生词本的 `🔊` 按钮在某些 Linux/浏览器上完全不显示（缺 emoji 字体，不是样式问题）
- 结论：图标一律用内联 SVG（`currentColor` 上色）+ 文字标签；emoji 只能用于“丢了也不影响功能”的装饰
- 证据：`site/build.mjs` 的 `SPK` 常量

## git 身份是本仓 local config（2026-11-12）

- 症状：本机（WSL）**没有 global git 身份**（`git config --global user.name` 为空），新仓库首提交会报 Author identity unknown
- 结论：本仓用 local config 固定为 `zyp <13150337230@163.com>`；**不要去设 global**，
  否则会污染用户其他仓库的身份
- 仓库：默认分支 `main`，无 remote（远端待用户自建）
- 副作用：M1–M2.1 的六个提交最初用临时身份 `zyp@local` 写成，已用 `git filter-branch --env-filter`
  重写作者与提交者，所以短 hash 变了（当时无 remote，无影响）
- 证据：`git config --local --list`；`git log --format='%an <%ae>'`

## dev 服务不会自动重建 dist（2026-11-13）

- 症状：录词表单提示"已写入候选池"，刷新页面看不到新词
- 结论：`dist/` 是**生成物**，dev 服务只做静态文件服务；写入 yaml 后必须重建
  → 已在 `POST /api/vocab/candidate` 里调用 `rebuild()`，日志会打 `↻ 已重建 dist（N 正式词 / M 候选）`
- 证据：`site/build.mjs` 的 `rebuild()`；本次事故即由它缺失引起

## site/dist 不入库（2026-11-12）

- 结论：`site/dist/` 与 `node_modules/` 已进 `.gitignore`；要发布再单独讨论部署方式
- 证据：`.gitignore`

## marked v15 不再生成标题 id（2026-11-16）

- 症状：想给站点加「本页内容」大纲，发现渲染出的 `h2` 没有 `id`，锚点全废
- 结论：`headerIds` 选项在 marked v5 起移除；要么装 `marked-gfm-heading-id`，要么自己后处理。
  本仓用 `addHeadingIds()` 正则补 id（slug 化保留中文、去标点、空格转 `-`、重名加序号）
- 证据：`site/build.mjs` 的 `slugifyHeading()` / `addHeadingIds()`；`raw/rfc3261.html` 的 `sec-*` 锚点不受影响（那套是自己生成的）

## CSS 里改网格列必须改「承放子元素的父级」（2026-11-16）

- 症状：原文页设了 `.layout.bare .doc{grid-template-columns:minmax(0,1fr)}`，但正文仍被挤成 264px 宽
- 结论：`.doc` 自己是 `.layout` 的第一列（`grid-template-columns: 264px minmax(0,1fr)`），
  只改 `.doc` 内部网格没用，必须写 `.layout.bare{grid-template-columns:minmax(0,1fr)}`
- 证据：headless Chrome `--dump-dom` + 注入 `document.title=JSON.stringify({...getBoundingClientRect().width})` 读出 264

## `details` 的展开状态只能用 JS 推，CSS 推不动（2026-11-16）

- 症状：对照模式想用纯 CSS 让 `<details>` 的英文原文显示出来
- 结论：Chrome 把 `details` 的非 summary 子节点藏在 UA slot 后，`details:not([open])>pre{display:block}` 无效；
  必须在切换模式时 `det.open = mode !== 'zh'`
- 证据：`/tmp/bi-dual.html` 纯 CSS 版本右栏空白，加 JS 后正常

## RFC 正文的行尾连字符是折行，不是词里的连字符（2026-11-16）

- 症状：把 72 列硬折行合并成段落时出现 `start- line`、`re- INVITE`
- 结论：合并时若前行以 `-` 结尾，**去掉空格直接拼**（保留连字符）：`start-`+`line` → `start-line`。
  不能简单删连字符（会丢掉 `Request-URI` 这类复合词）
- 证据：`scripts/rfc-sections.mjs` 的 `toBlocks()`；检验 §7.1 首段

## 译注里裸写 `MUST` 会被自己的校验器判成违规（2026-11-16）

- 症状：`zh:check` 报「译文出现了原文没有的规范词 MUST（§4）」，但正文并没有规范性陈述
- 结论：校验器按词计数，不区分"引用"与"使用"。译注里要谈规范词时，改用「规范动词 / 大写关键字」这类说法
- 证据：`sip/zh/rfc3261/4.md` 末段译注的改法

## 网格里 `display:none` 的项不会让出列（2026-11-16）

- 症状：原文页把目录列设成 `grid-template-columns: 0 0 1fr` 并 `display:none` 掉目录与拖柄后，
  正文被塞进第一列（0 宽），整页字挤成竖排一条
- 结论：`display:none` 的网格项不参与排布，但**列定义还在**，后面的项会依次往前填。
  收起某栏时要么改成单列（`grid-template-columns: minmax(0,1fr)`），要么显式 `grid-column`
- 证据：`site/assets/style.css` 的 `html[data-toc='off'] .rawlayout`

## RFC 3261 有两套 F 编号：Figure 1 与 §24.2 不一致（2026-11-16）

- 症状：照 §4 Figure 1 的编号去对 §24.2 的报文，从 F2 开始全错位
- 结论：Figure 1 里 **F2 = INVITE 代理→代理、F3 = 100 Trying 代理→Alice**；§24.2 里正好互换
  （F2 = 100 Trying、F3 = INVITE）。引用流程必须写明"按 §24.2"或"按 Figure 1"，
  wiki 表统一用 §24.2。另：§24.2 示例里 **Bob 的 UA 不发 100 Trying**
- 证据：`sip/raw/rfc/rfc3261.txt` 第 617–645 行（Figure 1）vs 第 11959–12230 行（§24.2）；
  `wiki/flows/basic-call.md` 的 F 表已按此修正

## 站点"✓ 已支撑"只校验 slug 存在（2026-11-16）

- 症状：`plan.yaml` 里任务挂着 `wiki: [flows/basic-call]`，站点显示绿勾"已支撑"，
  但页面里根本没有 `done_when` 要求的内容（l0-1 要"四个角色各维护什么状态"，当时 wiki 零命中）
- 结论：`site/build.mjs` 只做 `pages.has(slug)`，**不校验内容覆盖**。绿勾的含义仅限
  "页面存在且没红链"。判据是否被支撑目前只能人审；写 `done_when` 时要顺手核一遍
  `sources` 里真的包含能回答它的章节（§4 讲拓扑，不讲状态；状态在 §6/§12/§18.2.1）
- 证据：`site/build.mjs:757`；`wiki/flows/basic-call.md` 新增的「各角色维护什么状态」一节
