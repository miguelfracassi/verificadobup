buildBackground();

const $ = (s) => document.querySelector(s);
const face = createFace($('#face'), { expr: 'search' });
const statusEl = $('#status'), whoEl = $('#who'), resultEl = $('#result');
const REQUIRED_FALLBACK = 2;
const MIN_MS = 5000; // a "busca" dura pelo menos 5 segundos

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- animação de "pesquisando" ----------
const STEPS = ['Pesquisando', 'Verificando seus posts', 'Contando seus dias', 'Olhando suas interações'];
let stepTimer = 0, lookTimer = 0;
function setStatus(text, dots = true) {
  statusEl.innerHTML = `<span class="swap">${esc(text)}${dots ? '<span class="dots"></span>' : ''}</span>`;
}
function startSearching() {
  let i = 0;
  setStatus(STEPS[0]);
  stepTimer = setInterval(() => { i = (i + 1) % STEPS.length; setStatus(STEPS[i]); }, 1250);
  const dirs = [[-1, 0, -4], [1, 0, 4], [0, -1, 0], [-1, 0.7, -3], [1, -0.6, 3], [0, 0.9, 0], [1, 0.4, 4], [-1, -0.5, -4]];
  let d = 0;
  const go = () => { const [x, y, t] = dirs[d++ % dirs.length]; face.look(x, y, t); };
  go(); lookTimer = setInterval(go, 620);
}
function stopSearching() { clearInterval(stepTimer); clearInterval(lookTimer); face.look(0, 0, 0); }

// ---------- API ----------
async function api(path, method = 'GET') {
  const r = await fetch('/api/' + path, { method, credentials: 'same-origin', headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {}, body: method === 'POST' ? '{}' : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || 'erro'), { status: r.status, code: d.error });
  return d;
}

$('#out').addEventListener('click', async (e) => { e.preventDefault(); await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {}); location.assign('/'); });

// ---------- resultado ----------
function meter(label, have, need, hint) {
  const done = have >= need, pct = Math.min(100, Math.round((have / need) * 100));
  return `<div class="meter ${done ? 'done' : ''}"><div class="row"><span>${esc(label)}</span><span>${Math.min(have, need)}/${need} ${done ? '✓' : 'dias'}</span></div><div class="track"><div class="fill" data-w="${pct}"></div></div>${hint ? `<div class="note" style="text-align:left;margin:0">${esc(hint)}</div>` : ''}</div>`;
}

function fillMeters() { requestAnimationFrame(() => requestAnimationFrame(() => resultEl.querySelectorAll('.fill').forEach((f) => { f.style.width = f.dataset.w + '%'; }))); }

function confetti() {
  const box = document.createElement('div'); box.className = 'confetti'; document.body.appendChild(box);
  const colors = ['#FF4FA3', '#FFD23F', '#A3C1FF', '#FFA126', '#2bc48a', '#15110d'];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--x', (Math.random() * 240 - 120) + 'px');
    p.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
    p.style.animationDuration = 2.2 + Math.random() * 2 + 's';
    p.style.animationDelay = Math.random() * 0.6 + 's';
    p.style.borderRadius = i % 3 ? '2px' : '50%';
    box.appendChild(p);
  }
  setTimeout(() => box.remove(), 5500);
}

const HOW = (need) => `
<h3 class="h-title">Como fazer</h3>
<ol class="how">
  <li><div><b>Poste em ${need} dias diferentes</b><span>Publique pelo menos 1 post por dia, durante ${need} dias (não precisam ser seguidos).</span></div></li>
  <li><div><b>Interaja com a comunidade</b><span>Nesses mesmos dias, comente em posts de outras pessoas ou republique algo que você curtiu.</span></div></li>
  <li><div><b>Volte e verifique de novo</b><span>Quando completar os ${need} dias, toque em “Verificar de novo” e o selo é liberado.</span></div></li>
</ol>`;

