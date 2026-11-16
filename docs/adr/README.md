> 一句话：决策记录索引。一决定一文件，被取代只改状态不删。

# ADR

只记录**代价高或不可逆**的决定。琐碎约定进 `AGENTS.md`，不值得开 ADR。

| 编号 | 决定 | 状态 |
|---|---|---|
| [0001](0001-single-wiki-layer.md) | 一个全局编译层 `wiki/`，协议只切证据层 | current |
| [0002](0002-no-vitepress.md) | 站点用自写生成器，不用 VitePress | current |
| [0003](0003-yaml-as-source-of-truth.md) | 计划与词库以 yaml 为唯一数据源 | current |
| [0004](0004-impl-lives-elsewhere.md) | 本仓不写实现，只放 labs 最小验证件 | current |
| [0005](0005-learning-milestones-over-linear-reading.md) | 学习按可运行里程碑推进，分层读 spec | current |
| [0006](0006-zh-translation-layer.md) | 中文译文单独一层 `sip/zh/`，一节一文件 | current |

## 写法约定

- 一个决定一个文件，文件名 `NNNN-kebab-slug.md`，编号递增不回收
- 必须写**被否决的备选**及其理由（否则 ADR 就只是个电报）
- 必须写**重新考虑的触发条件**（否则它永远是 current）
- 禁止用"不是 X，而是 Y"这种对比——容易被读成"X 不必要"。
  写成"X 是前提，但**验收物**不是 X"，把手段与验收标准分开。

## 模板

```markdown
# ADR-000N 标题
状态：current ｜ 日期：YYYY-MM-DD

## 背景
（当时的约束与问题）

## 决定
（做了什么）

## 后果
（得到什么、放弃了什么、什么时候该重新考虑）
```
