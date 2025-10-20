:root{
  --bg:#f6f7fb; --panel:#ffffff; --ink:#111827; --muted:#6b7280;
  --primary:#0b5cab; --primary-ink:#ffffff; --ring:rgba(11,92,171,.25);
  --radius:16px; --shadow:0 10px 30px rgba(0,0,0,.07);
}
*{box-sizing:border-box} html,body{height:100%}
body{margin:0;font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:var(--ink);background:var(--bg)}

.container{max-width:960px;margin:0 auto;padding:24px}
.site-header{background:linear-gradient(180deg,#0b5cab,#0b5cab 60%,#0b5cab10);color:#fff;padding:24px 0 10px}
.site-header h1{margin:0}
.tagline{margin:.35rem 0 0;opacity:.9}
.tabs{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.tab{background:#ffffff22;border:1px solid #ffffff33;color:#fff;padding:8px 12px;border-radius:10px;cursor:pointer}
.tab.active{background:#fff;color:#0b5cab;font-weight:700}
.progress{margin-top:8px;display:flex;gap:16px;opacity:.95;flex-wrap:wrap}

.card{background:var(--panel);border-radius:var(--radius);box-shadow:var(--shadow);padding:20px;margin-top:-24px;border:1px solid #eef1f6}
.hidden{display:none}

.controls{display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap}
input,select,button{font:inherit;padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px}
input:focus,select:focus,button:focus{outline:3px solid var(--ring);border-color:transparent}

.term-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.term-card{border:1px solid #eef1f6;border-radius:12px;padding:14px}
.term-card .term{font-weight:700}
.term-card .meta{font-size:.9rem;color:var(--muted)}
.term-card .actions{margin-top:8px;display:flex;gap:8px}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.8rem;background:#eef;color:#0b5cab}

.btn{display:inline-block;background:var(--primary);color:var(--primary-ink);padding:10px 14px;border-radius:10px;font-weight:600;border:0;box-shadow:0 2px 10px var(--ring);text-decoration:none;cursor:pointer}
.btn.ghost{background:#f3f4f6;color:#111;border:1px solid #e5e7eb;box-shadow:none}

.result{margin-top:12px;font-weight:700}
.correct{color:#166534} .incorrect{color:#991b1b}
.kv{font-size:.95rem;color:var(--muted)}

.scenario{border:1px solid #eef1f6;border-radius:12px;padding:14px;margin:10px 0}
.option{display:block;width:100%;text-align:left;margin-top:8px}

#confetti{position:fixed;inset:0;pointer-events:none}
@media (max-width:700px){ .container{padding:16px} .card{padding:16px} }
1:31
// ---- load data ----
async function loadJSON(path){ const r = await fetch(path); return r.json(); }
let TERMS=[], QUIZBANK=[], SCENARIOS=[];
// ---- utility ----
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const todayKey = () => Math.floor(Date.now()/(1000*60*60*24));
function save(key,val){ localStorage.setItem(key, JSON.stringify(val)); }
function read(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch{ return fallback } }
// ---- tabs ----
function setView(name){
  $$('.tab').forEach(t=>{
    const active = t.dataset.view===name;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  ['learn','quiz','scenarios'].forEach(v=>{
    $('#view-'+v).classList.toggle('hidden', v!==name);
  });
}
// ---- streak & scores ----
function updateStreak(){
  const last = read('lastDay', null);
  const today = todayKey();
  let streak = read('streak', 0);
  if (last === null || last === today) {
    // same day; no change
  } else if (last === today - 1) {
    streak += 1;
  } else {
    streak = 1;
  }
  save('streak', streak);
  save('lastDay', today);
  $('#streak').textContent = `:fire: ${streak}-day streak`;
}
function updateBest(score){
  const best = read('best', 0);
  if (score > best){ save('best', score); }
  const finalBest = Math.max(score, read('best', 0));
  $('#bestScore').textContent = `:sports_medal: Best: ${finalBest}/5`;
}
// ---- learn view ----
function pickDaily(terms){
  const day = todayKey();
  return terms[day % terms.length];
}
function termCard(t){
  return `
    <div class="term-card">
      <div class="term">${t.term}</div>
      <div class="meta">${t.category}</div>
      <p>${t.definition}</p>
      <p class="kv"><strong>Gov example:</strong> ${t.gov_example}</p>
      <div class="actions">
        <button class="btn ghost copy" data-id="${t.id}">Copy leader blurb</button>
        <span class="badge">#${t.id}</span>
      </div>
    </div>
  `;
}
function renderLearn(terms){
  // daily
  $('#daily-card').innerHTML = termCard(pickDaily(terms));
  // list
  const q = $('#search').value.trim().toLowerCase();
  const cat = $('#filter').value;
  const filtered = terms.filter(t =>
    (!cat || t.category===cat) &&
    (!q || (t.term+' '+t.definition+' '+t.gov_example+' '+t.leader_blurb).toLowerCase().includes(q))
  );
  $('#term-list').innerHTML = filtered.map(t=>`<li>${termCard(t)}</li>`).join('');
}
// ---- copy handler ----
document.body.addEventListener('click', async (e)=>{
  if (e.target.matches('.copy')){
    const card = e.target.closest('.term-card');
    const blurb = TERMS.find(x=>`#${x.id}`===card.querySelector('.badge').textContent).leader_blurb;
    try{
      await navigator.clipboard.writeText(blurb);
      e.target.textContent = 'Copied!';
      setTimeout(()=>e.target.textContent='Copy leader blurb', 1200);
    }catch{
      alert('Copy failed—select the text and copy.');
    }
  }
});
// ---- quiz view ----
function sample(arr,n){
  const a = [...arr]; const out=[];
  while (out.length<n && a.length){ out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); }
  return out;
}
let currentQuiz=[];
function renderQuiz(){
  currentQuiz = sample(QUIZBANK, 5);
  const html = currentQuiz.map((q,i)=>`
    <fieldset class="quiz-q">
      <legend><strong>Q${i+1}.</strong> ${q.q}</legend>
      ${q.choices.map((c,idx)=>`
        <label><input type="radio" name="q${i}" value="${idx}"> ${c}</label>
      `).join('<br/>')}
      <div class="explain hidden" id="exp${i}">${q.explain}</div>
    </fieldset>
  `).join('');
  $('#quiz-container').innerHTML = html;
  $('#quiz-result').textContent = '';
  $('#retry-quiz').classList.add('hidden');
}
function gradeQuiz(){
  let score=0;
  currentQuiz.forEach((q,i)=>{
    const choice = $(`input[name="q${i}"]:checked`);
    const correct = q.answerIndex;
    const exp = $(`#exp${i}`);
    if (!choice){ exp.classList.remove('hidden'); exp.classList.add('incorrect'); return; }
    const val = parseInt(choice.value,10);
    if (val===correct){ score++; exp.classList.remove('hidden'); exp.classList.add('correct'); }
    else { exp.classList.remove('hidden'); exp.classList.add('incorrect'); }
  });
  $('#quiz-result').textContent = `You scored ${score}/5`;
  updateBest(score);
  if (score===5) celebrate();
  $('#retry-quiz').classList.remove('hidden');
}
// ---- scenarios view ----
function scenarioCard(s){
  return `
    <div class="scenario">
      <h3>${s.title}</h3>
      <p>${s.prompt}</p>
      ${s.options.map((o,idx)=>`
        <button class="option btn ghost" data-sid="${s.id}" data-idx="${idx}">
          ${o.label}
        </button>
      `).join('')}
      <div class="result hidden" id="sr-${s.id}"></div>
    </div>
  `;
}
function renderScenarios(){
  const picked = sample(SCENARIOS, 3);
  $('#scenario-container').innerHTML = picked.map(s=>scenarioCard(s)).join('');
}
document.body.addEventListener('click',(e)=>{
  if (e.target.matches('.option')){
    const sid = e.target.dataset.sid;
    const idx = parseInt(e.target.dataset.idx,10);
    const s = SCENARIOS.find(x=>x.id===sid);
    const o = s.options[idx];
    const box = $(`#sr-${sid}`);
    const label = o.outcome==='safe' ? ':white_check_mark: Safe to Try' : ':warning: Needs Review';
    box.innerHTML = `<p>${label}: ${o.explanation}</p>`;
    box.classList.remove('hidden');
  }
});
// ---- confetti (tiny) ----
const confettiCanvas = $('#confetti');
const ctx = confettiCanvas.getContext('2d');
let particles=[];
function resize(){ confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight; }
addEventListener('resize', resize); resize();
function celebrate(){
  particles = Array.from({length:120}, ()=>({
    x: Math.random()*confettiCanvas.width,
    y: -10,
    vy: 2+Math.random()*4,
    vx: -2+Math.random()*4,
    r: 2+Math.random()*4
  }));
  animate();
}
function animate(){
  ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  particles.forEach(p=>{
    p.x += p.vx; p.y += p.vy; p.vy+=0.05;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  });
  particles = particles.filter(p=>p.y<confettiCanvas.height+10);
  if (particles.length) requestAnimationFrame(animate);
}
// ---- boot ----
async function init(){
  // tabs
  $$('.tab').forEach(t=> t.addEventListener('click', ()=> setView(t.dataset.view)));
  setView('learn');
  // load data
  [TERMS, QUIZBANK, SCENARIOS] = await Promise.all([
    loadJSON('data/terms.json'),
    loadJSON('data/quiz.json'),
    loadJSON('data/scenarios.json')
  ]);
  // learn
  $('#search').addEventListener('input', ()=>renderLearn(TERMS));
  $('#filter').addEventListener('change', ()=>renderLearn(TERMS));
  renderLearn(TERMS);
  // quiz
  $('#submit-quiz').addEventListener('click', gradeQuiz);
  $('#retry-quiz').addEventListener('click', renderQuiz);
  renderQuiz();
  // scenarios
  renderScenarios();
  // progress
  updateStreak();
  updateBest(read('best',0));
}
init();
