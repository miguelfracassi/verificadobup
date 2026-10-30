// API do site de verificação. Uma função só (Vercel) — também usada pelo server.js local.
// Fala com a API do Bloxter pelo servidor: a senha e a sessão nunca ficam no JavaScript do navegador.

const BASE = () => String(process.env.BLOXTER_BASE || 'https://bloxter.sbs').replace(/\/+$/, '');
const REQUIRED_DAYS = () => Math.max(1, parseInt(process.env.REQUIRED_DAYS, 10) || 2);
const TZ = () => process.env.TZ_NAME || 'America/Sao_Paulo';
const BOT_KEY = () => process.env.BLOXTER_BOT_KEY || '';      // opcional: lê comentários (bx_bot_...)
const ADMIN_KEY = () => process.env.BLOXTER_ADMIN_KEY || '';  // opcional: dá o selo pela API de administração (bx_admin_...)
const COOKIE = 'bxv';
const SESSION_TTL = 60 * 60; // 1 hora

class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

// ---------- utilidades ----------
function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return out;
}
function isLocal(req) { return /^(localhost|127\.0\.0\.1)(:|$)/.test(String(req.headers.host || '')); }
function setCookie(res, req, value, maxAge) {
  const flags = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isLocal(req) ? '' : '; Secure'}`;
  res.setHeader('Set-Cookie', `${COOKIE}=${value}; ${flags}`);
}
function readBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') { try { return JSON.parse(b); } catch { return {}; } }
  return b;
}
function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

// limite simples de tentativas de login por IP (memória do processo)
const buckets = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) { buckets.set(key, hits); return false; }
  hits.push(now); buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear();
  return true;
}
function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
}

// ---------- chamadas ao Bloxter ----------
async function upstream(path, { method = 'GET', body, session, headers = {} } = {}) {
  const h = { Accept: 'application/json', ...headers };
  if (body) h['Content-Type'] = 'application/json';
  if (session) h.Cookie = `bx_session=${session}`;
  let r;
  try {
    r = await fetch(BASE() + '/api/' + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000) });
  } catch {
    throw new HttpError(502, 'upstream_unavailable');
  }
  const data = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok, data, headers: r.headers };
}

function sessionFrom(r) {
  const list = typeof r.headers.getSetCookie === 'function' ? r.headers.getSetCookie() : [r.headers.get('set-cookie') || ''];
  for (const c of list) {
    const m = /(?:^|,\s*)bx_session=([^;]+)/.exec(c);
    if (m && m[1] && m[1] !== '' && !/Max-Age=0/i.test(c)) return m[1];
  }
  return '';
}

const dayKey = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ(), year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};

// percorre as páginas de uma lista e junta as datas
async function collect(fetchPage, getDate, { pages }) {
  const days = []; let cursor = null;
  for (let i = 0; i < pages; i++) {
    const page = await fetchPage(cursor);
    if (!page) break;
    page.items.forEach((it) => { const k = dayKey(getDate(it)); if (k) days.push(k); });
    if (!page.next) break;
    cursor = page.next;
  }
  return days;
}

async function analyze(session, user) {
  const u = encodeURIComponent(user.username);
  const posts = await collect(async (before) => {
    const r = await upstream(`users/${u}/posts${before ? `?before=${before}` : ''}`, { session });
    if (!r.ok) return null;
    const items = r.data.posts || [];
    return { items, next: r.data.more && items.length ? items[items.length - 1].id : null };
  }, (p) => p.created_at, { pages: 10 });

  const reposts = await collect(async (before) => {
    const r = await upstream(`users/${u}/reposts${before ? `?before=${before}` : ''}`, { session });
    if (!r.ok) return null;
    return { items: r.data.posts || [], next: r.data.more ? r.data.next_cursor : null };
  }, (p) => p.repost_at, { pages: 6 });

  let comments = [], commentsOk = false;
  if (BOT_KEY()) {
    comments = await collect(async (before) => {
      const r = await upstream(`bot/comments?username=${u}&limit=100${before ? `&before=${before}` : ''}`, { headers: { 'X-API-Key': BOT_KEY() } });
      if (!r.ok) return null;
      commentsOk = true;
      return { items: r.data.comments || [], next: r.data.next_before };
    }, (c) => c.created_at, { pages: 5 });
  }

  const postDays = new Set(posts);
  const interactionDays = new Set([...reposts, ...comments]);
  const need = REQUIRED_DAYS();
  return {
    required_days: need,
    post_days: postDays.size,
    interaction_days: interactionDays.size,
    totals: { posts: posts.length, reposts: reposts.length, comments: comments.length },
    interactions_partial: !commentsOk,
    eligible: postDays.size >= need && interactionDays.size >= need,
  };
}

async function grantBadge(session, user) {
  if (ADMIN_KEY()) {
    const r = await upstream(`admin/users/${encodeURIComponent(user.username)}`, { method: 'PATCH', body: { verified: true }, headers: { 'X-Admin-Key': ADMIN_KEY() } });
    return r.ok ? 'verified' : 'error';
  }
  const r = await upstream('me/verified', { method: 'POST', session, body: {} });
  if (r.ok) return 'verified';
  if (r.status === 403 && r.data.error === 'verified_offer_closed') return 'closed';
  return 'error';
}

const publicUser = (u) => ({ id: u.id, username: u.username, name: u.name || u.username, avatar: u.avatar ? BASE() + u.avatar : null, verified: !!u.verified });

// ---------- rotas ----------
async function currentUser(req) {
  const session = parseCookies(req)[COOKIE];
  if (!session) throw new HttpError(401, 'unauthorized');
  const r = await upstream('me', { session });
  if (r.status === 403 && r.data.error === 'site_closed') throw new HttpError(503, 'site_closed');
  if (!r.ok || !r.data.user) throw new HttpError(401, 'unauthorized');
  return { session, user: r.data.user };
}

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    let route = url.searchParams.get('__p');
    if (route == null) route = url.pathname.replace(/^\/api\/?/, '');
    route = route.replace(/^\/+|\/+$/g, '');

    if (route === 'health') return send(res, 200, { ok: true, base: BASE(), comments_enabled: !!BOT_KEY(), required_days: REQUIRED_DAYS() });

    if (route === 'login' && req.method === 'POST') {
      if (!rateLimit('login:' + clientIp(req), 10, 60_000)) throw new HttpError(429, 'rate_limited');
      const d = readBody(req);
      const email = typeof d.email === 'string' ? d.email.trim().toLowerCase().slice(0, 254) : '';
      const password = typeof d.password === 'string' ? d.password.slice(0, 200) : '';
      if (!email || !password) throw new HttpError(400, 'invalid_input');
      const r = await upstream('auth/login', { method: 'POST', body: { identifier: email, password } });
      if (!r.ok) {
        const code = r.data && r.data.error;
        if (r.status === 401) throw new HttpError(401, 'invalid_credentials');
        if (code === 'account_banned') throw new HttpError(403, 'account_banned');
        if (code === 'site_closed') throw new HttpError(503, 'site_closed');
        throw new HttpError(502, 'upstream_unavailable');
      }
      const session = sessionFrom(r);
      if (!session || !/^[A-Za-z0-9._~+/=-]+$/.test(session)) throw new HttpError(502, 'upstream_unavailable');
      setCookie(res, req, session, SESSION_TTL);
      return send(res, 200, { user: publicUser(r.data.user) });
    }

    if (route === 'session' && req.method === 'GET') {
      try { const { user } = await currentUser(req); return send(res, 200, { user: publicUser(user) }); }
      catch (e) { if (e instanceof HttpError && e.status === 401) return send(res, 200, { user: null }); throw e; }
    }

    if (route === 'check' && req.method === 'POST') {
      const { session, user } = await currentUser(req);
      if (user.verified) return send(res, 200, { status: 'already_verified', user: publicUser(user), required_days: REQUIRED_DAYS() });
      const a = await analyze(session, user);
      const base = { user: publicUser(user), ...a };
      if (!a.eligible) return send(res, 200, { status: 'not_yet', ...base });
      const g = await grantBadge(session, user);
      if (g === 'verified') return send(res, 200, { status: 'verified', ...base });
      if (g === 'closed') return send(res, 200, { status: 'eligible_closed', ...base });
      throw new HttpError(502, 'upstream_unavailable');
    }

    if (route === 'logout' && req.method === 'POST') {
      setCookie(res, req, '', 0);
      return send(res, 200, { ok: true });
    }

    throw new HttpError(404, 'not_found');
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.code });
    console.error('erro:', e && e.message);
    return send(res, 500, { error: 'server' });
  }
};
