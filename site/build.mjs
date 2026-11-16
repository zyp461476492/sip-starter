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
import { lookup, computeMissing } from '../scripts/vocab-lookup.mjs';
import { readRfc3261, toBlocks } from '../scripts/rfc-sections.mjs';
import { loadZh, checkSection } from '../scripts/zh.mjs';

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
const SPECIAL = new Set(['index.md', 'log.md']);

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
    if (SPECIAL.has(rel) || rel.split('/').pop() === 'README.md') continue;
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

/* 标题锚点：marked 不再生成 id，自己补，供右侧大纲与深链使用 */
function slugifyHeading(html) {
  return String(html)
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function addHeadingIds(html) {
  const used = new Map();
  return html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, lvl, inner) => {
    const base = slugifyHeading(inner) || `h${lvl}`;
    const n = (used.get(base) || 0) + 1;
    used.set(base, n);
    const id = n === 1 ? base : `${base}-${n}`;
    return `<h${lvl} id="${id}">${inner}<a class="hanchor" href="#${id}" aria-hidden="true">#</a></h${lvl}>`;
  });
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
  return addHeadingIds(html);
}

/* ── 页面骨架 ───────────────────────────────────────────── */

/* 全局导航上下文：在 buildSite() 里注入，供 shell() 取侧栏/上下页 */
let CTX = { pages: new Map(), nav: [], drills: [], cur: null };

const NAVBAR = (rel, active) => `
<header class="topbar">
  <button class="burger" id="burger" aria-label="目录"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg></button>
  <a class="brand" href="${rel}index.html">sip<span>-starter</span></a>
  <nav class="topnav">
    <a href="${rel}index.html" class="${active === 'plan' ? 'on' : ''}">学习计划</a>
    <a href="${rel}wiki/index.html" class="${active === 'wiki' ? 'on' : ''}">知识库</a>
    <a href="${rel}raw/rfc3261.html" class="${active === 'raw' ? 'on' : ''}">RFC 原文</a>
    <a href="${rel}vocab.html" class="${active === 'vocab' ? 'on' : ''}">生词本</a>
  </nav>
  <div class="search">
    <input id="q" type="search" placeholder="搜索…" autocomplete="off" aria-label="搜索">
    <div id="hits" class="hits"></div>
  </div>
  <div class="prefs">
    <button id="prefbtn" class="prefbtn" title="阅读偏好（s 字号 / l 行宽）">Aa</button>
    <div id="prefmenu" class="prefmenu" hidden>
      <div class="pr-row"><span>字号</span>
        <button data-size="sm">小</button><button data-size="md">中</button><button data-size="lg">大</button><button data-size="xl">特大</button></div>
      <div class="pr-row"><span>行宽</span>
        <button data-width="narrow">窄</button><button data-width="mid">中</button><button data-width="wide">宽</button></div>
      <p class="pr-hint">快捷键：<kbd>s</kbd> 字号 · <kbd>l</kbd> 行宽</p>
    </div>
  </div>
</header>`;

const WIKI_GROUPS = [
  ['concepts', '概念'],
  ['messages', '消息与头域'],
  ['flows', '流程'],
  ['specs', '规格'],
  ['questions', '待查'],
];

function renderSidebar(rel, active) {
  const { pages, nav, drills } = CTX;
  const cur = CTX.cur;
  const on = (key) => (cur === key ? ' on' : '');
  const groups = new Map();
  for (const slug of nav) {
    const g = slug.includes('/') ? slug.split('/')[0] : '';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(pages.get(slug));
  }
  const groupHtml = WIKI_GROUPS.filter(([g]) => groups.has(g))
    .map(([g, label]) => {
      const items = groups
        .get(g)
        .map((p) => `<a class="sb-i${on(`wiki:${p.slug}`)}" href="${rel}wiki/${p.slug}.html">${esc(p.data.title)}</a>`)
        .join('');
      return `<div class="sb-sub">${esc(label)}</div>${items}`;
    })
    .join('');
  const other = groups.get('');
  const otherHtml = other
    ? other.map((p) => `<a class="sb-i${on(`wiki:${p.slug}`)}" href="${rel}wiki/${p.slug}.html">${esc(p.data.title)}</a>`).join('')
    : '';
  const drillHtml = drills
    .map((d) => `<a class="sb-i${on(`drill:${d.slug}`)}" href="${rel}drills/${d.slug}.html">${esc(d.slug)}</a>`)
    .join('');

  return `<a class="sb-t${on('plan')}" href="${rel}index.html">学习计划</a>
<div class="sb-grp">
  <a class="sb-t${on('wiki')}" href="${rel}wiki/index.html">知识库</a>
  ${groupHtml}${otherHtml}
</div>
<div class="sb-grp">
  <a class="sb-t${on('raw')}" href="${rel}raw/rfc3261.html">RFC 3261 原文</a>
</div>
${drillHtml ? `<div class="sb-grp"><div class="sb-t plain">练习</div>${drillHtml}</div>` : ''}
<div class="sb-grp">
  <a class="sb-t${on('vocab')}" href="${rel}vocab.html">生词本</a>
</div>`;
}

