> 一句话：`sip/zh/` 是 RFC 的**中文对照层**——可再生产物，不是证据。证据永远在 `sip/raw/`。

# sip/zh —— 中文译文层

## 这是什么

RFC 原文（`sip/raw/rfc/rfc3261.txt`）的逐节中文翻译，供**初期快速上手**用：先读中文建立骨架，
再回读英文原文确认措辞。站点上表现为「中文 / 原文 / 对照」三态阅读器（`raw/rfc3261.html`）。

## 三条边界

1. **不改 `sip/raw/`**。原文只读；译文是派生文件，删了可以重译。
2. **规范性以英文为准**。页面常驻声明；含 `MUST` / `SHOULD` 的句子一律保留英文原词（GLOSSARY R1），
   `scripts/zh-check.mjs` 会逐节核对规范词数量，漏掉就报错。
3. **`reviewed` 只能由人标**。agent 译完最高到 `draft`。

## 目录与字段

```
sip/zh/
  GLOSSARY.md            译文用词唯一口径（译前必查）
  README.md              本文件
  rfc3261/<节号>.md      一节一文件，文件名 = 节号（如 17.1.1.1.md）
```

单节 frontmatter：

| 字段 | 含义 |
|---|---|
| `sec` | 节号，必须与文件名一致，且能在原文里找到 |
| `en_sha` | 该节英文正文的哈希（`scripts/rfc-sections.mjs` 的 `sectionSha`）。原文变了就自动标"译文待复核" |
| `status` | `pending` / `draft` / `reviewed` |
| `translator` | `agent` |
| `date` | 翻译日期 |
| `reviewed_by` | 仅 `reviewed` 需要（人名/代号） |

## 工作流

```bash
npm run zh:status   # 覆盖率报表：哪些一级小节还空着
npm run zh:check    # 体检：frontmatter / 节号 / en_sha 漂移 / 规范词
npm run site        # 生成站点，raw/rfc3261.html 里出现中文块
```

新增一节：

1. 先查 `GLOSSARY.md`，缺词先补表
2. 用 `node -e` 或脚本取该节的 `en_sha`
3. 写 `sip/zh/rfc3261/<节号>.md`，`status: draft`
4. `npm run zh:check` 必须 0 错误

## 翻译纪律（踩过的坑）

- **别按句子直译**。英文长句先拆成"条件 / 动作 / 例外"三层，再按中文语序重排。
- **术语不许同义替换**。`final response` 永远是"最终响应"，见 GLOSSARY R5。
- **否定与例外要显式**。`except`、`only if`、`unless` 各自对应一个中文句式，不能含糊成"一般情况下"。
- **原文的跨节引用保留编号**：`Section 17.1.1.3` → `§17.1.1.3`，与站内锚点一致（R7）。
- **拿不准就留英文**（R8），并在 `docs/memory/open-threads.md` 记一条——不许猜。
