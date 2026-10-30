buildBackground();

const face = createFace(document.getElementById('face'), { expr: 'happy' });
const EXPR = ['happy', 'wink', 'surprised', 'love', 'cheer', 'sleepy', 'smirk', 'winkR'];
let stopCycle = face.cycle(EXPR, 2200);
// a carinha acompanha o mouse/dedo
addEventListener('pointermove', (e) => {
  const r = document.getElementById('face').getBoundingClientRect();
  const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth, dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
  face.look(Math.max(-1, Math.min(1, dx * 2.2)), Math.max(-1, Math.min(1, dy * 2.2)), dx * 5);
}, { passive: true });

const form = document.getElementById('login');
const err = document.getElementById('err');
const go = document.getElementById('go');
const pass = form.elements.password;
document.getElementById('eye').addEventListener('click', () => { pass.type = pass.type === 'password' ? 'text' : 'password'; });

const MSG = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  account_banned: 'Essa conta está suspensa no Bloxter.',
  site_closed: 'O Bloxter está fechado no momento. Tente de novo mais tarde.',
  rate_limited: 'Muitas tentativas. Espere um minutinho.',
  invalid_input: 'Preencha o e-mail e a senha.',
  upstream_unavailable: 'Não consegui falar com o Bloxter agora. Tente de novo.',
};

// já está logado? vai direto
fetch('/api/session', { credentials: 'same-origin' }).then((r) => r.json()).then((d) => { if (d && d.user) location.replace('/verification'); }).catch(() => {});

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  err.textContent = '';
  const email = form.elements.email.value.trim(), password = pass.value;
  if (!email || !password) { err.textContent = MSG.invalid_input; face.set('worried'); return; }
  go.disabled = true; go.innerHTML = '<span class="spin"></span> Entrando…';
  stopCycle(); face.set('search');
  try {
    const r = await fetch('/api/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.error || 'erro'), { code: d.error });
    face.set('cheer'); face.bounce();
    setTimeout(() => location.assign('/verification'), 350);
  } catch (e) {
    err.textContent = MSG[e.code] || 'Não foi possível entrar. Confira os dados.';
    face.set('worried');
    go.disabled = false; go.textContent = 'Continuar';
    setTimeout(() => { face.set('happy'); stopCycle = face.cycle(EXPR, 2200); }, 1800);
  }
});
