/* ============================================================
   錯題本 wrong.js
   從 localStorage 讀取錯題，按科目分類，支援清除與連結回筆記
   ============================================================ */

function renderWrongApp() {
  const el = document.getElementById('wrong-app');
  const wrongs = JSON.parse(localStorage.getItem('fireExamWrong') || '[]');

  if (wrongs.length === 0) {
    el.innerHTML = `
      <div class="card" style="text-align:center;padding:48px">
        <div style="font-size:2.5em;margin-bottom:8px">📝</div>
        <div style="font-size:1.2em;font-weight:700">錯題本是空的</div>
        <div style="font-size:.9em;color:#64748b;margin-top:4px">去練題吧！答錯的題目會自動收錄在這裡</div>
        <a href="../practice/" class="btn btn-primary" style="margin-top:16px;display:inline-block">開始練題</a>
      </div>
    `;
    return;
  }

  // Group by subject
  const grouped = {};
  wrongs.forEach(w => {
    const key = w.subj || '未分類';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(w);
  });

  const subjectColors = {
    '火災學概要': '#ef4444',
    '消防法規概要': '#3b82f6',
    '警報與避難系統': '#f59e0b',
    '水與化學系統': '#22c55e',
  };

  let html = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="card-title">❌ 錯題本（${wrongs.length} 題）</div>
        <button class="btn btn-outline" style="font-size:.75em;padding:4px 12px" onclick="clearAll()">清空全部</button>
      </div>
    </div>
  `;

  for (const [subj, items] of Object.entries(grouped)) {
    const color = subjectColors[subj] || '#64748b';
    html += `<div style="font-size:.9em;font-weight:700;color:${color};margin:16px 0 8px;padding-left:4px">${subj.replace('概要','')}（${items.length}題）</div>`;

    for (const w of items) {
      html += `
        <div class="wrong-item">
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
            <span class="badge" style="background:rgba(139,92,246,.15);color:#a78bfa">${w.year}年 第${w.num}題</span>
            <span style="font-size:.75em;color:#475569">${w.date}</span>
            <button class="btn btn-outline" style="font-size:.65em;padding:2px 8px;margin-left:auto" onclick="removeWrong(${w.id})">刪除</button>
          </div>
          <div style="font-size:.85em;line-height:1.6">${(w.text || '').substring(0, 200)}${(w.text || '').length > 200 ? '...' : ''}</div>
          <div style="margin-top:6px;font-size:.8em">
            <span style="color:#ef4444">你的答案：${w.userAnswer || '?'}</span>
            <span style="color:#22c55e;margin-left:12px">正確答案：${w.answer || '?'}</span>
          </div>
          ${w.tags && w.tags.length > 0 ? `
            <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">
              ${w.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }
  }

  el.innerHTML = html;
}

function removeWrong(id) {
  let wrongs = JSON.parse(localStorage.getItem('fireExamWrong') || '[]');
  wrongs = wrongs.filter(w => w.id !== id);
  localStorage.setItem('fireExamWrong', JSON.stringify(wrongs));
  renderWrongApp();
}

function clearAll() {
  if (confirm('確定清空所有錯題？此操作無法復原。')) {
    localStorage.setItem('fireExamWrong', '[]');
    renderWrongApp();
  }
}

document.addEventListener('DOMContentLoaded', renderWrongApp);
