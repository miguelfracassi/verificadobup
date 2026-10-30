/* Carinha animada: expressões com morph numérico (funciona em qualquer navegador). */
(function () {
  const BROWN = '#3b2a1a';

  // Vetor: eyeL[0-5] eyeR[6-11] mouth[12-23] mouthFill[24] eyeOp[25] blush[26] hearts[27] zzz[28] q[29] eyeW[30] browTilt[31]
  const open = (x) => [x, 80, x, 87, x, 94];
  const E = {
    open: [...[70, 81, 70, 88, 70, 95], ...[130, 81, 130, 88, 130, 95]],
    happy: [58, 93, 70, 71, 82, 93, 118, 93, 130, 71, 142, 93],
    closed: [58, 85, 70, 98, 82, 85, 118, 85, 130, 98, 142, 85],
    wink: [58, 93, 70, 71, 82, 93, 130, 81, 130, 88, 130, 95].concat(),
    wide: [70, 72, 70, 85, 70, 100, 130, 72, 130, 85, 130, 100],
    worried: [58, 93, 70, 86, 82, 79, 142, 93, 130, 86, 118, 79],
  };
  // wink: olho esquerdo ^ e direito aberto (ordem certa)
  E.wink = [58, 93, 70, 71, 82, 93, 130, 81, 130, 88, 130, 95];
  E.winkR = [70, 81, 70, 88, 70, 95, 118, 93, 130, 71, 142, 93];

  const M = {
    smile: [68, 118, 85, 142, 115, 142, 132, 118, 115, 142, 85, 142],
    big: [60, 114, 85, 116, 115, 116, 140, 114, 128, 162, 72, 162],
    o: [100, 114, 120, 114, 120, 152, 100, 152, 80, 152, 80, 114],
    flat: [80, 128, 92, 128, 108, 128, 120, 128, 108, 128, 92, 128],
    sad: [72, 137, 88, 118, 112, 118, 128, 137, 112, 118, 88, 118],
    smirk: [74, 123, 92, 137, 118, 135, 132, 114, 118, 135, 92, 137],
    tiny: [100, 122, 108, 122, 108, 136, 100, 136, 92, 136, 92, 122],
    hmm: [78, 128, 90, 124, 110, 132, 122, 126, 110, 132, 90, 124],
  };

  // nome: [olhos, boca, fill, eyeOp, blush, hearts, zzz, q, eyeW]
  const X = {
    happy: [E.happy, M.smile, 0, 1, 0, 0, 0, 0, 9],
    cheer: [E.happy, M.big, 1, 1, 1, 0, 0, 0, 9],
    wink: [E.wink, M.smirk, 0, 1, 0, 0, 0, 0, 9],
    winkR: [E.winkR, M.smirk, 0, 1, 0, 0, 0, 0, 9],
    surprised: [E.wide, M.o, 1, 1, 0, 0, 0, 0, 10],
    love: [E.open, M.smile, 0, 0, 1, 1, 0, 0, 9],
    sleepy: [E.closed, M.tiny, 1, 1, 0, 0, 1, 0, 9],
    smirk: [E.open, M.smirk, 0, 1, 0, 0, 0, 0, 9],
    calm: [E.open, M.smile, 0, 1, 0, 0, 0, 0, 9],
    search: [E.open, M.hmm, 0, 1, 0, 0, 0, 1, 9],
    worried: [E.worried, M.sad, 0, 1, 0, 0, 0, 0, 9],
    hope: [E.open, M.smile, 0, 1, 1, 0, 0, 0, 9],
  };

  const pack = (x) => [...x[0], ...x[1], x[2], x[3], x[4], x[5], x[6], x[7], x[8]];
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const heart = (cx, cy) => `M${cx} ${cy + 12}C${cx - 22} ${cy - 2} ${cx - 12} ${cy - 20} ${cx} ${cy - 8}C${cx + 12} ${cy - 20} ${cx + 22} ${cy - 2} ${cx} ${cy + 12}Z`;

  window.createFace = function (host, opts = {}) {
    const uid = 'f' + Math.random().toString(36).slice(2, 7);
    host.innerHTML = `
<svg viewBox="0 0 200 200" role="img" aria-label="Carinha do Bloxter">
  <defs>
    <radialGradient id="${uid}g" cx="42%" cy="30%" r="75%">
      <stop offset="0" stop-color="#FFE266"/><stop offset=".55" stop-color="#FFBE3D"/><stop offset="1" stop-color="#FFA126"/>
    </radialGradient>
    <filter id="${uid}s" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#7a4a00" flood-opacity=".28"/></filter>
  </defs>
  <g class="body" style="transform-origin:100px 100px">
    <circle cx="100" cy="100" r="92" fill="#fff" filter="url(#${uid}s)"/>
    <circle cx="100" cy="100" r="84" fill="url(#${uid}g)"/>
    <g class="feat">
      <ellipse class="blush" cx="52" cy="112" rx="13" ry="8" fill="#FF7A59" opacity="0"/>
      <ellipse class="blush" cx="148" cy="112" rx="13" ry="8" fill="#FF7A59" opacity="0"/>
      <path class="eL" fill="none" stroke="${BROWN}" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="eR" fill="none" stroke="${BROWN}" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="hL" d="${heart(70, 88)}" fill="#FF3D6E" opacity="0"/>
      <path class="hR" d="${heart(130, 88)}" fill="#FF3D6E" opacity="0"/>
      <path class="mouth" stroke="${BROWN}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <text class="zzz" x="140" y="58" font-family="Poppins,Arial,sans-serif" font-weight="800" font-size="26" fill="${BROWN}" opacity="0">z<tspan font-size="19" dx="3" dy="-12">z</tspan></text>
    <text class="q" x="132" y="56" font-family="Poppins,Arial,sans-serif" font-weight="800" font-size="34" fill="${BROWN}" opacity="0">?</text>
  </g>
</svg>`;
    const $ = (s) => host.querySelector(s);
    const body = $('.body'), feat = $('.feat');
    const eL = $('.eL'), eR = $('.eR'), mouth = $('.mouth'), hL = $('.hL'), hR = $('.hR');
    const blush = host.querySelectorAll('.blush'), zzz = $('.zzz'), q = $('.q');

    let cur = pack(X[opts.expr || 'happy']);
    let from = cur.slice(), to = cur.slice(), t0 = 0, dur = 420, raf = 0, name = opts.expr || 'happy';
    const gaze = { x: 0, y: 0, tx: 0, ty: 0 };
    let tiltT = 0, tilt = 0;

    function render() {
      eL.setAttribute('d', `M${cur[0]} ${cur[1]}Q${cur[2]} ${cur[3]} ${cur[4]} ${cur[5]}`);
      eR.setAttribute('d', `M${cur[6]} ${cur[7]}Q${cur[8]} ${cur[9]} ${cur[10]} ${cur[11]}`);
      const m = cur.slice(12, 24);
      mouth.setAttribute('d', `M${m[0]} ${m[1]}C${m[2]} ${m[3]} ${m[4]} ${m[5]} ${m[6]} ${m[7]}C${m[8]} ${m[9]} ${m[10]} ${m[11]} ${m[0]} ${m[1]}Z`);
      mouth.setAttribute('fill', BROWN);
      mouth.setAttribute('fill-opacity', Math.max(0, Math.min(1, cur[24])).toFixed(3));
      const eyeOp = Math.max(0, Math.min(1, cur[25]));
      const w = cur[30];
      eL.setAttribute('stroke-width', w); eR.setAttribute('stroke-width', w);
      eL.setAttribute('opacity', eyeOp); eR.setAttribute('opacity', eyeOp);
      const hv = Math.max(0, Math.min(1, cur[27]));
      hL.setAttribute('opacity', hv); hR.setAttribute('opacity', hv);
      blush.forEach((b) => b.setAttribute('opacity', (Math.max(0, Math.min(1, cur[26])) * 0.55).toFixed(3)));
      zzz.setAttribute('opacity', Math.max(0, Math.min(1, cur[28])).toFixed(3));
      q.setAttribute('opacity', Math.max(0, Math.min(1, cur[29])).toFixed(3));
      feat.style.transform = `translate(${(gaze.x * 13).toFixed(2)}px, ${(gaze.y * 9).toFixed(2)}px)`;
      body.style.transform = `rotate(${tilt.toFixed(2)}deg)`;
    }

    function frame(now) {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / dur);
      const k = ease(p);
      for (let i = 0; i < cur.length; i++) cur[i] = from[i] + (to[i] - from[i]) * k;
      // olhar (suavizado)
      gaze.x += (gaze.tx - gaze.x) * 0.14; gaze.y += (gaze.ty - gaze.y) * 0.14;
      tilt += (tiltT - tilt) * 0.1;
      render();
      const settled = p >= 1 && Math.abs(gaze.tx - gaze.x) < 0.003 && Math.abs(gaze.ty - gaze.y) < 0.003 && Math.abs(tiltT - tilt) < 0.02;
      raf = settled ? 0 : requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const api = {
      set(n, ms = 420) {
        if (!X[n]) return;
        name = n; from = cur.slice(); to = pack(X[n]); t0 = 0; dur = ms; kick();
      },
      look(x, y, tiltDeg = 0) { gaze.tx = x; gaze.ty = y; tiltT = tiltDeg; kick(); },
      get name() { return name; },
      blink() {
        if (name === 'happy' || name === 'cheer' || name === 'wink' || name === 'winkR' || name === 'closed') return;
        const keep = name; const f = cur.slice();
        from = cur.slice(); to = pack(X[keep]); to.splice(0, 12, ...E.closed); to[25] = keep === 'love' ? 0 : 1; t0 = 0; dur = 90; kick();
        setTimeout(() => { from = cur.slice(); to = pack(X[keep]); t0 = 0; dur = 140; kick(); }, 130);
      },
      cycle(list, ms = 2300) {
        let i = 0;
        const step = () => { api.set(list[i % list.length]); i++; };
        step();
        const id = setInterval(step, ms);
        const bl = setInterval(() => api.blink(), 3100);
        return () => { clearInterval(id); clearInterval(bl); };
      },
      bounce() { body.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.09)' }, { transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(.3,1.6,.5,1)' }); },
    };
    render();
    // respiração suave
    body.animate([{ translate: '0 0' }, { translate: '0 -5px' }], { duration: 2400, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
    return api;
  };
})();
