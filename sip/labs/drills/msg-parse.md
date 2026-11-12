---
slug: msg-parse
phase: alpha
specs: ["RFC3261 §7.1", "RFC3261 §7.2", "RFC3261 §7.3", "RFC3261 §24.1"]
wiki: ["specs/rfc3261", "messages/headers/via"]
---

# drill: 消息 round-trip

## 目标

把一段真实报文解析成结构体再序列化回去，**字节级一致**（行序、空格、折行都要对）。

## 输入（夹具来自原文，不要自己编）

- `sip/raw/rfc/rfc3261.txt` §24.1 的 `F1 REGISTER`（请求）与 `F2 200 OK`（响应）
- `sip/raw/rfc/rfc3261.txt` §20.42 的两个 Via 例子（含折行续行 `;received=...`）

提取时注意剔除页眉页脚（见 `docs/memory/facts.md`）。

## 做法

1. 只实现够用的子集：start-line、头域（含 compact form）、折行续行（续行以 SP/HTAB 开头）
2. 头域保持**原顺序**与**原大小写**，值里的空白不重排
3. 建立 `name → [values]` 的有序映射，同时保留原始字节切片
4. 序列化时优先输出原始切片，比对是否一致

## 判据

- 三份夹具 round-trip 后与原文字节一致（可用 `cmp` / `sha256sum` 验证）
- 折行续行被正确合并为单值，且再序列化时折行位置不强制改变
- `Via`、`v`（compact form）能被识别为同一头域

## 我踩到的

（做完立刻填）
