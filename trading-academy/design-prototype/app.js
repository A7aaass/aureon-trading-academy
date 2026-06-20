/* ============================================================================
   AUREON — Données de marché RÉELLES (prix + dates valides) & calendrier réel
   Sources gratuites sans clé :
     • Forex  : Frankfurter (taux de référence BCE)      https://frankfurter.dev
     • Crypto : CoinGecko                                 https://www.coingecko.com
     • Métaux : gold-api.com                              https://gold-api.com
     • Calendrier économique : ForexFactory (faireconomy) flux hebdomadaire
   Aucun signal / aucune analyse IA n'est généré.
   ========================================================================== */
if (window.lucide) lucide.createIcons();

/* ---- barre latérale mobile ---- */
const menuBtn = document.getElementById('menuBtn');
if (menuBtn) menuBtn.onclick = () => document.getElementById('sidebar').classList.toggle('open');

/* ---------- utilitaires ---------- */
const fmtPrice = (p) => p >= 1000 ? p.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  : p >= 100 ? p.toFixed(2)
  : p >= 1 ? p.toFixed(4)
  : p.toFixed(5);
const fmtPct = (c) => (c >= 0 ? '+' : '') + c.toFixed(2) + '%';
const dateLabel = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
const timeLabel = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
async function getJSON(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
/* récupère un JSON, avec repli via proxy CORS si nécessaire */
async function getJSONcors(url) {
  try { return await getJSON(url); }
  catch (e) {
    const proxied = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
    return getJSON(proxied);
  }
}

/* ===========================================================================
   MARCHÉS EN DIRECT
   ======================================================================== */
const marketState = { forex: [], crypto: [], metals: [] };
let activeTab = 'forex';

function renderMarketTable() {
  const tb = document.querySelector('#marketTable tbody');
  if (!tb) return;
  const rows = marketState[activeTab] || [];
  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="4" style="color:var(--muted);padding:16px 0">Chargement…</td></tr>`;
    return;
  }
  tb.innerHTML = rows.map(m => {
    const up = m.chg >= 0;
    const varCell = (m.chg === null || m.chg === undefined)
      ? `<td style="color:var(--muted)">—</td>`
      : `<td class="${up ? 'up' : 'down'}">${fmtPct(m.chg)}</td>`;
    return `<tr>
      <td><div class="sym"><span class="ic">${m.ic}</span>${m.sym}</div></td>
      <td style="font-variant-numeric:tabular-nums">${m.priceStr}</td>
      ${varCell}
      <td style="color:var(--muted);font-size:11px">${m.updated}</td>
    </tr>`;
  }).join('');
}

function setTab(tab) {
  activeTab = tab;
  document.querySelectorAll('#mktTabs button').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));
  const src = { forex: 'Source : BCE / Frankfurter (clôtures quotidiennes)',
                crypto: 'Source : CoinGecko (temps réel)',
                metals: 'Source : gold-api.com (temps réel)' }[tab];
  const el = document.getElementById('mktSource'); if (el) el.textContent = src;
  renderMarketTable();
}
const mktTabs = document.getElementById('mktTabs');
if (mktTabs) mktTabs.querySelectorAll('button').forEach(b => b.onclick = () => setTab(b.dataset.tab));

/* ---- FOREX (Frankfurter) ---- */
let forexSeries = null;
async function loadForex() {
  const start = new Date(); start.setDate(start.getDate() - 50);
  const s = start.toISOString().slice(0, 10);
  const data = await getJSON(`https://api.frankfurter.dev/v1/${s}..?base=USD&symbols=EUR,GBP,JPY,CHF,AUD,CAD,NZD`);
  forexSeries = data;
  const dates = Object.keys(data.rates).sort();
  const last = data.rates[dates[dates.length - 1]];
  const prev = data.rates[dates[dates.length - 2]] || last;
  const dataDate = new Date(dates[dates.length - 1] + 'T00:00:00');
  const upd = dateLabel(dataDate);

  // valeur d'une paire à partir des taux base=USD
  const pair = (sym, fn) => {
    const cur = fn(last), old = fn(prev);
    const chg = old ? (cur / old - 1) * 100 : null;
    return { sym, ic: sym[0], price: cur, priceStr: fmtPrice(cur), chg, updated: upd };
  };
  marketState.forex = [
    pair('EUR/USD', r => 1 / r.EUR),
    pair('GBP/USD', r => 1 / r.GBP),
    pair('USD/JPY', r => r.JPY),
    pair('USD/CHF', r => r.CHF),
    pair('AUD/USD', r => 1 / r.AUD),
    pair('USD/CAD', r => r.CAD),
  ];
  document.getElementById('mktUpdated').textContent = 'MAJ ' + upd;
  if (activeTab === 'forex') renderMarketTable();
  buildPriceChart();      // graphique EUR/USD réel
  buildCurrencyStrength(); // force des devises réelle
}

/* ---- CRYPTO (CoinGecko) ---- */
const COINS = [
  ['bitcoin', 'BTC/USD', '₿'], ['ethereum', 'ETH/USD', 'Ξ'],
  ['solana', 'SOL/USD', '◎'], ['ripple', 'XRP/USD', 'X'],
  ['binancecoin', 'BNB/USD', 'B'], ['cardano', 'ADA/USD', 'A'],
];
async function loadCrypto() {
  const ids = COINS.map(c => c[0]).join(',');
  const d = await getJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`);
  marketState.crypto = COINS.filter(c => d[c[0]]).map(([id, sym, ic]) => {
    const o = d[id];
    return { sym, ic, price: o.usd, priceStr: '$' + fmtPrice(o.usd),
      chg: o.usd_24h_change, updated: timeLabel(new Date(o.last_updated_at * 1000)) };
  });
  if (activeTab === 'crypto') renderMarketTable();
}

/* ---- MÉTAUX (gold-api.com) ---- */
const METALS = [['XAU', 'XAU/USD', 'Au', 'Or'], ['XAG', 'XAG/USD', 'Ag', 'Argent'],
                ['XPT', 'XPT/USD', 'Pt', 'Platine']];
async function loadMetals() {
  const out = [];
  for (const [code, sym, ic] of METALS) {
    try {
      const o = await getJSON(`https://api.gold-api.com/price/${code}`);
      if (o && o.price) out.push({ sym, ic, price: o.price, priceStr: '$' + fmtPrice(o.price),
        chg: null, updated: o.updatedAt ? timeLabel(new Date(o.updatedAt)) : '—' });
    } catch (e) { /* ignore une source indisponible */ }
  }
  marketState.metals = out;
  if (activeTab === 'metals') renderMarketTable();
}

