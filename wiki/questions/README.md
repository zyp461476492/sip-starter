> 一句话：我的问题清单。问题 → 查原文 → 结论 file back 进概念页。

# questions/

### 什么时候写

读到/写到"说不清但不想当场深挖"的地方，就落一个文件，**不要当场猜**（`AGENTS.md` §3）。

### 格式

文件名 = slug（小写连字符），如 `why-two-vias.md`：

```markdown
---
id: questions/why-two-vias
title: 为什么这通呼叫里有三个 Via？
topics: [sip]
status: open          # open | answered
asked: 2026-11-12
specs: []
updated: 2026-11-12
---

## 问题

（一句话，具体到能查）

## 已查到的证据

> 原文引用（RFC 3261 §x.y）

## 未解

（差哪一块）

## 结论（answered 后填）

（一到两句，然后 **file back**：把结论写进概念页，这里只留链接）
```

### 答完之后

1. 结论写进对应概念页（`wiki/concepts/` 或 `wiki/messages/`）
2. 本文件 `status: answered`，正文只留"结论 + 链到哪一页"
3. `wiki/log.md` 追加一条 `query`

> 只 open 不 answered 的问题页超过 5 个，说明读法有问题（想一次搞懂所有事），该回头拆小。
