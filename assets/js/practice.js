/* ============================================================
   練題系統 practice.js
   載入外部 JSON 題庫，支援篩選、作答、判對錯、加入錯題本
   ============================================================ */

const SUBJECTS = [
  { slug: 'fire-science', name: '火災學概要', color: '#ef4444' },
  { slug: 'fire-law', name: '消防法規概要', color: '#3b82f6' },
  { slug: 'alarm-system', name: '警報與避難系統', color: '#f59e0b' },
  { slug: 'water-chemical', name: '水與化學系統', color: '#22c55e' },
];

let allQuestions = [];
let filteredQuestions = [];
let currentIndex = 0;
let userAnswers = {};
let showingAnswer = false;
let currentSubject = '全部';
let currentYear = '全部';
let mode = 'select'; // select | doing | result
let loadedCount = 0;

// ---- DATA LOADING ----
async function loadAllData() {
  const el = document.getElementById('practice-app');
  el.innerHTML = '<div class="card" style="text-align:center;padding:40px"><p>載入題庫中...</p></div>';

  for (const subj of SUBJECTS) {
    try {
      const baseUrl = document.querySelector('meta[name="baseurl"]')?.content || '';
      const resp = await fetch(`${baseUrl}/assets/data/${subj.slug}.json`);
      const data = await resp.json();
      data.forEach(q => { q.subj = subj.name; q.subjSlug = subj.slug; q.color = subj.color; });
      allQuestions = allQuestions.concat(data);
      loadedCount += data.length;
    } catch (e) {
      console.error(`Failed to load ${subj.slug}:`, e);
    }
  }

  // Check URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get('subject')) currentSubject = params.get('subject');
  if (params.get('topic')) {
    const topic = params.get('topic');
    filteredQuestions = allQuestions.filter(q =>
      q.t.includes(topic) || (q.tags && q.tags.some(t => t.includes(topic)))
    );
    if (filteredQuestions.length > 0) {
      shuffle(filteredQuestions);
      mode = 'doing';
      renderDoing();
      return;
    }
  }

  renderSelect();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ---- RENDER: SELECT MODE ----
function renderSelect() {
  mode = 'select';
  const years = [...new Set(allQuestions.map(q => q.y))].sort();
  const el = document.getElementById('practice-app');

  el.innerHTML = `
    <div class="card">
      <div class="card-title">📋 選擇練習範圍（共 ${loadedCount} 題）</div>
      <div style="margin-bottom:12px">
        <div style="font-size:.8em;color:#64748b;margin-bottom:6px">科目：</div>
        <div class="filter-row" id="subj-filters">
          <button class="filter-btn ${currentSubject === '全部' ? 'active' : ''}" onclick="setSubject('全部')">全部</button>
          ${SUBJECTS.map(s => `<button class="filter-btn ${currentSubject === s.name ? 'active' : ''}" onclick="setSubject('${s.name}')">${s.name.replace('概要','')}</button>`).join('')}
        </div>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:.8em;color:#64748b;margin-bottom:6px">年份：</div>
        <div class="filter-row" id="year-filters">
          <button class="filter-btn ${currentYear === '全部' ? 'active' : ''}" onclick="setYear('全部')">全部</button>
          <button class="filter-btn ${currentYear === 'recent' ? 'active' : ''}" onclick="setYear('recent')">近5年</button>
          ${years.map(y => `<button class="filter-btn ${currentYear === String(y) ? 'active' : ''}" onclick="setYear('${y}')">${y}年</button>`).join('')}
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary" style="flex:1;min-width:200px;padding:14px" onclick="startPractice()">🚀 開始練習</button>
        <button class="btn btn-outline" style="flex:1;min-width:200px;padding:14px" onclick="startPractice(10)">⚡ 快速10題</button>
        <button class="btn btn-outline" style="flex:1;min-width:200px;padding:14px" onclick="startPractice(40)">📝 模擬考40題</button>
      </div>
    </div>
  `;
}

function setSubject(s) { currentSubject = s; renderSelect(); }
function setYear(y) { currentYear = y; renderSelect(); }

function startPractice(limit) {
  let qs = [...allQuestions];
  if (currentSubject !== '全部') qs = qs.filter(q => q.subj === currentSubject);
  if (currentYear === 'recent') qs = qs.filter(q => q.y >= 110);
  else if (currentYear !== '全部') qs = qs.filter(q => q.y === parseInt(currentYear));

  shuffle(qs);
  if (limit) qs = qs.slice(0, limit);

  filteredQuestions = qs;
  currentIndex = 0;
  userAnswers = {};
  showingAnswer = false;
  mode = 'doing';
  renderDoing();
}

// ---- RENDER: DOING MODE ----
function renderDoing() {
  const el = document.getElementById('practice-app');
  if (filteredQuestions.length === 0) {
    el.innerHTML = '<div class="card" style="text-align:center;padding:40px">沒有符合條件的題目</div>';
    return;
  }

  const q = filteredQuestions[currentIndex];
  const progress = ((currentIndex + 1) / filteredQuestions.length * 100);
  const userAns = userAnswers[currentIndex];

  let optionsHtml = '';
  if (showingAnswer && q.a) {
    optionsHtml = ['A','B','C','D'].map(opt => {
      let cls = 'option';
      if (opt === q.a) cls += ' correct';
      else if (opt === userAns && opt !== q.a) cls += ' wrong';
      return `<div class="${cls}"><span class="option-label">${opt}</span></div>`;
    }).join('');
  } else {
    optionsHtml = ['A','B','C','D'].map(opt => {
      let cls = 'option';
      if (userAns === opt) cls += ' correct'; // just highlight selected
      return `<div class="${cls}" onclick="selectAnswer('${opt}')" style="cursor:pointer"><span class="option-label">${opt}</span></div>`;
    }).join('');
  }

  let resultHtml = '';
  if (showingAnswer) {
    const isCorrect = userAns === q.a;
    resultHtml = `
      <div class="result-box ${isCorrect ? 'result-correct' : 'result-wrong'}">
        <div style="font-weight:700;color:${isCorrect ? '#22c55e' : '#ef4444'}">
          ${isCorrect ? '✅ 答對了！' : `❌ 答錯了！正確答案是 ${q.a || '未知'}`}
        </div>
        ${!isCorrect ? `<button class="btn btn-outline" style="margin-top:8px;font-size:.8em" onclick="addToWrong()">📌 加入錯題本</button>` : ''}
      </div>
    `;
  }

  el.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
          <span class="badge badge-subj">${q.subj.replace('概要','')}</span>
          <span class="badge" style="background:rgba(139,92,246,.15);color:#a78bfa">${q.y}年</span>
          <span style="font-size:.8em;color:#64748b">第${q.n}題</span>
        </div>
        <div style="font-size:.9em;font-weight:700;color:#94a3b8">${currentIndex + 1} / ${filteredQuestions.length}</div>
      </div>
      <div class="progress-bar" style="margin-bottom:14px">
        <div class="progress-fill" style="width:${progress}%;background:#3b82f6"></div>
      </div>
      <div style="font-size:.95em;line-height:1.7;margin-bottom:12px">${q.t}</div>
    </div>
    <div class="options-grid">${optionsHtml}</div>
    ${resultHtml}
    <div style="display:flex;gap:8px;justify-content:space-between;margin-top:12px">
      <button class="btn btn-outline" onclick="backToSelect()">⬅ 返回</button>
      <div style="display:flex;gap:8px">
        ${!showingAnswer ? `<button class="btn btn-primary" onclick="checkAnswer()">確認答案</button>` : ''}
        ${showingAnswer && currentIndex < filteredQuestions.length - 1 ? `<button class="btn btn-primary" onclick="nextQuestion()">下一題 ➡</button>` : ''}
        ${showingAnswer && currentIndex === filteredQuestions.length - 1 ? `<button class="btn btn-green" onclick="showResult()">查看結果 📊</button>` : ''}
      </div>
    </div>
  `;
}

function selectAnswer(opt) {
  if (showingAnswer) return;
  userAnswers[currentIndex] = opt;
  renderDoing();
}

function checkAnswer() {
  if (!userAnswers[currentIndex]) return;
  showingAnswer = true;
  renderDoing();
}

function nextQuestion() {
  currentIndex++;
  showingAnswer = false;
  renderDoing();
  window.scrollTo(0, 0);
}

function backToSelect() { renderSelect(); }

function addToWrong() {
  const q = filteredQuestions[currentIndex];
  const wrongs = JSON.parse(localStorage.getItem('fireExamWrong') || '[]');
  wrongs.push({
    id: Date.now(),
    subj: q.subj,
    year: q.y,
    num: q.n,
    text: q.t,
    answer: q.a,
    userAnswer: userAnswers[currentIndex],
    tags: q.tags || [],
    date: new Date().toLocaleDateString('zh-TW'),
  });
  localStorage.setItem('fireExamWrong', JSON.stringify(wrongs));
  alert('已加入錯題本！');
}

// ---- RENDER: RESULT MODE ----
function showResult() {
  mode = 'result';
  const el = document.getElementById('practice-app');
  let correct = 0;
  const answered = Object.keys(userAnswers).length;
  for (const [i, ans] of Object.entries(userAnswers)) {
    if (filteredQuestions[i] && filteredQuestions[i].a === ans) correct++;
  }
  const rate = answered > 0 ? Math.round(correct / answered * 100) : 0;

  el.innerHTML = `
    <div class="card" style="text-align:center;padding:40px">
      <div style="font-size:3em;font-weight:900;color:${rate >= 60 ? '#22c55e' : '#ef4444'}">${rate}%</div>
      <div style="font-size:1em;color:#94a3b8;margin-top:4px">答對 ${correct} / ${answered} 題</div>
      <div class="progress-bar" style="margin-top:16px;height:14px">
        <div class="progress-fill" style="width:${rate}%;background:${rate >= 60 ? '#22c55e' : '#ef4444'}"></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:24px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="renderSelect()">再練一次</button>
        <button class="btn btn-outline" onclick="window.location.href='../wrong/'">查看錯題本</button>
      </div>
    </div>
  `;
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', loadAllData);
