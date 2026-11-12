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
| `vocab/*.yaml` | `dist/vocab.html` | 生词本（筛选 + 抽卡） |
| 以上全部正文 | `dist/search.json` | 全站子串搜索（几百页足够，不上向量） |

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

## 构建失败排查

| 现象 | 先查 |
|---|---|
| 某个 `[[x/y]]` 变成红字 | `wiki/x/y.md` 是否存在（slug 大小写、连字符） |
| 页面没出现 | 是否缺 `id` / `title` / `topics` frontmatter |
| 计划页某项显示"未支撑" | 该 task 的 `wiki:` 列表里的 slug 是否都能解析 |
| 词条不显示 | `vocab/terms.yaml` 里的 `status` 值是否在枚举内 |
| 端口占用 | `--serve` 换端口：`node site/build.mjs --serve 5174` |
