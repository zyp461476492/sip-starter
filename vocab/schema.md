> 一句话：生词本字段约定。正式词条在 `terms.yaml`，LLM 抽取的候选在 `candidates.yaml`。

# vocab schema

## 为什么要有 `domain_meaning` 和 `confusion`

学协议卡人的往往**不是生词，是熟词僻义**：`fork`、`provisional`、`canonical`、`glare`、`tag`
都是英语常用词，但在 RFC 3261 里指非常具体的东西。普通词典查不到这一层，
所以字段必须留给"领域义"和"我当初误以为是什么"。

## 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `term` | ✅ | 词条原形（英文，小写；缩写保留大写如 `CSeq`） |
| `pos` | | 词性：n / v / adj / abbr |
| `phonetic` | | 音标（可选，只对真生词有用） |
| `domain_meaning` | ✅ | **在本协议语境里到底指什么**（一句中文，尽量对应英文原文用词） |
| `general_meaning` | | 通用义，用来对照"熟词僻义" |
| `confusion` | ✅ | 我当初的误解 / 最容易混的点 |
| `source` | ✅ | 证据锚点，如 `RFC3261 §19.3`，必须能在 `sip/raw/` 里 grep 到 |
| `topics` | ✅ | `[sip]` / `[sip, media]` |
| `status` | ✅ | `candidate` → `learning` → `known` |
| `wiki` | | 相关页面 slug 列表，站点据此做双向跳转 |
| `added` | ✅ | 日期 |

## 状态机

```
candidates.yaml (LLM 抽)  ──人工确认──▶  terms.yaml: status=learning  ──能主动用对──▶  known
        │
        └──丢弃（写一句为什么，防止重复抽出来）
```

**纪律**：LLM 只能写 `candidates.yaml`，`terms.yaml` 只有人能改（见 `AGENTS.md` §2）。
理由与 ADR-0003 同源：不让未经确认的东西进正式本。
