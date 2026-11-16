/**
 * scripts/zh.mjs —— 中文译文层（sip/zh/）的读取与校验
 *
 * 目录约定：sip/zh/rfc3261/<节号>.md，一节一文件
 *   frontmatter: sec / en_sha / status / translator / date
 *   status: pending | draft | reviewed
 *
 * 译文层不是证据层：sip/raw/ 只读，译文永远是可再生产物，见 docs/adr/0006。
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { normativeCounts } from './rfc-sections.mjs';

export const ZH_DIR = 'sip/zh/rfc3261';
export const ZH_STATUS = new Set(['pending', 'draft', 'reviewed']);

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  return { data: yaml.load(m[1]) || {}, body: raw.slice(m[0].length) };
}

/**
 * 读入全部译文。
 * @returns {{ bySec: Map<string, {sec,file,data,body}>, errors: string[], warn: string[] }}
 */
export function loadZh(root) {
  const dir = join(root, ZH_DIR);
  const bySec = new Map();
  const errors = [];
  const warn = [];
  if (!existsSync(dir)) return { bySec, errors, warn };

  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith('.md') || f === 'README.md') continue;
    const file = join(dir, f);
    const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'));
    const slug = f.replace(/\.md$/, '');
    const sec = String(data.sec || '');
    if (!sec) {
      errors.push(`${ZH_DIR}/${f} 缺 frontmatter sec`);
      continue;
    }
    if (sec !== slug) warn.push(`${ZH_DIR}/${f} 文件名(${slug}) 与 sec(${sec}) 不一致`);
    if (!data.en_sha) errors.push(`${ZH_DIR}/${f} 缺 en_sha —— 无法判断译文是否过期`);
    if (!ZH_STATUS.has(String(data.status))) errors.push(`${ZH_DIR}/${f} status 非法：${data.status}（只能 pending/draft/reviewed）`);
    if (data.status === 'reviewed' && !data.reviewed_by) errors.push(`${ZH_DIR}/${f} status=reviewed 但缺 reviewed_by`);
    if (bySec.has(sec)) errors.push(`译文节号重复：${sec}（${bySec.get(sec).file} 与 ${f}）`);
    bySec.set(sec, { sec, file: `${ZH_DIR}/${f}`, slug, data, body: body.trim() });
  }
  return { bySec, errors, warn };
}

/**
 * 单节质量校验：节号是否存在、en_sha 是否漂移、规范词是否被翻译掉。
 * 规则（AGENTS.md §3.1）：MUST/SHOULD 等一律保留英文原词，不许只写中文。
 */
export function checkSection(zh, secObj) {
  const errors = [];
  const warn = [];
  if (!secObj) {
    errors.push(`${zh.file} 的 sec=${zh.sec} 在 RFC3261 原文里找不到对应小节`);
    return { errors, warn };
  }
  if (zh.data.en_sha && zh.data.en_sha !== secObj.sha) {
    warn.push(
      `${zh.file} 原文已变（en_sha ${zh.data.en_sha} → ${secObj.sha}），译文需复核：RFC3261 §${zh.sec}`
    );
  }
  const en = normativeCounts(secObj.text);
  const cn = normativeCounts(zh.body);
  for (const [kw, n] of Object.entries(en)) {
    const got = cn[kw] || 0;
    if (got === 0) errors.push(`${zh.file} 原文有 ${n} 处 ${kw}，译文里一处英文原词都没保留（§${zh.sec}）`);
    else if (got !== n) warn.push(`${zh.file} 规范词数量不符：${kw} 原文 ${n} / 译文 ${got}（§${zh.sec}）`);
  }
  for (const kw of Object.keys(cn)) {
    if (!(kw in en)) warn.push(`${zh.file} 译文出现了原文没有的规范词 ${kw}（§${zh.sec}）`);
  }
  if (!zh.body) errors.push(`${zh.file} 正文为空`);
  return { errors, warn };
}
