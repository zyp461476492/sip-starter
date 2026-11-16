#!/usr/bin/env node
/**
 * scripts/zh-status.mjs —— 中文译文覆盖率报表（只读）
 *
 * 用途：决定"下一批翻哪几节"。按一级/二级小节聚合，标出未译、草稿、已复核、待复核（原文已变）。
 * 用法： node scripts/zh-status.mjs [--top <N>]   只列前 N 个未完成的一级小节（默认 12）
 */
import { resolve, dirname } from 'node:path';
import { readRfc3261 } from './rfc-sections.mjs';
import { loadZh } from './zh.mjs';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const argv = process.argv.slice(2);
const topIdx = argv.indexOf('--top');
const TOP = topIdx >= 0 ? Number(argv[topIdx + 1]) || 12 : 12;

const { byNum, secs } = readRfc3261(ROOT);
const { bySec, errors } = loadZh(ROOT);

// 只统计"有正文"的节（容器节如 §17 本身不含正文）
const real = secs.filter((s) => s.text.trim().length > 0);
const stat = { pending: 0, draft: 0, reviewed: 0, stale: 0, untranslated: 0 };
const byRoot = new Map();
for (const s of real) {
  const root = s.num === 'A' ? 'A' : s.num.split('.')[0];
  if (!byRoot.has(root)) byRoot.set(root, { total: 0, done: 0, draft: 0, reviewed: 0 });
  const g = byRoot.get(root);
  g.total++;
  const z = bySec.get(s.num);
  if (!z) {
    stat.untranslated++;
    continue;
  }
  stat[z.data.status] = (stat[z.data.status] || 0) + 1;
  g.done++;
  if (z.data.status === 'draft') g.draft++;
  if (z.data.status === 'reviewed') g.reviewed++;
  if (z.data.en_sha && z.data.en_sha !== s.sha) stat.stale++;
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
console.log(`\n中文译文覆盖率：${bySec.size}/${real.length} 节（有正文的节）· ${pct(bySec.size, real.length)}%`);
console.log(
  `  已复核 reviewed ${stat.reviewed} · 草稿 draft ${stat.draft} · 未译 ${stat.untranslated} · 原文已变 ${stat.stale}\n`
);

const rows = [...byRoot.entries()]
  .map(([root, g]) => ({ root, ...g, p: pct(g.done, g.total) }))
  .sort((a, b) => a.p - b.p || Number(a.root) - Number(b.root));

console.log('按一级小节（完成率低的在前）：');
for (const r of rows.slice(0, TOP)) {
  const bar = '█'.repeat(Math.round(r.p / 10)).padEnd(10, '·');
  console.log(`  §${String(r.root).padEnd(4)} ${bar} ${String(r.p).padStart(3)}%  ${r.done}/${r.total}`);
}
const missing = real.filter((s) => !bySec.has(s.num)).length;
console.log(`\n未译小节合计 ${missing} 节；明细：node scripts/zh-check.mjs --quiet 之外可直接读 sip/zh/ 目录。`);
if (errors.length) console.log(`\n注意：译文层有 ${errors.length} 个结构错误，先跑 node scripts/zh-check.mjs 修掉。`);
