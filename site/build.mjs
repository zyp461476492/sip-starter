#!/usr/bin/env node
/**
 * site/build.mjs —— sip-starter 静态站点生成器
 *
 * 数据源：plan/plan.yaml、vocab/*.yaml、wiki/**\/*.md
 * 产物：  site/dist/（三视图 + search.json）
 *
 * 用法： node site/build.mjs           构建
 *        node site/build.mjs --serve   构建并起本地服务
 *        node site/build.mjs --check   只校验不写文件
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { createServer } from 'node:http';
import { marked } from 'marked';
import yaml from 'js-yaml';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const DIST = join(ROOT, 'site', 'dist');
const argv = process.argv.slice(2);
const MODE = argv[0] || 'build';
const PORT = Number(argv[1] && !argv[1].startsWith('-') ? argv[1] : 5173);

const errors = [];
const warn = [];

/* ── 基础工具 ───────────────────────────────────────────── */

const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  let data = {};
  try {
    data = yaml.load(m[1]) || {};
  } catch (e) {
    errors.push(`frontmatter 解析失败：${e.message}`);
  }
  return { data, body: raw.slice(m[0].length) };
}

/* ── 读取 wiki ──────────────────────────────────────────── */

const WIKI = join(ROOT, 'wiki');
const SPECIAL = new Set(['index.md', 'log.md', 'README.md']);

/* ── 证据锚点 / 练习 的链接化 ───────────────────────────
   sources:"RFC3261 §7.1" → 原文锚点页；drills → 练习页          */

let H = new Set(); // RFC3261 章节号集合（从原文抽）
const DRILLS = new Map(); // slug → { slug, data, body }

function collectDrills(dirName = 'sip/labs/drills') {
  const dir = join(ROOT, dirName);
  const map = new Map();
  if (!existsSync(dir)) return map;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md') || f === 'README.md') continue;
    const { data, body } = parseFrontmatter(readFileSync(join(dir, f), 'utf8'));
    const slug = data.slug || f.replace(/\.md$/, '');
    map.set(slug, { slug, data, body });
  }
  return map;
}

function sourceChip(spec, rel) {
  const s = String(spec);
  if (/^RFC3261\s*附录\s*A/.test(s)) return `<a class="chip src" href="${rel}raw/rfc3261.html#sec-A">${esc(s)}</a>`;
  const m = s.match(/^(RFC\d+)\s*§\s*([0-9]+(?:\.[0-9]+)*)/);
  if (m && m[1] === 'RFC3261') {
    if (H.has(m[2])) return `<a class="chip src" href="${rel}raw/rfc3261.html#sec-${m[2]}">${esc(s)}</a>`;
    return `<span class="chip src gap" title="原文里找不到该章节">${esc(s)}</span>`;
  }
  return `<span class="chip src gap" title="原文尚未入库，暂不可跳">${esc(s)}</span>`;
}

function drillChip(slug, rel) {
  if (DRILLS.has(slug)) return `<a class="chip" href="${rel}drills/${slug}.html">drill: ${esc(slug)}</a>`;
  return `<span class="chip gap" title="练习文件尚未创建">drill: ${esc(slug)}</span>`;
}

function collectWiki() {
  const pages = new Map();
  for (const file of walk(WIKI)) {
    if (!file.endsWith('.md')) continue;
    const rel = relative(WIKI, file).replace(/\\/g, '/');
    if (SPECIAL.has(rel)) continue;
    const slug = rel.replace(/\.md$/, '');
    const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'));
    if (!data.id) errors.push(`缺 frontmatter id：wiki/${rel}`);
    if (!data.title) errors.push(`缺 frontmatter title：wiki/${rel}`);
    if (!data.topics) errors.push(`缺 frontmatter topics：wiki/${rel}`);
    if (data.id && data.id !== slug) warn.push(`id(${data.id}) 与路径(${slug}) 不一致`);
    pages.set(slug, { slug, rel, data, body, links: [], backlinks: [] });
  }
  // 收集 wikilink + 反链
  for (const page of pages.values()) {
    for (const target of wikilinks(page.body)) {
      if (!page.links.includes(target)) page.links.push(target);
      if (pages.has(target)) {
        const t = pages.get(target);
        if (!t.backlinks.includes(page.slug)) t.backlinks.push(page.slug);
      }
    }
  }
  return pages;
}

function wikilinks(text) {
  const out = [];
  for (const m of text.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) out.push(m[1].trim());
  return out;
}