/* ===========================================================================
   GRAPHIQUE PRIX RÉEL — EUR/USD 30 jours (Frankfurter)
   ======================================================================== */
const BLUE = '#0066FF', GREEN = '#00FF88', GRID = 'rgba(255,255,255,.05)', MUTED = '#8aa0c0';
let priceChartObj = null;
function buildPriceChart() {
  const pc = document.getElementById('priceChart');
  if (!pc || !forexSeries) return;
  const dates = Object.keys(forexSeries.rates).sort().slice(-30);
  const labels = dates.map(d => dateLabel(new Date(d + 'T00:00:00')));
  const pts = dates.map(d => 1 / forexSeries.rates[d].EUR); // EUR/USD
  if (priceChartObj) priceChartObj.destroy();
  priceChartObj = new Chart(pc, {
    type: 'line',
    data: { labels, datasets: [{ data: pts, borderColor: BLUE, borderWidth: 2, fill: true,
      backgroundColor: 'rgba(0,102,255,.12)', tension: .3, pointRadius: 0 }] },
    options: { plugins: { legend: { display: false },
      tooltip: { callbacks: { label: c => 'EUR/USD ' + c.parsed.y.toFixed(5) } } },
      scales: { x: { display: true, grid: { display: false },
        ticks: { color: MUTED, font: { size: 9 }, maxTicksLimit: 8 } },
        y: { position: 'right', grid: { color: GRID }, ticks: { color: MUTED, font: { size: 9 } } } } }
  });
}

/* ===========================================================================
   FORCE DES DEVISES RÉELLE (variation quotidienne, Frankfurter)
   ======================================================================== */
let radarObj = null;
function buildCurrencyStrength() {
  if (!forexSeries) return;
  const dates = Object.keys(forexSeries.rates).sort();
  const last = forexSeries.rates[dates[dates.length - 1]];
  const prev = forexSeries.rates[dates[dates.length - 2]] || last;
  const curs = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];
  const valUSD = (r, c) => c === 'USD' ? 1 : 1 / r[c];     // valeur en USD
  const chg = {};
  curs.forEach(c => { chg[c] = (valUSD(last, c) / valUSD(prev, c) - 1) * 100; });
  const mean = curs.reduce((a, c) => a + chg[c], 0) / curs.length;
  const rel = {}; curs.forEach(c => rel[c] = chg[c] - mean);
  const maxAbs = Math.max(...curs.map(c => Math.abs(rel[c]))) || 1;
  const score = {}; curs.forEach(c => score[c] = Math.round(50 + (rel[c] / maxAbs) * 45));
  const sorted = curs.slice().sort((a, b) => score[b] - score[a]);

  const sb = document.getElementById('strengthBars');
  if (sb) sb.innerHTML = sorted.map(c => `
    <div class="cs-row"><span class="c">${c}</span>
      <span class="b"><i style="width:${score[c]}%"></i></span>
      <span class="v">${score[c]}%</span></div>`).join('');

  const rc = document.getElementById('radarChart');
  if (rc) {
    if (radarObj) radarObj.destroy();
    radarObj = new Chart(rc, { type: 'radar',
      data: { labels: sorted, datasets: [{ data: sorted.map(c => score[c]),
        backgroundColor: 'rgba(0,102,255,.18)', borderColor: BLUE, borderWidth: 2,
        pointBackgroundColor: GREEN, pointRadius: 2 }] },
      options: { plugins: { legend: { display: false } },
        scales: { r: { min: 0, max: 100, angleLines: { color: GRID }, grid: { color: GRID },
          pointLabels: { color: MUTED, font: { size: 9 } }, ticks: { display: false } } } } });
  }
  const u = document.getElementById('csUpdated');
  if (u) u.textContent = 'MAJ ' + dateLabel(new Date(dates[dates.length - 1] + 'T00:00:00'));
}

