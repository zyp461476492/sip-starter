// site/assets/app.js —— 全站搜索 + 生词发音/筛选/抽卡
(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* ── 轻提示 ─────────────────────────────────────────── */
  let toastTimer;
  function toast(msg, ms = 4200) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), ms);
  }

  /* ── 发音：三层回退 ───────────────────────────────────
     1. 词条的 audio 本地文件
     2. 在线词典音频（有道 dictvoice，可开关）
     3. 浏览器 speechSynthesis（需要系统语音包）
     优先级可用 localStorage 覆盖：sip.online = 'on' | 'off' | 空(=自动)   */
  const speechOK = 'speechSynthesis' in window;
  const ONLINE_KEY = 'sip.online';
  const ONLINE_URL = (w) => `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(w)}&type=2`;
  let accent = localStorage.getItem('sip.acc') || 'en-US';
  let rate = Number(localStorage.getItem('sip.rate') || 1);
  let onlinePref = localStorage.getItem(ONLINE_KEY); // null = 自动
  let online = false;
  let voices = [];

  const norm = (l) => String(l).replace('_', '-');
  const refreshVoices = () => {
    if (speechOK) voices = window.speechSynthesis.getVoices() || [];
    return voices;
  };

  /** voices 是异步加载的：首次可能为空，最多等 1.5s */
  async function ensureVoices() {
    if (!speechOK) return [];
    if (refreshVoices().length) return voices;
    return await new Promise((res) => {
      const t0 = Date.now();
      const tick = () => {
        if (refreshVoices().length || Date.now() - t0 > 1500) return res(voices);
        setTimeout(tick, 120);
      };
      tick();
    });
  }

  const pickVoice = () => {
    if (!voices.length) refreshVoices();
    return (
      voices.find((v) => norm(v.lang) === accent && /natural|google|samantha|daniel|zira/i.test(v.name)) ||
      voices.find((v) => norm(v.lang) === accent) ||
      voices.find((v) => norm(v.lang).startsWith(accent.slice(0, 2))) ||
      null
    );
  };

  /** 播一个音频 URL，成功返回 true */
  function playAudio(url) {
    return new Promise((res) => {
      if (!url) return res(false);
      const a = new Audio(url);
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        res(ok);
      };
      a.addEventListener('playing', () => done(true), { once: true });
      a.addEventListener('error', () => done(false), { once: true });
      setTimeout(() => done(false), 2500);
      a.play().catch(() => done(false));
    });
  }

  async function speak(text, audioUrl) {
    // 1) 本地音频
    if (audioUrl && (await playAudio(audioUrl))) return;
    // 2) 在线音频
    if (online && (await playAudio(ONLINE_URL(text)))) return;
    // 3) 本地 TTS
    const vs = await ensureVoices();
    if (!speechOK || !vs.length) {
      toast(
        online
          ? `「${text}」发音失败：在线音频不可达，且本机没有 TTS 语音。详见 docs/02-site.md`
          : `本机没有可用 TTS 语音（voices=0），已可在工具栏打开「在线发音」`
      );
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = accent;
    u.rate = rate;
    const v = pickVoice();
    if (v) u.voice = v;
    try {
      window.speechSynthesis.cancel();
      setTimeout(() => window.speechSynthesis.speak(u), 60); // cancel 后立刻 speak 在 Chrome 上会被吞
    } catch {
      toast('语音合成调用失败');
    }
  }

  /* 初始化：决定是否启用在线发音 */
  (async () => {
    const vs = await ensureVoices();
    const noTTS = !speechOK || !vs.length;
    online = onlinePref === 'on' ? true : onlinePref === 'off' ? false : noTTS;
    syncOnlineBtn();
    if (online && noTTS) {
      const warn = document.getElementById('voicewarn');
      if (warn) {
        warn.hidden = false;
        warn.innerHTML =
          '本机浏览器没有可用语音（<code>voices=0</code>），已自动切到<b>在线发音</b>（有道词典音频，只发送单词本身）。' +
          '想在本地合成：Debian/Ubuntu 装 <code>speech-dispatcher</code> + <code>espeak-ng</code> 后重启浏览器。';
      }
    }
  })();

  function syncOnlineBtn() {
    const b = document.querySelector('.toolbar button[data-online]');
    if (!b) return;
    b.classList.toggle('on', online);
    b.textContent = online ? '在线发音 · 开' : '在线发音 · 关';
  }

  // 卡片上的朗读按钮
  document.querySelectorAll('.speak').forEach((btn) =>
    btn.addEventListener('click', () => speak(btn.dataset.say, btn.dataset.audio))
  );

  /* ── 搜索 ───────────────────────────────────────────── */
  const q = document.getElementById('q');
  const hits = document.getElementById('hits');
  if (q && hits) {
    let data = null;
    const load = async () => {
      if (!data) data = await (await fetch(new URL('search.json', document.baseURI))).json();
      return data;
    };
    q.addEventListener('input', async () => {
      const kw = q.value.trim().toLowerCase();
      if (kw.length < 2) return hits.classList.remove('open');
      const all = await load();
      const found = [];
      for (const item of all) {
        const src = item.title + ' ' + item.text;
        const pos = src.toLowerCase().indexOf(kw);
        if (pos < 0) continue;
        found.push({ ...item, snip: src.slice(Math.max(0, pos - 30), pos + 60).replace(/\s+/g, ' ') });
        if (found.length >= 12) break;
      }
      hits.innerHTML = found.length
        ? found.map((f) => `<a href="${new URL(f.path, document.baseURI)}">${esc(f.title)}<div class="snip">…${esc(f.snip)}…</div></a>`).join('')
        : '<a>无匹配</a>';
      hits.classList.add('open');
    });
    document.addEventListener('click', (e) => {
      if (!hits.contains(e.target) && e.target !== q) hits.classList.remove('open');
    });
  }

  /* ── 生词筛选 ───────────────────────────────────────── */
  const cards = [...document.querySelectorAll('.card')];
  const filters = [...document.querySelectorAll('.toolbar button[data-filter]')];
  filters.forEach((b) =>
    b.addEventListener('click', () => {
      filters.forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      const f = b.dataset.filter;
      cards.forEach((c) => (c.hidden = f !== 'all' && c.dataset.status !== f));
    })
  );

  /* ── 口音 / 语速 / 在线发音 ─────────────────────────── */
  const accents = [...document.querySelectorAll('.toolbar button[data-accent]')];
  accents.forEach((b) => {
    b.classList.toggle('on', b.dataset.accent === accent);
    b.addEventListener('click', () => {
      accent = b.dataset.accent;
      localStorage.setItem('sip.acc', accent);
      accents.forEach((x) => x.classList.toggle('on', x === b));
      speak('session initiation protocol');
    });
  });

  const rateBtn = document.querySelector('.toolbar button[data-rate]');
  if (rateBtn) {
    const slow = Number(rateBtn.dataset.rate);
    const sync = () => {
      const isSlow = rate === slow;
      rateBtn.classList.toggle('on', isSlow);
      rateBtn.textContent = isSlow ? '慢速' : '正常速';
    };
    sync();
    rateBtn.addEventListener('click', () => {
      rate = rate === slow ? 1 : slow;
      localStorage.setItem('sip.rate', String(rate));
      sync();
      speak('provisional');
    });
  }

  const onlineBtn = document.querySelector('.toolbar button[data-online]');
  if (onlineBtn) {
    onlineBtn.addEventListener('click', () => {
      online = !online;
      localStorage.setItem(ONLINE_KEY, online ? 'on' : 'off');
      syncOnlineBtn();
      toast(online ? '已启用在线发音（有道）' : '已关闭在线发音，只用本地 TTS');
      if (online) speak('fork');
    });
  }

  /* ── 抽卡 ───────────────────────────────────────────── */
  const box = document.getElementById('quizbox');
  const btnQuiz = document.getElementById('quiz');
  if (box && btnQuiz && window.__VOCAB__) {
    const pool = window.__VOCAB__.slice();
    const qterm = box.querySelector('.qterm');
    const qphon = box.querySelector('.qphon');
    const qans = box.querySelector('.qans');
    const qleft = document.getElementById('qleft');
    let cur = null;
    const say = (t) => speak(t.say || t.term, t.audio);

    const pick = () => {
      if (!pool.length) {
        qterm.textContent = '一轮结束';
        qphon.textContent = '';
        qans.hidden = true;
        qleft.textContent = '';
        cur = null;
        return;
      }
      cur = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      qterm.textContent = cur.term;
      qphon.textContent = cur.phonetic || '';
      qans.innerHTML =
        `<b>${esc(cur.domain_meaning)}</b><br>` +
        (cur.general_meaning ? `<span class="muted">通用义：${esc(cur.general_meaning)}</span><br>` : '') +
        `易错点：${esc(cur.confusion)}<br><span class="muted">${esc(cur.source)}</span>`;
      qans.hidden = true;
      qleft.textContent = `剩余 ${pool.length + 1}`;
      say(cur); // 抽到先念一遍：先听音再想义
    };

    btnQuiz.addEventListener('click', () => {
      box.hidden = !box.hidden;
      if (!box.hidden) {
        pool.length = 0;
        pool.push(...window.__VOCAB__);
        pick();
      }
    });
    document.getElementById('qspeak').addEventListener('click', () => cur && say(cur));
    document.getElementById('reveal').addEventListener('click', () => (qans.hidden = false));
    document.getElementById('next').addEventListener('click', pick);
  }

  /* ── 录词面板（dev 模式可写；静态模式只能查） ─────────── */
  const ap = document.getElementById('addpanel');
  if (ap) {
    const el = (id) => document.getElementById(id);
    const state = { api: false, canWrite: false, result: null, photo: '' };

    fetch(new URL('api/ping', document.baseURI))
      .then((r) => r.json())
      .then((d) => {
        state.api = !!d.ok;
        state.canWrite = !!d.write;
        el('apmode').textContent = state.api
          ? state.canWrite ? 'dev 模式 · 可写入候选池' : 'dev 模式 · 只读（来源非本机）'
          : '静态模式 · 只能查词，不能写入（npm run dev 后才可写）';
        if (!state.api || !state.canWrite) el('apsave').disabled = true;
      })
      .catch(() => {
        el('apmode').textContent = '静态模式 · 只能查词，不能写入（npm run dev 后才可写）';
        el('apsave').disabled = true;
      });

    /** 静态模式的兜底查询：浏览器直连 dictionaryapi（该站允许跨域） */
    async function lookupClient(word) {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) throw new Error(`词典查不到 "${word}"`);
      const data = await res.json();
      const entry = data[0] || {};
      const texts = (entry.phonetics || []).map((p) => p.text).filter(Boolean);
      const audio = (entry.phonetics || []).find((p) => p.audio);
      const meaning = (entry.meanings || [])[0] || {};
      return {
        term: word,
        phonetic: texts.slice(0, 2).join(' · ') || entry.phonetic || '',
        pos: meaning.partOfSpeech || '',
        generalMeaning: ((meaning.definitions || [])[0] || {}).definition || '',
        audioUrl: audio ? audio.audio : '',
        audioAccent: audio && /-uk\./i.test(audio.audio) ? 'BrE' : 'AmE',
        lookup: { source: 'dictionaryapi', at: new Date().toISOString().slice(0, 10) },
      };
    }

    function renderResult(r) {
      state.result = r;
      el('apphon').textContent = r.phonetic || '（无）';
      el('apgen').textContent = r.generalMeaning || '—';
      el('apsrc').textContent = `${r.lookup ? r.lookup.source : '?'} · ${r.pos || '未知词性'}${r.note ? ' · ' + r.note : ''}`;
      const sb = el('apspeak');
      sb.dataset.say = r.term;
      if (r.audioUrl) sb.dataset.audio = r.audioUrl;
      el('apresult').hidden = false;
      el('apnote').textContent = '';
    }

    async function doLookup() {
      const word = el('apword').value.trim();
      if (!word) return;
      el('aplookup').disabled = true;
      el('apnote').textContent = '查询中…';
      try {
        let r;
        if (state.api) {
          const mode = el('apoffline').checked ? 'offline' : 'online';
          const d = await (await fetch(new URL(`api/vocab/lookup?word=${encodeURIComponent(word)}&mode=${mode}`, document.baseURI))).json();
          if (!d.ok) throw new Error(d.error);
          r = d.result;
        } else {
          r = await lookupClient(word);
        }
        renderResult(r);
      } catch (e) {
        el('apnote').textContent = '✗ ' + e.message;
        el('apresult').hidden = true;
      } finally {
        el('aplookup').disabled = false;
      }
    }

    el('aplookup').addEventListener('click', doLookup);
    el('apword').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doLookup();
    });
    el('apspeak').addEventListener('click', () => {
      const r = state.result;
      if (r) speak(r.term, r.audioUrl || null);
    });

    el('apsave').addEventListener('click', async () => {
      const r = state.result;
      if (!r) return;
      el('apsave').disabled = true;
      el('apnote').textContent = '写入中…';
      try {
        const payload = {
          term: r.term,
          pos: r.pos,
          phonetic: r.phonetic,
          phoneticsRaw: r.phonetic,
          general_meaning: r.generalMeaning,
          domain_meaning: el('apdom').value.trim(),
          confusion: el('apconf').value.trim(),
          source: el('apspec').value.trim(),
          downloadAudio: el('apaudio').checked,
          audioUrl: r.audioUrl,
          audioAccent: r.audioAccent,
          lookup: r.lookup,
        };
        const d = await (await fetch(new URL('api/vocab/candidate', document.baseURI), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })).json();
        if (!d.ok) throw new Error(d.error);
        const miss = d.entry.missing || [];
        toast(`已写入候选池：${d.entry.term}${miss.length ? `（缺 ${miss.join(', ')}）` : '（语义齐全）'}`, 6000);
        setTimeout(() => location.reload(), 1200);
      } catch (e) {
        el('apnote').textContent = '✗ ' + e.message;
        el('apsave').disabled = false;
      }
    });
  }

})();