function renderMd(md, { pages, rel }) {
  const linked = md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_all, target, text) => {
    const slug = target.trim();
    const page = pages.get(slug);
    const label = esc(text || (page ? page.data.title : slug));
    if (page) return `<a class="wl" href="${rel}wiki/${slug}.html">${label}</a>`;
    return `<a class="redlink" title="待建页面 ${esc(slug)}">${label}</a>`;
  });
  let html = marked.parse(linked, { async: false, mangle: false, headerIds: false });
  // 内联 SVG：md 里写 ![说明](assets/x.svg)，构建时把文件内容直接嵌进页面（单文件、无路径问题）
  html = html.replace(/<img\b[^>]*src="([^"]+\.svg)"[^>]*>/gi, (all, src) => {
    const p = join(WIKI, src.replace(/^\.\//, ''));
    if (!existsSync(p)) {
      errors.push(`页面引用的 SVG 不存在：wiki/${src}`);
      return all;
    }
    const svg = readFileSync(p, 'utf8');
    if (!/class="dg-/.test(svg)) warn.push(`SVG 未用 dg- 类前缀（内联时会污染页面样式）：${src}`);
    return svg;
  });
  return html;
}

/* ── 页面骨架 ───────────────────────────────────────────── */

const NAV = (rel, active) => `
<header class="topbar">
  <a class="brand" href="${rel}index.html">sip<span>-starter</span></a>
  <nav>
    <a href="${rel}index.html" class="${active === 'plan' ? 'on' : ''}">学习计划</a>
    <a href="${rel}wiki/index.html" class="${active === 'wiki' ? 'on' : ''}">知识库</a>
    <a href="${rel}vocab.html" class="${active === 'vocab' ? 'on' : ''}">生词本</a>
    <a href="${rel}raw/rfc3261.html" class="${active === 'raw' ? 'on' : ''}">RFC 原文</a>
  </nav>
  <div class="search">
    <input id="q" type="search" placeholder="搜索 wiki / 生词…" autocomplete="off">
    <div id="hits" class="hits"></div>
  </div>
</header>`;

function shell({ title, rel, active, body }) {
  return `<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · sip-starter</title>
<link rel="stylesheet" href="${rel}assets/style.css">
</head><body>
${NAV(rel, active)}
<main>${body}</main>
<footer>由 <code>site/build.mjs</code> 从 plan/ + vocab/ + wiki/ 生成。不要手改 dist/。</footer>
<script src="${rel}assets/app.js"></script>
</body></html>`;
}

/* ── 计划视图 ───────────────────────────────────────────── */

function renderPlan(plan, pages, rel) {
  const tasks = plan.phases.flatMap((p) => p.tasks || []);
  const done = tasks.filter((t) => t.status === 'done').length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const next = tasks.find((t) => t.status === 'doing') || tasks.find((t) => t.status === 'todo');

  const wikiChip = (slug) =>
    pages.has(slug)
      ? `<a class="chip ok" href="${rel}wiki/${slug}.html">✓ ${esc(slug)}</a>`
      : `<span class="chip gap" title="wiki 页尚未编译">○ ${esc(slug)}</span>`;

  const phases = plan.phases
    .map((phase) => {
      const pt = phase.tasks || [];
      const pd = pt.filter((t) => t.status === 'done').length;
      const marks = [
        phase.code === false ? '<span class="badge noco">不写代码</span>' : '<span class="badge code">要写代码</span>',
        phase.timebox ? `<span class="badge">约 ${esc(phase.timebox)}</span>` : '',
      ].join(' ');
      const rows = pt
        .map(
          (t) => `<article class="task ${t.status}">
  <div class="taskhead">
    <span class="badge ${t.status}">${t.status === 'done' ? '已完成' : t.status === 'doing' ? '进行中' : '待办'}</span>
    <h4>${esc(t.title)}</h4>
  </div>
  <p class="why">为什么：${esc(t.why)}</p>
  <p class="done-when"><b>完成判据</b>：${esc(t.done_when)}</p>
  <div class="chips">
    ${t.est ? `<span class="chip">约 ${esc(t.est)}</span>` : ''}
    ${(t.sources || []).map((s) => sourceChip(s, rel)).join('')}
    ${(t.wiki || []).map(wikiChip).join('')}
    ${(t.drills || []).map((d) => drillChip(d, rel)).join('')}
    ${t.prereq && t.prereq.length ? `<span class="chip">前置：${t.prereq.map(esc).join(', ')}</span>` : ''}
  </div>
</article>`
        )
        .join('');
      return `<section class="phase">
  <h3>${esc(phase.title)} <small>${pd}/${pt.length}</small></h3>
  <p class="phaseMarks">${marks}</p>
  <p class="goal">目标：${esc(phase.goal)}</p>
  ${rows}
</section>`;
    })
    .join('');

  return `<h1>学习计划 <span class="topic">${esc(plan.active_topic)}</span></h1>
<div class="progress"><div class="bar" style="width:${pct}%"></div><span>${done}/${tasks.length} · ${pct}%</span></div>
${
  next
    ? `<div class="next"><b>下一步</b> ${esc(next.title)} <span class="muted">（${esc(next.id)}）</span></div>`
    : '<div class="next">全部完成</div>'
}
${phases}`;
}

