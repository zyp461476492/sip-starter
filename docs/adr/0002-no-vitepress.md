# ADR-0002 站点用自写生成器，不用 VitePress

状态：current ｜ 日期：2026-11-12

## 背景

站点需要三件事：学习计划进度面板、生词抽卡、wiki 阅读（含 `[[wikilink]]` 与页尾反链）。

- VitePress 是文档站范式：md 渲染、内置搜索、主题都很好，但它不给"每页注入反链"的干净位置，
  `[[wikilink]]` 需要第三方 markdown-it 插件，两个数据面板要写 Vue SFC。
- 本仓库 80% 是数据面板，20% 才是文档；为 20% 引入一套框架（vite + vue + router + shiki，数百包）
  不划算，且这是"学完 SIP 就毕业"的个人项目，不值得每年跟框架大版本。

## 决定

自写 `site/build.mjs`（~300 行），依赖只有 `marked`（md→html）与 `js-yaml`（读数据）。
构建期做内容变换：frontmatter 解析、`[[slug]]` 解析、反链收集、生词关联、搜索索引。
前端是原生 HTML/CSS/JS，无框架。

## 后果

- 得到：完全拥有内容管线；反链/wikilink/词库关联都发生在构建期，一处改全站生效；依赖面极小。
- 放弃：HMR 开发体验、现成的搜索 UI、主题生态；`build.mjs` 的 bug 要自己修。
- 重新考虑的触发条件：站点功能膨胀到需要客户端状态管理（多视图路由、编辑、协作）时，
  再迁移到 VitePress/Astro，此时内容格式（md + frontmatter + yaml）不需要改，迁移成本可控。
