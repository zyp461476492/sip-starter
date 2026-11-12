#!/usr/bin/env node
/**
 * svg-check.mjs —— 手写 SVG 的机械校验（零依赖）
 *
 * 用法： node scripts/svg-check.mjs <file.svg> [--quiet]
 * 退出码：0 通过 / 1 有错误（warn 不影响退出码）
 *
 * 只查"错"（结构、几何、文字溢出），不查"好不好看"。
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const quiet = process.argv.includes('--quiet');
if (!file) {
  console.error('用法: node scripts/svg-check.mjs <file.svg>');
  process.exit(2);
}

const src = readFileSync(file, 'utf8');
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

/* ── 根元素 ─────────────────────────────────────────────── */
const svgTag = src.match(/<svg\b[^>]*>/);
if (!svgTag) {
  console.error('✗ 找不到 <svg> 根元素');
  process.exit(1);
}
const root = svgTag[0];
const attr = (name) => {
  const m = root.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : null;
};
if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(root)) err('根元素缺 xmlns');
const vb = attr('viewBox');
if (!vb) err('根元素缺 viewBox');
if (!attr('width')) err('根元素缺 width（推荐 width="100%"）');
if (!/<title>/.test(src)) err('缺 <title>（可访问性 + 截图自检需要）');
if (!/<desc>/.test(src)) err('缺 <desc>');

let VW = 720;
let VH = 400;
if (vb) {
  const p = vb.trim().split(/[\s,]+/).map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isFinite(n))) err(`viewBox 格式不对：${vb}`);
  else [, , VW, VH] = p;
}

/* ── style 与字号 ───────────────────────────────────────── */
const styleBlocks = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
const defined = new Set();
const fontSizes = new Map();
for (const css of styleBlocks) {
  for (const m of css.matchAll(/\.([a-zA-Z][\w-]*)\s*\{([^}]*)\}/g)) {
    defined.add(m[1]);
    const fs = m[2].match(/(?:font:\s*[^;]*?|font-size:\s*)(\d+(?:\.\d+)?)px/);
    if (fs) fontSizes.set(m[1], Number(fs[1]));
  }
}

/* ── 元素收集 ───────────────────────────────────────────── */
const rects = [];
for (const m of src.matchAll(/<rect\b([^>]*)\/?>/g)) {
  const a = m[1];
  const num = (n) => {
    const x = a.match(new RegExp(`\\b${n}="(-?[\\d.]+)"`));
    return x ? Number(x[1]) : null;
  };
  const r = { x: num('x'), y: num('y'), w: num('width'), h: num('height') };
  if ([r.x, r.y, r.w, r.h].some((v) => v === null)) {
    if (!/fill="none"/.test(a)) warn(`rect 缺 x/y/width/height：${a.trim().slice(0, 60)}`);
    continue;
  }
  rects.push(r);
  if (r.x < 0 || r.y < 0 || r.x + r.w > VW || r.y + r.h > VH) {
    err(`rect 越界 (${r.x},${r.y} ${r.w}×${r.h}) 超出 viewBox ${VW}×${VH}`);
  }
  if (r.x < 16 || r.y < 16) warn(`rect 贴边过近 (${r.x},${r.y})，建议留 ≥16px 边距`);
}

const classUse = new Map(); // class → 首次出现位置描述
for (const m of src.matchAll(/class="([^"]+)"/g)) {
  for (const c of m[1].trim().split(/\s+/)) {
    if (defined.size && !defined.has(c)) err(`使用了未在 <style> 中定义的类 .${c}`);
    if (!classUse.has(c)) classUse.set(c, true);
  }
}
if (!defined.size) warn('没有 <style> 块：字体/箭头样式会散落在属性里');

/* ── marker 引用 ────────────────────────────────────────── */
const markerIds = new Set([...src.matchAll(/<marker\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]));
for (const m of src.matchAll(/url\(#([^)]+)\)/g)) {
  if (!markerIds.has(m[1])) err(`引用了不存在的 marker：#${m[1]}`);
}
if (markerIds.size === 0 && /class="arr/.test(src)) warn('有箭头线条但没有定义 <marker>');

/* ── 重复 id ────────────────────────────────────────────── */
const ids = new Map();
for (const m of src.matchAll(/\bid="([^"]+)"/g)) ids.set(m[1], (ids.get(m[1]) || 0) + 1);
for (const [id, n] of ids) if (n > 1) err(`id 重复 ${n} 次：${id}`);

/* ── 文本：宽度估算 + 容器容纳 ──────────────────────────── */
const isWide = (ch) => /[\u1100-\u11ff\u2e80-\ua4cf\ua960-\ua97f\uac00-\ud7ff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/.test(ch);
function textWidth(s, size) {
  let w = 0;
  for (const ch of s) w += isWide(ch) ? size : size * 0.55;
  return w;
}

let textCount = 0;
for (const m of src.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
  const a = m[1];
  const content = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (!content) continue;
  textCount++;
  const num = (n) => {
    const x = a.match(new RegExp(`\\b${n}="(-?[\\d.]+)"`));
    return x ? Number(x[1]) : null;
  };
  const x = num('x');
  const y = num('y');
  if (x === null || y === null) {
    err(`text 缺 x/y：「${content.slice(0, 20)}」`);
    continue;
  }
  const cls = (a.match(/class="([^"]+)"/) || [, ''])[1].trim().split(/\s+/)[0];
  const size = fontSizes.get(cls) || Number((a.match(/font-size="(\d+(?:\.\d+)?)"/) || [, 12])[1]);
  const anchor = (a.match(/text-anchor="([^"]+)"/) || [, 'start'])[1];
  const w = textWidth(content, size);

  if (x - (anchor === 'middle' ? w / 2 : anchor === 'end' ? w : 0) < 4 || x + (anchor === 'middle' ? w / 2 : anchor === 'end' ? 0 : w) > VW - 4) {
    err(`文字可能超出画布左右：「${content.slice(0, 24)}」 x=${x} 估宽=${w.toFixed(0)}`);
  }
  if (y < 8 || y > VH - 4) err(`文字可能在画布外(y=${y})：「${content.slice(0, 24)}」`);

  // 找包含锚点的最小 rect，检查容纳
  const holder = rects
    .filter((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)
    .sort((p, q) => p.w * p.h - q.w * q.h)[0];
  if (holder) {
    const inner = holder.w - 24; // 左右各 12 内边距
    if (w > inner) {
      err(`文字溢出容器：「${content.slice(0, 24)}」 估宽 ${w.toFixed(0)} > 可用 ${inner}（容器 ${holder.w}）`);
    }
  }
}
if (textCount === 0) warn('没有找到任何 <text>');

/* ── 外部资源 ───────────────────────────────────────────── */
if (/<image\b/.test(src)) err('含 <image>：本技能要求纯矢量，不嵌位图');
if (/<script\b/.test(src)) err('含 <script>：不允许');
if (/href="https?:/.test(src)) err('引用了外部 URL：不允许（离线可用是硬要求）');

/* ── 报告 ───────────────────────────────────────────────── */
const name = file.split('/').pop();
if (!quiet) {
  for (const w of warns) console.log(`  warn  ${w}`);
}
for (const e of errors) console.log(`  ERROR ${e}`);
const summary = `${name}: ${errors.length} 个错误，${warns.length} 个提醒（${rects.length} 个 rect / ${textCount} 个 text / viewBox ${VW}×${VH}）`;
console.log(errors.length ? `✗ ${summary}` : `✓ ${summary}`);
process.exit(errors.length ? 1 : 0);
