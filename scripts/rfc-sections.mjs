/**
 * scripts/rfc-sections.mjs —— RFC 原文切节（唯一实现，build.mjs 与 zh-* 脚本共用）
 *
 * 产物：{ pre, secs }，每节 { num, title, lines }
 *   - num 就是锚点里的 § 号（`#sec-17.1.1.1`），译文文件名也用它
 *   - text 是去掉首尾空行的原文，sha 用来判断"原文变了译文过期"
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const NOISE = [/^Rosenberg, et\. al\./, /^RFC 3261\s{2,}SIP: Session Initiation Protocol/];

export function parseSections(rawText, { noteToc = true } = {}) {
  const pre = [];
  const secs = [];
  let cur = null;
  let inToc = false;
  for (const rawLine of rawText.split('\n')) {
    const line = rawLine.replace(/\f/g, '').replace(/\s+$/, '');
    if (NOISE.some((re) => re.test(line))) continue;
    if (/^Table of Contents\s*$/.test(line)) {
      inToc = true;
      if (noteToc) pre.push('（原文目录略——用右上导航，或看 rfc-editor 页面）');
      continue;
    }
    const m = line.match(/^(\d{1,2}(?:\.\d{1,3})*)\.?\s+([A-Za-z0-9].*)$/);
    const a = /^A\s+Table of Timer Values\s*$/.test(line);
    if (m || a) {
      inToc = false;
      cur = { num: m ? m[1] : 'A', title: m ? m[2] : 'Table of Timer Values', lines: [] };
      secs.push(cur);
      continue;
    }
    if (inToc) continue;
    (cur ? cur.lines : pre).push(line);
  }
  return { pre, secs };
}

export function sectionText(sec) {
  return sec.lines.join('\n').replace(/^\n+|\n+$/g, '');
}

/** 只在"节正文"上算哈希：忽略行尾空白与首尾空行，避免无关 diff 让译文失效 */
export function sectionSha(sec) {
  const norm = sectionText(sec)
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n');
  return createHash('sha256').update(norm).digest('hex').slice(0, 16);
}

/** 规范词：译文里必须原样保留英文 */
export const NORMATIVE = [
  'MUST NOT',
  'MUST',
  'SHALL NOT',
  'SHALL',
  'SHOULD NOT',
  'SHOULD',
  'NOT RECOMMENDED',
  'RECOMMENDED',
  'REQUIRED',
  'MAY',
  'OPTIONAL',
];

export function normativeCounts(text) {
  const out = {};
  for (const kw of NORMATIVE) {
    const re = new RegExp(`\\b${kw.replace(/ /g, '\\s+')}\\b`, 'g');
    const n = (String(text).match(re) || []).length;
    if (n) out[kw] = n;
  }
  return out;
}

export function readRfc3261(root) {
  const file = join(root, 'sip/raw/rfc/rfc3261.txt');
  const { pre, secs } = parseSections(readFileSync(file, 'utf8'));
  for (const s of secs) {
    s.text = sectionText(s);
    s.sha = sectionSha(s);
  }
  return { pre, secs, byNum: new Map(secs.map((s) => [s.num, s])) };
}

/**
 * 把一节的原文切成"可读块"：散文按段落合并换行，预格式化块（表/ABNF/报文样例）原样保留。
 *
 * 判据：块内任意一行出现 3 个以上连续空格（列对齐、ABNF 等号对齐），或块内存在
 * 以非空白开头的短行混排 → 预格式化。散文块则把行首缩进去掉、行间换行折成空格。
 * 这是启发式：误判的代价是"该保留空白的被折行"，宁可保守（多判为 pre）。
 */
export function toBlocks(text) {
  const chunks = [];
  let cur = [];
  for (const line of String(text).split('\n')) {
    if (line.trim() === '') {
      if (cur.length) chunks.push(cur);
      cur = [];
    } else cur.push(line);
  }
  if (cur.length) chunks.push(cur);

  return chunks.map((lines) => {
    // 顶格短行 = 原文里的小标题（Status of this Memo / Copyright Notice / Abstract）
    if (lines.length === 1 && !/^\s/.test(lines[0]) && lines[0].trim().length <= 60 && !/\S {3,}\S/.test(lines[0])) {
      return { type: 'h', text: lines[0].trim() };
    }
    const indents = lines.filter((l) => l.trim()).map((l) => (l.match(/^ */) || [''])[0].length);
    const uniform = new Set(indents).size === 1 && indents[0] === 3; // 正文固定缩进 3 格
    const maxLen = Math.max(...lines.map((l) => l.replace(/\s+$/, '').length));
    const preformatted =
      lines.some((l) => /\S {3,}\S/.test(l)) || // 列对齐（表 / ABNF 等号 / 报文头）
      !uniform ||                                 // 缩进不一致（示例块、续行、状态表）
      (lines.length >= 2 && maxLen < 50);         // 短行堆叠 = 表格或清单
    if (preformatted) return { type: 'pre', text: lines.join('\n').replace(/\s+$/, '') };
    if (lines.length === 1) return { type: 'p', text: lines[0].trim() };
    // 文献里的续行：折成一个空格；行尾连字符（start-/line、non-/INVITE）直接粘连，不插空格
    let out = lines[0].trim();
    for (const l of lines.slice(1)) {
      const t = l.trim();
      out += out.endsWith('-') ? t : ' ' + t;
    }
    return { type: 'p', text: out.replace(/\s{2,}/g, ' ') };
  });
}