function showNotYet(d) {
  const need = d.required_days || REQUIRED_FALLBACK;
  face.set('hope');
  setStatus(`Quase lá, ${d.user.name.split(' ')[0]}!`, false);
  resultEl.innerHTML = `<div class="glass">
    <h2>Você ainda não chegou lá</h2>
    <p class="lead">Para ganhar o verificado, você precisa ter <b>${need} dias postando e interagindo</b> no Bloxter.</p>
    <div class="meters">
      ${meter('Dias postando', d.post_days, need)}
      ${meter('Dias interagindo', d.interaction_days, need, d.interactions_partial ? 'Conta comentários e republicações.' : '')}
    </div>
    ${HOW(need)}
    <div class="actions">
      <a class="btn ghost" href="https://bloxter.sbs/home" target="_blank" rel="noopener">Abrir o Bloxter</a>
      <button class="btn" id="again" type="button">Verificar de novo</button>
    </div>
  </div>`;
  resultEl.classList.add('show');
  fillMeters();
  $('#again').addEventListener('click', run);
}

function showVerified(d, fresh) {
  face.set('cheer'); face.bounce();
  setStatus(fresh ? 'Parabéns! Você é verificado!' : 'Você já é verificado!', false);
  resultEl.innerHTML = `<div class="glass" style="text-align:center">
    <img class="badge" src="/verificado.png" alt="Selo de verificado">
    <h2>${fresh ? 'Selo liberado!' : 'Seu perfil já tem o selo'}</h2>
    <p class="lead">${fresh ? 'Você cumpriu os dias postando e interagindo. O selo já aparece no seu perfil.' : 'Nada para fazer por aqui. Continue postando e interagindo!'}</p>
    <div class="actions" style="grid-template-columns:1fr"><a class="btn" href="https://bloxter.sbs/account/${encodeURIComponent(d.user.username)}" target="_blank" rel="noopener">Ver meu perfil</a></div>
  </div>`;
  resultEl.classList.add('show');
  if (fresh) confetti();
}

function showEligibleClosed(d) {
  face.set('smirk');
  setStatus('Você cumpriu tudo!', false);
  resultEl.innerHTML = `<div class="glass">
    <h2>Requisitos cumpridos ✓</h2>
    <p class="lead">Você já tem os <b>${d.required_days} dias postando e interagindo</b>, mas a entrega do selo está pausada agora. Tente de novo mais tarde.</p>
    <div class="actions" style="grid-template-columns:1fr"><button class="btn" id="again" type="button">Verificar de novo</button></div>
  </div>`;
  resultEl.classList.add('show');
  $('#again').addEventListener('click', run);
}

function showError(e) {
  face.set('worried');
  const msg = e.code === 'site_closed' ? 'O Bloxter está fechado no momento.' : 'Não consegui falar com o Bloxter agora.';
  setStatus(msg, false);
  resultEl.innerHTML = `<div class="glass"><h2>Opa, algo deu errado</h2><p class="lead">Tente novamente em instantes.</p><div class="actions" style="grid-template-columns:1fr"><button class="btn" id="again" type="button">Tentar de novo</button></div></div>`;
  resultEl.classList.add('show');
  $('#again').addEventListener('click', run);
}

// ---------- fluxo ----------
let running = false;
async function run() {
  if (running) return;
  running = true;
  resultEl.classList.remove('show'); resultEl.innerHTML = '';
  face.set('search');
  startSearching();
  const started = Date.now();
  let data, error;
  try { data = await api('check', 'POST'); } catch (e) { error = e; }
  const wait = MIN_MS - (Date.now() - started);
  if (wait > 0) await sleep(wait);
  stopSearching();
  running = false;
  if (error) {
    if (error.status === 401) return location.replace('/');
    return showError(error);
  }
  whoEl.textContent = `@${data.user.username}`;
  if (data.status === 'already_verified') return showVerified(data, false);
  if (data.status === 'verified') return showVerified(data, true);
  if (data.status === 'eligible_closed') return showEligibleClosed(data);
  showNotYet(data);
}

run();