/* ── 生词视图 ───────────────────────────────────────────── */

const SPK = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z" fill="currentColor"/><path d="M15.2 9a4.2 4.2 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M17.8 6.6a7.6 7.6 0 0 1 0 10.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

function renderVocab(terms, candidates, rel) {
  const data = JSON.stringify(terms);
  const speakBtn = (t, extra = '') =>
    `<button class="speak ${extra}" data-say="${esc(t.say || t.term)}"${t.audio ? ` data-audio="${rel}${esc(t.audio)}"` : ''} title="朗读 ${esc(t.term)}">${SPK}<span>读</span></button>`;
  const cards = terms
    .map(
      (t) => `<article class="card" data-status="${esc(t.status)}" data-term="${esc(t.term)}">
  <div class="cardhead">
    <h3>${esc(t.term)} ${speakBtn(t)}</h3>
    <span class="badge ${esc(t.status)}">${esc(t.status)}</span>
  </div>
  ${t.phonetic ? `<p class="phon">${esc(t.phonetic)}</p>` : ''}
  <p class="dom">${esc(t.domain_meaning)}</p>
  <dl>
    ${t.general_meaning ? `<dt>通用义</dt><dd>${esc(t.general_meaning)}</dd>` : ''}
    <dt>易错点</dt><dd>${esc(t.confusion)}</dd>
    <dt>出处</dt><dd><code>${esc(t.source)}</code></dd>
  </dl>
  <div class="chips">${(t.wiki || []).map((w) => (rel !== undefined ? `<a class="chip" href="${rel}wiki/${w}.html">${esc(w)}</a>` : `<span class="chip">${esc(w)}</span>`)).join('')}</div>
</article>`
    )
    .join('');

  const cand = candidates.length
    ? `<details class="cand"><summary>候选池（${candidates.length} 条，待人工确认）</summary><ul>${candidates
        .map((c) => `<li><b>${esc(c.term)}</b> ${c.phonetic ? `<span class="phon inline">${esc(c.phonetic)}</span> ` : ''}— ${esc(c.domain_meaning || '')} <code>${esc(c.source || '')}</code></li>`)
        .join('')}</ul></details>`
    : '';

  return `<h1>生词本 <small>熟词僻义才是坑</small></h1>
<div class="toolbar">
  <span class="tgroup">
    <button data-filter="all" class="on">全部</button>
    <button data-filter="learning">learning</button>
    <button data-filter="known">known</button>
  </span>
  <span class="tgroup">
    <button data-accent="en-US" class="on">US</button>
    <button data-accent="en-GB">UK</button>
    <button data-rate="0.6">慢速</button>
  </span>
  <span class="tgroup"><button data-online title="用有道词典音频发音（本机无 TTS 语音时的回退）">在线发音</button></span>
  <span class="tgroup"><button id="quiz">抽卡自查</button></span>
</div>
<div id="voicewarn" class="voicewarn" hidden></div>
<div id="quizbox" class="quizbox" hidden>
  <div class="qterm"></div>
  <div class="qphon"></div>
  <div class="qans" hidden></div>
  <div class="qfoot"><button id="qspeak">读一遍</button><button id="reveal">看答案</button><button id="next">下一个</button><span id="qleft"></span></div>
</div>
<section class="cards">${cards}</section>
${cand}
<script>window.__VOCAB__=${data};</script>`;
}

/* ── wiki 视图 ──────────────────────────────────────────── */

