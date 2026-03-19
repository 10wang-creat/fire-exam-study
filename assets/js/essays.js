/* ============================================================
   申論題練習追蹤系統 essays.js
   載入 essay-questions.json，四科分頁，localStorage 追蹤
   ============================================================ */

const ESSAY_SUBJECTS = [
  { key: '火災學', icon: '🔥', color: '#ef4444' },
  { key: '消防法規', icon: '📋', color: '#3b82f6' },
  { key: '水與化學系統', icon: '💧', color: '#22c55e' },
  { key: '警報與避難系統', icon: '🚨', color: '#f59e0b' },
];

const STORAGE_KEY = 'essay-practice-v1';
let essays = [];
let practiceState = {};
let activeSubject = '火災學';
let filterType = '全部';
let filterStatus = '全部';

// ---- LOAD ----
async function loadEssays() {
  const baseUrl = document.querySelector('meta[name="baseurl"]')?.content || '';
  try {
    const resp = await fetch(`${baseUrl}/assets/data/essay-questions.json`);
    essays = await resp.json();
  } catch (e) {
    document.getElementById('essay-app').innerHTML =
      '<div class="card" style="text-align:center;padding:40px;color:#ef4444">載入失敗，請確認 essay-questions.json 存在</div>';
    return;
  }
  practiceState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  render();
}

// ---- STATE ----
function getKey(e) { return `${e.y}-${e.s}-${e.n}`; }
function getStatus(e) {
  const s = practiceState[getKey(e)];
  if (!s) return 'new';
  return s.rating || 'done';
}
function setStatus(e, rating) {
  practiceState[getKey(e)] = { rating, date: new Date().toISOString().slice(0,10) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(practiceState));
}
function clearStatus(e) {
  delete practiceState[getKey(e)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(practiceState));
}

// ---- STATS ----
function calcStats(subj) {
  const items = essays.filter(e => e.s === subj);
  const total = items.length;
  const practiced = items.filter(e => practiceState[getKey(e)]).length;
  const good = items.filter(e => practiceState[getKey(e)]?.rating === 'good').length;
  const ok = items.filter(e => practiceState[getKey(e)]?.rating === 'ok').length;
  const weak = items.filter(e => practiceState[getKey(e)]?.rating === 'weak').length;
  return { total, practiced, good, ok, weak, pct: total ? Math.round(practiced / total * 100) : 0 };
}

