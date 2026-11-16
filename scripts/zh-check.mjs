#!/usr/bin/env node
/**
 * scripts/zh-check.mjs —— 中文译文层体检（只报告，不改文件）
 *
 * 查四件事：
 *   1. frontmatter 完整（sec / en_sha / status，reviewed 还要 reviewed_by）
 *   2. sec 能在 RFC3261 原文里找到
 *   3. en_sha 与原文一致（不一致 = 原文变了，译文待复核）
 *   4. 规范词（MUST / SHOULD / MAY …）在译文里保留英文原词，不许只写中文
 *
 * 用法： node scripts/zh-check.mjs [--quiet]
 * 退出码：有 error 则 1。
 */
import { resolve, dirname } from 'node:path';
import { readRfc3261 } from './rfc-sections.mjs';
import { loadZh, checkSection } from './zh.mjs';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const quiet = process.argv.includes('--quiet');

const { byNum, secs } = readRfc3261(ROOT);
const { bySec, errors, warn } = loadZh(ROOT);

for (const [sec, zh] of bySec) {
  const r = checkSection(zh, byNum.get(sec));
  errors.push(...r.errors);
  warn.push(...r.warn);
}

if (!quiet) {
  console.log(`\n中文译文层：${bySec.size} 节已译 / 原文 ${secs.length} 节\n`);
  const rows = [...bySec.values()]
    .map((z) => {
      const s = byNum.get(z.sec);
      const stale = s && z.data.en_sha !== s.sha ? '⚠ 原文已变' : '';
      return `  §${z.sec.padEnd(10)} ${String(z.data.status).padEnd(9)} ${(s ? s.title : '?').slice(0, 46)} ${stale}`;
    })
    .join('\n');
  if (rows) console.log(rows + '\n');
}

for (const w of warn) console.log('  warn  ' + w);
for (const e of errors) console.log('  ERROR ' + e);
console.log(`\n${errors.length} 个错误，${warn.length} 个提醒`);
process.exit(errors.length ? 1 : 0);