function renderWikiPage(page, pages, terms, rel) {
  // 正文若以 # 标题开头，去掉（页面模板已渲染 title，避免两个 h1）
  const body = page.body.replace(/^\s*#\s+.*\n/, '');
  const html = renderMd(body, { pages, rel });
  const relVocab = terms.filter((t) => (t.wiki || []).includes(page.slug));
  const back = page.backlinks.length
    ? `<ul>${page.backlinks.map((b) => `<li><a class="wl" href="${rel}wiki/${b}.html">${esc(pages.get(b).data.title)}</a></li>`).join('')}</ul>`
    : '<p class="muted">暂无入链。</p>';
  const specs = (page.data.specs || []).map((s) => sourceChip(s, rel)).join('');
  const drills = (page.data.drills || []).map((d) => drillChip(d, rel)).join('');
  const foot = `<aside class="pagefoot">
  <div><h4>证据锚点</h4><div class="chips">${specs || '<span class="muted">—</span>'}</div>
    ${drills ? `<h4 style="margin-top:12px">相关练习</h4><div class="chips">${drills}</div>` : ''}</div>
  <div><h4>反向链接</h4>${back}</div>
  <div><h4>相关生词</h4>${
    relVocab.length ? `<div class="chips">${relVocab.map((t) => `<span class="chip">${esc(t.term)}</span>`).join('')}</div>` : '<p class="muted">—</p>'
  }</div>
</aside>`;
  return `<div class="crumb"><a href="${rel}wiki/index.html">知识库</a> / ${esc(page.slug)}</div>
<article class="wikipage">
  <div class="pagehead"><h1>${esc(page.data.title)}</h1><span class="badge ${esc(page.data.status || 'draft')}">${esc(page.data.status || 'draft')}</span></div>
  <p class="topics">${(page.data.topics || []).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</p>
  ${html}
  ${foot}
</article>`;
}

/* ── RFC 原文页（按节加锁点） ───────────────────────────── */

let RFC_CACHE = null;
function getRfc() {
  if (!RFC_CACHE) RFC_CACHE = rfcSections();
  return RFC_CACHE;
}

function rfcSections(file = 'sip/raw/rfc/rfc3261.txt') {
  const raw = readFileSync(join(ROOT, file), 'utf8');
  const noise = [/^Rosenberg, et\. al\./, /^RFC 3261\s{2,}SIP: Session Initiation Protocol/];
  const pre = [];
  const secs = [];
  let cur = null;
  let inToc = false;
  for (const rawLine of raw.split('\n')) {
    const line = rawLine.replace(/\f/g, '').replace(/\s+$/, '');
    if (noise.some((re) => re.test(line))) continue;
    if (/^Table of Contents\s*$/.test(line)) {
      inToc = true;
      pre.push('（原文目录略——用右上导航，或看 rfc-editor 页面）');
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

function renderRawPage(rel) {
  const { pre, secs } = getRfc();
  const toc = secs
    .map((s) => {
      const lvl = s.num === 'A' ? 1 : s.num.split('.').length;
      return `<a class="toc-l${Math.min(lvl, 3)}" href="#sec-${s.num}"><b>${esc(s.num)}</b> ${esc(s.title)}</a>`;
    })
    .join('');
  const body = secs
    .map(
      (s) => `<section id="sec-${s.num}">
  <h3>${esc(s.num)} &nbsp;${esc(s.title)} <a class="anchor" href="#sec-${s.num}">#</a></h3>
  <pre class="rfctext">${esc(s.lines.join('\n').replace(/^\n+|\n+$/g, ''))}</pre>
</section>`
    )
    .join('\n');
  return `<div class="crumb"><a href="${rel}index.html">学习计划</a> / RFC 3261 原文</div>
<h1>RFC 3261 原文 <small>SIP: Session Initiation Protocol · 269 页</small></h1>
<p class="muted">由 <code>sip/raw/rfc/rfc3261.txt</code> 生成，已剔除页眉页脚。每节一个锁点：计划页与 wiki 页的 <code>§x.y</code> 直接跳到这里。</p>
<div class="rawlayout">
  <nav class="rawtoc">${toc}</nav>
  <div class="rawbody">
    ${pre.filter((l) => l.trim()).length ? `<section id="sec-pre"><pre class="rfctext">${esc(pre.join('\n').replace(/^\n+|\n+$/g, ''))}</pre></section>` : ''}
    ${body}
  </div>
</div>`;
}

function renderDrillPage(d, pages, rel) {
  const html = renderMd(d.body, { pages, rel });
  const specs = (d.data.specs || []).map((s) => sourceChip(s, rel)).join('');
  const wl = (d.data.wiki || [])
    .map((w) => (pages.has(w) ? `<a class="chip ok" href="${rel}wiki/${w}.html">✓ ${esc(w)}</a>` : `<span class="chip gap">${esc(w)}</span>`))
    .join('');
  return `<div class="crumb"><a href="${rel}index.html">学习计划</a> / 练习 / ${esc(d.slug)}</div>
<article class="wikipage">
  <div class="pagehead"><h1>drill: ${esc(d.slug)}</h1><span class="badge">${esc(d.data.phase || '')}</span></div>
  ${html}
  <aside class="pagefoot">
    <div><h4>证据锚点</h4><div class="chips">${specs || '<span class="muted">—</span>'}</div></div>
    <div><h4>相关 wiki</h4><div class="chips">${wl || '<span class="muted">—</span>'}</div></div>
  </aside>
</article>`;
}

/* ── 写文件 ─────────────────────────────────────────────── */

function writePage(relPath, html) {
  const full = join(DIST, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html);
}

const relFrom = (relPath) => '../'.repeat(relPath.split('/').length - 1);

/* ── 主流程 ─────────────────────────────────────────────── */

function main() {
  const plan = yaml.load(read('plan/plan.yaml'));
  const terms = yaml.load(read('vocab/terms.yaml')) || [];
  const candidates = existsSync(join(ROOT, 'vocab/candidates.yaml')) ? yaml.load(read('vocab/candidates.yaml')) || [] : [];
  const pages = collectWiki();
  H = new Set(getRfc().secs.map((s) => s.num));
  for (const [k, v] of collectDrills()) DRILLS.set(k, v);

  /* 校验 */
  const VALID_VOCAB = new Set(['candidate', 'learning', 'known']);
  const VALID_TASK = new Set(['todo', 'doing', 'done']);
  terms.forEach((t, i) => {
    for (const f of ['term', 'phonetic', 'domain_meaning', 'confusion', 'source', 'status', 'topics']) {
      if (!t[f]) errors.push(`vocab/terms.yaml[${i}] 缺字段 ${f}`);
    }
    if (t.audio && !existsSync(join(ROOT, 'vocab', t.audio))) warn.push(`vocab(${t.term}) 的 audio 文件不存在：${t.audio}，将回退浏览器 TTS`);
    if (t.status && !VALID_VOCAB.has(t.status)) errors.push(`vocab 状态非法: ${t.status} (${t.term})`);
    for (const w of t.wiki || []) if (!pages.has(w)) errors.push(`vocab(${t.term}) 引用了不存在的 wiki 页: ${w}`);
  });
  for (const phase of plan.phases) {
    for (const t of phase.tasks || []) {
      for (const f of ['id', 'title', 'why', 'done_when', 'status']) if (!t[f]) errors.push(`plan.yaml ${t.id || '(无 id)'} 缺字段 ${f}`);
      if (t.status && !VALID_TASK.has(t.status)) errors.push(`task 状态非法: ${t.status} (${t.id})`);
      for (const w of t.wiki || []) if (!pages.has(w)) errors.push(`plan(${t.id}) 引用了不存在的 wiki 页: ${w}`);
      for (const d of t.drills || []) if (!DRILLS.has(d)) errors.push(`plan(${t.id}) 引用了不存在的 drill: ${d}`);
    }
  }
  // 锚点存在性 + 死链
  const headings = H;
  for (const page of pages.values()) {
    const secs = [...page.body.matchAll(/RFC ?3261 ?§\s*([0-9]+(?:\.[0-9]+)*)/g)].map((m) => m[1]);
    for (const s of new Set([...(page.data.specs || []).flatMap((x) => [...String(x).matchAll(/§\s*([0-9]+(?:\.[0-9]+)*)/g)].map((m) => m[1])), ...secs])) {
      if (headings.size && !headings.has(s)) errors.push(`锚点不存在：RFC3261 §${s}（${page.slug}）`);
    }
    for (const l of page.links) if (!pages.has(l)) warn.push(`红链：${page.slug} → ${l}`);
    for (const d of page.data.drills || []) if (!DRILLS.has(d)) errors.push(`wiki(${page.slug}) 引用了不存在的 drill: ${d}`);
  }

  const report = () => {
    for (const w of warn) console.log('  warn  ' + w);
    for (const e of errors) console.log('  ERROR ' + e);
    console.log(`\n${errors.length} 个错误，${warn.length} 个提醒；wiki 页 ${pages.size} 个，生词 ${terms.length} 条，任务 ${plan.phases.flatMap((p) => p.tasks || []).length} 个`);
  };

  if (MODE === '--check') {
    report();
    process.exit(errors.length ? 1 : 0);
  }

  /* 构建 */
  if (existsSync(DIST)) rmSync(DIST, { recursive: true });
  mkdirSync(join(DIST, 'assets'), { recursive: true });
  writeFileSync(join(DIST, 'assets/style.css'), read('site/assets/style.css'));
  writeFileSync(join(DIST, 'assets/app.js'), read('site/assets/app.js'));
  // 本地发音文件（可选）：vocab/audio/* → dist/audio/*
  const audioDir = join(ROOT, 'vocab/audio');
  if (existsSync(audioDir)) {
    mkdirSync(join(DIST, 'audio'), { recursive: true });
    for (const f of readdirSync(audioDir)) {
      writeFileSync(join(DIST, 'audio', f), readFileSync(join(audioDir, f)));
    }
  }

  // 1. 计划
  writePage('index.html', shell({ title: '学习计划', rel: '', active: 'plan', body: renderPlan(plan, pages, '') }));

  // 2. wiki
  writePage('wiki/index.html', shell({ title: '知识库', rel: '../', active: 'wiki', body: renderMd(read('wiki/index.md'), { pages, rel: '../' }) }));
  for (const page of pages.values()) {
    const rel = relFrom(`wiki/${page.slug}.html`);
    writePage(`wiki/${page.slug}.html`, shell({ title: page.data.title, rel, active: 'wiki', body: renderWikiPage(page, pages, terms, rel) }));
  }
  // wiki 构建日志也出一页（便于回溯，不进索引）
  writePage('wiki/log.html', shell({ title: '构建日志', rel: '../', active: 'wiki', body: renderMd(read('wiki/log.md'), { pages, rel: '../' }) }));

  // 3. 生词
  writePage('vocab.html', shell({ title: '生词本', rel: '', active: 'vocab', body: renderVocab(terms, candidates, '') }));

  // 4. RFC 原文锁点页
  writePage('raw/rfc3261.html', shell({ title: 'RFC 3261 原文', rel: '../', active: 'raw', body: renderRawPage('../') }));

  // 5. 练习页
  for (const d of DRILLS.values()) {
    const rel = relFrom(`drills/${d.slug}.html`);
    writePage(`drills/${d.slug}.html`, shell({ title: `drill: ${d.slug}`, rel, active: '', body: renderDrillPage(d, pages, rel) }));
  }

  // 4. 搜索索引
  const index = [
    { path: 'index.html', title: '学习计划', text: plan.phases.map((p) => p.title + ' ' + (p.tasks || []).map((t) => t.title + ' ' + t.why + ' ' + t.done_when).join(' ')).join(' ') },
    ...[...pages.values()].map((p) => ({ path: `wiki/${p.slug}.html`, title: p.data.title, text: p.body.replace(/[#>*`\[\]]/g, ' ') })),
    { path: 'vocab.html', title: '生词本', text: terms.map((t) => `${t.term} ${t.domain_meaning} ${t.confusion}`).join(' ') },
    ...[...DRILLS.values()].map((d) => ({ path: `drills/${d.slug}.html`, title: `drill: ${d.slug}`, text: d.body.replace(/[#>*`\[\]]/g, ' ') })),
    { path: 'raw/rfc3261.html', title: 'RFC 3261 原文', text: 'RFC 3261 SIP Session Initiation Protocol 原文全文' },
  ];
  writeFileSync(join(DIST, 'search.json'), JSON.stringify(index));

  report();
  console.log(`→ site/dist/  (${index.length} 条索引)`);

  if (MODE === '--serve') serve();
}

/* ── 本地服务 ───────────────────────────────────────────── */

function serve() {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };
  createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = join(DIST, p);
    if (!file.startsWith(DIST) || !existsSync(file)) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('404');
    }
    res.writeHead(200, { 'content-type': types[file.slice(file.lastIndexOf('.'))] || 'application/octet-stream' });
    res.end(readFileSync(file));
  }).listen(PORT, () => console.log(`\n  http://localhost:${PORT}\n`));
}

main();
