> 一句话：决策记录索引。一决定一文件，被取代只改状态不删。

# ADR

只记录**代价高或不可逆**的决定。琐碎约定进 `AGENTS.md`，不值得开 ADR。

| 编号 | 决定 | 状态 |
|---|---|---|
| [0001](0001-single-wiki-layer.md) | 一个全局编译层 `wiki/`，协议只切证据层 | current |
| [0002](0002-no-vitepress.md) | 站点用自写生成器，不用 VitePress | current |
| [0003](0003-yaml-as-source-of-truth.md) | 计划与词库以 yaml 为唯一数据源 | current |

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
