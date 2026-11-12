// site/assets/app.js —— 全站搜索 + 生词发音/筛选/抽卡
(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* ── 发音（Web Speech API） ─────────────────────────────
     优先级：data-audio 本地音频 > speechSynthesis 合成
     口音与语速存 localStorage，全站生效                        */
  const speechOK = 'speechSynthesis' in window;
  let accent = localStorage.getItem('sip.acc') || 'en-US';
  let rate = Number(localStorage.getItem('sip.rate') || 1);
  let voices = [];

  const loadVoices = () => {
    if (speechOK) voices = window.speechSynthesis.getVoices();
  };
  if (speechOK) {
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
  }

  const pickVoice = () => {
    if (!voices.length) loadVoices();
    const norm = (l) => l.replace('_', '-');
    return (
      voices.find((v) => norm(v.lang) === accent && /natural|google|samantha|daniel|zira/i.test(v.name)) ||
      voices.find((v) => norm(v.lang) === accent) ||
      voices.find((v) => norm(v.lang).startsWith(accent.slice(0, 2))) ||
      null
    );
  };

  function speak(text, audioUrl) {
    if (audioUrl) {
      const a = new Audio(audioUrl);
      a.play().catch(() => speak(text, null)); // 文件缺失时回退合成
      return;
    }
    if (!speechOK) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = accent;
    u.rate = rate;
    const v = pickVoice();
    if (v) u.voice = v;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  // 卡片上的 🔊
  document.querySelectorAll('.speak').forEach((btn) =>
    btn.addEventListener('click', () => speak(btn.dataset.say, btn.dataset.audio))
  );
  // 浏览器不支持合成时隐藏按钮，避免点了没反应
  if (!speechOK) document.querySelectorAll('.speak').forEach((b) => (b.hidden = true));

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

  /* ── 口音 / 语速 ────────────────────────────────────── */
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

    const pick = () => {
      if (!pool.length) {
        qterm.textContent = '一轮结束 🎉';
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
      speak(cur.say || cur.term, cur.audio); // 抽到就念一遍：先听音再想义
    };

    btnQuiz.addEventListener('click', () => {
      box.hidden = !box.hidden;
      if (!box.hidden) {
        pool.length = 0;
        pool.push(...window.__VOCAB__);
        pick();
      }
    });
    document.getElementById('qspeak').addEventListener('click', () => cur && speak(cur.say || cur.term, cur.audio));
    document.getElementById('reveal').addEventListener('click', () => (qans.hidden = false));
    document.getElementById('next').addEventListener('click', pick);
  }
})();
