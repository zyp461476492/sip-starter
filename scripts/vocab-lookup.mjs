/**
 * scripts/vocab-lookup.mjs —— 生词查询（零 AI，纯数据）
 *
 * 在线：api.dictionaryapi.dev（免 key，给 IPA + 真人 mp3）
 * 离线：CMUdict（ARPAbet → IPA 自动转换，首次使用会下载到 vocab/data/）
 *
 * 用法（CLI 调试）：
 *   node scripts/vocab-lookup.mjs glare
 *   node scripts/vocab-lookup.mjs glare --offline
 *
 * 作为模块：
 *   import { lookup } from './scripts/vocab-lookup.mjs';
 *   const r = await lookup('glare', { mode: 'online' });
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const DATA_DIR = join(ROOT, 'vocab', 'data');
const CMU_FILE = join(DATA_DIR, 'cmudict.dict');
const CMU_URL = 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict';
const API = (w) => `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`;

const today = () => new Date().toISOString().slice(0, 10);

/* ── 在线：dictionaryapi.dev ─────────────────────────────── */

async function lookupOnline(word) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  let res;
  try {
    res = await fetch(API(word), { signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`dictionaryapi ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || !data[0]) throw new Error('dictionaryapi 返回为空');

  const entry = data[0];
  const phonetics = [];
  for (const p of entry.phonetics || []) {
    const text = (p.text || '').trim();
    if (!text) continue;
    const audio = p.audio || '';
    const accent = /-uk\./i.test(audio) ? 'BrE' : /-us\./i.test(audio) ? 'AmE' : '';
    phonetics.push({ text, audio, accent });
  }
  // 把没标口音的补到缺的那一档（dictionaryapi 的第二条通常就是另一口音）
  const hasBrE = phonetics.some((p) => p.accent === 'BrE');
  const hasAmE = phonetics.some((p) => p.accent === 'AmE');
  for (const p of phonetics) {
    if (p.accent) continue;
    if (!hasBrE) { p.accent = 'BrE'; continue; }
    if (!hasAmE) { p.accent = 'AmE'; continue; }
  }

  const meaning = (entry.meanings || [])[0] || {};
  const def = ((meaning.definitions || [])[0] || {}).definition || '';

  const br = phonetics.find((p) => p.accent === 'BrE');
  const am = phonetics.find((p) => p.accent === 'AmE');
  const phonetic =
    br && am && br.text !== am.text
      ? `BrE ${br.text} · AmE ${am.text}`
      : (br || am || phonetics[0]).text;

  return {
    term: word,
    phonetic,
    pos: meaning.partOfSpeech || '',
    generalMeaning: def,
    audioUrl: (phonetics.find((p) => p.audio) || {}).audio || '',
    audioAccent: (phonetics.find((p) => p.audio) || {}).accent || '',
    lookup: { source: 'dictionaryapi', at: today() },
  };
}

/* ── 离线：CMUdict（ARPAbet → IPA） ──────────────────────── */

async function ensureCmudict() {
  if (existsSync(CMU_FILE)) return;
  mkdirSync(DATA_DIR, { recursive: true });
  process.stderr.write('下载 CMUdict（约 3.6MB，只需一次）…\n');
  const res = await fetch(CMU_URL);
  if (!res.ok) throw new Error(`CMUdict 下载失败 ${res.status}`);
  writeFileSync(CMU_FILE, Buffer.from(await res.arrayBuffer()));
}

let CMU = null;
function loadCmudict() {
  if (CMU) return CMU;
  CMU = new Map();
  for (const line of readFileSync(CMU_FILE, 'utf8').split('\n')) {
    if (!line || line.startsWith(';;;')) continue;
    const [w, ...phones] = line.trim().split(/\s+/);
    const key = w.replace(/\(\d+\)$/, '').toLowerCase();
    if (!CMU.has(key)) CMU.set(key, phones);
  }
  return CMU;
}

const VOWELS = {
  AA: 'ɑ', AE: 'æ', AH: 'ʌ', AO: 'ɔ', AW: 'aʊ', AY: 'aɪ',
  EH: 'ɛ', ER: 'ɜːr', EY: 'eɪ', IH: 'ɪ', IY: 'iː', OW: 'oʊ',
  OY: 'ɔɪ', UH: 'ʊ', UW: 'uː',
};
const CONS = {
  B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', F: 'f', G: 'ɡ', HH: 'h', JH: 'dʒ',
  K: 'k', L: 'l', M: 'm', N: 'n', NG: 'ŋ', P: 'p', R: 'r', S: 's',
  SH: 'ʃ', T: 't', TH: 'θ', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ',
};

/** ARPAbet（带重音数字）→ IPA 串。近似转换，标 source=cmudict */
function arpabetToIpa(phones) {
  let out = '';
  for (const ph of phones) {
    const m = ph.match(/^([A-Z]+)([0-2])?$/);
    if (!m) continue;
    const [, base, stress] = m;
    if (VOWELS[base]) {
      const sym = base === 'AH' && stress === '0' ? 'ə' : VOWELS[base];
      if (stress === '1') out += 'ˈ';
      else if (stress === '2') out += 'ˌ';
      out += sym;
    } else if (CONS[base]) {
      out += CONS[base];
    }
  }
  return `/${out}/`;
}

async function lookupOffline(word) {
  await ensureCmudict();
  const phones = loadCmudict().get(word.toLowerCase());
  if (!phones) throw new Error(`CMUdict 里没有 "${word}"（可能是缩写或专名）`);
  return {
    term: word,
    phonetic: arpabetToIpa(phones),
    pos: '',
    generalMeaning: '',
    audioUrl: '',
    audioAccent: '',
    lookup: { source: 'cmudict', at: today() },
    note: 'IPA 由 ARPAbet 自动转换，可能与词典标注有差异',
  };
}

/* ── 对外 ───────────────────────────────────────────────── */

export async function lookup(word, { mode = 'online' } = {}) {
  const term = String(word || '').trim();
  if (!term) throw new Error('单词为空');
  if (mode === 'offline') return lookupOffline(term);
  try {
    return await lookupOnline(term);
  } catch (e) {
    // 在线失败自动回退离线，并说明原因
    const r = await lookupOffline(term);
    r.note = `在线查询失败（${e.message}），已回退 CMUdict；${r.note || ''}`;
    return r;
  }
}

/** 是否机械信息（音标）已齐 */
export const hasPhonetic = (entry) => Boolean(entry && String(entry.phonetic || '').trim());

/** 重算 missing：语义三件套缺什么就列什么 */
export function computeMissing(entry) {
  const out = [];
  for (const f of ['domain_meaning', 'confusion', 'source']) {
    if (!entry || !String(entry[f] || '').trim()) out.push(f);
  }
  return out;
}

/* CLI */
if (process.argv[1] && process.argv[1].endsWith('vocab-lookup.mjs')) {
  const word = process.argv[2];
  const offline = process.argv.includes('--offline');
  if (!word) {
    console.error('用法: node scripts/vocab-lookup.mjs <word> [--offline]');
    process.exit(2);
  }
  lookup(word, { mode: offline ? 'offline' : 'online' })
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error('✗ ' + e.message);
      process.exit(1);
    });
}
