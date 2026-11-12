> 一句话：`docs/` 的索引层。想弄清什么 → 读哪篇。

# docs/ 索引

`docs/` 只回答两件事：**为什么这么设计**、**当初发生过什么**。SIP 知识不在这里（去 `wiki/`）。

| 我想… | 读 |
|---|---|
| 知道整个仓库为什么这么切、为什么不用 VitePress | [`00-design.md`](00-design.md) |
| 知道一次 ingest / 一次学习该怎么动手 | [`01-workflow.md`](01-workflow.md) |
| 把站点跑起来 / 改样式 / 排构建故障 | [`02-site.md`](02-site.md) |
| 知道里程碑做到哪、验收标准是什么 | [`roadmap.md`](roadmap.md) |
| 知道**现在**做到哪、下一步做什么 | [`status.md`](status.md) |
| 知道某个决定当初为什么这么定 | [`adr/`](adr/) |
| 找回"上次干到哪、踩过什么坑、还没完什么" | [`memory/`](memory/) |

## 目录内的分工

- `adr/` —— 一决定一文件，被取代也只改状态不删。**只在代价高或不可逆时写**。
- `memory/` —— 本地项目记忆：facts（坑）、journal（时间线）、open-threads（未决）。
  写入规则见 [`memory/README.md`](memory/README.md)。
- `status.md` —— 唯一权威的"当前状态"，每次会话末覆盖，只写现在不写历史。
- `roadmap.md` —— 里程碑与验收，改动少。