function renderOutline(html) {
  const items = [...String(html).matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)].map(([, lvl, id, inner]) => ({
    lvl: Number(lvl),
    id,
    text: inner.replace(/<a class="hanchor"[\s\S]*?<\/a>/g, '').replace(/<[^>]+>/g, '').trim(),
  }));
  if (items.length < 2) return '';
  return `<div class="ot-title">本页内容</div>
<ul class="ot-list">${items
    .map((i) => `<li class="ot-l${i.lvl}"><a href="#${encodeURIComponent(i.id)}">${i.text}</a></li>`)
    .join('')}</ul>`;
}

function renderPager(rel) {
  const { cur, pages, nav, drills } = CTX;
  let list = [];
  if (cur && cur.startsWith('wiki:') && cur !== 'wiki') {
    list = nav.map((s) => ({ href: `wiki/${s}.html`, title: pages.get(s).data.title }));
  } else if (cur && cur.startsWith('drill:')) {
    list = drills.map((d) => ({ href: `drills/${d.slug}.html`, title: `drill: ${d.slug}` }));
  } else return '';
  const i = list.findIndex((x) => (cur.startsWith('wiki:') ? `wiki/${cur.slice(5)}.html` : `drills/${cur.slice(6)}.html`) === x.href);
  if (i < 0) return '';
  const prev = list[i - 1];
  const next = list[i + 1];
  return `<nav class="pager">
  ${prev ? `<a class="pg prev" href="${rel}${prev.href}"><span>上一页</span><b>${esc(prev.title)}</b></a>` : '<span></span>'}
  ${next ? `<a class="pg next" href="${rel}${next.href}"><span>下一页</span><b>${esc(next.title)}</b></a>` : '<span></span>'}
</nav>`;
}

