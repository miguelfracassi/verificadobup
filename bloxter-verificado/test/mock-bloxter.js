// "Bloxter de mentira" para testar sem mexer no site de verdade: node test/mock-bloxter.js (porta 4010)
const http = require('node:http');
const day = (n, h = 15) => new Date(Date.now() - n * 864e5 + (h - 12) * 36e5).toISOString();
const users = {
  'maria@x.com': { id: 1, username: 'maria', name: 'Maria Souza', verified: false, posts: [day(0)], reposts: [], comments: [] },
  'joao@x.com':  { id: 2, username: 'joao', name: 'João Lima', verified: false, posts: [day(0), day(1), day(1, 20)], reposts: [day(0), day(1)], comments: [] },
  'vera@x.com':  { id: 3, username: 'vera', name: 'Vera Alves', verified: true, posts: [], reposts: [], comments: [] },
  'caio@x.com':  { id: 4, username: 'caio', name: 'Caio Prado', verified: false, posts: [day(0), day(2)], reposts: [], comments: [day(0), day(2)] },
};
const byName = (n) => Object.values(users).find((u) => u.username === n);
const sessions = {};
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const json = (s, d, h = {}) => { res.writeHead(s, { 'Content-Type': 'application/json', ...h }); res.end(JSON.stringify(d)); };
  let raw = ''; req.on('data', (c) => (raw += c));
  req.on('end', () => {
    const body = raw ? JSON.parse(raw) : {};
    const sess = /bx_session=([^;]+)/.exec(req.headers.cookie || '')?.[1];
    const me = sess && sessions[sess];
    const p = url.pathname.replace(/^\/api\//, '').split('/');
    const pub = (u) => ({ id: u.id, username: u.username, name: u.name, verified: u.verified, avatar: null });
    if (p[0] === 'auth' && p[1] === 'login') {
      const u = users[body.identifier];
      if (!u || body.password !== 'senha123') return json(401, { error: 'invalid_credentials' });
      const t = 'tok' + Math.random().toString(36).slice(2); sessions[t] = u;
      return json(200, { user: pub(u) }, { 'Set-Cookie': `bx_session=${t}; Path=/; HttpOnly; SameSite=Lax; Secure` });
    }
    if (p[0] === 'me' && !p[1]) return json(200, { user: me ? pub(me) : null });
    if (p[0] === 'me' && p[1] === 'verified') { if (!me) return json(401, { error: 'unauthorized' }); if (process.env.CLOSED) return json(403, { error: 'verified_offer_closed' }); me.verified = true; return json(200, { ok: true, verified: true }); }
    if (p[0] === 'users' && p[2] === 'posts') { const u = byName(p[1]); return json(200, { posts: u.posts.map((c, i) => ({ id: 100 + i, created_at: c })), more: false }); }
    if (p[0] === 'users' && p[2] === 'reposts') { const u = byName(p[1]); return json(200, { posts: u.reposts.map((c, i) => ({ id: 9 + i, repost_at: c })), more: false, next_cursor: null }); }
    if (p[0] === 'bot' && p[1] === 'comments') { if (req.headers['x-api-key'] !== 'bx_bot_test') return json(401, { error: 'invalid_api_key' }); const u = byName(url.searchParams.get('username')); return json(200, { comments: (u ? u.comments : []).map((c, i) => ({ id: i + 1, created_at: c })), next_before: null }); }
    json(404, { error: 'not_found' });
  });
}).listen(4010, () => console.log('Mock do Bloxter em http://localhost:4010'));
