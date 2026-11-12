// site/assets/app.js —— 全站搜索 + 生词筛选/抽卡
(() => {
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
        const hay = (item.title + ' ' + item.text).toLowerCase();
        const at = hay.indexOf(kw);
        if (at < 0) continue;
        const src = item.title + ' ' + item.text;
        const pos = src.toLowerCase().indexOf(kw);
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
  const buttons = [...document.querySelectorAll('.toolbar button[data-filter]')];
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      buttons.forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      const f = b.dataset.filter;
      cards.forEach((c) => (c.hidden = f !== 'all' && c.dataset.status !== f));
    })
  );

  /* ── 抽卡 ───────────────────────────────────────────── */
  const box = document.getElementById('quizbox');
  const btnQuiz = document.getElementById('quiz');
  if (box && btnQuiz && window.__VOCAB__) {
    const pool = window.__VOCAB__.slice();
    let cur = null;
    const qterm = box.querySelector('.qterm');
    const qans = box.querySelector('.qans');
    const qleft = document.getElementById('qleft');

    const pick = () => {
      if (!pool.length) {
        qterm.textContent = '一轮结束 🎉';
        qans.hidden = true;
        qleft.textContent = '';
        return;
      }
      cur = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      qterm.textContent = cur.term;
      qans.innerHTML =
        `<b>${esc(cur.domain_meaning)}</b><br>` +
        (cur.general_meaning ? `<span class="muted">通用义：${esc(cur.general_meaning)}</span><br>` : '') +
        `易错点：${esc(cur.confusion)}<br><span class="muted">${esc(cur.source)}</span>`;
      qans.hidden = true;
      qleft.textContent = `剩余 ${pool.length + 1}`;
    };

    btnQuiz.addEventListener('click', () => {
      box.hidden = !box.hidden;
      if (!box.hidden) {
        pool.length = 0;
        pool.push(...window.__VOCAB__);
        pick();
      }
    });
    document.getElementById('reveal').addEventListener('click', () => (qans.hidden = false));
    document.getElementById('next').addEventListener('click', pick);
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  }
})();