function shell({ title, rel, active, body, bare = false }) {
  const outline = bare ? '' : renderOutline(body);
  return `<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · sip-starter</title>
<script>try{var h=document.documentElement,d=localStorage;h.dataset.size=d.getItem('sip.size')||'md';h.dataset.width=d.getItem('sip.width')||'mid';h.dataset.rmode=d.getItem('sip.rmode')||'zh';h.dataset.toc=d.getItem('sip.toc')||'on';var tw=Number(d.getItem('sip.tocw'))||250;h.style.setProperty('--toc-w',Math.max(150,Math.min(480,tw))+'px');if(d.getItem('sip.theme')==='dark')h.classList.add('dark')}catch(e){}</script>
<link rel="stylesheet" href="${rel}assets/style.css">
</head><body>
<div class="scrim" id="scrim"></div>
${NAVBAR(rel, active)}
<div class="layout${bare ? ' bare' : ''}">
  ${bare ? '' : `<aside class="sidebar" id="sidebar">${renderSidebar(rel, active)}</aside>`}
  <div class="doc">
    <main class="docmain">${body}${bare ? '' : renderPager(rel)}</main>
    ${outline ? `<aside class="outline" id="outline">${outline}</aside>` : ''}
  </div>
</div>
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
    .map((phase, pi) => {
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
  <h3 id="phase-${pi + 1}">${esc(phase.title)} <small>${pd}/${pt.length}</small></h3>
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

  const candCard = (c) => {
    const miss = Array.isArray(c.missing) ? c.missing : computeMissing(c);
    return `<article class="card cand-card" data-status="${esc(c.status || 'candidate')}" data-term="${esc(c.term)}">
  <div class="cardhead"><h3>${esc(c.term)}</h3><span class="badge ${esc(c.status || 'candidate')}">${esc(c.status || 'candidate')}</span></div>
  ${c.phonetic ? `<p class="phon">${esc(c.phonetic)}</p>` : ''}
  ${c.general_meaning ? `<p class="dom muted">${esc(c.general_meaning)}</p>` : ''}
  ${c.domain_meaning ? `<p class="dom">${esc(c.domain_meaning)}</p>` : ''}
  ${c.confusion ? `<p class="dom muted">易错：${esc(c.confusion)}</p>` : ''}
  ${c.source ? `<p class="muted"><code>${esc(c.source)}</code></p>` : ''}
  <div class="chips">${miss.length ? miss.map((m) => `<span class="chip gap">缺 ${esc(m)}</span>`).join('') : '<span class="chip ok">语义齐全，可晋升</span>'}${c.drafted_by ? `<span class="chip">drafted_by: ${esc(c.drafted_by)}</span>` : ''}</div>
</article>`;
  };
  const pendingFix = candidates.filter((c) => (Array.isArray(c.missing) ? c.missing.length : computeMissing(c).length) > 0).length;
  const draftedN = candidates.filter((c) => c.status === 'drafted').length;
  const candSection = candidates.length
    ? `<h2>候选池 <small>${candidates.length} 条 · 待补全 ${pendingFix} · 待复核 ${draftedN}</small></h2>` +
      [['drafted', '待复核（AI 已起草，需人确认）'], ['candidate', '待补全 / 待晋升']]
        .map(([st, label]) => {
          const list = candidates.filter((c) => (c.status || 'candidate') === st);
          if (!list.length) return '';
          return `<h3 class="cand-h">${label} · ${list.length}</h3><section class="cards">${list.map(candCard).join('')}</section>`;
        })
        .join('')
    : '';

  const addPanel = `<section class="addpanel" id="addpanel">
  <div class="aphead"><b>录词</b> <span class="muted" id="apmode">检查本地接口…</span></div>
  <div class="aprow">
    <input id="apword" placeholder="输入英文单词，回车查询" autocomplete="off">
    <button id="aplookup">查询</button>
    <label class="apl"><input type="checkbox" id="apoffline"> 离线 CMUdict</label>
    <label class="apl"><input type="checkbox" id="apaudio" checked> 下载真人发音</label>
  </div>
  <div id="apresult" class="apresult" hidden>
    <div class="apmech">
      <div><span class="apk">音标</span> <code id="apphon"></code> <button id="apspeak" class="speak">${SPK}<span>读</span></button></div>
      <div><span class="apk">通用义</span> <span id="apgen"></span></div>
      <div><span class="apk">来源</span> <span id="apsrc"></span></div>
    </div>
    <div class="apsem">
      <label>领域义（SIP 语境）<input id="apdom" placeholder="词典给不了，可留空"></label>
      <label>易错点<input id="apconf" placeholder="你当初的误解，可留空"></label>
      <label>出处<input id="apspec" placeholder="如 RFC3261 §21.4.27，可留空"></label>
    </div>
    <div class="apfoot">
      <button id="apsave">存为候选</button>
      <span class="muted" id="aphint">留空的语义项会被记入 <code>missing</code>，之后可批量交给 AI 补全</span>
    </div>
  </div>
  <div id="apnote" class="apnote"></div>
</section>
`;

  return `<h1>生词本 <small>熟词僻义才是坑</small></h1>
${addPanel}
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
${candSection}
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

/* ── RFC 原文页（按节加锁点 + 中文对照） ───────────────── */

let RFC_CACHE = null;
function getRfc() {
  if (!RFC_CACHE) RFC_CACHE = readRfc3261(ROOT);
  return RFC_CACHE;
}

let ZH = new Map(); // 节号 → { sec, file, data, body }

/** 单节渲染：有译文就出「中文 + 折叠原文」，没有就退化显示英文并标「未译」 */
/** 原文渲染：散文按段落折行，表/ABNF/报文样例保留原样（见 rfc-sections.mjs 的 toBlocks） */
function renderEn(text) {
  const blocks = toBlocks(text);
  return `<div class="en">${blocks
    .map((b) => {
      if (b.type === 'pre') return `<pre>${esc(b.text)}</pre>`;
      if (b.type === 'h') return `<p class="enh">${esc(b.text)}</p>`;
      return `<p>${esc(b.text)}</p>`;
    })
    .join('')}</div>`;
}

function renderBiSection(s, pages, rel) {
  const anchor = `<a class="anchor" href="#sec-${s.num}">#</a>`;
  const en = renderEn(s.text);
  const zh = ZH.get(s.num);
  if (!s.text.trim()) {
    // 容器节（如 §17.1.1 本身没有正文，只有子节）：只出标题，避免空壳
    return `<section id="sec-${s.num}" class="secbi empty" data-sec="${s.num}">
  <h3>${esc(s.num)} &nbsp;${esc(s.title)} ${anchor}</h3>
</section>`;
  }
  if (!zh) {
    return `<section id="sec-${s.num}" class="secbi untranslated" data-sec="${s.num}">
  <h3>${esc(s.num)} &nbsp;${esc(s.title)} <span class="zbadge untr">未译</span> ${anchor}</h3>
  ${en}
</section>`;
  }
  const stale = zh.data.en_sha && zh.data.en_sha !== s.sha;
  const zhHtml = renderMd(zh.body, { pages, rel });
  return `<section id="sec-${s.num}" class="secbi" data-sec="${s.num}">
  <h3>${esc(s.num)} &nbsp;${esc(s.title)} <span class="zbadge ${esc(zh.data.status)}">译·${esc(zh.data.status)}</span>${
    stale ? '<span class="zbadge stale" title="英文原文已变更，需复核译文">原文已变</span>' : ''
  } ${anchor}</h3>
  <div class="pair">
    <div class="zh">${zhHtml}</div>
    <details class="endet"><summary>英文原文</summary>${en}</details>
  </div>
</section>`;
}

function renderRawPage({ pages, rel }) {
  const { pre, secs } = getRfc();
  const translated = secs.filter((s) => ZH.has(s.num)).length;
  const toc = secs
    .map((s) => {
      const lvl = s.num === 'A' ? 1 : s.num.split('.').length;
      const mark = ZH.has(s.num) ? '<i class="toc-zh" title="有中文译文">中</i>' : '';
      return `<a class="toc-l${Math.min(lvl, 3)}" href="#sec-${s.num}"><b>${esc(s.num)}</b> ${esc(s.title)}${mark}</a>`;
    })
    .join('');
  const body = secs.map((s) => renderBiSection(s, pages, rel)).join('\n');
  return `<div class="crumb"><a href="${rel}index.html">学习计划</a> / RFC 3261 原文</div>
<h1>RFC 3261 原文 <small>SIP: Session Initiation Protocol · 269 页</small></h1>
<p class="muted">由 <code>sip/raw/rfc/rfc3261.txt</code> 生成，已剔除页眉页脚。每节一个锁点：计划页与 wiki 页的 <code>§x.y</code> 直接跳到这里。
中文译文是非官方机译（<code>sip/zh/</code>），<b>规范性以英文原文为准</b>；含 MUST / SHOULD 的句子一律保留英文原词。</p>
<div class="rawlayout">
  <nav class="rawtoc" id="rawtoc">${toc}</nav>
  <div class="tocres" id="tocres" title="拖动调整目录宽度，双击复位"></div>
  <div class="rawbody">
    <div class="modebar">
      <span class="mb-label">显示</span>
      <span class="mb-seg">
        <button data-rmode="zh" class="on">中文</button>
        <button data-rmode="en">原文</button>
        <button data-rmode="dual">对照</button>
      </span>
      <span class="mb-stat">已译 <b>${translated}</b>/${secs.length} 节</span>
      <button id="toctoggle" class="mb-btn" title="显示/隐藏左侧节目录（快捷键 [）">隐藏目录</button>
      <span class="mb-tip"><kbd>t</kbd> 切换语言 · <kbd>[</kbd> 目录 · 拖动目录右缘调宽</span>
    </div>
    ${pre.filter((l) => l.trim()).length ? `<section id="sec-pre">${renderEn(pre.join('\n').replace(/^\n+|\n+$/g, ''))}</section>` : ''}
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

function wikiNavOrder(pages) {
  const order = [];
  const idxFile = join(WIKI, 'index.md');
  if (existsSync(idxFile)) {
    for (const t of wikilinks(readFileSync(idxFile, 'utf8'))) if (pages.has(t) && !order.includes(t)) order.push(t);
  }
  for (const slug of [...pages.keys()].sort()) if (!order.includes(slug)) order.push(slug);
  return order;
}

function buildSite({ plan, terms, candidates, pages }) {
  /* 构建 */
  if (existsSync(DIST)) rmSync(DIST, { recursive: true });
  mkdirSync(join(DIST, 'assets'), { recursive: true });
  writeFileSync(join(DIST, 'assets/style.css'), read('site/assets/style.css'));
  writeFileSync(join(DIST, 'assets/app.js'), read('site/assets/app.js'));
  CTX = { pages, nav: wikiNavOrder(pages), drills: [...DRILLS.values()], cur: null };
  // 本地发音文件（可选）：vocab/audio/* → dist/audio/*
  const audioDir = join(ROOT, 'vocab/audio');
  if (existsSync(audioDir)) {
    mkdirSync(join(DIST, 'audio'), { recursive: true });
    for (const f of readdirSync(audioDir)) {
      writeFileSync(join(DIST, 'audio', f), readFileSync(join(audioDir, f)));
    }
  }

  // 1. 计划
  CTX.cur = 'plan';
  writePage('index.html', shell({ title: '学习计划', rel: '', active: 'plan', body: renderPlan(plan, pages, '') }));

  // 2. wiki
  CTX.cur = 'wiki';
  writePage(
    'wiki/index.html',
    shell({ title: '知识库', rel: '../', active: 'wiki', body: renderMd(read('wiki/index.md'), { pages, rel: '../' }) })
  );
  for (const page of pages.values()) {
    const rel = relFrom(`wiki/${page.slug}.html`);
    CTX.cur = `wiki:${page.slug}`;
    writePage(`wiki/${page.slug}.html`, shell({ title: page.data.title, rel, active: 'wiki', body: renderWikiPage(page, pages, terms, rel) }));
  }
  // wiki 构建日志也出一页（便于回溯，不进索引）
  CTX.cur = 'wiki';
  writePage('wiki/log.html', shell({ title: '构建日志', rel: '../', active: 'wiki', body: renderMd(read('wiki/log.md'), { pages, rel: '../' }) }));

  // 3. 生词
  CTX.cur = 'vocab';
  writePage('vocab.html', shell({ title: '生词本', rel: '', active: 'vocab', body: renderVocab(terms, candidates, '') }));

  // 4. RFC 原文锁点页（full-bleed：自带节导航，不要侧栏）
  CTX.cur = 'raw';
  writePage(
    'raw/rfc3261.html',
    shell({ title: 'RFC 3261 原文', rel: '../', active: 'raw', body: renderRawPage({ pages, rel: '../' }), bare: true })
  );

  // 5. 练习页
  for (const d of DRILLS.values()) {
    const rel = relFrom(`drills/${d.slug}.html`);
    CTX.cur = `drill:${d.slug}`;
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

  return index.length;
}

/* ── 主流程 ─────────────────────────────────────────────── */

function main() {
  const plan = yaml.load(read('plan/plan.yaml'));
  const terms = yaml.load(read('vocab/terms.yaml')) || [];
  const candidates = existsSync(join(ROOT, 'vocab/candidates.yaml')) ? yaml.load(read('vocab/candidates.yaml')) || [] : [];
  const pages = collectWiki();
  H = new Set(getRfc().secs.map((s) => s.num));
  for (const [k, v] of collectDrills()) DRILLS.set(k, v);

  /* 中文译文层 */
  const zhLoaded = loadZh(ROOT);
  ZH = zhLoaded.bySec;
  errors.push(...zhLoaded.errors);
  warn.push(...zhLoaded.warn);
  for (const [sec, z] of ZH) {
    const r = checkSection(z, getRfc().byNum.get(sec));
    errors.push(...r.errors);
    warn.push(...r.warn);
  }

  /* 校验 */
  const VALID_VOCAB = new Set(['candidate', 'learning', 'known']);
  const VALID_TASK = new Set(['todo', 'doing', 'done']);
  // 候选池：机械信息（音标）必须有；missing 必须与实际一致；drafted 必须带 drafted_by
  const VALID_CAND = new Set(['candidate', 'drafted']);
  candidates.forEach((c, i) => {
    if (!c.term) return errors.push(`vocab/candidates.yaml[${i}] 缺 term`);
    if (!String(c.phonetic || '').trim()) errors.push(`candidates(${c.term}) 缺 phonetic —— 机械信息拿不到就别入池`);
    if (c.status && !VALID_CAND.has(c.status)) errors.push(`candidates(${c.term}) status 非法：${c.status}（只允许 candidate/drafted）`);
    const miss = computeMissing(c);
    const declared = Array.isArray(c.missing) ? c.missing : null;
    if (!declared || declared.join(',') !== miss.join(',')) {
      errors.push(`candidates(${c.term}) 的 missing 与实际不一致，应为 [${miss.join(', ')}]`);
    }
    if (c.status === 'drafted' && !c.drafted_by) errors.push(`candidates(${c.term}) status=drafted 但缺 drafted_by`);
  });

  terms.forEach((t, i) => {
    for (const f of ['term', 'phonetic', 'domain_meaning', 'confusion', 'source', 'status', 'topics']) {
      if (!t[f]) errors.push(`vocab/terms.yaml[${i}] 缺字段 ${f}`);
    }
    if (t.audio && !existsSync(join(ROOT, 'vocab', t.audio))) warn.push(`vocab(${t.term}) 的 audio 文件不存在：${t.audio}，将回退浏览器 TTS`);
    if (t.status && !VALID_VOCAB.has(t.status)) errors.push(`vocab 状态非法: ${t.status} (${t.term})`);
    if (t.status && !['learning', 'known'].includes(t.status)) errors.push(`terms(${t.term}) 只允许 learning/known —— candidate/drafted 应留在候选池`);
    if (t.drafted_by) errors.push(`terms(${t.term}) 不允许 drafted_by —— 正式本必须由人确认`);
    if (Array.isArray(t.missing) && t.missing.length) errors.push(`terms(${t.term}) 有未补全项 missing=[${t.missing.join(', ')}]`);
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

  const indexCount = buildSite({ plan, terms, candidates, pages });

  report();
  console.log(`→ site/dist/  (${indexCount} 条索引)`);

  if (MODE === '--serve') serve();
}

/* ── 本地服务 ───────────────────────────────────────────── */

/* ── 本地写接口（仅 dev 模式） ───────────────────────────────
   只做两件事：代查生词、把候选写进 vocab/candidates.yaml。
   安全边界：只写 vocab/ 下两个 yaml；请求体 ≤64KB；来源限本机/私有网段。 */

const YAML_HEADER =
  '# LLM 抽取与「录词」表单写入的候选生词（待人工/agent 补全与复核）。\n# 字段与状态机见 schema.md；missing 由脚本重算，勿手改。\n\n';

const isLocalAddr = (ip = '') => {
  const a = ip.replace(/^::ffff:/, '');
  return a === '127.0.0.1' || a === '::1' || /^10\./.test(a) || /^192\.168\./.test(a) || /^172\.(1[6-9]|2\d|3[01])\./.test(a);
};

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('请求体过大'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function downloadAudio(term, url, accent) {
  if (!url) return null;
  const safe = term.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const ext = (url.match(/\.(mp3|ogg|wav)$/i) || [, 'mp3'])[1].toLowerCase();
  const file = `${safe}${accent ? '-' + accent.toLowerCase() : ''}.${ext}`;
  const dir = join(ROOT, 'vocab', 'audio');
  mkdirSync(dir, { recursive: true });
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    writeFileSync(join(dir, file), Buffer.from(await res.arrayBuffer()));
    return file;
  } catch {
    return null;
  }
}

async function saveCandidate(d) {
  const term = String(d.term || '').trim();
  if (!term) throw new Error('缺少 term');
  const candPath = join(ROOT, 'vocab', 'candidates.yaml');
  const termsPath = join(ROOT, 'vocab', 'terms.yaml');
  const existing = existsSync(candPath) ? yaml.load(readFileSync(candPath, 'utf8')) || [] : [];
  const official = yaml.load(readFileSync(termsPath, 'utf8')) || [];
  const dup = [...existing, ...official].find((x) => String(x.term || '').toLowerCase() === term.toLowerCase());
  if (dup) throw new Error(`"${term}" 已存在（候选池或正式本），未重复写入`);

  if (!String(d.phonetic || '').trim()) {
    throw new Error('查不到音标：先点「查询」确认拼写（或用离线 CMUdict）；缩写/专名可手工填音标后再存');
  }
  const entry = { term, pos: d.pos || '', phonetic: d.phonetic };
  if (d.downloadAudio && d.audioUrl) {
    let file = await downloadAudio(term, d.audioUrl, d.audioAccent);
    if (!file && /-uk\./i.test(d.audioUrl)) file = await downloadAudio(term, d.audioUrl.replace('-uk.', '-us.'), 'AmE');
    if (!file && /-us\./i.test(d.audioUrl)) file = await downloadAudio(term, d.audioUrl.replace('-us.', '-uk.'), 'BrE');
    if (file) {
      entry.audio = `audio/${file}`;
      entry.audio_source = 'dictionaryapi.dev / Wikimedia Commons (BY-SA 4.0)';
    }
  }
  Object.assign(entry, {
    general_meaning: d.general_meaning || '',
    domain_meaning: d.domain_meaning || '',
    confusion: d.confusion || '',
    source: d.source || '',
    topics: ['sip'],
    status: 'candidate',
    added: new Date().toISOString().slice(0, 10),
  });
  if (d.lookup) entry.lookup = d.lookup;
  entry.missing = computeMissing(entry);

  existing.push(entry);
  writeFileSync(candPath, YAML_HEADER + yaml.dump(existing, { lineWidth: 200 }));
  return { ok: true, entry };
}

function rebuild() {
  const plan = yaml.load(read('plan/plan.yaml'));
  const terms = yaml.load(read('vocab/terms.yaml')) || [];
  const candidates = yaml.load(read('vocab/candidates.yaml')) || [];
  const pages = collectWiki();
  H = new Set(getRfc().secs.map((x) => x.num));
  for (const [k, v] of collectDrills()) DRILLS.set(k, v);
  ZH = loadZh(ROOT).bySec;
  buildSite({ plan, terms, candidates, pages });
  console.log(`  ↻ 已重建 dist（${terms.length} 正式词 / ${candidates.length} 候选）`);
}

function serve() {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg' };
  const json = (res, obj, code = 200) => {
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj));
  };

  createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    try {
      if (url.pathname === '/api/ping') return json(res, { ok: true, write: isLocalAddr(req.socket.remoteAddress) });
      if (url.pathname === '/api/vocab/lookup') {
        const word = (url.searchParams.get('word') || '').trim();
        const mode = url.searchParams.get('mode') === 'offline' ? 'offline' : 'online';
        if (!word) return json(res, { ok: false, error: '缺少 word' }, 400);
        return json(res, { ok: true, result: await lookup(word, { mode }) });
      }
      if (url.pathname === '/api/vocab/candidate') {
        if (req.method !== 'POST') return json(res, { ok: false, error: '只接受 POST' }, 405);
        if (!isLocalAddr(req.socket.remoteAddress)) return json(res, { ok: false, error: '只允许本机/私有网段写入' }, 403);
        const body = await readBody(req, 64 * 1024);
        const r = await saveCandidate(JSON.parse(body || '{}'));
        rebuild(); // 关键：dist 是生成物，写完必须重建，否则页面看到的是旧的
        return json(res, r);
      }

      let p = decodeURIComponent(url.pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = join(DIST, p);
      if (!file.startsWith(DIST) || !existsSync(file)) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        return res.end('404');
      }
      res.writeHead(200, { 'content-type': types[file.slice(file.lastIndexOf('.'))] || 'application/octet-stream' });
      res.end(readFileSync(file));
    } catch (e) {
      return json(res, { ok: false, error: e.message }, 500);
    }
  }).listen(PORT, () => console.log(`\n  http://localhost:${PORT}\n  （dev 模式：可写入 vocab/candidates.yaml）\n`));
}

main();
