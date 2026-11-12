---
name: svg-diagram
description: 手写内联 SVG 说明图（架构/流程/时序 ladder/状态机/对照），用于解释协议、代码架构、部署拓扑与方案对比。当需要"结构化解释"而不是纯段落时应加载本技能：包括给 wiki 页面配图、给 RFC 画呼叫流程、给方案写对照图。
---

# 图表（内联 SVG）

**为什么自己写 SVG 而不画 ASCII / 不出图片**：矢量、可版本化、可 diff、可 grep、随主题缩放、能内联进 markdown 和 HTML。
代价是坐标要自己算——所以本技能的重点是**几何规则 + 自检脚本**，不是审美。

## 硬规则（违反任意一条就要重做）

1. **手写内联 `<svg>`**，不用外部字体/图片/脚本；不引 CDN。
2. 根元素必须有 `xmlns`、`viewBox`，宽度写 `width="100%"`（内联进页面）或显式像素（导出用）。
3. 必须有 `<title>` 和 `<desc>`（可访问性，也让截图自检时知道这张图讲什么）。
4. **配色只用 `references/tokens.md` 的调色板**，不要满屏高饱和。
5. 字体与箭头统一走 `<style>` 里的类（`.th` `.ts` `.tn` `.tm` `.arr` `.lane`），不要在属性里散落 `font-family`。
6. **文字必须装进它的容器**：中文按 `1.0em/字`、ASCII 按 `0.55em/字` 估宽（脚本会算）。
7. 箭头统一用 `<marker>`，id 唯一，引用必须能解析。
8. 所有坐标落在 `viewBox` 内，留 ≥16px 边距。

## 工作流（不要跳步）

1. **先文字后坐标**：列出节点/边（谁连接谁、几层、几条消息），确认结构对了再算坐标。
2. **选骨架**：`references/archetypes.md` 里五选一（分层架构 / 流程 / 时序 ladder / 状态机 / 对照）。
3. **定网格**：基准 20px；同层等高；列宽等分；层间留 24–40px。
4. **写 SVG**：从 `assets/skeleton.svg` 复制，改内容。
5. **自检（必须做）**：
   ```bash
   node <skill>/scripts/svg-check.mjs 图.svg
   node <skill>/scripts/render.mjs 图.svg /tmp/x.png
   ```
   然后**用 read 看那张 PNG**，肉眼确认没有重叠、裁切、箭头错位。脚本查不出"难看"，只能查"错"。
6. **交付**：文件落到项目里（wiki 用 `wiki/assets/`，文档用同目录 `assets/`），再用 `present_files` 给用户看图。

## 五类图的判定

| 想表达 | 用哪种 | 骨架 |
|---|---|---|
| 系统由哪些部分组成、怎么连接 | 分层架构图 | `archetypes.md` §1 |
| 有判断/分支的步骤 | 流程图 | §2 |
| 多方的消息先后顺序（协议、握手、调用链） | **时序 ladder** | §3 |
| 一个对象的状态与迁移 | 状态机 | §4 |
| 两个方案逐项比较 | 对照图 | §5 |

协议类内容（SIP/RTP/HTTP）优先用 **ladder**：谁发给谁、经过谁、什么时候重传，一张图能替三段文字。

## 排版细则

- **盒子**：高 34（单行）/ 56（两行）；`rx=8`；描边 0.5–1；填充浅色底 + 深色描边。
- **层**：竖向堆叠，间距 24；同层内水平等距（gap 20）。
- **文字**：盒内文字用 `text-anchor="middle"` + `dominant-baseline="central"`，坐标取盒子中心；
  注释用 `.tn`（11px 灰）。
- **多行**：一个盒子内两行就用两个 `<text>`（y 差 18），**不要**用 `<tspan>` 叠行（更难算）。
- **箭头**：`<path d="M x1 y1L x2 y2">` + `marker-end`；先画线后画盒子，让线被盒子遮住更干净。
- **ladder**：生命线用 `stroke-dasharray="4 4"`；消息标签压在箭头上方 12px；响应箭头方向与请求相反。

## 自检脚本说明

```bash
node scripts/svg-check.mjs <file.svg>            # 只检查不改文件；退出码 1 = 有错
node scripts/render.mjs <file.svg> <out.png> [scale]
```

`svg-check.mjs` 检查：`xmlns`/`viewBox`/`width`、`title`/`desc`、style 类是否都定义、marker 引用是否可解析、
rect 是否越界、文字估算宽度是否超出它所在（中心落入的）rect、文本坐标是否在 viewBox 外。

`render.mjs` 用本机 `google-chrome --headless` 截图（零 npm 依赖；WSL/Linux 实测可用）。
截图是**给模型自己看**的，不是交付物。

## 什么时候不要画

- 只是两三个要素的线性关系 → 用一句话或列表
- 需要精确数值比较 → 用表格
- 每个盒子里要塞超过 18 个 ASCII 字符 → 说明结构没拆清，先拆结构

## 版本与安装

源码放在项目的 `tools/skills/svg-diagram/`（纳入 git），装到全局：

```bash
scripts/install-skills.sh svg-diagram     # → ~/.pi/agent/skills/svg-diagram/
```

装完 `/reload` 生效。`tools/` 不在技能发现路径里，所以源码与已装副本不会重名冲突。
改完技能记得重跑一次安装脚本，否则加载的还是旧副本。