/* ===========================================================================
   CALENDRIER ÉCONOMIQUE RÉEL (ForexFactory — semaine en cours)
   ======================================================================== */
const IMPACT = { High: ['high', 'ÉLEVÉ'], Medium: ['med', 'MOYEN'], Low: ['low', 'FAIBLE'], Holiday: ['low', 'FÉRIÉ'] };
const FF_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
/* Récupère le calendrier réel : 1) lecteur Jina (compatible CORS),
   2) repli sur l'instantané réel calendar.json livré avec le site. */
async function fetchCalendarEvents() {
  try {
    const r = await fetch('https://r.jina.ai/' + FF_URL, { headers: { 'Accept': 'application/json' }, cache: 'no-store' });
    if (r.ok) {
      const j = await r.json();
      const raw = j && j.data && j.data.content;
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return arr;
      }
    }
  } catch (e) { /* repli ci-dessous */ }
  const f = await fetch('calendar.json', { cache: 'no-store' });
  return f.json();
}
async function loadCalendar() {
  const list = document.getElementById('calendarList');
  if (!list) return;
  try {
    const events = await fetchCalendarEvents();
    const now = new Date();
    // priorité : événements à venir et à fort/moyen impact
    const enriched = events.map(e => ({ ...e, dt: new Date(e.date) }))
      .filter(e => !isNaN(e.dt));
    const upcoming = enriched.filter(e => e.dt >= now);
    const pool = (upcoming.length ? upcoming : enriched)
      .sort((a, b) => a.dt - b.dt)
      .sort((a, b) => (b.impact === 'High') - (a.impact === 'High'));
    const top = pool.slice(0, 8);
    list.innerHTML = top.map(e => {
      const [cls, lbl] = IMPACT[e.impact] || ['low', (e.impact || '').toUpperCase()];
      const day = e.dt.toLocaleDateString('fr-FR', { weekday: 'short' });
      const tm = e.dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const extra = [e.forecast && `prév. ${e.forecast}`, e.previous && `préc. ${e.previous}`]
        .filter(Boolean).join(' · ');
      return `<div class="cal-row">
        <span class="tm">${day}<br>${tm}</span>
        <span class="cur">${e.country}</span>
        <span class="ev" title="${e.title}">${e.title}${extra ? ` <span class="cal-extra">${extra}</span>` : ''}</span>
        <span class="imp ${cls}">${lbl}</span></div>`;
    }).join('');
    const u = document.getElementById('calUpdated');
    if (u) u.textContent = top.length + ' événements';
  } catch (e) {
    list.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:8px 0">
      Calendrier momentanément indisponible. Réessayez plus tard.</div>`;
  }
}

/* ===========================================================================
   ÉLÉMENTS DÉMO (académie) — compte à rebours, progression, activité
   ======================================================================== */
let total = 2 * 3600 + 15 * 60 + 30;
const fmt = n => String(n).padStart(2, '0');
if (document.getElementById('cd-h')) setInterval(() => {
  total = total <= 0 ? 2 * 3600 + 15 * 60 + 30 : total - 1;
  document.getElementById('cd-h').textContent = fmt(Math.floor(total / 3600));
  document.getElementById('cd-m').textContent = fmt(Math.floor(total % 3600 / 60));
  document.getElementById('cd-s').textContent = fmt(total % 60);
}, 1000);

const ring = document.getElementById('progRing');
if (ring) new Chart(ring, { type: 'doughnut',
  data: { datasets: [{ data: [65, 35], backgroundColor: [BLUE, 'rgba(255,255,255,.07)'], borderWidth: 0 }] },
  options: { cutout: '80%', plugins: { legend: { display: false }, tooltip: { enabled: false } } } });

const sc = document.getElementById('statsChart');
if (sc) new Chart(sc, { type: 'bar',
  data: { labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'], datasets: [{ data: [3, 5, 2, 6, 4, 3, 5],
    backgroundColor: BLUE, borderRadius: 4 }] },
  options: { plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, ticks: { color: MUTED, font: { size: 9 } } }, y: { display: false } } } });

/* ===========================================================================
   INITIALISATION + rafraîchissement automatique
   ======================================================================== */
async function refreshMarkets() {
  await Promise.allSettled([loadForex(), loadCrypto(), loadMetals()]);
}
setTab('forex');
refreshMarkets();
loadCalendar();
/* crypto/métaux toutes les 60 s ; forex (clôtures quotidiennes) toutes les 15 min */
setInterval(() => { loadCrypto(); loadMetals(); }, 60 * 1000);
setInterval(loadForex, 15 * 60 * 1000);
