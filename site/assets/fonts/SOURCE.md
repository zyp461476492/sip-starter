# 自托管字体来源

| 文件 | 字体 | 版本 | 许可 | 来源 |
|---|---|---|---|---|
| `inter-latin-wght-normal.woff2` | Inter（可变字重 100–900，latin 子集） | `@fontsource-variable/inter@5` | SIL OFL 1.1（`OFL-Inter.txt`） | <https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@5/files/inter-latin-wght-normal.woff2> |
| `jetbrains-mono-latin-400-normal.woff2` | JetBrains Mono 400（latin 子集） | `@fontsource/jetbrains-mono@5` | SIL OFL 1.1（`OFL-JetBrainsMono.txt`） | <https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-400-normal.woff2> |

## 为什么不引中文网络字体

中文 webfont 即使用子集化也常在 1–3 MB 量级，且会命中"首屏阻塞 + FOUT"问题。
主流中文文档站（VitePress 官方主题、Vue 中文文档）都**不加载中文网络字体**，中文交给系统
CJK 栈：`PingFang SC`（macOS/iOS）、`HarmonyOS Sans SC`、`MiSans`、`Source Han Sans SC`、
`Noto Sans CJK SC`（多数 Linux）、`Microsoft YaHei`（Windows）。

拉丁文单独加载 Inter 的原因：不加载时，Linux 上拉丁字符会落到 DejaVu Sans、中文落到
Noto Sans CJK，两套字形混排导致字重、x-height、基线都不齐。Inter 的 latin 子集只有 48 KB。

## 更新方式

```bash
curl -sL -o inter-latin-wght-normal.woff2 \
  https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@5/files/inter-latin-wght-normal.woff2
curl -sL -o jetbrains-mono-latin-400-normal.woff2 \
  https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-400-normal.woff2
```

升级版本时同步改本文件与两个 `OFL-*.txt`，并跑一次 `npm run site` 看 `dist/assets/fonts/` 是否齐全。