// ---- RENDER ----
function render() {
  const app = document.getElementById('essay-app');
  const allStats = ESSAY_SUBJECTS.map(s => ({ ...s, ...calcStats(s.key) }));
  const totalAll = allStats.reduce((a, s) => a + s.total, 0);
  const practicedAll = allStats.reduce((a, s) => a + s.practiced, 0);
  const pctAll = totalAll ? Math.round(practicedAll / totalAll * 100) : 0;

  // Overall progress
  let html = `
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:700">總進度</span>
        <span style="font-size:.85em;color:#64748b">${practicedAll} / ${totalAll} 題 (${pctAll}%)</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pctAll}%;background:linear-gradient(90deg,#3b82f6,#22c55e)"></div></div>
    </div>
  `;

  // Subject tabs
  html += '<div class="filter-row" style="margin-bottom:4px">';
  for (const s of allStats) {
    const active = activeSubject === s.key ? 'active' : '';
    html += `<button class="filter-btn ${active}" onclick="switchSubject('${s.key}')" style="${active ? `border-color:${s.color};background:${s.color}` : ''}">${s.icon} ${s.key} <span style="opacity:.7">(${s.practiced}/${s.total})</span></button>`;
  }
  html += '</div>';

  // Filter row
  html += `<div class="filter-row" style="margin-bottom:12px">
    <button class="filter-btn ${filterStatus === '全部' ? 'active' : ''}" onclick="setFilter('全部')">全部</button>
    <button class="filter-btn ${filterStatus === 'new' ? 'active' : ''}" onclick="setFilter('new')">⬜ 未練</button>
    <button class="filter-btn ${filterStatus === 'weak' ? 'active' : ''}" onclick="setFilter('weak')" style="${filterStatus === 'weak' ? 'border-color:#ef4444;background:#ef4444' : ''}">🔴 不熟</button>
    <button class="filter-btn ${filterStatus === 'ok' ? 'active' : ''}" onclick="setFilter('ok')" style="${filterStatus === 'ok' ? 'border-color:#f59e0b;background:#f59e0b' : ''}">🟡 普通</button>
    <button class="filter-btn ${filterStatus === 'good' ? 'active' : ''}" onclick="setFilter('good')" style="${filterStatus === 'good' ? 'border-color:#22c55e;background:#22c55e' : ''}">🟢 熟練</button>
  </div>`;

  // Filtered list
  let items = essays.filter(e => e.s === activeSubject);
  if (filterStatus !== '全部') {
    items = items.filter(e => getStatus(e) === filterStatus);
  }

  if (items.length === 0) {
    html += '<div class="card" style="text-align:center;padding:24px;color:#64748b">此篩選條件無題目</div>';
  }

  // Group by year
  const years = [...new Set(items.map(e => e.y))].sort((a, b) => b - a);
  for (const y of years) {
    const yearItems = items.filter(e => e.y === y);
    html += `<div style="margin-top:16px;margin-bottom:6px;font-size:.8em;color:#64748b;font-weight:700">📅 ${y} 年</div>`;
    for (const e of yearItems) {
      const status = getStatus(e);
      const statusIcon = status === 'good' ? '🟢' : status === 'ok' ? '🟡' : status === 'weak' ? '🔴' : '⬜';
      const date = practiceState[getKey(e)]?.date || '';
      const borderColor = status === 'good' ? '#22c55e' : status === 'ok' ? '#f59e0b' : status === 'weak' ? '#ef4444' : '#334155';

      html += `
        <div class="card" style="border-left:4px solid ${borderColor};padding:14px 16px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
            <div style="flex:1;min-width:0">
              <div style="font-size:.75em;color:#64748b;margin-bottom:4px">
                第${e.n}題 · <span class="badge badge-subj" style="font-size:.9em">${e.type}</span>
                ${e.tags.map(t => `<span class="tag">${t}</span>`).join('')}
              </div>
              <div style="font-size:.95em;font-weight:600;line-height:1.5">${e.t}</div>
              ${date ? `<div style="font-size:.7em;color:#475569;margin-top:4px">上次練習：${date}</div>` : ''}
            </div>
            <div style="flex-shrink:0;display:flex;flex-direction:column;gap:4px;align-items:center">
              <span style="font-size:1.2em">${statusIcon}</span>
              <div style="display:flex;gap:3px;margin-top:4px">
                <button onclick="rate('${getKey(e)}','weak')" title="不熟" style="width:24px;height:24px;border-radius:50%;border:2px solid ${status === 'weak' ? '#ef4444' : '#334155'};background:${status === 'weak' ? 'rgba(239,68,68,.2)' : 'transparent'};cursor:pointer;font-size:.7em;color:#ef4444">✗</button>
                <button onclick="rate('${getKey(e)}','ok')" title="普通" style="width:24px;height:24px;border-radius:50%;border:2px solid ${status === 'ok' ? '#f59e0b' : '#334155'};background:${status === 'ok' ? 'rgba(249,115,22,.2)' : 'transparent'};cursor:pointer;font-size:.7em;color:#f59e0b">△</button>
                <button onclick="rate('${getKey(e)}','good')" title="熟練" style="width:24px;height:24px;border-radius:50%;border:2px solid ${status === 'good' ? '#22c55e' : '#334155'};background:${status === 'good' ? 'rgba(34,197,94,.2)' : 'transparent'};cursor:pointer;font-size:.7em;color:#22c55e">✓</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  // Reset button
  html += `
    <div style="text-align:center;margin-top:24px;padding:16px">
      <button class="btn btn-outline" onclick="resetAll()" style="font-size:.8em">🗑️ 清除所有練習紀錄</button>
    </div>
  `;

  app.innerHTML = html;
}

// ---- ACTIONS ----
function switchSubject(s) { activeSubject = s; render(); }
function setFilter(f) { filterStatus = f; render(); }

function rate(key, rating) {
  const cur = practiceState[key];
  if (cur && cur.rating === rating) {
    delete practiceState[key];
  } else {
    practiceState[key] = { rating, date: new Date().toISOString().slice(0,10) };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(practiceState));
  render();
}

function resetAll() {
  if (!confirm('確定要清除所有申論練習紀錄嗎？此動作無法復原。')) return;
  practiceState = {};
  localStorage.setItem(STORAGE_KEY, JSON.stringify(practiceState));
  render();
}

// ---- INIT ----
loadEssays();
