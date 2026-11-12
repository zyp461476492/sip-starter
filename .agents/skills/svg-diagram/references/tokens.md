# 设计令牌（配色 / 字号 / 间距）

> **内联前必须加前缀**：页面内联 SVG 时 `<style>` 是全局作用域。
> 规则：所有类名加 `dg-`（`.dg-th` → `.dg-tm`），marker id 也加（`dg-ar`）。
> 项目构建会检查这一点，缺前缀会 warn。

## 调色板

低饱和中性底 + 一个强调色（绿）。全套只有 8 个颜色，够用且不会花。

| 用途 | 值 | 说明 |
|---|---|---|
| 中性底 | `#F1EFE8` | 普通盒子填充 |
| 中性描边 | `#5F5E5A` | 普通盒子边框、箭头 |
| 中性浅描边 | `#B4B2A9` | 次要描边、虚线、生命线 |
| 正文深色 | `#444441` | 盒子标题（`.th`） |
| 正文灰色 | `#5F5E5A` | 说明文字（`.ts`） |
| 强调底 | `#E1F5EE` | 主角 / 核心模块填充 |
| 强调描边 | `#0F6E56` | 强调框边框、强调箭头 |
| 强调深色 | `#085041` | 强调框内文字 |

可选强调（第二组，谨慎，一张图最多一处）：`#FAEEDA` / `#EF9F27` / `#854F0B`（警示、待办）。

## 字号

| 类 | 大小 | 用途 |
|---|---|---|
| `.th` | 13px / 600 | 盒子标题 |
| `.ts` | 12px | 盒子副标题、图内说明 |
| `.tn` | 11px | 脚注、注释（灰） |
| `.tm` | 12px | ladder 的消息标签 |

## 几何

| 项 | 值 |
|---|---|
| 网格基准 | 20px |
| 盒子高（单行 / 两行） | 34 / 56 |
| 圆角 | 8（小盒）/ 12（分区） |
| 层间垂直间距 | 24 |
| 同层水平间距 | 20 |
| 画布最小边距 | 16 |
| 箭头线宽 | 1.5（主）/ 0.5（虚线关系） |
| 生命线虚线 | `4 4` |

## 文本宽度估算（写坐标必用）

```
宽 ≈ (CJK 字数 × 字号) + (ASCII 字数 × 字号 × 0.55)
```

盒子宽度至少留 `宽 + 24`（左右各 12 内边距）。一行最多约 18 个 ASCII 字符，超了就换行或加宽。

## 标准 style 块（复制到每个 SVG 顶部）

```html
<style>
  .th { font: 600 13px -apple-system, "Segoe UI", "PingFang SC", sans-serif; }
  .ts { font: 12px -apple-system, "Segoe UI", "PingFang SC", sans-serif; }
  .tn { font: 11px -apple-system, "Segoe UI", "PingFang SC", sans-serif; }
  .tm { font: 12px -apple-system, "Segoe UI", "PingFang SC", sans-serif; }
  .arr { fill: none; stroke: #5F5E5A; stroke-width: 1.5; }
  .arr2 { fill: none; stroke: #B4B2A9; stroke-width: 1.5; }
  .lane { stroke: #B4B2A9; stroke-width: 1; stroke-dasharray: 4 4; }
</style>
```

> 注意：内联进 markdown/HTML 时，SVG 的 `<style>` 是**全局作用域**，类名可能与页面冲突。
> 一页多个 SVG 时用前缀（`.dg-th`），或给根元素加 `id` 并在选择器里限定。
