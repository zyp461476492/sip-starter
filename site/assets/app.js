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

  /* ── 阅读偏好 / 右侧大纲 / 移动端抽屉 ───────────────── */
  const root = document.documentElement;
  const SIZES = ['sm', 'md', 'lg', 'xl'];
  const WIDTHS = ['narrow', 'mid', 'wide'];
  const SIZE_LABEL = { sm: '小', md: '中', lg: '大', xl: '特大' };
  const WIDTH_LABEL = { narrow: '窄', mid: '中', wide: '宽' };
  const prefBtn = document.getElementById('prefbtn');
  const prefMenu = document.getElementById('prefmenu');

  function syncPrefs() {
    if (!prefMenu) return;
    const s = root.dataset.size || 'md';
    const w = root.dataset.width || 'mid';
    prefMenu.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('on', b.dataset.size === s));
    prefMenu.querySelectorAll('[data-width]').forEach((b) => b.classList.toggle('on', b.dataset.width === w));
  }

  if (prefBtn && prefMenu) {
    prefBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      prefMenu.hidden = !prefMenu.hidden;
      syncPrefs();
    });
    document.addEventListener('click', (e) => {
      if (!prefMenu.hidden && !prefMenu.contains(e.target) && e.target !== prefBtn) prefMenu.hidden = true;
    });
    prefMenu.querySelectorAll('[data-size]').forEach((b) =>
      b.addEventListener('click', () => {
        root.dataset.size = b.dataset.size;
        localStorage.setItem('sip.size', b.dataset.size);
        syncPrefs();
      })
    );
    prefMenu.querySelectorAll('[data-width]').forEach((b) =>
      b.addEventListener('click', () => {
        root.dataset.width = b.dataset.width;
        localStorage.setItem('sip.width', b.dataset.width);
        syncPrefs();
      })
    );
    syncPrefs();

    const cycle = (cur, arr) => arr[(arr.indexOf(cur) + 1) % arr.length] || arr[0];
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 's' || e.key === 'S') {
        const n = cycle(root.dataset.size || 'md', SIZES);
        root.dataset.size = n;
        localStorage.setItem('sip.size', n);
        syncPrefs();
        toast('字号：' + SIZE_LABEL[n], 1400);
      } else if (e.key === 'l' || e.key === 'L') {
        const n = cycle(root.dataset.width || 'mid', WIDTHS);
        root.dataset.width = n;
        localStorage.setItem('sip.width', n);
        syncPrefs();
        toast('行宽：' + WIDTH_LABEL[n], 1400);
      } else if (e.key === '/') {
        const qq = document.getElementById('q');
        if (qq) {
          e.preventDefault();
          qq.focus();
          qq.select();
        }
      }
    });
  }

  /* 右侧大纲：滚动时高亮当前小节 */
  (function outlineSpy() {
    const box = document.getElementById('outline');
    if (!box) return;
    const links = [...box.querySelectorAll('.ot-list a')];
    if (!links.length) return;
    const pairs = [];
    for (const a of links) {
      const el = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (el) pairs.push([el, a]);
    }
    if (!pairs.length) return;
    const setOn = (a) => links.forEach((x) => x.classList.toggle('on', x === a));
    let ticking = false;
    const update = () => {
      ticking = false;
      const top = (document.querySelector('.topbar')?.offsetHeight || 0) + 28;
      let cur = pairs[0][1];
      for (const [el, a] of pairs) {
        if (el.getBoundingClientRect().top <= top) cur = a;
        else break;
      }
      setOn(cur);
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    links.forEach((a) => a.addEventListener('click', () => setOn(a)));
    update();
  })();

  /* RFC 原文页：中文 / 原文 / 对照 三态（默认中文，原文折叠） */
  (function readerMode() {
    const bar = document.querySelector('.modebar');
    if (!bar) return;
    const btns = [...bar.querySelectorAll('[data-rmode]')];
    const pairs = [...document.querySelectorAll('.secbi')];
    const LABEL = { zh: '中文（原文折叠）', en: '英文原文', dual: '左右对照' };
    const sync = () => {
      const mode = root.dataset.rmode || 'zh';
      btns.forEach((b) => b.classList.toggle('on', b.dataset.rmode === mode));
      pairs.forEach((sec) => {
        const det = sec.querySelector('.endet');
        if (det) det.open = mode !== 'zh';
      });
    };
    btns.forEach((b) =>
      b.addEventListener('click', () => {
        root.dataset.rmode = b.dataset.rmode;
        localStorage.setItem('sip.rmode', b.dataset.rmode);
        sync();
        toast('显示：' + LABEL[b.dataset.rmode], 1400);
      })
    );
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key !== 't' && e.key !== 'T') return;
      const order = ['zh', 'en', 'dual'];
      const next = order[(order.indexOf(root.dataset.rmode || 'zh') + 1) % order.length];
      root.dataset.rmode = next;
      localStorage.setItem('sip.rmode', next);
      sync();
      toast('显示：' + LABEL[next], 1400);
    });
    sync();
  })();

  /* RFC 原文页：左侧节目录可拖宽 / 可隐藏 */
  (function rawToc() {
    const layout = document.querySelector('.rawlayout');
    if (!layout) return;
    const res = document.getElementById('tocres');
    const btn = document.getElementById('toctoggle');
    const MIN = 150;
    const MAX = 480;
    const DEFAULT = 250;

    const setW = (w) => {
      const v = Math.max(MIN, Math.min(MAX, Math.round(w)));
      root.style.setProperty('--toc-w', v + 'px');
      localStorage.setItem('sip.tocw', String(v));
      return v;
    };
    const syncBtn = () => {
      const on = root.dataset.toc !== 'off';
      if (btn) {
        btn.textContent = on ? '隐藏目录' : '显示目录';
        btn.classList.toggle('on', on);
      }
    };
    const toggle = () => {
      const next = root.dataset.toc === 'off' ? 'on' : 'off';
      root.dataset.toc = next;
      localStorage.setItem('sip.toc', next);
      syncBtn();
    };

    btn?.addEventListener('click', toggle);

    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === '[' || e.key === '【') {
        e.preventDefault();
        toggle();
        toast(root.dataset.toc === 'off' ? '目录已隐藏（[ 恢复）' : '目录已显示', 1400);
      }
    });

    if (!res) return syncBtn();
    let startX = 0;
    let startW = 0;
    res.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startW = res.previousElementSibling.getBoundingClientRect().width;
      res.classList.add('drag');
      res.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    res.addEventListener('pointermove', (e) => {
      if (!res.classList.contains('drag')) return;
      setW(startW + (e.clientX - startX));
    });
    const stop = () => {
      if (!res.classList.contains('drag')) return;
      res.classList.remove('drag');
      toast('目录宽度已保存', 1200);
    };
    res.addEventListener('pointerup', stop);
    res.addEventListener('pointercancel', stop);
    res.addEventListener('dblclick', () => {
      setW(DEFAULT);
      toast('目录宽度已复位', 1200);
    });
    syncBtn();
  })();

  /* 移动端侧栏抽屉 */
  (function drawer() {
    const burger = document.getElementById('burger');
    const sidebar = document.getElementById('sidebar');
    const scrim = document.getElementById('scrim');
    if (!burger || !sidebar) return;
    const close = () => {
      sidebar.classList.remove('open');
      scrim?.classList.remove('on');
    };
    burger.addEventListener('click', () => {
      const open = !sidebar.classList.contains('open');
      sidebar.classList.toggle('open', open);
      scrim?.classList.toggle('on', open);
    });
    scrim?.addEventListener('click', close);
    sidebar.addEventListener('click', (e) => {
      if (e.target.closest('a')) close();
    });
  })();

})();
