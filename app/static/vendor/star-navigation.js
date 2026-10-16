/*!
 * Star Navigation — a self-playing animated explainer of how Apollo crews
 * found their position between Earth and the Moon using star angles.
 *
 *   1. Lost in space?           (no GPS between Earth and the Moon)
 *   2. Measure one angle        (star -> Earth = 135°: that gives a LINE)
 *   3. Add a second angle       (star -> Moon = 120°: the lines cross at the ship)
 *   4. Solve the triangle       (Earth–Moon distance + angles -> distances)
 *
 * Usage (anywhere on a page):
 *   <div data-star-navigation></div>
 *   <script src="star-navigation.js"></script>
 *
 * Or: const anim = StarNavigation.mount(el); anim.destroy();
 *
 * The animation starts when it scrolls into view, pauses when it leaves the
 * screen, loops, and has a pause button. Headings use the "Unbounded" Google
 * Font when available (add data-fonts="none" to skip loading it).
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  // Palette (line-art style): navy sky, flat planet blue, mint line art,
  // glowing cyan stars and dark-blue sparkles.
  var C = { bg: '#031133', deep: '#02091D', white: '#F8F9EA', green: '#7DF194', blue: '#11295F', teal: '#5ECBE1', dark: '#1E4597' };
  var DUR = 31;                       // seconds per loop
  var SCENE_STARTS = [0, 6, 15, 23];
  var DEG = Math.PI / 180;

  // ---- geometry (the numbers in the diagrams) --------------------------------
  // From the ship: Earth is 135° from the star direction (one side), the Moon
  // 120° (other side), so the angle at the ship is 105°. With Earth–Moon =
  // 384,400 km the law of sines gives ship–Earth ≈ 235,000 km and
  // ship–Moon ≈ 249,000 km; the angles at Earth and Moon are 38.8° and 36.2°.
  var EM_KM = 384400, ANG_E = 38.8, ANG_M = 36.2, ANG_S = 105;
  var SE_KM = EM_KM * Math.sin(ANG_M * DEG) / Math.sin(ANG_S * DEG);   // ≈ 235,000
  var SM_KM = EM_KM * Math.sin(ANG_E * DEG) / Math.sin(ANG_S * DEG);   // ≈ 249,000
  var U_E = [-Math.sin(135 * DEG), -Math.cos(135 * DEG)];  // ship -> Earth (screen, y down)
  var U_M = [Math.sin(120 * DEG), -Math.cos(120 * DEG)];   // ship -> Moon

  var LAYOUTS = {
    wide: { W: 960, H: 540, ratio: '16 / 9', k: 1.25, S: [470, 178], rE: 54, rM: 30, ext: 165, slide: 130,
            guide: [470, 50], readout: [706, 40], labelSize: 15 },
    tall: { W: 540, H: 900, ratio: '3 / 5', k: 1.1, S: [258, 382], rE: 46, rM: 26, ext: 125, slide: 100,
            guide: [258, 214], readout: [46, 624], labelSize: 15 }
  };
  function geometry(L) {
    var S = L.S, k = L.k / 1000;
    var E = [S[0] + U_E[0] * SE_KM * k, S[1] + U_E[1] * SE_KM * k];
    var M = [S[0] + U_M[0] * SM_KM * k, S[1] + U_M[1] * SM_KM * k];
    return { S: S, E: E, M: M, d: [-U_E[0], -U_E[1]] };
  }

  // ---- story titles -----------------------------------------------------------
  var HEADS = [
    { t0: 0, t1: 6, title: 'Lost in space?' },
    { t0: 6, t1: 15, title: 'Measure one angle' },
    { t0: 15, t1: 23, title: 'Add a second angle' },
    { t0: 23, t1: 31, title: 'Solve the triangle' }
  ];

  // ---- helpers ----------------------------------------------------------------
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function easeOut(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function backOut(x) { x = clamp(x, 0, 1); var c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function lerp(a, b, x) { return a + (b - a) * x; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function seeded(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function set(e, attrs) { for (var k in attrs) e.setAttribute(k, attrs[k]); }
  function angleOf(v) { return Math.atan2(v[1], v[0]) / DEG; }  // screen degrees, clockwise positive
  function arcD(cx, cy, r, a0, a1) {
    if (Math.abs(a1 - a0) < 0.01) return 'M' + cx + ',' + cy;
    var x0 = cx + r * Math.cos(a0 * DEG), y0 = cy + r * Math.sin(a0 * DEG);
    var x1 = cx + r * Math.cos(a1 * DEG), y1 = cy + r * Math.sin(a1 * DEG);
    var large = Math.abs(a1 - a0) > 180 ? 1 : 0, sweep = a1 > a0 ? 1 : 0;
    return 'M' + x0.toFixed(2) + ',' + y0.toFixed(2) + ' A' + r + ',' + r + ' 0 ' + large + ' ' + sweep + ' ' + x1.toFixed(2) + ',' + y1.toFixed(2);
  }
  function starPath(R, r) {
    var d = '';
    for (var i = 0; i < 10; i++) {
      var rad = i % 2 ? r : R, a = (i * 36 - 90) * DEG;
      d += (i ? 'L' : 'M') + (Math.cos(a) * rad).toFixed(2) + ',' + (Math.sin(a) * rad).toFixed(2);
    }
    return d + 'Z';
  }
  function sparklePath(R) { // curved four-point star ✦
    var q = R * 0.12;
    return 'M0,' + (-R) + ' Q' + q + ',' + (-q) + ' ' + R + ',0 Q' + q + ',' + q + ' 0,' + R +
      ' Q' + (-q) + ',' + q + ' ' + (-R) + ',0 Q' + (-q) + ',' + (-q) + ' 0,' + (-R) + 'Z';
  }

  // ---- styles (injected once) ---------------------------------------------------
  var CSS = [
    '.sn-wrap{position:relative;width:100%;overflow:hidden;background:' + C.bg + ';color:' + C.white + ';container-type:inline-size;',
    'font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}',
    '.sn-wrap svg{position:absolute;inset:0;width:100%;height:100%;display:block}',
    '.sn-head{position:absolute;left:4.2%;top:5.5%;width:44%;pointer-events:none}',
    '.sn-title{margin:0;font-family:Unbounded,"Arial Black",system-ui,sans-serif;font-weight:700;font-size:1.85cqw;line-height:1.15;letter-spacing:.01em;text-transform:uppercase;color:' + C.white + '}',
    '.sn-progress{position:absolute;left:4.2%;bottom:4%;display:flex;gap:.6cqw}',
    '.sn-progress i{display:block;width:3.2cqw;height:.32cqw;min-height:2px;border-radius:9px;background:rgba(248,249,234,.18);overflow:hidden}',
    '.sn-progress i b{display:block;height:100%;width:0;background:' + C.green + '}',
    '.sn-btn{position:absolute;right:2.6%;bottom:2.6%;width:3.6cqw;height:3.6cqw;min-width:30px;min-height:30px;border-radius:50%;border:1px solid rgba(125,241,148,.6);',
    'background:rgba(3,17,51,.7);color:' + C.green + ';cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}',
    '.sn-btn:hover{border-color:' + C.teal + ';color:' + C.teal + '}',
    '.sn-btn:focus-visible{outline:2px solid ' + C.teal + ';outline-offset:2px}',
    '.sn-btn svg{position:static;width:40%;height:40%}',
    '.sn-tall .sn-head{left:6%;right:6%;top:4%;width:auto}',
    '.sn-tall .sn-title{font-size:4cqw}',
    '.sn-tall .sn-progress{gap:1.4cqw;bottom:3%}',
    '.sn-tall .sn-progress i{width:7cqw;height:.8cqw}',
    '.sn-tall .sn-btn{width:8cqw;height:8cqw;bottom:2%}',
    '.sn-text{transition:none}'
  ].join('');

  function injectAssets(root) {
    if (!document.getElementById('sn-style')) {
      var st = document.createElement('style');
      st.id = 'sn-style'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    if (root.getAttribute('data-fonts') !== 'none' && !document.getElementById('sn-fonts')) {
      var pc = document.createElement('link');
      pc.rel = 'preconnect'; pc.href = 'https://fonts.gstatic.com'; pc.crossOrigin = '';
      document.head.appendChild(pc);
      var lk = document.createElement('link');
      lk.id = 'sn-fonts'; lk.rel = 'stylesheet';
      lk.href = 'https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700;800&family=Inter:wght@400;500;600&display=swap';
      document.head.appendChild(lk);
    }
  }

  // ---- illustration builders (mint line art over navy, like the mission art) ----
  var LW = 1.4; // line weight for the line art
  // Gemini-style capsule, nose up, centred on (0,0), about 40 x 52 units.
  function buildShip(parent, ghost) {
    var g = el('g', { 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, parent);
    var flame = null;
    if (!ghost) {
      flame = el('g', null, g);
      el('path', { d: 'M-11,21 Q0,50 11,21 Z', fill: C.green, opacity: 0.9 }, flame);
      el('path', { d: 'M-5,21 Q0,36 5,21 Z', fill: C.teal }, flame);
    }
    var fill = ghost ? 'none' : C.bg;
    // body (truncated cone)
    el('path', { d: 'M-20,17 L-9,-12 L9,-12 L20,17 Z', fill: fill, stroke: C.green, 'stroke-width': LW }, g);
    // ribs
    el('path', { d: 'M-4,-12 L-8,17 M4,-12 L8,17 M-14,3 Q0,1 14,3', stroke: C.green, 'stroke-width': 0.8, fill: 'none', opacity: 0.75 }, g);
    if (!ghost) {
      // row of portholes / lights and two solid mint panels (as in the reference)
      [-11, -5.5, 0, 5.5, 11].forEach(function (x) { el('circle', { cx: x, cy: 8.5, r: 1.2, fill: C.green }, g); });
      el('rect', { x: -6.5, y: -8, width: 3, height: 8, rx: 0.8, fill: C.green }, g);
      el('path', { d: 'M4,-8 L6.5,-8 L8.5,0 L5.2,0 Z', fill: C.green }, g);
    }
    // nose section with handles
    el('path', { d: 'M-7,-12 L-6,-22 Q0,-25 6,-22 L7,-12 Z', fill: fill, stroke: C.green, 'stroke-width': LW }, g);
    el('path', { d: 'M-2,-23 L-2.5,-12 M2,-23 L2.5,-12', stroke: C.green, 'stroke-width': 0.7, opacity: 0.7 }, g);
    el('path', { d: 'M-6.5,-19 L-10,-16.5 L-7,-14', stroke: C.green, 'stroke-width': 1.4, fill: 'none' }, g);
    el('path', { d: 'M6.5,-19 L10,-16.5 L7,-14', stroke: C.green, 'stroke-width': 1.4, fill: 'none' }, g);
    // heat shield: curved base + the solid mint band
    el('path', { d: 'M-20,17 Q0,27 20,17', fill: fill, stroke: C.green, 'stroke-width': LW }, g);
    el('path', { d: 'M-19.2,14.5 Q0,21 19.2,14.5 L20,17 Q0,24 -20,17 Z', fill: ghost ? 'none' : C.green, stroke: ghost ? C.green : 'none', 'stroke-width': 0.8 }, g);
    return { g: g, flame: flame };
  }

  // Line-art astronaut, centred on (0,0), about 50 x 70 units.
  function buildAstronaut(parent) {
    var g = el('g', { 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, parent);
    var st = { fill: C.bg, stroke: C.green, 'stroke-width': 1.3 };
    function sh(tag, a) { var o = {}; for (var k in st) o[k] = st[k]; for (k in a) o[k] = a[k]; return el(tag, o, g); }
    sh('rect', { x: -16, y: -6, width: 32, height: 30, rx: 7 });                                 // backpack
    sh('rect', { x: -12, y: 18, width: 10, height: 22, rx: 5, transform: 'rotate(14 -7 18)' });   // legs
    sh('rect', { x: 2, y: 18, width: 10, height: 22, rx: 5, transform: 'rotate(-22 7 18)' });
    el('rect', { x: -14, y: 34, width: 12, height: 7, rx: 3.5, fill: C.green, transform: 'rotate(14 -7 18)' }, g);
    el('rect', { x: 0, y: 34, width: 12, height: 7, rx: 3.5, fill: C.green, transform: 'rotate(-22 7 18)' }, g);
    sh('rect', { x: -22, y: -2, width: 9, height: 22, rx: 4.5, transform: 'rotate(28 -17 0)' });  // arm
    var wave = el('g', null, g);
    el('rect', { x: 12, y: -18, width: 9, height: 22, rx: 4.5, fill: C.bg, stroke: C.green, 'stroke-width': 1.3 }, wave);
    el('circle', { cx: 16.5, cy: -19, r: 5, fill: C.green }, wave);
    sh('rect', { x: -13, y: -4, width: 26, height: 27, rx: 8 });                                  // torso
    el('rect', { x: -7, y: 3, width: 14, height: 9, rx: 2, fill: 'none', stroke: C.green, 'stroke-width': 1.1 }, g);
    el('circle', { cx: -3, cy: 7.5, r: 1.7, fill: C.teal }, g);
    el('rect', { x: 0.5, y: 6.3, width: 4.5, height: 2.4, rx: 1, fill: C.green }, g);
    sh('circle', { cx: 0, cy: -17, r: 15 });                                                      // helmet
    el('ellipse', { cx: 1.5, cy: -17, rx: 10.5, ry: 8.5, fill: C.green }, g);                     // visor (solid mint)
    el('path', { d: 'M-5,-21 Q1,-25 7,-21', stroke: C.bg, 'stroke-width': 2.2, fill: 'none' }, g);
    el('circle', { cx: -4.5, cy: -14, r: 1.6, fill: C.bg, opacity: 0.6 }, g);
    return { g: g, wave: wave };
  }

  function buildEarth(parent, r, id) {
    var g = el('g', null, parent);
    var defs = el('defs', null, g);
    var cp = el('clipPath', { id: id }, defs);
    el('circle', { cx: 0, cy: 0, r: r }, cp);
    el('circle', { cx: 0, cy: 0, r: r + 8, fill: 'none', stroke: C.teal, 'stroke-width': 1, 'stroke-dasharray': '2 6', opacity: 0.8 }, g); // atmosphere
    el('circle', { cx: 0, cy: 0, r: r, fill: C.blue }, g);
    var inner = el('g', { 'clip-path': 'url(#' + id + ')' }, g);
    var land = el('g', null, inner);
    var s = r / 58;
    var blobs = [
      'M-40,-30 q12,-14 30,-8 q10,6 4,16 q-10,4 -14,14 q-8,8 -18,-2 q-8,-10 -2,-20Z',
      'M10,8 q16,-8 26,4 q6,12 -4,22 q-10,10 -20,2 q-8,-14 -2,-28Z',
      'M18,-38 q10,-4 16,4 q2,8 -6,10 q-10,0 -10,-14Z',
      'M-30,26 q8,-6 14,2 q2,10 -8,12 q-8,-2 -6,-14Z'
    ];
    for (var copy = 0; copy < 2; copy++) {
      var gg = el('g', { transform: 'translate(' + (copy * 150 * s) + ',0) scale(' + s + ')' }, land);
      blobs.forEach(function (d) { el('path', { d: d, fill: C.green, opacity: 0.85 }, gg); });
      el('path', { d: 'M-50,-8 q20,-6 36,0 M0,-22 q16,-4 30,2 M-20,40 q18,-5 34,0', stroke: C.teal, 'stroke-width': 1.6, opacity: 0.6, fill: 'none', 'stroke-linecap': 'round' }, gg);
    }
    el('circle', { cx: r * 0.55, cy: r * 0.35, r: r * 1.05, fill: C.deep, opacity: 0.35 }, inner);       // night side
    el('circle', { cx: 0, cy: 0, r: r, fill: 'none', stroke: C.green, 'stroke-width': LW }, g);
    return { g: g, land: land, s: s };
  }

  function buildMoon(parent, r) {
    var g = el('g', null, parent);
    el('circle', { cx: 0, cy: 0, r: r, fill: C.bg, stroke: C.teal, 'stroke-width': LW }, g);
    el('path', { d: 'M' + (r * 0.2) + ',' + (-r * 0.98) + ' A' + r + ',' + r + ' 0 0 1 ' + (r * 0.2) + ',' + (r * 0.98) + ' A' + (r * 1.2) + ',' + (r * 1.2) + ' 0 0 0 ' + (r * 0.2) + ',' + (-r * 0.98) + 'Z', fill: C.blue }, g);
    var cr = [[-0.35, -0.3, 0.22], [0.3, 0.1, 0.16], [-0.1, 0.42, 0.12], [0.42, -0.42, 0.09], [-0.5, 0.2, 0.08]];
    cr.forEach(function (c) { el('circle', { cx: c[0] * r, cy: c[1] * r, r: c[2] * r, fill: 'none', stroke: C.teal, 'stroke-width': 1, opacity: 0.85 }, g); });
    return { g: g };
  }

  // Sky in the mission-art style: flat planets, glowing cyan dots, outlined
  // cyan sparkles and small dark-blue sparkles. Returns twinkle targets.
  function buildSky(svg, W, H, seed, id, wide, skipPlanets) {
    var defs = el('defs', null, svg);
    var bgG = el('radialGradient', { id: id + 'sky', cx: '0.15', cy: '0', r: '1.2' }, defs);
    el('stop', { offset: '0', 'stop-color': C.deep }, bgG);
    el('stop', { offset: '0.55', 'stop-color': C.bg }, bgG);
    el('stop', { offset: '1', 'stop-color': '#031338' }, bgG);
    var dg = el('radialGradient', { id: id + 'dot' }, defs);
    el('stop', { offset: '0', 'stop-color': C.teal, 'stop-opacity': 0.55 }, dg);
    el('stop', { offset: '1', 'stop-color': C.teal, 'stop-opacity': 0 }, dg);
    el('rect', { width: W, height: H, fill: 'url(#' + id + 'sky)' }, svg);
    var g = el('g', null, svg);
    if (!skipPlanets && wide) {
      el('circle', { cx: W * 0.98, cy: -H * 0.1, r: H * 0.42, fill: C.blue }, g);
      var pl = el('g', { transform: 'translate(' + (W * 0.9) + ',' + (H * 0.98) + ')' }, g);
      el('ellipse', { rx: 120, ry: 34, fill: 'none', stroke: C.blue, 'stroke-width': 14, transform: 'rotate(-18)' }, pl);
      el('circle', { r: 78, fill: C.blue }, pl);
      el('path', { d: 'M-112,10 A120,34 0 0 0 112,-10', fill: 'none', stroke: C.blue, 'stroke-width': 14, transform: 'rotate(-18)' }, pl);
    } else if (!skipPlanets) {
      el('circle', { cx: W * 1.02, cy: H * 0.02, r: W * 0.42, fill: C.blue }, g);
      var pt = el('g', { transform: 'translate(' + (W * 0.94) + ',' + (H * 0.97) + ')' }, g);
      el('circle', { r: 70, fill: C.blue }, pt);
      el('ellipse', { rx: 108, ry: 30, fill: 'none', stroke: C.blue, 'stroke-width': 12, transform: 'rotate(-18)' }, pt);
    }
    var rnd = seeded(seed), tw = [];
    var margin = 28;
    function skyPt() {
      return [margin + rnd() * (W - margin * 2), margin + rnd() * (H - margin * 2)];
    }
    var n = wide ? 26 : 22;
    for (var i = 0; i < n; i++) {   // glowing cyan dots
      var dot = skyPt();
      var x = dot[0], y = dot[1], r = 1.6 + rnd() * 3.2;
      var d = el('g', { transform: 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')' }, g);
      el('circle', { r: r * 3.2, fill: 'url(#' + id + 'dot)' }, d);
      el('circle', { r: r, fill: C.teal }, d);
      tw.push({ e: d, a: 0.55 + rnd() * 0.45, ph: rnd() * 6.3, sp: 0.5 + rnd() * 1.2 });
    }
    for (i = 0; i < (wide ? 12 : 9); i++) {   // dark-blue dots and filled sparkles
      var dark = skyPt();
      var dx = dark[0], dy = dark[1];
      var e = rnd() < 0.5 ? el('circle', { cx: dx.toFixed(1), cy: dy.toFixed(1), r: 2 + rnd() * 2, fill: C.dark }, g)
        : el('path', { d: sparklePath(5 + rnd() * 5), transform: 'translate(' + dx.toFixed(1) + ',' + dy.toFixed(1) + ')', fill: C.dark }, g);
      tw.push({ e: e, a: 0.8, ph: rnd() * 6.3, sp: 0.3 + rnd() * 0.5 });
    }
    for (i = 0; i < (wide ? 9 : 7); i++) {   // outlined cyan sparkles
      var spark = skyPt();
      var sx = spark[0], sy = spark[1], R = 7 + rnd() * 16;
      var sp = el('path', { d: sparklePath(R), transform: 'translate(' + sx.toFixed(1) + ',' + sy.toFixed(1) + ')', fill: 'none', stroke: rnd() < 0.7 ? C.teal : C.dark, 'stroke-width': 1.2 }, g);
      tw.push({ e: sp, a: 0.8, ph: rnd() * 6.3, sp: 0.4 + rnd() * 0.6 });
    }
    return tw;
  }

  // ---- instance -------------------------------------------------------------------
  var uid = 0;
  function mount(root) {
    if (!root) throw new Error('StarNavigation.mount: no element given');
    if (root.__starNavigation) return root.__starNavigation;
    injectAssets(root);
    var id = 'sn' + (++uid);

    var wrap = document.createElement('div');
    wrap.className = 'sn-wrap';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Animated explainer: how Apollo astronauts found their position using star angles');
    root.appendChild(wrap);

    var mqRM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduced = !!(mqRM && mqRM.matches);
    function onRM(e) { reduced = e.matches; }
    if (mqRM) { if (mqRM.addEventListener) mqRM.addEventListener('change', onRM); else if (mqRM.addListener) mqRM.addListener(onRM); }

    var L = null, G = null, svg = null, R = null; // layout, geometry, svg root, refs
    var head, titleEl, progress = [], btn;

    // HTML overlay
    head = document.createElement('div'); head.className = 'sn-head';
    titleEl = document.createElement('h2'); titleEl.className = 'sn-title';
    head.appendChild(titleEl);
    var prog = document.createElement('div'); prog.className = 'sn-progress'; prog.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < SCENE_STARTS.length; i++) { var seg = document.createElement('i'); var fill = document.createElement('b'); seg.appendChild(fill); prog.appendChild(seg); progress.push(fill); }
    btn = document.createElement('button'); btn.className = 'sn-btn'; btn.type = 'button';

    function buildScene() {
      if (svg) svg.parentNode.removeChild(svg);
      svg = el('svg', { viewBox: '0 0 ' + L.W + ' ' + L.H, 'aria-hidden': 'true', focusable: 'false' });
      svg.style.fontFamily = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      wrap.insertBefore(svg, wrap.firstChild);
      R = {};
      var defs = el('defs', null, svg);
      var rg = el('radialGradient', { id: id + 'glow' }, defs);
      el('stop', { offset: '0', 'stop-color': C.teal, 'stop-opacity': 0.4 }, rg);
      el('stop', { offset: '1', 'stop-color': C.teal, 'stop-opacity': 0 }, rg);
      var rg2 = el('radialGradient', { id: id + 'tglow' }, defs);
      el('stop', { offset: '0', 'stop-color': C.teal, 'stop-opacity': 0.45 }, rg2);
      el('stop', { offset: '1', 'stop-color': C.teal, 'stop-opacity': 0 }, rg2);

      // background: navy sky, flat planets, cyan stars and sparkles
      R.stars = buildSky(svg, L.W, L.H, L === LAYOUTS.wide ? 7 : 11, id, L === LAYOUTS.wide, root.hasAttribute('data-star-now'));

      R.scene = el('g', null, svg);
      var gS = R.scene;
      // guide star
      R.guide = el('g', null, gS);
      el('circle', { cx: 0, cy: 0, r: 34, fill: 'url(#' + id + 'tglow)' }, R.guide);
      R.guideSpin = el('g', null, R.guide);
      R.guideStar = el('path', { d: sparklePath(22), fill: 'none', stroke: C.teal, 'stroke-width': 1.6 }, R.guideSpin);
      el('path', { d: sparklePath(9), fill: C.teal }, R.guideSpin);
      R.guideLabel = el('text', { x: 0, y: -32, 'text-anchor': 'middle', fill: C.teal, 'font-size': 12, 'font-weight': 600, 'letter-spacing': '0.12em', opacity: 0.8 }, R.guide);
      R.guideLabel.textContent = 'GUIDE STAR';

      // Earth & Moon
      R.earth = buildEarth(gS, L.rE, id + 'ec');
      R.earthLabel = el('text', { 'text-anchor': 'middle', fill: C.white, 'font-size': L.rE > 50 ? 17 : 15, 'font-weight': 600, 'font-family': 'Unbounded, Inter, sans-serif' }, R.earth.g);
      R.earthLabel.textContent = 'Earth';
      set(R.earthLabel, { y: 6 });
      R.moon = buildMoon(gS, L.rM);
      R.moonLabel = el('text', { 'text-anchor': 'middle', y: L.rM + 22, fill: C.white, 'font-size': 14, 'font-weight': 600, opacity: 0.85, 'font-family': 'Unbounded, Inter, sans-serif' }, R.moon.g);
      R.moonLabel.textContent = 'Moon';

      // lines
      R.lines = el('g', { 'stroke-linecap': 'round' }, gS);
      R.emLine = el('line', { stroke: C.white, 'stroke-width': 1.4, opacity: 0.6 }, R.lines);
      R.greenLine = el('line', { stroke: C.green, 'stroke-width': 2.2, 'stroke-dasharray': '7 7' }, R.lines);
      R.tealLine = el('line', { stroke: C.teal, 'stroke-width': 2.2, 'stroke-dasharray': '7 7' }, R.lines);
      R.greenTag = el('text', { fill: C.green, 'font-size': 13, 'font-weight': 600 }, gS);
      R.greenTag.textContent = "Earth's line";
      R.tealTag = el('text', { fill: C.teal, 'font-size': 13, 'font-weight': 600 }, gS);
      R.tealTag.textContent = "Moon's line";
      R.emTag = el('text', { 'text-anchor': 'middle', fill: C.white, 'font-size': L === LAYOUTS.wide ? 14 : 13, 'font-weight': 600 }, gS);

      // ghosts (scene 2)
      R.ghosts = [];
      [-1, 1].forEach(function (sgn) {
        var g = el('g', null, gS);
        buildShip(g, true);
        var arr = el('g', { stroke: C.green, 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round', opacity: 0.8 }, g);
        el('line', { x1: 0, y1: -28, x2: 0, y2: -66 }, arr);
        el('path', { d: 'M-5,-59 L0,-66 L5,-59' }, arr);
        var arc = el('path', { d: arcD(0, 0, 30, -90, -225), stroke: C.green, 'stroke-width': 2, fill: 'none' }, g);
        var tx = el('text', { x: -52, y: -24, fill: C.green, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle' }, g);
        tx.textContent = '135°';
        R.ghosts.push({ g: g, sgn: sgn, arc: arc });
      });

      // arcs at the ship
      R.arcs = el('g', { fill: 'none', 'stroke-linecap': 'round' }, gS);
      R.arcE = el('path', { stroke: C.green, 'stroke-width': 2.4 }, R.arcs);
      R.arcM = el('path', { stroke: C.teal, 'stroke-width': 2.4 }, R.arcs);
      R.arcETxt = el('text', { fill: C.green, 'font-size': 16, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Unbounded, Inter, sans-serif' }, R.arcs);
      R.arcMTxt = el('text', { fill: C.teal, 'font-size': 16, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Unbounded, Inter, sans-serif' }, R.arcs);

      // triangle angles (scene 4)
      R.tri = el('g', { fill: 'none', 'stroke-linecap': 'round' }, gS);
      R.triArcs = [0, 1, 2].map(function (i) { return el('path', { stroke: [C.green, C.teal, C.white][i], 'stroke-width': 2 }, R.tri); });
      R.triTxt = [0, 1, 2].map(function (i) { return el('text', { fill: [C.green, C.teal, C.white][i], 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle', stroke: 'none', 'font-family': 'Unbounded, Inter, sans-serif' }, R.tri); });
      R.distE = el('text', { fill: C.green, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Unbounded, Inter, sans-serif' }, gS);
      R.distM = el('text', { fill: C.teal, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Unbounded, Inter, sans-serif' }, gS);

      // star arrow from the ship
      R.arrow = el('g', { stroke: C.white, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gS);
      R.arrowLine = el('line', null, R.arrow);
      R.arrowHead = el('path', null, R.arrow);
      R.arrowTxt = el('text', { fill: C.white, 'font-size': 12.5, 'font-weight': 500, stroke: 'none', 'text-anchor': 'end', opacity: 0.85 }, gS);
      R.arrowTxt.textContent = 'toward the star';

      // ping rings + test marker + ship
      R.pings = [0, 1, 2].map(function () { return el('circle', { fill: 'none', stroke: C.teal, 'stroke-width': 2 }, gS); });
      R.marker = el('g', null, gS);
      el('circle', { r: 30, fill: 'url(#' + id + 'tglow)' }, R.marker);
      el('circle', { r: 9, fill: 'none', stroke: C.teal, 'stroke-width': 2 }, R.marker);
      el('path', { d: 'M-15,0 L-5,0 M5,0 L15,0 M0,-15 L0,-5 M0,5 L0,15', stroke: C.teal, 'stroke-width': 2, 'stroke-linecap': 'round' }, R.marker);
      R.tether = el('path', { fill: 'none', stroke: C.green, 'stroke-width': 1.2, opacity: 0.8 }, gS);
      R.smallAstro = buildAstronaut(gS);
      R.ship = buildShip(gS, false);
      R.qBubble = el('g', null, gS);
      el('path', { d: 'M-4,12 L-8,22 L4,13Z', fill: C.bg, stroke: C.green, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, R.qBubble);
      el('circle', { r: 15, fill: C.bg, stroke: C.green, 'stroke-width': 1.4 }, R.qBubble);
      el('path', { d: 'M-4,12 L4,13', stroke: C.bg, 'stroke-width': 2.4 }, R.qBubble);
      var q = el('text', { 'text-anchor': 'middle', y: 6.5, fill: C.green, 'font-size': 19, 'font-weight': 800, 'font-family': 'Unbounded, Inter, sans-serif' }, R.qBubble);
      q.textContent = '?';

      // live readout
      R.readout = el('g', { transform: 'translate(' + L.readout[0] + ',' + L.readout[1] + ')' }, gS);
      var rw = L === LAYOUTS.wide ? 220 : 448, rh = 66;
      el('rect', { width: rw, height: rh, rx: 12, fill: C.bg, stroke: C.green, 'stroke-width': 1.2, 'stroke-opacity': 0.7 }, R.readout);
      var lab1 = el('text', { x: 16, y: 26, fill: C.white, 'font-size': 11.5, 'font-weight': 600, 'letter-spacing': '0.08em', opacity: 0.7 }, R.readout);
      lab1.textContent = 'STAR TO EARTH';
      var lab2 = el('text', { x: 16, y: 52, fill: C.white, 'font-size': 11.5, 'font-weight': 600, 'letter-spacing': '0.08em', opacity: 0.7 }, R.readout);
      lab2.textContent = 'STAR TO MOON';
      R.roE = el('text', { x: rw - 16, y: 27, 'text-anchor': 'end', fill: C.green, 'font-size': 17, 'font-weight': 700, 'font-family': 'Unbounded, Inter, sans-serif' }, R.readout);
      R.roM = el('text', { x: rw - 16, y: 53, 'text-anchor': 'end', fill: C.teal, 'font-size': 17, 'font-weight': 700, 'font-family': 'Unbounded, Inter, sans-serif' }, R.readout);
    }

    function applyLayout() {
      var w = wrap.getBoundingClientRect().width;
      var next = root.hasAttribute('data-star-now') || !(w > 0 && w < 620) ? LAYOUTS.wide : LAYOUTS.tall;
      if (next === L) return;
      L = next; G = geometry(L);
      wrap.style.aspectRatio = L.ratio;
      wrap.classList.toggle('sn-tall', L === LAYOUTS.tall);
      buildScene();
      render(t);
    }

    wrap.appendChild(head);
    if (root.getAttribute('data-star-chrome') !== 'off') {
      wrap.appendChild(prog);
      wrap.appendChild(btn);
    }

    // ---- render: everything is a pure function of time t ----
    var t = 0;
    var loopFrom = 0;
    var loopTo = DUR;
    if (root.hasAttribute('data-star-from')) {
      var startAt = parseFloat(root.getAttribute('data-star-from'));
      if (!isNaN(startAt)) t = startAt;
    }
    if (root.hasAttribute('data-star-loop')) {
      var loopAt = parseFloat(root.getAttribute('data-star-loop'));
      if (!isNaN(loopAt)) loopFrom = loopAt;
    }
    if (root.hasAttribute('data-star-to')) {
      var endAt = parseFloat(root.getAttribute('data-star-to'));
      if (!isNaN(endAt)) loopTo = endAt;
    }
    function pr(a, b) { return reduced ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a), 0, 1); }
    function vis(e, o) { e.setAttribute('opacity', o.toFixed(3)); e.style.display = o <= 0.001 ? 'none' : ''; }
    function moveTo(e, x, y, rot, sc) {
      e.setAttribute('transform', 'translate(' + x.toFixed(2) + ',' + y.toFixed(2) + ')' + (rot ? ' rotate(' + rot.toFixed(2) + ')' : '') + (sc != null && sc !== 1 ? ' scale(' + sc.toFixed(3) + ')' : ''));
    }
    function lineTo(e, x1, y1, x2, y2) { set(e, { x1: x1.toFixed(2), y1: y1.toFixed(2), x2: x2.toFixed(2), y2: y2.toFixed(2) }); }
    function textWindow(list) {
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        if (t >= it.t0 && t < it.t1) {
          var o = reduced ? 1 : Math.min(1, (t - it.t0) / 0.45, (it.t1 - t) / 0.35);
          return { item: it, o: clamp(o, 0, 1) };
        }
      }
      return null;
    }
    function moonAngleAt(P) { var v = [G.M[0] - P[0], G.M[1] - P[1]]; return Math.atan2(v[0], -v[1]) / DEG; }
    function earthAngleAt(P) { var v = [G.E[0] - P[0], G.E[1] - P[1]]; return Math.atan2(-v[0], -v[1]) / DEG; }

    var lastHead = '';
    function render(tt) {
      t = tt;
      if (!svg) return;
      var S = G.S, E = G.E, M = G.M, d = G.d, wide = L === LAYOUTS.wide;
      var bob = reduced ? 0 : Math.sin(t * 1.6) * 3;
      var loopFade = reduced ? 1 : Math.min(pr(0, 0.6) + (t < 0.6 ? 0 : 1), 1) * (1 - pr(30.3, 31));

      // background twinkle
      for (var i = 0; i < R.stars.length; i++) {
        var st = R.stars[i];
        st.e.setAttribute('opacity', (st.a * (reduced ? 1 : 0.6 + 0.4 * Math.sin(t * st.sp + st.ph))).toFixed(3));
      }

      vis(R.scene, loopFade);

      // Earth / Moon slide in
      var eIn = easeOut(pr(0, 1.6)), mIn = easeOut(pr(0.3, 1.9));
      moveTo(R.earth.g, E[0] - (1 - eIn) * 220, E[1]);
      vis(R.earth.g, eIn);
      R.earth.land.setAttribute('transform', 'translate(' + (-((t * 6) % (150 * R.earth.s))).toFixed(2) + ',0)');
      moveTo(R.moon.g, M[0] + (1 - mIn) * 220, M[1]);
      vis(R.moon.g, mIn);

      // guide star
      var gIn = backOut(pr(6, 6.8));
      moveTo(R.guide, L.guide[0], L.guide[1], 0, Math.max(0.001, gIn));
      R.guideSpin.setAttribute('transform', 'rotate(' + (reduced ? 0 : (t * 12) % 360).toFixed(1) + ') scale(' + (1 + (reduced ? 0 : Math.sin(t * 3) * 0.06)).toFixed(3) + ')');
      vis(R.guide, Math.min(1, pr(6, 6.4) * 2));

      // ship: drifts in, then (scene 3) the real ship hides while the marker searches
      var shipIn = ease(pr(0.4, 3));
      var shipX = S[0] - (1 - shipIn) * 170, shipY = S[1] - (1 - shipIn) * 90 + bob;
      var searching = t >= 15.3 && t < 19.4;
      var shipO = searching ? 0 : 1;
      if (t >= 15 && t < 15.3) shipO = 1 - pr(15, 15.3);
      if (t >= 19.4) shipO = pr(19.4, 19.8);
      moveTo(R.ship.g, shipX, shipY, (1 - shipIn) * 18);
      vis(R.ship.g, Math.min(1, pr(0.4, 1)) * shipO);
      vis(R.ship.flame, reduced ? 0 : (t < 3.2 ? 1 : 0) * (0.7 + 0.3 * Math.sin(t * 40)));

      // small astronaut on a tether (intro), reeled in at the end of the intro
      var aIn = pr(1.6, 2.6), aOut = pr(5.2, 6);
      var ax = shipX + 58 + (reduced ? 0 : Math.sin(t * 0.9) * 8), ay = shipY + 26 + (reduced ? 0 : Math.cos(t * 1.1) * 6);
      ax = lerp(ax, shipX, ease(aOut)); ay = lerp(ay, shipY, ease(aOut));
      moveTo(R.smallAstro.g, ax, ay, reduced ? 10 : 10 + Math.sin(t * 0.8) * 14, 0.5 * (1 - aOut * 0.7));
      vis(R.smallAstro.g, aIn * (1 - aOut));
      R.smallAstro.wave.setAttribute('transform', 'rotate(' + (reduced ? 0 : Math.sin(t * 6) * 20) + ' 16 4)');
      R.tether.setAttribute('d', 'M' + (shipX + 12) + ',' + (shipY + 4) + ' Q' + ((shipX + ax) / 2 + 10) + ',' + ((shipY + ay) / 2 + 26) + ' ' + (ax - 6) + ',' + (ay + 2));
      vis(R.tether, aIn * (1 - aOut) * 0.6);

      // "?" bubble
      var qIn = backOut(pr(3, 3.5)) * (1 - pr(5.4, 5.8));
      moveTo(R.qBubble, shipX - 30, shipY - 46 + (reduced ? 0 : Math.sin(t * 4) * 2), 0, Math.max(0.001, qIn));
      vis(R.qBubble, qIn > 0.01 ? 1 : 0);

      // arrow "toward the star" (from the ship, or from the searching marker)
      var P = S;
      var sTest = 0;
      if (t >= 15.3) {
        // marker slides along the green line from far out to the true spot
        var sp = reduced ? (t >= 19.4 ? 1 : 0.5) : ease(pr(15.6, 19.2));
        sTest = L.slide * (1 - sp);
        P = [S[0] + d[0] * sTest, S[1] + d[1] * sTest];
      }
      var arrIn = easeOut(pr(6.3, 7.1)), arrLen = 66;
      var ay0 = (searching ? P[1] : shipY) - 27, ax0 = searching ? P[0] : S[0];
      lineTo(R.arrowLine, ax0, ay0, ax0, ay0 - arrLen * arrIn);
      R.arrowHead.setAttribute('d', 'M' + (ax0 - 5) + ',' + (ay0 - arrLen * arrIn + 7) + ' L' + ax0 + ',' + (ay0 - arrLen * arrIn) + ' L' + (ax0 + 5) + ',' + (ay0 - arrLen * arrIn + 7));
      vis(R.arrow, arrIn);
      set(R.arrowTxt, { x: ax0 - 10, y: ay0 - arrLen + 16 });
      vis(R.arrowTxt, pr(6.8, 7.4) * (1 - pr(9.6, 10)));

      // Earth angle arc (sweeps to 135°)
      var aE = 135 * ease(pr(7.2, 8.7));
      var cx = searching ? P[0] : S[0], cy = searching ? P[1] : S[1] + bob;
      R.arcE.setAttribute('d', arcD(cx, cy, 34, -90, -90 - aE));
      vis(R.arcE, pr(7.2, 7.4) * (1 - 0.6 * pr(23, 23.6)));
      var midE = (-90 - aE / 2) * DEG;
      set(R.arcETxt, { x: (cx + Math.cos(midE) * 58).toFixed(1), y: (cy + Math.sin(midE) * 58 + 6).toFixed(1) });
      R.arcETxt.textContent = Math.round(aE) + '°';
      vis(R.arcETxt, pr(7.2, 7.5) * (1 - 0.6 * pr(23, 23.6)));

      // green line: from Earth through the ship and beyond
      var gl = ease(pr(8.7, 9.9));
      var gx0 = E[0], gy0 = E[1], gx1 = S[0] + d[0] * L.ext, gy1 = S[1] + d[1] * L.ext;
      lineTo(R.greenLine, gx0, gy0, lerp(gx0, gx1, gl), lerp(gy0, gy1, gl));
      vis(R.greenLine, pr(8.7, 8.9));
      R.greenLine.setAttribute('stroke-dashoffset', reduced ? 0 : (-t * 14).toFixed(1));
      set(R.greenTag, { x: (lerp(E[0], S[0], 0.3) + 14).toFixed(1), y: (lerp(E[1], S[1], 0.3) + 14).toFixed(1) });
      vis(R.greenTag, pr(9.6, 10) * (1 - pr(23, 23.5)));

      // ghosts along the line
      for (i = 0; i < R.ghosts.length; i++) {
        var gh = R.ghosts[i], off = gh.sgn > 0 ? (wide ? 92 : 74) : -(wide ? 112 : 84);
        var gin = backOut(pr(10.4 + i * 0.5, 11.1 + i * 0.5)), gout = pr(14.6, 15.2);
        var gp = [S[0] + d[0] * off, S[1] + d[1] * off];
        moveTo(gh.g, gp[0], gp[1] + bob, 0, Math.max(0.001, gin));
        vis(gh.g, Math.min(1, gin) * (1 - gout) * 0.75);
      }

      // the searching marker
      vis(R.marker, (t >= 15.3 && t < 20.2 ? 1 : 0) * Math.min(pr(15.3, 15.6), 1 - pr(19.6, 20.2)));
      moveTo(R.marker, P[0], P[1], reduced ? 0 : t * 40);

      // Moon line (follows the marker live, then locks)
      var moonAng = moonAngleAt(t >= 15.3 && t < 19.4 ? P : S);
      var tl = t >= 15.3 ? 1 : 0;
      var lx = t >= 15.3 && t < 19.4 ? P[0] : S[0], ly = t >= 15.3 && t < 19.4 ? P[1] : S[1];
      lineTo(R.tealLine, M[0], M[1], lx, ly);
      vis(R.tealLine, tl * pr(15.3, 15.7) * (t < 19.4 ? 0.65 : 1));
      R.tealLine.setAttribute('stroke-dashoffset', reduced ? 0 : (t * 14).toFixed(1));
      set(R.tealTag, { x: (lerp(M[0], S[0], 0.3) - 40).toFixed(1), y: (lerp(M[1], S[1], 0.3) + 24).toFixed(1) });
      vis(R.tealTag, pr(19.6, 20) * (1 - pr(23, 23.5)));

      // Moon angle arc at the marker / ship
      R.arcM.setAttribute('d', arcD(cx, cy, 40, -90, -90 + moonAng));
      vis(R.arcM, pr(15.4, 15.8) * (1 - 0.6 * pr(23, 23.6)));
      var midM = (-90 + moonAng / 2) * DEG;
      set(R.arcMTxt, { x: (cx + Math.cos(midM) * 64).toFixed(1), y: (cy + Math.sin(midM) * 64 + 6).toFixed(1) });
      R.arcMTxt.textContent = Math.round(moonAng) + '°';
      vis(R.arcMTxt, pr(15.4, 15.8) * (1 - 0.6 * pr(23, 23.6)));

      // live readout
      var roIn = pr(7.4, 7.9) * (1 - pr(22.6, 23.2));
      vis(R.readout, roIn);
      R.roE.textContent = Math.round(t < 15.3 ? aE : earthAngleAt(P)) + '°';
      R.roM.textContent = t >= 15.3 ? Math.round(moonAng) + '°' : '—';
      if (t >= 19.4 && !reduced) R.roM.setAttribute('font-size', (17 + 5 * Math.max(0, 1 - (t - 19.4) / 0.5)).toFixed(1));
      else R.roM.setAttribute('font-size', 17);

      // lock-on pings
      for (i = 0; i < R.pings.length; i++) {
        var pp = reduced ? 0 : pr(19.4 + i * 0.22, 20.6 + i * 0.22);
        set(R.pings[i], { cx: S[0], cy: S[1] + bob, r: (12 + pp * 60).toFixed(1) });
        vis(R.pings[i], pp > 0 && pp < 1 ? (1 - pp) * 0.9 : 0);
      }

      // scene 4: triangle
      var em = ease(pr(23.5, 24.7));
      lineTo(R.emLine, E[0], E[1], lerp(E[0], M[0], em), lerp(E[1], M[1], em));
      vis(R.emLine, pr(23.5, 23.7) * 0.8);
      var mid = [(E[0] + M[0]) / 2, (E[1] + M[1]) / 2];
      set(R.emTag, { x: mid[0].toFixed(1), y: (mid[1] + (wide ? 34 : 38)).toFixed(1) });
      R.emTag.textContent = wide ? 'Earth–Moon: 384,400 km (from the tables)' : 'Earth–Moon: 384,400 km';
      vis(R.emTag, pr(24.4, 24.9));

      var corners = [
        { P: E, a: angleOf([S[0] - E[0], S[1] - E[1]]), b: angleOf([M[0] - E[0], M[1] - E[1]]), r: wide ? 44 : 36, txt: ANG_E.toFixed(1) + '°' },
        { P: M, a: angleOf([E[0] - M[0], E[1] - M[1]]), b: angleOf([S[0] - M[0], S[1] - M[1]]), r: wide ? 44 : 36, txt: ANG_M.toFixed(1) + '°' },
        { P: S, a: angleOf(U_M), b: angleOf(U_E), r: 26, txt: ANG_S + '°' }
      ];
      for (i = 0; i < 3; i++) {
        var cnr = corners[i], a0 = cnr.a, a1 = cnr.b;
        while (a1 - a0 > 180) a1 -= 360; while (a0 - a1 > 180) a1 += 360;
        var pc = ease(pr(24.8 + i * 0.45, 25.6 + i * 0.45));
        var py = i === 2 ? bob : 0;
        R.triArcs[i].setAttribute('d', arcD(cnr.P[0], cnr.P[1] + py, cnr.r, a0, lerp(a0, a1, pc)));
        var mida = (a0 + a1) / 2 * DEG, lr = cnr.r + (i === 2 ? 22 : 26);
        set(R.triTxt[i], { x: (cnr.P[0] + Math.cos(mida) * lr).toFixed(1), y: (cnr.P[1] + py + Math.sin(mida) * lr + 5).toFixed(1) });
        R.triTxt[i].textContent = cnr.txt;
        vis(R.triArcs[i], pr(24.8 + i * 0.45, 25 + i * 0.45));
        vis(R.triTxt[i], pr(25.3 + i * 0.45, 25.6 + i * 0.45));
      }

      // distances count up
      var cnt = ease(pr(26.6, 28.4));
      var nE = [-(S[1] - E[1]), S[0] - E[0]], nl = Math.hypot(nE[0], nE[1]);
      var dE = [(E[0] + S[0]) / 2 + nE[0] / nl * -30, (E[1] + S[1]) / 2 + nE[1] / nl * -30];
      set(R.distE, { x: (dE[0] - (wide ? 34 : 18)).toFixed(1), y: dE[1].toFixed(1) });
      R.distE.textContent = '≈ ' + fmt(Math.round(SE_KM * cnt / 1000) * 1000) + ' km';
      vis(R.distE, pr(26.6, 26.9));
      var nM = [-(M[1] - S[1]), M[0] - S[0]], nml = Math.hypot(nM[0], nM[1]);
      var dM = [(S[0] + M[0]) / 2 + nM[0] / nml * -30, (S[1] + M[1]) / 2 + nM[1] / nml * -30];
      set(R.distM, { x: (dM[0] + (wide ? 30 : 14)).toFixed(1), y: dM[1].toFixed(1) });
      R.distM.textContent = '≈ ' + fmt(Math.round(SM_KM * cnt / 1000) * 1000) + ' km';
      vis(R.distM, pr(26.6, 26.9));

      // ---- HTML overlay ----
      var h = textWindow(HEADS);
      if (h) {
        if (h.item.title !== lastHead) { titleEl.textContent = h.item.title; lastHead = h.item.title; }
        head.style.opacity = h.o; head.style.transform = 'translateY(' + ((1 - h.o) * (reduced ? 0 : 8)).toFixed(1) + 'px)';
      } else head.style.opacity = 0;

      // progress segments
      for (i = 0; i < SCENE_STARTS.length; i++) {
        var s0 = SCENE_STARTS[i], s1 = i + 1 < SCENE_STARTS.length ? SCENE_STARTS[i + 1] : DUR;
        progress[i].style.width = (clamp((t - s0) / (s1 - s0), 0, 1) * 100).toFixed(1) + '%';
      }
    }

    // ---- playback ----
    var playing = true, visible = false, started = false;
    var ICON_PAUSE = '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="1" width="2.4" height="8" rx=".6" fill="currentColor"/><rect x="6.1" y="1" width="2.4" height="8" rx=".6" fill="currentColor"/></svg>';
    var ICON_PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.4 1.2 L8.6 5 L2.4 8.8Z" fill="currentColor"/></svg>';
    function syncBtn() {
      btn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
      btn.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
    }
    btn.addEventListener('click', function () { playing = !playing; syncBtn(); });
    syncBtn();

    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(applyLayout) : null;
    if (ro) ro.observe(wrap); else window.addEventListener('resize', applyLayout);
    L = null; applyLayout();
    if (!L) { L = LAYOUTS.wide; G = geometry(L); wrap.style.aspectRatio = L.ratio; buildScene(); }

    var io = null;
    if (root.hasAttribute('data-star-now')) {
      visible = true;
      started = true;
    } else if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(function (entries) {
        var r = entries[entries.length - 1].intersectionRatio;
        visible = r >= 0.3;
        if (visible && !started) { started = true; t = 0; }   // start from the beginning when first seen
      }, { threshold: [0, 0.3, 0.6, 1] });
      io.observe(wrap);
    } else { visible = true; started = true; }

    var last = performance.now(), raf = 0, alive = true;
    function frame(now) {
      if (!alive) return;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (playing && visible && !document.hidden) {
        t += dt;
        if (t >= loopTo) t = loopFrom;
        else if (t >= DUR) t -= DUR;
        render(t);
      }
      raf = requestAnimationFrame(frame);
    }
    render(t);
    raf = requestAnimationFrame(frame);

    var api = {
      seek: function (s) { t = clamp(s, 0, DUR - 0.001); render(t); },
      play: function () { playing = true; syncBtn(); },
      pause: function () { playing = false; syncBtn(); },
      getState: function () {
        return { t: t, playing: playing, visible: visible, layout: L === LAYOUTS.wide ? 'wide' : 'tall',
          shipEarthKm: SE_KM, shipMoonKm: SM_KM, earthAngle: earthAngleAt(G.S), moonAngle: moonAngleAt(G.S),
          emPx: Math.hypot(G.M[0] - G.E[0], G.M[1] - G.E[1]) };
      },
      destroy: function () {
        alive = false; cancelAnimationFrame(raf);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', applyLayout);
        if (io) io.disconnect();
        if (mqRM) { if (mqRM.removeEventListener) mqRM.removeEventListener('change', onRM); else if (mqRM.removeListener) mqRM.removeListener(onRM); }
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        delete root.__starNavigation;
      }
    };
    root.__starNavigation = api;
    return api;
  }

  function autoMount() {
    var els = document.querySelectorAll('[data-star-navigation]');
    for (var i = 0; i < els.length; i++) mount(els[i]);
  }
  window.StarNavigation = { mount: mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
  else autoMount();
})();
