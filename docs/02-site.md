> 一句话：站点怎么构建、三视图各显示什么、构建坏了从哪查。

# 02 站点

## 命令

```bash
npm install       # marked + js-yaml
npm run site      # 只构建 → site/dist/
npm run dev       # 构建 + 本地服务（http://localhost:5173）
npm run check     # 只校验不写文件
```

`site/dist/` 是生成物，**永不手改，也不入库**（`.gitignore` 已排除）。

## 数据 → 页面

| 数据源 | 生成 | 视图 |
|---|---|---|
| `plan/plan.yaml` + `wiki/` 存在性 | `dist/index.html` | 学习计划（进度、下一步、wiki 支撑状态） |
| `wiki/**/*.md`（frontmatter + 正文） | `dist/wiki/<area>/<slug>.html`、`dist/wiki/index.html` | 知识库（含页尾反链、相关生词） |
| `vocab/*.yaml` | `dist/vocab.html` | 生词本（音标 + 发音 + 筛选 + 抽卡） |
| `sip/raw/rfc/rfc3261.txt` | `dist/raw/rfc3261.html` | **原文锁点页**：按节切分、剔页眉页脚，`§x.y` 可直跳 |
| `sip/labs/drills/*.md` | `dist/drills/<slug>.html` | 练习页（带证据锚点与相关 wiki） |
| `wiki/assets/*.svg` | 内联进对应页面 | 说明图（md 里写 `![说明](assets/x.svg)`，构建时把文件内容嵌进页面） |
| 以上全部正文 | `dist/search.json` | 全站子串搜索（几百页足够，不上向量） |

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
| 图排版变形/文字重叠 | 跑 `node ~/.pi/agent/skills/svg-diagram/scripts/svg-check.mjs <svg>`，再用 `render.mjs` 截图看 |
