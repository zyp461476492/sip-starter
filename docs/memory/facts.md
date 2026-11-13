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
