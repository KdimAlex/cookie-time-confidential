/*!
 * Constellation Run — fly your ship through the constellation that matches
 * the name. 5 quick levels (~30 seconds), each a little faster and trickier.
 * Combines Asteroid Dodge (ship, asteroids, sound) with Star Match
 * (constellation drawings), in the same vector-glow style and palette.
 *
 * Usage (anywhere on a page):
 *   <div data-constellation-run></div>
 *   <script src="constellation-run.js"></script>
 *
 * Or mount manually (e.g. from React/Vue):
 *   const game = ConstellationRun.mount(document.getElementById('my-div'));
 *   game.destroy(); // when unmounting
 *
 * Background music plays only during a run. By default it loads
 * "soundtrack.mp3" next to this script; override with data-music="path.mp3"
 * or turn it off with data-music="none".
 */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var SCRIPT_BASE = (function () {
    var cs = document.currentScript;
    return cs && cs.src ? cs.src.replace(/[^\/]*$/, '') : '';
  })();

  // Brand palette
  // Line-art mission style: navy sky, flat planet blue, mint line art,
  // glowing cyan stars and dark-blue sparkles.
  var C = {
    bg: '#031133',
    deep: '#02091d',
    white: '#f8f9ea',
    green: '#7df194',
    blue: '#11295f',
    teal: '#5ecbe1',
    dark: '#1e4597'
  };
  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // ---------------------------------------------------------------------------
  // Presentation face. The kiosk draws its buttons and headings in this
  // grotesque (brand.css --ctc-font-grotesque). Stencil Pixel-7 stays in
  // ./fonts/ but is not loaded or drawn.
  // Pixel caps filled 950/1000 of the em; Avenir Next Bold caps are 708/1000.
  // FONT_SCALE keeps the existing size arguments at the same visual height.
  // ---------------------------------------------------------------------------
  var FONT_FAMILY = '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif';
  var FONT_SCALE = 950 / 708;
  function ensureGameFont() {
    /* System face. No @font-face. */
  }
  function applyFont(ctx, size) {
    ctx.font = '700 ' + (Math.round(size * FONT_SCALE * 10) / 10) + 'px ' + FONT_FAMILY;
  }

  function clean(str) {
    return String(str).toUpperCase()
      .replace(/[—–]/g, '-')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
  }
  function drawText(ctx, str, x, y, size, align) {
    str = clean(str);
    applyFont(ctx, size);
    ctx.textAlign = align || 'center';
    // Hang the ink on y. The grotesque has leading above its caps, so a
    // 'top' baseline would sit the letters lower than the pixel face did.
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = ctx.strokeStyle;
    var ascent = size * 0.95;
    if (ctx.measureText) {
      var box = ctx.measureText(str);
      if (box.actualBoundingBoxAscent) ascent = box.actualBoundingBoxAscent;
    }
    ctx.fillText(str, x, y + ascent);
  }
  function wrapText(ctx, str, size, maxW) {
    str = clean(str);
    applyFont(ctx, size);
    var words = str.split(' '), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  // ---------------------------------------------------------------------------
  // The five constellations (same data as star-match.js). Positions are real J2000 coordinates (RA in hours,
  // Dec in degrees) projected onto the sky, so each pattern looks like the real
  // thing. Each star: [label, RA hours, Dec degrees, magnitude, color]
  //   targets: stars to highlight [index, label]
  //   polaris: draw a "to Polaris" guide — 'pointers' (from the two outer bowl
  //            stars of the Big Dipper) or 'center' (from the middle of the shape)
  //   level:   [a, b, low] rotate so stars a->b lie level, with star `low` below
  //            the line (the sky turns through the night, so any rotation is
  //            true to life; this just shows Cassiopeia as a clear W)
  //   learn:   carousel description;  fact: explanation shown after answering
  // ---------------------------------------------------------------------------
  var STARS = [
    {
      id: 'ursa-major', name: 'Ursa Major', sub: 'The Big Dipper', color: '#f8f9ea',
      targets: [[0, 'Dubhe'], [1, 'Merak']], polaris: 'pointers',
      hint: 'A big spoon: a four-star bowl and a three-star handle',
      learn: 'The Big Dipper looks like a large spoon in the sky. It has a bowl made of four stars and a handle made of three. Follow the two outer stars of the bowl to find Polaris, the North Star.',
      fact: 'The Big Dipper is an asterism - a pattern inside Ursa Major, not a constellation of its own. Follow its two outer bowl stars to find Polaris, the North Star.',
      stars: [
        ['Dubhe', 11.0621, 61.751, 1.79, '#f8f9ea'], ['Merak', 11.0307, 56.382, 2.37], ['Phecda', 11.8972, 53.695, 2.44],
        ['Megrez', 12.2571, 57.033, 3.31], ['Alioth', 12.9005, 55.960, 1.77], ['Mizar', 13.3988, 54.925, 2.27],
        ['Alkaid', 13.7923, 49.313, 1.86]
      ],
      lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]]
    },
    {
      id: 'canis-major', name: 'Canis Major', sub: 'Home of Sirius', color: '#08cee4',
      targets: [[0, 'Sirius']],
      hint: 'A big dog wearing the brightest star in the night sky',
      learn: 'Canis Major represents a big dog in the sky. Sirius is its brightest star and the brightest star in the night sky.',
      fact: 'The dazzling star marks the big dog: Sirius, the brightest star in the night sky. It was one of the 57 navigation stars astronauts drilled at Morehead.',
      stars: [
        ['Sirius', 6.7525, -16.716, -1.46, '#08cee4'], ['Mirzam', 6.3783, -17.956, 1.98], ['Adhara', 6.9772, -28.972, 1.5],
        ['Wezen', 7.1397, -26.393, 1.84], ['Aludra', 7.4017, -29.303, 2.45], ['o2', 7.0503, -23.833, 3.0],
        ['Furud', 6.3386, -30.063, 3.0], ['iota', 6.9356, -17.054, 4.4], ['gamma', 7.0625, -15.633, 4.1], ['theta', 6.9031, -12.038, 4.1]
      ],
      lines: [[0, 1], [0, 7], [7, 9], [9, 8], [8, 7], [0, 5], [5, 3], [3, 2], [2, 6], [3, 4]]
    },
    {
      id: 'scorpius', name: 'Scorpius', sub: 'Home of Antares', color: '#42f489',
      targets: [[0, 'Antares']],
      hint: 'A curved body, a long curling tail and a reddish heart',
      learn: 'Scorpius looks like a scorpion, with a curved body and a long, curling tail. Antares is the reddish star near its center, often called the heart of the scorpion.',
      fact: 'Look for the curling tail and the red heart: Antares, whose name means "rival of Mars." Put it where the Sun is and it would swallow the orbit of Mars.',
      stars: [
        ['Antares', 16.4900, -26.432, 1.06, '#42f489'], ['sigma', 16.3531, -25.593, 2.9], ['tau', 16.5981, -28.216, 2.8],
        ['Acrab', 16.0906, -19.806, 2.6], ['Dschubba', 16.0056, -22.622, 2.3], ['pi', 15.9808, -26.114, 2.9],
        ['eps', 16.8361, -34.293, 2.3], ['mu', 16.8644, -38.047, 3.0], ['zeta', 16.9097, -42.362, 3.6],
        ['eta', 17.2025, -43.239, 3.3], ['Sargas', 17.6219, -42.998, 1.9], ['iota', 17.7931, -40.127, 3.0],
        ['kappa', 17.7081, -39.030, 2.4], ['Shaula', 17.5600, -37.104, 1.6], ['Lesath', 17.5128, -37.296, 2.7]
      ],
      lines: [[3, 4], [4, 5], [4, 1], [1, 0], [0, 2], [2, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14]]
    },
    {
      id: 'aquila', name: 'Aquila', sub: 'Home of Altair', color: '#f8f9ea',
      targets: [[0, 'Altair']],
      hint: 'An eagle with outstretched wings around a bright central star',
      learn: 'Aquila represents an eagle flying across the sky. Its stars resemble a body with outstretched wings, and Altair is its bright central star.',
      fact: 'Spot the bright star between two dimmer ones: that is Altair, the eagle\'s eye. With Vega and Deneb it forms the Summer Triangle.',
      stars: [
        ['Altair', 19.8464, 8.868, 0.76, '#f8f9ea'], ['Tarazed', 19.7711, 10.613, 2.7, '#08cee4'], ['Alshain', 19.9219, 6.407, 3.7],
        ['delta', 19.4250, 3.115, 3.4], ['zeta', 19.0903, 13.863, 3.0], ['theta', 20.1883, -0.821, 3.2],
        ['lambda', 19.1042, -4.882, 3.4], ['eta', 19.8744, 1.006, 3.9]
      ],
      lines: [[1, 0], [0, 2], [2, 7], [7, 5], [0, 3], [3, 6], [3, 4]]
    },
    {
      id: 'cassiopeia', name: 'Cassiopeia', sub: 'The W in the north', color: '#08cee4',
      targets: [], polaris: 'center', level: [4, 0, 1],
      hint: 'Five bright stars in a W (or M) shape, near the North Star',
      learn: 'Cassiopeia looks like a big W or M made of five bright stars. Its distinctive shape makes it easy to recognize in the northern sky, not far from Polaris.',
      fact: 'That zigzag W gives it away. Cassiopeia sits on the opposite side of Polaris from the Big Dipper, so when one is low in the sky, the other is high.',
      stars: [
        ['Caph', 0.1530, 59.150, 2.27], ['Schedar', 0.6751, 56.537, 2.24, '#08cee4'], ['Navi', 0.9451, 60.717, 2.15],
        ['Ruchbah', 1.4303, 60.235, 2.68], ['Segin', 1.9066, 63.670, 3.37]
      ],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4]]
    }
  ];
  var POLARIS = [2.5303, 89.264];

  // Gnomonic projection centred on each constellation, north up, east left
  // (as seen looking up at the sky). Result: points inside the unit circle.
  function vec(raH, decD) {
    var a = raH * 15 * Math.PI / 180, d = decD * Math.PI / 180;
    return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)];
  }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  STARS.forEach(function (def) {
    var vs = def.stars.map(function (s) { return vec(s[1], s[2]); });
    var c = [0, 0, 0];
    vs.forEach(function (v) { c[0] += v[0]; c[1] += v[1]; c[2] += v[2]; });
    c = norm(c);
    var e = norm([-c[1], c[0], 0]), n = cross(c, e);
    var pts = vs.map(function (v) { var t = dot(v, c); return [-dot(v, e) / t, -dot(v, n) / t]; });
    var pv = vec(POLARIS[0], POLARIS[1]), pt = dot(pv, c);
    var pp = [-dot(pv, e) / pt, -dot(pv, n) / pt];
    if (def.level) {
      var A = pts[def.level[0]], B = pts[def.level[1]];
      var ang = -Math.atan2(B[1] - A[1], B[0] - A[0]);
      var rot = function (q) { return [q[0] * Math.cos(ang) - q[1] * Math.sin(ang), q[0] * Math.sin(ang) + q[1] * Math.cos(ang)]; };
      pts = pts.map(rot); pp = rot(pp);
      if (pts[def.level[2]][1] < pts[def.level[0]][1]) { pts = pts.map(function (q) { return [-q[0], -q[1]]; }); pp = [-pp[0], -pp[1]]; }
    }
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach(function (p) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, maxD = 0;
    pts.forEach(function (p) { maxD = Math.max(maxD, Math.hypot(p[0] - cx, p[1] - cy)); });
    def.pts = pts.map(function (p) { return [(p[0] - cx) / maxD, (p[1] - cy) / maxD]; });
    if (def.polaris) {
      // direction (in the same projected frame) toward the North Star
      pp = [(pp[0] - cx) / maxD, (pp[1] - cy) / maxD];
      var from;
      if (def.polaris === 'pointers') {
        from = def.pts[0];                                   // Dubhe
        var d0 = [def.pts[0][0] - def.pts[1][0], def.pts[0][1] - def.pts[1][1]]; // Merak -> Dubhe
        var dl = Math.hypot(d0[0], d0[1]);
        def.guide = { from: from, dir: [d0[0] / dl, d0[1] / dl] };
      } else {
        from = [0, 0];
        def.pts.forEach(function (q) { from = [from[0] + q[0] / def.pts.length, from[1] + q[1] / def.pts.length]; });
        var d1 = [pp[0] - from[0], pp[1] - from[1]], l1 = Math.hypot(d1[0], d1[1]);
        def.guide = { from: from, dir: [d1[0] / l1, d1[1] / l1] };
      }
    }
  });

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function easeOut(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }

  // ---------------------------------------------------------------------------
  // Difficulty: one gate per level
  //   travel: seconds for the portals to reach the ship (lower = faster)
  //   rot:    max random rotation of each drawing (the real sky turns!)
  //   sway:   side-to-side drift of the portals
  //   rocks:  asteroids that cross during the approach
  // ---------------------------------------------------------------------------
  var LEVELS = [
    { travel: 4.0, rot: 0,    sway: 0,  rocks: 0, tag: 'WARM UP' },
    { travel: 3.5, rot: 0,    sway: 0,  rocks: 1, tag: 'WATCH FOR ROCKS' },
    { travel: 3.1, rot: 0.7,  sway: 0,  rocks: 2, tag: 'THE SKY IS TURNING' },
    { travel: 2.8, rot: 1.2,  sway: 50, rocks: 3, tag: 'MOVING TARGETS' },
    { travel: 2.5, rot: 1.6,  sway: 70, rocks: 4, tag: 'FULL SPEED' }
  ];
  var TOTAL = LEVELS.length;
  var INTRO = 1.3;   // level banner before the portals appear
  var AFTER = 1.1;   // result moment after crossing a gate

  var LAYOUTS = {
    wide: { W: 960, H: 540, ratio: '16 / 9', shipY: 462, gateR: 100, gateDX: 220 },
    tall: { W: 480, H: 800, ratio: '3 / 5', shipY: 680, gateR: 94, gateDX: 118 }
  };

  // ---------------------------------------------------------------------------
  // Game instance
  // ---------------------------------------------------------------------------
  function mount(root) {
    if (!root) throw new Error('ConstellationRun.mount: no element given');
    if (root.__constellationRun) return root.__constellationRun;

    ensureGameFont();

    var wrap = document.createElement('div');
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'application');
    wrap.setAttribute('aria-label', 'Constellation Run. Steer the ship left or right through the constellation that matches the name. Arrow keys, A and D, or drag.');
    var ws = wrap.style;
    ws.position = 'relative'; ws.width = '100%'; ws.height = '100%'; ws.background = C.bg; ws.overflow = 'hidden';
    ws.outline = 'none'; ws.userSelect = 'none'; ws.webkitUserSelect = 'none';
    ws.webkitTapHighlightColor = 'transparent'; ws.touchAction = 'pan-y'; ws.cursor = 'pointer';

    var canvas = document.createElement('canvas');
    var cs = canvas.style;
    cs.position = 'absolute'; cs.left = '0'; cs.top = '0'; cs.width = '100%'; cs.height = '100%'; cs.display = 'block';
    wrap.appendChild(canvas);
    var live = document.createElement('div');
    live.setAttribute('aria-live', 'polite');
    var ls = live.style;
    ls.position = 'absolute'; ls.width = '1px'; ls.height = '1px'; ls.overflow = 'hidden'; ls.clip = 'rect(0 0 0 0)'; ls.whiteSpace = 'nowrap';
    ls.fontFamily = FONT_FAMILY;
    wrap.appendChild(live);
    root.appendChild(wrap);
    var ctx = canvas.getContext('2d');
    function announce(m) { live.textContent = m; }

    var mqRM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduced = !!(mqRM && mqRM.matches);
    function onRM(e) { reduced = e.matches; }
    if (mqRM) { if (mqRM.addEventListener) mqRM.addEventListener('change', onRM); else if (mqRM.addListener) mqRM.addListener(onRM); }
    var isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    // ---- layout ----
    var L = LAYOUTS.wide, W = L.W, H = L.H, sx = 1, sy = 1, streaks = [];
    var isWide = true;
    function makeStreaks() {
      streaks = [];
      for (var i = 0; i < 120; i++) streaks.push({ x: rnd(0, W), y: rnd(0, H), z: rnd(0.25, 1), a: rnd(0.15, 0.6) });
    }
    function resize() {
      var r = wrap.getBoundingClientRect();
      var cssW = r.width, cssH = r.height;
      var base = cssW > 0 && cssW < 620 ? LAYOUTS.tall : LAYOUTS.wide;
      var nextH = base.H;
      if (cssW > 0 && cssH > 0) nextH = Math.max(base.H, base.W * (cssH / cssW));
      var nextShip = nextH - (base.H - base.shipY);
      if (isWide !== (base === LAYOUTS.wide) || Math.abs(H - nextH) > 0.5 || !streaks.length) {
        var fx = ship ? ship.x / W : 0.5;
        isWide = base === LAYOUTS.wide;
        L = { W: base.W, H: nextH, shipY: nextShip, gateR: base.gateR, gateDX: base.gateDX };
        W = L.W; H = L.H; makeStreaks();
        if (ship) ship.x = fx * W;
      }
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      sx = canvas.width / W; sy = canvas.height / H;
    }
    var ship = null;
    resize();
    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(wrap); else window.addEventListener('resize', resize);

    // ---- music (only during a run) ----
    var musicAttr = root.getAttribute('data-music');
    var music = null;
    if (musicAttr !== 'none') {
      music = new Audio(musicAttr || SCRIPT_BASE + 'soundtrack.mp3');
      music.loop = true; music.preload = 'auto'; music.volume = 0.28;
    }
    function musicPlay(fromStart) {
      if (!music || muted) return;
      if (fromStart) { try { music.currentTime = 0; } catch (e) { /* not loaded */ } }
      var pr = music.play();
      if (pr && pr.catch) pr.catch(function () { /* blocked or missing */ });
    }
    function musicStop(rewind) {
      if (!music) return;
      music.pause();
      if (rewind) { try { music.currentTime = 0; } catch (e) { /* ignore */ } }
    }

    // ---- state ----
    var state = 'title', clock = 0, stateT = 0;
    var order = [], results = [], li = 0, phase = 'intro', phaseT = 0, gate = null;
    var rocks = [], particles = [], debris = [], popup = null, shakeT = 0;
    var keys = { l: false, r: false };
    var drag = null, targetX = null;
    // An iframe often never gets an IntersectionObserver callback, so the
    // ratio stays 0 and the loop sits on the first frame (and a 0 reading
    // pauses a run). Embedded pages are on screen. Same fix as Guiding Stars.
    var embedded = window.parent !== window;
    var visibleRatio = embedded || typeof IntersectionObserver === 'undefined' ? 1 : 0;
    var runTime = 0;
    var titleRocks = [];
    for (var tr = 0; tr < 6; tr++) titleRocks.push(makeRock(rnd(0, 960), rnd(0, 540), rnd(14, 30), 0, 0));

    function setState(s) {
      state = s; stateT = 0;
      ws.touchAction = s === 'play' ? 'none' : 'pan-y';
      ws.cursor = s === 'play' ? 'default' : 'pointer';
    }
    function score() { var n = 0; for (var i = 0; i < results.length; i++) if (results[i] === 'hit') n++; return n; }

    function makeShape() {
      var n = 9 + ((Math.random() * 3) | 0), pts = [];
      var notch = Math.random() < 0.6 ? (Math.random() * n) | 0 : -1;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * TAU + rnd(-0.14, 0.14);
        var k = i === notch ? rnd(0.45, 0.6) : rnd(0.76, 1.0);
        pts.push([Math.cos(a) * k, Math.sin(a) * k]);
      }
      return pts;
    }
    function makeRock(x, y, r, vx, vy) { return { x: x, y: y, r: r, vx: vx, vy: vy, shape: makeShape(), rot: rnd(0, TAU), spin: rnd(-1.5, 1.5) }; }

    function newGame() {
      order = shuffle(STARS);
      results = []; for (var i = 0; i < TOTAL; i++) results.push('pending');
      ship = { x: W / 2, vx: 0, tilt: 0, tumble: 0, inv: 0, spin: 0 };
      rocks = []; particles = []; debris = []; popup = null; runTime = 0;
      keys.l = keys.r = false;
      li = 0;
      setState('play');
      startLevel();
      musicPlay(true);
    }

    function startLevel() {
      var lv = LEVELS[li], target = order[li];
      var others = STARS.filter(function (s) { return s !== target; });
      var decoy = others[(Math.random() * others.length) | 0];
      var correct = Math.random() < 0.5 ? 0 : 1;
      var defs = correct === 0 ? [target, decoy] : [decoy, target];
      gate = {
        target: target, defs: defs, correct: correct, chosen: -1,
        rot: [rnd(-lv.rot, lv.rot), rnd(-lv.rot, lv.rot)],
        swayPh: rnd(0, TAU), y: -L.gateR - 30, resolved: false, broken: false
      };
      gate.rockTimes = [];
      for (var k = 0; k < lv.rocks; k++) gate.rockTimes.push(lv.travel * (0.08 + 0.72 * (k + rnd(0.1, 0.9)) / lv.rocks));
      phase = 'intro'; phaseT = 0;
      sfx('level');
      announce('Level ' + (li + 1) + ' of ' + TOTAL + '. Find ' + target.name + '. Left: ? Right: ? Steer into the matching constellation.');
    }

    function gateX(side) {
      var lv = LEVELS[li];
      var sway = lv.sway ? Math.sin(clock * 1.6 + gate.swayPh) * lv.sway : 0;
      return W / 2 + (side === 0 ? -L.gateDX : L.gateDX) + sway;
    }

    function resolveGate() {
      var dl = Math.abs(ship.x - gateX(0)), dr = Math.abs(ship.x - gateX(1));
      var chosen = dl <= dr ? 0 : 1;
      gate.chosen = chosen; gate.resolved = true;
      var ok = chosen === gate.correct;
      results[li] = ok ? 'hit' : 'miss';
      var cx = gateX(chosen);
      if (ok) {
        burst(cx, gate.y, 34, C.green, 260);
        popup = { text: 'CORRECT!', color: C.green, t: 0 };
        sfx('correct');
        announce('Correct! That was ' + gate.target.name + '. Score ' + score() + ' of ' + TOTAL + '.');
      } else {
        shatter(cx, gate.y, L.gateR);
        gate.broken = true;
        popup = { text: 'MISSED!', color: C.teal, t: 0 };
        if (!reduced) shakeT = 0.3;
        sfx('wrong');
        announce('Missed. That was ' + gate.defs[chosen].name + '. ' + gate.target.name + ' was on the other side.');
      }
    }

    function burst(x, y, n, color, spd) {
      if (reduced) n = Math.min(n, 8);
      for (var i = 0; i < n; i++) {
        var a = rnd(0, TAU), s = rnd(spd * 0.25, spd), life = rnd(0.5, 1.1);
        particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life, max: life, c: Math.random() < 0.6 ? color : C.white });
      }
    }
    function shatter(x, y, r) {
      var n = 12;
      for (var i = 0; i < n; i++) {
        var a0 = i / n * TAU, a1 = (i + 1) / n * TAU, am = (a0 + a1) / 2;
        var s = reduced ? 30 : rnd(80, 200);
        debris.push({ x: x + Math.cos(am) * r, y: y + Math.sin(am) * r, cx: x, cy: y, r: r, a0: a0 - am, a1: a1 - am, am: am,
          vx: Math.cos(am) * s, vy: Math.sin(am) * s, spin: rnd(-4, 4), rot: 0, life: 0.9, max: 0.9 });
      }
    }

    function finish() {
      setState('over');
      musicStop(true);
      sfx(score() === TOTAL ? 'win' : 'lose');
      announce('Final score ' + score() + ' of ' + TOTAL + '.');
    }

    function pause() {
      if (state !== 'play') return;
      setState('paused');
      musicStop(false);
      keys.l = keys.r = false; drag = null; targetX = null;
    }

    // ---- update ----
    function scrollSpeed() {
      if (state !== 'play') return 40;
      var base = 140 + li * 45;
      if (phase === 'intro') base += 520 * Math.max(0, 1 - phaseT / 0.7) * (reduced ? 0.3 : 1); // warp in
      return base;
    }

    function update(dt) {
      clock += dt; stateT += dt;
      var spd = scrollSpeed();
      for (var i = 0; i < streaks.length; i++) {
        var st = streaks[i];
        if (i === 0) bgScroll += spd * 0.12 * dt;
        st.y += spd * st.z * dt;
        if (st.y > H + 20) { st.y -= H + 40; st.x = rnd(0, W); }
      }
      if (state === 'title' || state === 'over') {
        for (i = 0; i < titleRocks.length; i++) {
          var tr = titleRocks[i];
          tr.y += 25 * dt; tr.rot += tr.spin * 0.3 * dt;
          if (tr.y > H + tr.r) { tr.y = -tr.r; tr.x = rnd(0, W); }
        }
      }
      if (state !== 'play') return;
      runTime += dt;
      phaseT += dt;
      var lv = LEVELS[li];

      // ship
      if (ship.tumble > 0) {
        ship.tumble -= dt; ship.spin += dt * 14; ship.vx *= Math.pow(0.2, dt);
      } else {
        ship.spin = 0;
        var ax = 0;
        if (keys.l) ax -= 1; if (keys.r) ax += 1;
        if (targetX != null) { var dx = targetX - ship.x; if (Math.abs(dx) > 3) ax += clamp(dx / 45, -1, 1); }
        ax = clamp(ax, -1, 1);
        ship.vx += (ax * 2600 - ship.vx * 5.5) * dt;
      }
      ship.x += ship.vx * dt;
      if (ship.x < 28) { ship.x = 28; ship.vx = 0; } if (ship.x > W - 28) { ship.x = W - 28; ship.vx = 0; }
      ship.tilt = clamp(ship.vx / 470, -1, 1) * 0.45;
      if (ship.inv > 0) ship.inv -= dt;

      // gate
      var startY = -L.gateR - 30;
      var gSpeed = (L.shipY - startY) / lv.travel;
      if (phase === 'intro') {
        if (phaseT >= INTRO) { phase = 'approach'; phaseT = 0; }
      } else if (phase === 'approach') {
        gate.y = startY + gSpeed * phaseT;
        while (gate.rockTimes.length && phaseT >= gate.rockTimes[0]) {
          gate.rockTimes.shift();
          var rr = rnd(15, 26), rx = rnd(40, W - 40);
          // aim loosely at the ship's lane so rocks matter
          var tx = clamp(ship.x + rnd(-120, 120), 20, W - 20);
          var vy = gSpeed * rnd(1.25, 1.6), tt = (L.shipY + 40) / vy;
          rocks.push(makeRock(rx, -rr - 10, rr, (tx - rx) / tt, vy));
          sfx('rock');
        }
        if (phaseT >= lv.travel) { resolveGate(); phase = 'after'; phaseT = 0; }
      } else if (phase === 'after') {
        gate.y += gSpeed * dt;
        if (phaseT >= AFTER) {
          li++;
          if (li < TOTAL) startLevel(); else { finish(); return; }
        }
      }

      // asteroids
      for (i = rocks.length - 1; i >= 0; i--) {
        var r = rocks[i];
        r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.spin * dt;
        if (r.y > H + r.r + 20) { rocks.splice(i, 1); continue; }
        if (ship.inv <= 0 && ship.tumble <= 0 && Math.hypot(r.x - ship.x, r.y - L.shipY) < r.r * 0.8 + 11) {
          ship.tumble = 0.75; ship.inv = 1.6;
          ship.vx = (ship.x < r.x ? -1 : 1) * 380;
          burst(r.x, r.y, 14, C.teal, 160);
          rocks.splice(i, 1);
          if (!reduced) shakeT = 0.25;
          sfx('boom');
        }
      }
      for (i = particles.length - 1; i >= 0; i--) {
        var q = particles[i];
        q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.97; q.vy *= 0.97;
        if (q.life <= 0) particles.splice(i, 1);
      }
      for (i = debris.length - 1; i >= 0; i--) {
        var d = debris[i];
        d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.spin * dt;
        if (d.life <= 0) debris.splice(i, 1);
      }
      if (popup) { popup.t += dt; if (popup.t > AFTER) popup = null; }
      if (shakeT > 0) shakeT -= dt;
    }

    // ---- drawing ----
    function ink(c) { ctx.strokeStyle = c; ctx.shadowColor = rgba(c, (c === C.teal || c === C.blue) ? 0.7 : 0.85); }
    function glowOn(b) { ctx.shadowBlur = (b == null ? 5 : b) * sx * 0.35; }   // crisp line art, only a hint of glow
    function glowOff() { ctx.shadowBlur = 0; }

    function drawStarPoint(x, y, mag, color, alpha, boost) {
      var r = clamp(1.3 + (3.2 - mag) * 0.85, 1.0, 5.2) * (boost || 1);
      var g = ctx.createRadialGradient(x, y, 0, x, y, r * 4.2);
      g.addColorStop(0, color); g.addColorStop(0.25, color); g.addColorStop(1, rgba(color, 0));
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r * 4.2, 0, TAU); ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    function drawConstellation(def, cx, cy, R, rot, alpha) {
      var k = R * 0.76, c = Math.cos(rot || 0), s = Math.sin(rot || 0);
      var P = def.pts.map(function (p) { return [cx + (p[0] * c - p[1] * s) * k, cy + (p[0] * s + p[1] * c) * k]; });
      glowOff(); ink(C.green);
      ctx.lineWidth = R > 60 ? 1.3 : 1;
      ctx.globalAlpha = 0.9 * alpha;
      ctx.beginPath();
      for (var i = 0; i < def.lines.length; i++) {
        var a = P[def.lines[i][0]], b = P[def.lines[i][1]];
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      }
      ctx.stroke();
      ctx.globalAlpha = 1; glowOff();
      var small = R < 60 ? 0.55 : R < 90 ? 0.8 : 0.9;
      for (i = def.stars.length - 1; i >= 0; i--) {
        var st = def.stars[i];
        drawStarPoint(P[i][0], P[i][1], st[3], st[4] || C.teal, alpha, small);
      }
    }
    function drawRock(r, color) {
      var c = Math.cos(r.rot), s = Math.sin(r.rot), sh = r.shape;
      ink(color || C.teal);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (var i = 0; i < sh.length; i++) {
        var px = r.x + (sh[i][0] * c - sh[i][1] * s) * r.r, py = r.y + (sh[i][0] * s + sh[i][1] * c) * r.r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = C.blue; ctx.fill();
      ctx.stroke();
      // a couple of crater rings
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(r.x + c * r.r * 0.25, r.y + s * r.r * 0.25, r.r * 0.22, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(r.x - s * r.r * 0.3, r.y + c * r.r * 0.3, r.r * 0.14, 0, TAU); ctx.stroke();
    }
    function drawShip(x, y, a, thrust, sc) {
      sc = sc || 1;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(a); ctx.scale(sc, sc);
      var prevBlur = ctx.shadowBlur; ctx.shadowBlur = 0;
      if (thrust && (reduced || Math.random() < 0.85)) {
        var f = reduced ? 30 : rnd(26, 36);
        ctx.fillStyle = C.green;
        ctx.beginPath(); ctx.moveTo(-15, -8); ctx.quadraticCurveTo(-f, 0, -15, 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = C.teal;
        ctx.beginPath(); ctx.moveTo(-15, -4); ctx.quadraticCurveTo(-f * 0.7, 0, -15, 4); ctx.closePath(); ctx.fill();
      }
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = C.green; ctx.fillStyle = C.bg; ctx.lineWidth = 1.3;
      // body (truncated cone)
      ctx.beginPath(); ctx.moveTo(-14, -17); ctx.lineTo(11, -8); ctx.lineTo(11, 8); ctx.lineTo(-14, 17); ctx.closePath(); ctx.fill(); ctx.stroke();
      // nose
      ctx.beginPath(); ctx.moveTo(11, -6.5); ctx.lineTo(20, -5); ctx.quadraticCurveTo(22.5, 0, 20, 5); ctx.lineTo(11, 6.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      // ribs
      ctx.lineWidth = 0.8; ctx.globalAlpha *= 0.8;
      ctx.beginPath(); ctx.moveTo(11, -3); ctx.lineTo(-14, -7); ctx.moveTo(11, 3); ctx.lineTo(-14, 7); ctx.moveTo(-3, -12.5); ctx.quadraticCurveTo(-1, 0, -3, 12.5); ctx.stroke();
      ctx.globalAlpha /= 0.8;
      // heat shield: curved base + solid mint band
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(-14, -17); ctx.quadraticCurveTo(-22, 0, -14, 17); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.moveTo(-12, -16.2); ctx.quadraticCurveTo(-18.5, 0, -12, 16.2); ctx.lineTo(-14, 17); ctx.quadraticCurveTo(-21, 0, -14, -17); ctx.closePath(); ctx.fill();
      // lights + panels
      for (var i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(-7, i * 5, 1.1, 0, TAU); ctx.fill(); }
      ctx.fillRect(3, -5.5, 6, 2.6); ctx.fillRect(3, 3, 6, 2.6);
      // handles on the nose
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(18, -5.5); ctx.lineTo(16, -9); ctx.lineTo(13, -6.5); ctx.moveTo(18, 5.5); ctx.lineTo(16, 9); ctx.lineTo(13, 6.5); ctx.stroke();
      ctx.shadowBlur = prevBlur;
      ctx.restore();
    }

    function drawPortal(side) {
      var def = gate.defs[side], x = gateX(side), y = gate.y, R = L.gateR;
      var resolved = gate.resolved, isCorrect = side === gate.correct, isChosen = side === gate.chosen;
      if (resolved && isChosen && gate.broken) {
        // ring is shattered; the drawing fades
        drawConstellation(def, x, y, R, gate.rot[side], clamp(1 - phaseT * 1.5, 0, 1));
      } else {
        var ringColor = C.teal, pulse = 0;
        if (resolved && isCorrect) { ringColor = C.green; pulse = reduced ? 0 : Math.min(1, phaseT * 3) * 6; }
        ctx.fillStyle = C.bg; ctx.globalAlpha = 0.92;
        ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
        glowOn(resolved && isCorrect ? 10 : 5); ink(ringColor);
        ctx.lineWidth = resolved && isCorrect ? 2.6 : 2;
        ctx.beginPath(); ctx.arc(x, y, R + pulse, 0, TAU); ctx.stroke();
        // tick marks like the Star Match eyepiece
        ctx.globalAlpha = 0.45; ctx.lineWidth = 1;
        ctx.beginPath();
        for (var i = 0; i < 48; i++) {
          var a = i / 48 * TAU, l = i % 4 === 0 ? 8 : 4;
          ctx.moveTo(x + Math.cos(a) * R, y + Math.sin(a) * R);
          ctx.lineTo(x + Math.cos(a) * (R - l), y + Math.sin(a) * (R - l));
        }
        ctx.stroke(); ctx.globalAlpha = 1; glowOff();
        drawConstellation(def, x, y, R, gate.rot[side], resolved && !isCorrect ? 0.45 : 1);
      }
      if (resolved) {
        glowOn(5);
        ink(isCorrect ? C.green : C.white);
        ctx.globalAlpha = isCorrect ? 1 : 0.7;
        drawText(ctx, def.name, x, y - R - 26, 14, 'center');
        ctx.globalAlpha = 1; glowOff();
      }
    }

    function drawHUD() {
      // target name (always visible while the portals approach)
      if (phase !== 'intro' || phaseT > INTRO * 0.75) {
        var wide = isWide;
        glowOn(5);
        ink(C.teal);
        drawText(ctx, 'FIND', W / 2, wide ? 14 : 92, 11, 'center');
        ink(C.green);
        drawText(ctx, gate.target.name, W / 2, wide ? 32 : 110, wide ? 26 : 24, 'center');
        glowOff();
      }
    }

    // Mission-art sky: flat planets drifting past, glowing cyan dots, dark-blue
    // dots and outlined sparkles (they stretch into short streaks during warp).
    var bgScroll = 0;
    function sparkle(x, y, R) {
      var q = R * 0.12;
      ctx.beginPath();
      ctx.moveTo(x, y - R); ctx.quadraticCurveTo(x + q, y - q, x + R, y); ctx.quadraticCurveTo(x + q, y + q, x, y + R);
      ctx.quadraticCurveTo(x - q, y + q, x - R, y); ctx.quadraticCurveTo(x - q, y - q, x, y - R); ctx.closePath();
    }
    function drawStreaks() {
      var spd = scrollSpeed();
      var g = ctx.createRadialGradient(W * 0.15, 0, 0, W * 0.15, 0, Math.max(W, H) * 1.2);
      g.addColorStop(0, C.deep); g.addColorStop(0.55, C.bg); g.addColorStop(1, '#031338');
      ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
      // flat planets (slow parallax)
      var wide = isWide;
      var big = wide ? 230 : 200, span = H + big * 2 + 200;
      var by = ((bgScroll * 0.6 + (wide ? 20 : 120)) % span) - big;
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(W - (wide ? 40 : 10), by, big, 0, TAU); ctx.fill();
      var ry = ((bgScroll * 0.9 + (wide ? 380 : 560)) % (H + 260)) - 130, rx = wide ? 120 : 70;
      ctx.beginPath(); ctx.arc(rx, ry, 56, 0, TAU); ctx.fill();
      ctx.strokeStyle = C.blue; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.ellipse(rx, ry, 92, 24, -0.32, 0, TAU); ctx.stroke();
      // stars
      var len = clamp((spd - 140) * 0.05, 0, reduced ? 0 : 30);
      for (var i = 0; i < streaks.length; i++) {
        var s = streaks[i];
        var tw = reduced ? 1 : 0.65 + 0.35 * Math.sin(clock * (0.8 + s.z) + i);
        if (i % 13 === 0) {                       // outlined cyan sparkle
          ctx.globalAlpha = 0.85 * tw; ctx.strokeStyle = C.teal; ctx.lineWidth = 1.1;
          sparkle(s.x, s.y, 6 + s.z * 10); ctx.stroke();
        } else if (i % 5 === 0) {                 // dark-blue sparkle / dot
          ctx.globalAlpha = 0.9; ctx.fillStyle = C.dark;
          if (i % 2) { sparkle(s.x, s.y, 4 + s.z * 4); ctx.fill(); } else { ctx.beginPath(); ctx.arc(s.x, s.y, 2 + s.z * 1.5, 0, TAU); ctx.fill(); }
        } else if (s.z > 0.8) {                   // glowing cyan dot
          var r = 1 + s.z * 2.2;
          ctx.globalAlpha = 0.35 * tw; ctx.fillStyle = C.teal;
          ctx.beginPath(); ctx.arc(s.x, s.y, r * 2.6, 0, TAU); ctx.fill();
          ctx.globalAlpha = tw; ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, TAU); ctx.fill();
          if (len > 1) { ctx.strokeStyle = C.teal; ctx.lineWidth = r; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y - len * s.z); ctx.stroke(); }
        } else if (i % 3 === 0) {                 // faint far dot (sparse)
          ctx.globalAlpha = s.a * 0.8; ctx.fillStyle = C.teal;
          ctx.beginPath(); ctx.arc(s.x, s.y, 0.9, 0, TAU); ctx.fill();
          if (len > 1) { ctx.strokeStyle = C.teal; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x, s.y - len * s.z); ctx.stroke(); }
        }
      }
      ctx.globalAlpha = 1;
    }

    function drawCenterLines(lines) {
      // lines: [text, size, color, y]
      glowOn(5);
      for (var i = 0; i < lines.length; i++) { var l = lines[i]; ink(l[2]); ctx.globalAlpha = l[4] == null ? 1 : l[4]; drawText(ctx, l[0], W / 2, l[3], l[1], 'center'); }
      ctx.globalAlpha = 1; glowOff();
    }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      var shx = 0, shy = 0;
      if (shakeT > 0 && !reduced) { shx = rnd(-5, 5) * shakeT * 3; shy = rnd(-5, 5) * shakeT * 3; }
      ctx.setTransform(sx, 0, 0, sy, shx * sx, shy * sy);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      drawStreaks();
      var wide = isWide;

      // play, including the frozen sky after a run (no end card, no replay)
      if (phase !== 'intro') { drawPortal(0); drawPortal(1); }
      for (var i = 0; i < rocks.length; i++) drawRock(rocks[i]);
      // portal shards
      glowOn(6);
      for (i = 0; i < debris.length; i++) {
        var d = debris[i];
        ink(C.teal); ctx.lineWidth = 2;
        ctx.globalAlpha = Math.max(0, d.life / d.max);
        ctx.beginPath();
        ctx.arc(d.x - Math.cos(d.am) * d.r, d.y - Math.sin(d.am) * d.r, d.r, d.am + d.a0 + d.rot, d.am + d.a1 + d.rot);
        ctx.stroke();
      }
      ctx.globalAlpha = 1; glowOff();
      for (i = 0; i < particles.length; i++) {
        var q = particles[i];
        ctx.globalAlpha = Math.max(0, q.life / q.max);
        ctx.fillStyle = q.c;
        ctx.beginPath(); ctx.arc(q.x, q.y, 1.8, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ship
      var blink = ship.inv > 0 && ship.tumble <= 0 && Math.floor(clock * 12) % 2 === 0;
      if (!blink) {
        glowOn(6);
        drawShip(ship.x, L.shipY, -Math.PI / 2 + ship.tilt + ship.spin, state === 'play', 1.25);
        glowOff();
      }

      drawHUD();

      // level banner
      if (phase === 'intro') {
        var t = phaseT, ba = reduced ? 1 : Math.min(1, t / 0.25) * Math.min(1, (INTRO - t) / 0.25 + 0.2);
        var cy = wide ? 190 : 300;
        drawCenterLines([
          [LEVELS[li].tag, 13, C.teal, cy + (wide ? 56 : 52), ba],
          ['FIND: ' + gate.target.name, wide ? 26 : 22, C.green, cy + (wide ? 92 : 90), ba]
        ]);
      }
      if (popup) {
        var pa = clamp(1.2 - popup.t / AFTER, 0, 1);
        drawCenterLines([[popup.text, wide ? 30 : 28, popup.color, (wide ? 250 : 400) - (reduced ? 0 : popup.t * 20), pa]]);
      }
      if (state === 'paused') {
        ctx.globalAlpha = 0.6; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
        drawCenterLines([['PAUSED', 44, C.white, H / 2 - 50], [isTouch ? 'TAP TO RESUME' : 'PRESS SPACE TO RESUME', 18, C.teal, H / 2 + 20]]);
      }
    }

    // ---- sound ----
    var actx = null, master = null, noiseBuf = null, muted = false;
    function ensureAudio() {
      try {
        if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        actx = new AC();
        master = actx.createGain();
        master.gain.value = muted ? 0 : 1;
        var comp = actx.createDynamicsCompressor();
        comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
        master.connect(comp); comp.connect(actx.destination);
        noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
        var data = noiseBuf.getChannelData(0);
        for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      } catch (e) { actx = null; }
    }
    function tone(freq, dur, type, vol, delay, slideTo) {
      if (!actx || muted) return;
      var t = actx.currentTime + (delay || 0);
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.02);
    }
    function noise(dur, vol, cutoff, delay, endCutoff) {
      if (!actx || muted) return;
      var t = actx.currentTime + (delay || 0);
      var src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
      src.buffer = noiseBuf;
      f.type = 'lowpass'; f.frequency.setValueAtTime(cutoff, t);
      f.frequency.exponentialRampToValueAtTime(endCutoff || 80, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t); src.stop(t + dur);
    }
    function sfx(name) {
      if (!actx || muted) return;
      switch (name) {
        case 'level': noise(0.6, 0.45, 300, 0, 3000); tone(440, 0.09, 'square', 0.22, 0.05); tone(660, 0.12, 'square', 0.22, 0.17); break;
        case 'correct': [784, 988, 1319].forEach(function (f, i) { tone(f, 0.16, 'square', 0.3, i * 0.07); }); tone(1568, 0.4, 'sine', 0.3, 0.21); break;
        case 'wrong': noise(0.55, 0.9, 3200, 0, 200); tone(196, 0.25, 'sawtooth', 0.35, 0, 140); tone(147, 0.35, 'sawtooth', 0.35, 0.2, 100); break;
        case 'rock': tone(1200, 0.05, 'square', 0.1); break;
        case 'boom': noise(0.9, 0.9, 1400, 0, 60); tone(140, 0.5, 'sine', 0.7, 0, 40); break;
        case 'win': [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.28, 'square', 0.3, i * 0.13); }); break;
        case 'lose': [523, 659, 784].forEach(function (f, i) { tone(f, 0.24, 'square', 0.25, i * 0.14); }); break;
      }
    }
    function toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 1;
      if (muted) musicStop(false); else if (state === 'play') musicPlay(false);
    }

    // ---- input ----
    function primary() {
      ensureAudio();
      if (state === 'paused') { setState('play'); musicPlay(false); }
    }
    var MOVE = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r' };
    function isTyping(t) { return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }
    function onKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (state === 'play') {
        if (MOVE[e.code]) { keys[MOVE[e.code]] = true; e.preventDefault(); }
        else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault();
        else if (e.code === 'KeyP' || e.code === 'Escape') { pause(); e.preventDefault(); }
        else if (e.code === 'KeyM') toggleMute();
        return;
      }
      var t = e.target;
      var neutral = t === document.body || t === document.documentElement || wrap.contains(t);
      if (!neutral || visibleRatio < 0.55) return;
      if (e.code === 'Space' || (e.code === 'Enter' && wrap.contains(t))) { e.preventDefault(); primary(); }
      else if (e.code === 'KeyM') toggleMute();
    }
    function onKeyUp(e) { if (MOVE[e.code]) { keys[MOVE[e.code]] = false; if (state === 'play') e.preventDefault(); } }
    function toVirtual(e) {
      var r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
    }
    function onPointerDown(e) {
      var p = toVirtual(e);
      try { wrap.focus({ preventScroll: true }); } catch (err) { /* old browsers */ }
      if (p.x > W - 170 && p.y > H - 40) { ensureAudio(); toggleMute(); return; }
      if (state !== 'play') { primary(); return; }
      drag = { id: e.pointerId };
      targetX = clamp(p.x, 28, W - 28);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
    }
    function onPointerMove(e) {
      if (!drag || e.pointerId !== drag.id || state !== 'play') return;
      targetX = clamp(toVirtual(e).x, 28, W - 28);
      e.preventDefault();
    }
    function onPointerUp(e) { if (drag && e.pointerId === drag.id) { drag = null; targetX = null; } }
    function onBlur() { pause(); keys.l = keys.r = false; }
    function onVisibility() { if (!embedded && document.hidden) pause(); }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    var io = null;
    if (!embedded && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(function (entries) {
        visibleRatio = entries[entries.length - 1].intersectionRatio;
        if (visibleRatio < 0.35) pause();
      }, { threshold: [0, 0.2, 0.35, 0.55, 0.75, 1] });
      io.observe(wrap);
    }

    // ---- loop ----
    var last = performance.now(), raf = 0, alive = true;
    function frame(now) {
      if (!alive) return;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visibleRatio > 0 || state === 'play') { update(dt); draw(); }
      raf = requestAnimationFrame(frame);
    }
    newGame();
    draw();
    raf = requestAnimationFrame(frame);

    var api = {
      start: function () { ensureAudio(); newGame(); },
      getState: function () {
        return {
          state: state, level: li, phase: phase, score: results.length ? score() : 0, runTime: runTime,
          results: results.slice(), order: order.map(function (o) { return o.id; }),
          gate: gate ? { target: gate.target.id, left: gate.defs[0].id, right: gate.defs[1].id, correct: gate.correct, y: gate.y,
            leftX: state === 'play' ? gateX(0) : 0, rightX: state === 'play' ? gateX(1) : 0 } : null,
          ship: ship ? { x: ship.x, tumble: ship.tumble } : null, rocks: rocks.length, W: W, H: H
        };
      },
      destroy: function () {
        alive = false;
        cancelAnimationFrame(raf);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('blur', onBlur);
        document.removeEventListener('visibilitychange', onVisibility);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
        if (io) io.disconnect();
        if (mqRM) { if (mqRM.removeEventListener) mqRM.removeEventListener('change', onRM); else if (mqRM.removeListener) mqRM.removeListener(onRM); }
        if (actx) try { actx.close(); } catch (e) { /* ignore */ }
        if (music) { music.pause(); music.removeAttribute('src'); music.load(); }
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        delete root.__constellationRun;
      }
    };
    root.__constellationRun = api;
    return api;
  }

  function autoMount() {
    var els = document.querySelectorAll('[data-constellation-run]');
    for (var i = 0; i < els.length; i++) mount(els[i]);
  }
  window.ConstellationRun = { mount: mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
  else autoMount();
})();
