/* Fundo: blobs + grade (CSS) e elementos flutuantes (SVG). Chame buildBackground() uma vez. */
(function () {
  const INK = 'currentColor';

  const svg = {
    cube: (s) => `<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="22" fill="#FFD23F" stroke="#E0A800" stroke-width="7"/><text x="50" y="72" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="800" font-size="66" fill="#fff">?</text></svg>`,
    dice: (s) => `<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="22" fill="#fff" stroke="#CFCFD4" stroke-width="6"/><circle cx="32" cy="30" r="7" fill="${INK}"/><circle cx="50" cy="50" r="7" fill="${INK}"/><circle cx="68" cy="70" r="7" fill="${INK}"/></svg>`,
    sparkleY: () => `<svg viewBox="-12 -12 24 24"><path d="M0-10C.9-3.5 3.5-.9 10 0 3.5.9.9 3.5 0 10-.9 3.5-3.5.9-10 0-3.5-.9-.9-3.5 0-10Z" fill="#FFC928" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    sparkleW: () => `<svg viewBox="-12 -12 24 24"><path d="M0-10C.9-3.5 3.5-.9 10 0 3.5.9.9 3.5 0 10-.9 3.5-3.5.9-10 0-3.5-.9-.9-3.5 0-10Z" fill="#fff" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    squiggle: () => `<svg viewBox="0 0 120 70"><path d="M6 62 L30 12 L48 52 L72 8 L84 40 L112 26" fill="none" stroke="#FF4FA3" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    spiral: () => `<svg viewBox="0 0 100 100" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"><path d="M50 4A46 46 0 1 0 96 50"/><path d="M50 22A28 28 0 1 0 78 50"/><circle cx="50" cy="50" r="7" stroke-width="7"/></svg>`,
    square: (c) => `<svg viewBox="0 0 10 10"><rect width="10" height="10" rx="1" fill="${c}"/></svg>`,
  };

  // [tipo, x%, y%, tamanho px, rotação, extra]
  const items = [
    ['cube', 7, 16, 92, -14, { t: 7, d: 0 }],
    ['cube', 31, 74, 46, 12, { t: 6, d: 1.2, cls: 'hide-sm' }],
    ['dice', 90, 13, 88, 14, { t: 8, d: .6 }],
    ['dice', 74, 80, 54, -12, { t: 7, d: 2, cls: 'hide-sm' }],
    ['squiggle', 88, 70, 112, 0, { t: 6, d: .4 }],
    ['spiral', 8, 76, 96, 0, { spin: 26 }],
    ['sparkleY', 19, 47, 54, 0, { twinkle: 3.2, d: .3 }],
    ['sparkleY', 31, 8, 38, 0, { twinkle: 2.8, d: 1 }],
    ['sparkleY', 70, 10, 38, 0, { twinkle: 3.6, d: .7, cls: 'hide-sm' }],
    ['sparkleY', 48, 90, 46, 0, { twinkle: 3, d: 1.6 }],
    ['sparkleW', 48, 6, 44, 0, { twinkle: 3.4, d: .2, cls: 'hide-sm' }],
    ['sparkleW', 82, 42, 46, 0, { twinkle: 3.1, d: 1.1 }],
    ['sparkleW', 60, 92, 40, 0, { twinkle: 2.6, d: .9, cls: 'hide-sm' }],
    ['sparkleW', 4, 40, 36, 0, { twinkle: 3.3, d: 1.8, cls: 'hide-sm' }],
  ];
  const confetti = [
    ['#FF4FA3', 21, 12, 16], ['#FFD23F', 4, 28, 14], ['#15110d', 51, 30, 14], ['#FF4FA3', 38, 44, 14],
    ['#A3C1FF', 44, 56, 14], ['#FFD23F', 66, 66, 16], ['#FF4FA3', 96, 50, 14], ['#15110d', 14, 62, 12],
    ['#A3C1FF', 78, 22, 12], ['#FFD23F', 56, 14, 12],
  ];

  function el(html, x, y, size, rot, o) {
    const d = document.createElement('div');
    d.className = 'el' + (o.spin ? ' spin' : '') + (o.twinkle ? ' twinkle' : '') + (o.cls ? ' ' + o.cls : '');
    d.style.left = x + '%'; d.style.top = y + '%';
    d.style.width = size + 'px'; d.style.height = size * (o.h || 1) + 'px';
    d.style.marginLeft = -size / 2 + 'px'; d.style.marginTop = -size / 2 + 'px';
    d.style.setProperty('--r0', rot - 6 + 'deg'); d.style.setProperty('--r1', rot + 6 + 'deg');
    d.style.setProperty('--dx', (Math.random() * 14 - 7).toFixed(1) + 'px');
    d.style.setProperty('--dy', (-10 - Math.random() * 14).toFixed(1) + 'px');
    d.style.setProperty('--t', (o.spin || o.twinkle || o.t || 7) + 's');
    d.style.setProperty('--d', (o.d || 0) + 's');
    d.innerHTML = html;
    return d;
  }

  window.buildBackground = function () {
    const bg = document.createElement('div');
    bg.className = 'bg';
    bg.setAttribute('aria-hidden', 'true');
    items.forEach(([type, x, y, size, rot, o]) => {
      const e = el(svg[type](), x, y, size, rot, o);
      if (type === 'squiggle') e.style.height = size * 0.6 + 'px';
      bg.appendChild(e);
    });
    confetti.forEach(([c, x, y, s], i) => {
      const e = el(svg.square(c), x, y, s * 0.7, i * 23, { t: 8 + (i % 4), d: i * 0.4, cls: 'conf' + (i % 2 ? ' hide-sm' : '') });
      bg.appendChild(e);
    });
    document.body.prepend(bg);
  };
})();
