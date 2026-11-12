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
| `phonetic` | ✅ | 音标，英美并列时用 `BrE /fɔːk/ · AmE /fɔːrk/` 格式 |
| `say` | | **朗读文本覆盖**。缩写/头域名（`CSeq`、`Via`、`SDP`）TTS 会读错，用它能读对 |
| `audio` | | 本地音频，相对 `vocab/` 路径（如 `audio/fork.mp3`）。有则优先播它，否则走浏览器 TTS |
| `domain_meaning` | ✅ | **在本协议语境里到底指什么**（一句中文，尽量对应英文原文用词） |
| `general_meaning` | | 通用义，用来对照"熟词僻义" |
| `confusion` | ✅ | 我当初的误解 / 最容易混的点 |
| `source` | ✅ | 证据锚点，如 `RFC3261 §19.3`，必须能在 `sip/raw/` 里 grep 到 |
| `topics` | ✅ | `[sip]` / `[sip, media]` |
| `status` | ✅ | `candidate` → `learning` → `known` |
| `wiki` | | 相关页面 slug 列表，站点据此做双向跳转 |
| `added` | ✅ | 日期 |

## 发音怎么来

三层回退（站点实现，见 `site/assets/app.js`）：

1. `audio` 字段指向的本地文件（离线、音质确定）
2. **在线词典音频**（有道 `dictvoice`，只发送单词本身）——工具栏可开关，默认在检测到本机无语音时自动打开
3. 浏览器 Web Speech API（`speechSynthesis`）——需要系统装语音包，Linux 上要 `speech-dispatcher`

缩写类词条用 `say` 写出发音近似（如 `CSeq` → `say: C see cue`），否则 TTS 会念成字母串。
`say` **不参与在线音频**：有道拿的是 `say` 的文本，所以 `say` 只该写真正要读的东西。

## 状态机

```
candidates.yaml (LLM 抽)  ──人工确认──▶  terms.yaml: status=learning  ──能主动用对──▶  known
        │
        └──丢弃（写一句为什么，防止重复抽出来）
```

**纪律**：LLM 只能写 `candidates.yaml`，`terms.yaml` 只有人能改（见 `AGENTS.md` §2）。
理由与 ADR-0003 同源：不让未经确认的东西进正式本。
