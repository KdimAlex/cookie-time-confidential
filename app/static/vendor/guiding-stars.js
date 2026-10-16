/*!
 * Guiding Stars — a short, self-playing animation that draws a parallel:
 * driving past a lone tree with a far-off mountain range (top) and flying
 * past the Moon with the far-off guide stars (bottom). Near things move
 * across your view; far things stay put, so they make good landmarks.
 *
 * Usage:
 *   <div data-guiding-stars></div>
 *   <script src="guiding-stars.js"></script>
 * Or: const a = GuidingStars.mount(el); a.destroy();
 *
 * Starts when scrolled into view, pauses off-screen, loops, has a pause
 * button and respects reduced motion.
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  // Palette (line-art style, same as star-navigation): navy sky, flat planet
  // blue, mint line art, glowing cyan stars and dark-blue sparkles.
  var C = { bg: '#031133', deep: '#02091D', white: '#F8F9EA', green: '#7DF194', blue: '#11295F', teal: '#5ECBE1', dark: '#1E4597' };
  var DUR = 19;
  var PW = 640, PH = 320;                           // panel viewBox

  // the near object (tree / Moon) crosses the window at constant speed
  function nearX(t) { return 610 - 56 * t; }
  var GHOST_T = 5.4;  // when we "pin" where the near object was

  // ---- helpers ----
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function backOut(x) { x = clamp(x, 0, 1); var c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function seeded(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function sparklePath(R) {
    var q = R * 0.12;
    return 'M0,' + (-R) + ' Q' + q + ',' + (-q) + ' ' + R + ',0 Q' + q + ',' + q + ' 0,' + R +
      ' Q' + (-q) + ',' + q + ' ' + (-R) + ',0 Q' + (-q) + ',' + (-q) + ' 0,' + (-R) + 'Z';
  }

  // ---- styles ----
  var CSS = [
    '.gs-wrap{position:relative;width:100%;background:radial-gradient(120% 90% at 10% 0%,' + C.deep + ' 0%,' + C.bg + ' 55%,#031338 100%);color:' + C.white + ';container-type:inline-size;overflow:hidden;',
    'display:block;padding:3.2cqw;box-sizing:border-box}',
    '.gs-panels{display:flex;flex-direction:column;gap:2.4cqw;min-width:0}',
    '.gs-panel{position:relative;width:100%;aspect-ratio:2/1;border-radius:1.6cqw;overflow:hidden;background:' + C.bg + ';box-shadow:0 0 0 1px rgba(125,241,148,.35)}',
    '.gs-panel svg{position:absolute;inset:0;width:100%;height:100%;display:block}',
    '.gs-btn{position:absolute;right:1.6cqw;bottom:1.6cqw;width:3cqw;height:3cqw;min-width:28px;min-height:28px;border-radius:50%;border:1px solid rgba(125,241,148,.6);',
    'background:rgba(3,17,51,.7);color:' + C.green + ';cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;z-index:2}',
    '.gs-btn:hover{border-color:' + C.teal + ';color:' + C.teal + '}',
    '.gs-btn:focus-visible{outline:2px solid ' + C.teal + ';outline-offset:2px}',
    '.gs-btn svg{width:40%;height:40%}',
    '.gs-narrow{padding:5cqw}',
    '.gs-narrow .gs-panels{gap:4cqw}',
    '.gs-narrow .gs-panel{border-radius:3.5cqw}',
    '.gs-narrow .gs-btn{width:8cqw;height:8cqw;right:4cqw;bottom:3cqw}'
  ].join('');

  function injectAssets() {
    if (!document.getElementById('gs-style')) {
      var st = document.createElement('style'); st.id = 'gs-style'; st.textContent = CSS; document.head.appendChild(st);
    }
  }

  // ---- shared bits for both panels ----
  function makeReticle(parent) {
    var g = el('g', null, parent);
    var spin = el('g', null, g);
    el('circle', { r: 30, fill: 'none', stroke: C.green, 'stroke-width': 2.2, 'stroke-dasharray': '30 17', 'stroke-linecap': 'round' }, spin);
    el('path', { d: 'M-42,0 L-33,0 M33,0 L42,0 M0,-42 L0,-33 M0,33 L0,42', stroke: C.green, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
    return { g: g, spin: spin };
  }
  function makeHud(parent) {
    var g = el('g', { transform: 'translate(' + (PW - 34) + ',' + (PH - 30) + ')' }, parent);
    var chev = [];
    for (var i = 0; i < 3; i++) chev.push(el('path', { d: 'M' + (-38 + i * 11) + ',-6 L' + (-32 + i * 11) + ',0 L' + (-38 + i * 11) + ',6', stroke: C.green, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g));
    return chev;
  }

  // ---- sky in the mission-art style (inside a window) ----
  function addSky(scene, id, seed, x0, y0, x1, y1, n) {
    var tw = [], rnd = seeded(seed);
    for (var i = 0; i < n; i++) {   // glowing cyan dots
      var x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0), r = 1.4 + rnd() * 2.6;
      var d = el('g', { transform: 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')' }, scene);
      el('circle', { r: r * 3.2, fill: 'url(#' + id + 'dot)' }, d);
      el('circle', { r: r, fill: C.teal }, d);
      tw.push({ e: d, a: 0.55 + rnd() * 0.45, ph: rnd() * 6 });
    }
    for (i = 0; i < Math.round(n / 2); i++) {   // dark-blue dots / sparkles
      var dx = x0 + rnd() * (x1 - x0), dy = y0 + rnd() * (y1 - y0);
      tw.push({ e: rnd() < 0.5 ? el('circle', { cx: dx.toFixed(1), cy: dy.toFixed(1), r: 1.8 + rnd() * 1.6, fill: C.dark }, scene)
        : el('path', { d: sparklePath(4 + rnd() * 4), transform: 'translate(' + dx.toFixed(1) + ',' + dy.toFixed(1) + ')', fill: C.dark }, scene), a: 0.9, ph: rnd() * 6 });
    }
    for (i = 0; i < Math.round(n / 3); i++) {   // outlined cyan sparkles
      var sx = x0 + rnd() * (x1 - x0), sy = y0 + rnd() * (y1 - y0);
      tw.push({ e: el('path', { d: sparklePath(6 + rnd() * 10), transform: 'translate(' + sx.toFixed(1) + ',' + sy.toFixed(1) + ')', fill: 'none', stroke: C.teal, 'stroke-width': 1.1 }, scene), a: 0.85, ph: rnd() * 6 });
    }
    return tw;
  }
  function skyDefs(defs, id) {
    var sky = el('radialGradient', { id: id + 'sky', cx: '0.15', cy: '0', r: '1.2' }, defs);
    el('stop', { offset: '0', 'stop-color': C.deep }, sky);
    el('stop', { offset: '0.6', 'stop-color': C.bg }, sky);
    el('stop', { offset: '1', 'stop-color': '#031338' }, sky);
    var dg = el('radialGradient', { id: id + 'dot' }, defs);
    el('stop', { offset: '0', 'stop-color': C.teal, 'stop-opacity': 0.55 }, dg);
    el('stop', { offset: '1', 'stop-color': C.teal, 'stop-opacity': 0 }, dg);
  }

  // ---- EARTH panel: looking out of a car window ----
  function buildEarthPanel(svg, id) {
    var R = {};
    var defs = el('defs', null, svg);
    skyDefs(defs, id);
    var clip = el('clipPath', { id: id + 'win' }, defs);
    var winD = 'M70,26 L606,26 Q626,26 626,46 L626,250 L14,250 L14,120 Q14,100 30,86 Z';
    el('path', { d: winD }, clip);

    el('rect', { width: PW, height: PH, fill: C.bg }, svg);
    var scene = el('g', { 'clip-path': 'url(#' + id + 'win)' }, svg);
    el('rect', { width: PW, height: PH, fill: 'url(#' + id + 'sky)' }, scene);
    el('circle', { cx: 120, cy: 34, r: 70, fill: C.blue }, scene);                         // flat crescent moon
    el('circle', { cx: 150, cy: 18, r: 64, fill: C.deep }, scene);
    R.twinkle = addSky(scene, id, 3, 20, 30, 630, 130, 12);
    // far mountain range (static): flat planet-blue back range, line-art front range
    R.mountains = el('g', { 'stroke-linejoin': 'round' }, scene);
    el('path', { d: 'M0,190 L60,150 L110,172 L175,118 L240,165 L300,132 L360,170 L430,104 L500,158 L560,130 L640,168 L640,250 L0,250Z', fill: C.blue }, R.mountains);
    el('path', { d: 'M0,212 L80,170 L150,200 L230,140 L300,196 L380,160 L432,124 L495,176 L560,150 L640,190 L640,250 L0,250Z', fill: C.bg, stroke: C.green, 'stroke-width': 1.4 }, R.mountains);
    el('path', { d: 'M432,124 L452,141 L442,140 L436,148 L429,140 L418,145 Z', fill: C.green }, R.mountains);       // snow cap (the landmark peak)
    el('path', { d: 'M230,140 L252,158 L240,157 L233,165 L224,155 L212,160 Z', fill: C.green, opacity: 0.85 }, R.mountains);
    el('path', { d: 'M380,160 L392,170 M300,196 L312,186 M150,200 L162,192', stroke: C.green, 'stroke-width': 1, opacity: 0.6 }, R.mountains);
    R.peak = [432, 124];
    // field
    el('rect', { x: 0, y: 206, width: PW, height: 50, fill: C.bg }, scene);
    el('path', { d: 'M0,207 Q320,201 640,209', stroke: C.green, 'stroke-width': 1.4, fill: 'none' }, scene);
    el('path', { d: 'M0,218 Q320,211 640,221 M0,230 Q320,222 640,233 M0,243 Q320,235 640,246', stroke: C.green, 'stroke-width': 1, opacity: 0.45, fill: 'none', 'stroke-dasharray': '10 8' }, scene);
    // lone tree (moves): navy shapes, mint outline, mint accents
    R.tree = el('g', null, scene);
    el('rect', { x: -5, y: -8, width: 10, height: 46, rx: 3, fill: C.bg, stroke: C.green, 'stroke-width': 1.4 }, R.tree);
    var lobes = [[0, -22, 28], [-20, -6, 18], [19, -8, 19]];
    lobes.forEach(function (l) { el('circle', { cx: l[0], cy: l[1], r: l[2], fill: 'none', stroke: C.green, 'stroke-width': 2.8 }, R.tree); });
    lobes.forEach(function (l) { el('circle', { cx: l[0], cy: l[1], r: l[2] - 0.7, fill: C.bg }, R.tree); });
    el('path', { d: 'M-14,-34 Q-6,-44 6,-42', stroke: C.green, 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }, R.tree);
    [[-8, -18], [8, -26], [-20, -2], [16, -6], [2, -8]].forEach(function (d) { el('circle', { cx: d[0], cy: d[1], r: 2.6, fill: C.green }, R.tree); });
    R.treeY = 204;
    // ghost of the tree's earlier position
    R.ghost = el('g', { fill: 'none', stroke: C.teal, 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, scene);
    el('circle', { cx: 0, cy: -22, r: 28 }, R.ghost);
    el('circle', { cx: -20, cy: -6, r: 18 }, R.ghost);
    el('circle', { cx: 19, cy: -8, r: 19 }, R.ghost);
    el('path', { d: 'M0,10 L0,38' }, R.ghost);
    R.ghostArrow = el('path', { stroke: C.green, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': '6 6' }, scene);
    // fast foreground: fence posts + grass
    R.fore = el('g', null, scene);
    R.posts = [];
    for (var i = 0; i < 8; i++) {
      var p = el('g', null, R.fore);
      el('rect', { x: -4.5, y: 200, width: 9, height: 56, rx: 2, fill: C.bg, stroke: C.green, 'stroke-width': 1.3 }, p);
      el('circle', { cx: 0, cy: 206, r: 1.6, fill: C.green }, p);
      R.posts.push(p);
    }
    R.rail = el('path', { d: 'M0,214 L640,214 M0,232 L640,232', stroke: C.green, 'stroke-width': 1.4, opacity: 0.8 }, R.fore);
    R.grass = el('g', null, R.fore);
    for (i = 0; i < 2; i++) {
      var gg = el('g', { transform: 'translate(' + (i * PW) + ',0)' }, R.grass);
      for (var j = 0; j < 22; j++) {
        var gx = j * 29 + (j % 3) * 5;
        el('path', { d: 'M' + gx + ',252 q2,-16 6,-22 q-1,12 2,22 q3,-12 8,-18 q-3,10 -2,18Z', fill: C.green, opacity: 0.9 }, gg);
      }
    }
    R.pin = el('path', { d: 'M' + R.peak[0] + ',' + (R.peak[1] - 10) + ' L' + R.peak[0] + ',' + (R.peak[1] - 44), stroke: C.teal, 'stroke-width': 1.6, 'stroke-dasharray': '4 4' }, svg);
    R.ret = makeReticle(svg);
    // car door + window frame (navy with mint line art)
    var frame = el('g', { 'stroke-linejoin': 'round' }, svg);
    el('path', { d: 'M0,0 L640,0 L640,320 L0,320 Z ' + winD, fill: C.bg, 'fill-rule': 'evenodd' }, frame);
    el('path', { d: winD, fill: 'none', stroke: C.green, 'stroke-width': 1.6 }, frame);
    el('path', { d: 'M78,16 L604,16 Q636,16 636,48 L636,262 L4,262 L4,118 Q4,94 24,78 Z', fill: 'none', stroke: C.green, 'stroke-width': 1, opacity: 0.55 }, frame);
    el('path', { d: 'M0,274 Q320,268 640,276', stroke: C.green, 'stroke-width': 3.4, fill: 'none' }, frame);   // mint trim band
    for (i = 0; i < 9; i++) el('circle', { cx: 120 + i * 50, cy: 300, r: 2.4, fill: C.green, opacity: 0.8 }, frame);
    // side mirror
    el('path', { d: 'M18,232 L84,226 Q100,226 100,240 L100,262 Q100,274 86,274 L28,276 Q14,276 14,262 Z', fill: C.bg, stroke: C.green, 'stroke-width': 1.5 }, frame);
    el('path', { d: 'M26,238 L82,234 Q90,234 90,242 L90,258 Q90,266 82,266 L30,268 Q24,268 24,262 Z', fill: C.blue, stroke: C.teal, 'stroke-width': 1 }, frame);
    el('path', { d: 'M36,256 L52,244 M48,260 L66,246', stroke: C.teal, 'stroke-width': 1.2, opacity: 0.8, 'stroke-linecap': 'round' }, frame);
    el('rect', { x: 300, y: 284, width: 64, height: 10, rx: 5, fill: C.green }, frame);   // door handle
    [R.pin, R.ret.g].forEach(function (n) { svg.appendChild(n); }); // above the frame
    R.chev = makeHud(svg);
    return R;
  }

  // ---- SPACE panel: looking out of a spacecraft window ----
  function buildSpacePanel(svg, id) {
    var R = {};
    var defs = el('defs', null, svg);
    skyDefs(defs, id);
    var clip = el('clipPath', { id: id + 'win' }, defs);
    var winD = 'M92,22 L548,22 Q566,22 572,38 L622,236 Q626,254 606,254 L34,254 Q14,254 18,236 L68,38 Q74,22 92,22 Z';
    el('path', { d: winD }, clip);
    var glow = el('radialGradient', { id: id + 'glow' }, defs);
    el('stop', { offset: '0', 'stop-color': C.teal, 'stop-opacity': 0.45 }, glow);
    el('stop', { offset: '1', 'stop-color': C.teal, 'stop-opacity': 0 }, glow);

    el('rect', { width: PW, height: PH, fill: C.bg }, svg);
    var scene = el('g', { 'clip-path': 'url(#' + id + 'win)' }, svg);
    el('rect', { width: PW, height: PH, fill: 'url(#' + id + 'sky)' }, scene);
    // flat ringed planet in the far background (like the reference)
    var pl = el('g', { transform: 'translate(590,236)' }, scene);
    el('circle', { r: 66, fill: C.blue }, pl);
    el('ellipse', { rx: 102, ry: 28, fill: 'none', stroke: C.blue, 'stroke-width': 11, transform: 'rotate(-18)' }, pl);
    R.twinkle = addSky(scene, id, 9, 60, 26, 600, 250, 16);
    // distant constellation + guide star (static) — Big Dipper shape
    R.far = el('g', null, scene);
    var dip = [[318, 62], [330, 100], [390, 108], [406, 76], [448, 74], [482, 82], [518, 58]];
    var lines = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]];
    lines.forEach(function (l) { el('line', { x1: dip[l[0]][0], y1: dip[l[0]][1], x2: dip[l[1]][0], y2: dip[l[1]][1], stroke: C.green, 'stroke-width': 1.2, opacity: 0.85 }, R.far); });
    dip.forEach(function (p, k) { if (k) { el('circle', { cx: p[0], cy: p[1], r: 9, fill: 'url(#' + id + 'glow)' }, R.far); el('circle', { cx: p[0], cy: p[1], r: 3, fill: C.teal }, R.far); } });
    R.peak = dip[0];
    el('circle', { cx: dip[0][0], cy: dip[0][1], r: 28, fill: 'url(#' + id + 'glow)' }, R.far);
    R.guideSpin = el('g', { transform: 'translate(' + dip[0][0] + ',' + dip[0][1] + ')' }, R.far);
    el('path', { d: sparklePath(18), fill: 'none', stroke: C.teal, 'stroke-width': 1.5 }, R.guideSpin);
    el('path', { d: sparklePath(7), fill: C.teal }, R.guideSpin);
    // the Moon (moves): navy with cyan outline, flat-blue crescent, cyan craters
    R.moon = el('g', null, scene);
    el('circle', { r: 54, fill: C.bg, stroke: C.teal, 'stroke-width': 1.5 }, R.moon);
    el('path', { d: 'M10,-53 A54,54 0 0 1 10,53 A66,66 0 0 0 10,-53Z', fill: C.blue }, R.moon);
    [[-0.35, -0.3, 0.22], [0.3, 0.1, 0.16], [-0.1, 0.42, 0.12], [0.42, -0.42, 0.09], [-0.5, 0.2, 0.08]].forEach(function (c) {
      el('circle', { cx: c[0] * 54, cy: c[1] * 54, r: c[2] * 54, fill: 'none', stroke: C.teal, 'stroke-width': 1.1 }, R.moon);
    });
    R.treeY = 192;
    R.ghost = el('g', null, scene);
    el('circle', { r: 54, fill: 'none', stroke: C.teal, 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, R.ghost);
    R.ghostArrow = el('path', { stroke: C.green, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': '6 6' }, scene);
    R.pin = el('path', { d: 'M' + (R.peak[0] - 18) + ',' + R.peak[1] + ' L' + (R.peak[0] - 40) + ',' + R.peak[1], stroke: C.teal, 'stroke-width': 1.6, 'stroke-dasharray': '4 4' }, svg);
    R.ret = makeReticle(svg);
    // spacecraft window frame (navy panel, mint line art)
    var frame = el('g', { 'stroke-linejoin': 'round' }, svg);
    el('path', { d: 'M0,0 L640,0 L640,320 L0,320 Z ' + winD, fill: C.bg, 'fill-rule': 'evenodd' }, frame);
    el('path', { d: winD, fill: 'none', stroke: C.green, 'stroke-width': 1.6 }, frame);
    el('path', { d: 'M86,12 L554,12 Q576,12 582,32 L634,238 Q638,264 610,264 L30,264 Q2,264 6,238 L58,32 Q64,12 86,12 Z', fill: 'none', stroke: C.green, 'stroke-width': 1, opacity: 0.55 }, frame);
    var i;
    for (i = 0; i < 9; i++) el('circle', { cx: 100 + i * 55, cy: 6, r: 2.4, fill: C.green }, frame);    // rivets
    for (i = 0; i < 11; i++) el('circle', { cx: 50 + i * 54, cy: 272, r: 2.4, fill: C.green }, frame);
    el('path', { d: 'M0,282 L640,282', stroke: C.green, 'stroke-width': 3.4 }, frame);                  // mint trim band
    R.lights = [];
    for (i = 0; i < 6; i++) R.lights.push(el('circle', { cx: 150 + i * 26, cy: 302, r: 4, fill: i % 3 === 0 ? C.green : C.teal }, frame));
    el('rect', { x: 330, y: 294, width: 110, height: 16, rx: 4, fill: C.blue, stroke: C.green, 'stroke-width': 1 }, frame);
    el('path', { d: 'M338,302 L352,302 L358,296 L366,308 L374,302 L432,302', stroke: C.green, 'stroke-width': 1.6, fill: 'none' }, frame);
    [R.pin, R.ret.g].forEach(function (n) { svg.appendChild(n); }); // above the frame
    R.chev = makeHud(svg);
    return R;
  }

  // ---- instance ----
  var uid = 0;
  function mount(root) {
    if (!root) throw new Error('GuidingStars.mount: no element given');
    if (root.__guidingStars) return root.__guidingStars;
    injectAssets();
    var id = 'gs' + (++uid);

    var wrap = document.createElement('div');
    wrap.className = 'gs-wrap';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Guiding stars animation: near things move across your view, far things stay put');
    wrap.innerHTML =
      '<div class="gs-panels">' +
        '<div class="gs-panel" data-p="earth"></div>' +
        '<div class="gs-panel" data-p="space"></div>' +
      '</div>' +
      '<button class="gs-btn" type="button"></button>';
    root.appendChild(wrap);
    var btn = wrap.querySelector('.gs-btn');

    function makeSvg(host, label) {
      var svg = el('svg', { viewBox: '0 0 ' + PW + ' ' + PH, role: 'img', 'aria-label': label });
      host.appendChild(svg);
      return svg;
    }
    var E = buildEarthPanel(makeSvg(wrap.querySelector('[data-p="earth"]'), 'Looking out of a car window: a lone tree slides past while a distant mountain range stays in place.'), id + 'e');
    var S = buildSpacePanel(makeSvg(wrap.querySelector('[data-p="space"]'), 'Looking out of a spacecraft window: the Moon slides past while the distant guide stars stay in place.'), id + 's');

    var mqRM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduced = !!(mqRM && mqRM.matches);
    function onRM(e) { reduced = e.matches; }
    if (mqRM) { if (mqRM.addEventListener) mqRM.addEventListener('change', onRM); else if (mqRM.addListener) mqRM.addListener(onRM); }

    function layout() {
      var w = wrap.getBoundingClientRect().width;
      wrap.classList.toggle('gs-narrow', w > 0 && w < 760);
    }
    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(layout) : null;
    if (ro) ro.observe(wrap); else window.addEventListener('resize', layout);
    layout();

    // ---- render (pure function of time) ----
    var t = 0;
    function pr(a, b) { return reduced ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a), 0, 1); }
    function vis(e, o) { e.setAttribute('opacity', o.toFixed(3)); e.style.display = o <= 0.001 ? 'none' : ''; }
    function at(e, x, y, sc) { e.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')' + (sc != null ? ' scale(' + Math.max(0.001, sc).toFixed(3) + ')' : '')); }

    function renderPanel(P, isEarth) {
      var fade = 1 - pr(DUR - 0.7, DUR);                         // gentle fade before looping
      var appear = pr(0, 0.6);
      // twinkle
      for (var i = 0; i < P.twinkle.length; i++) {
        var s = P.twinkle[i];
        s.e.setAttribute('opacity', (s.a * (reduced ? 1 : 0.6 + 0.4 * Math.sin(t * 1.7 + s.ph))).toFixed(3));
      }
      // near object position (reduced motion: jump between key positions)
      var tx = reduced ? (t < 5 ? nearX(4) : t < 11.5 ? nearX(8) : -200) : nearX(t);
      var ny = P.treeY, sc = isEarth ? 1.35 : 1;
      at(isEarth ? P.tree : P.moon, tx, ny, sc);
      vis(isEarth ? P.tree : P.moon, appear * fade);
      // ghost of where it was
      var gx = nearX(GHOST_T);
      var gO = pr(GHOST_T + 0.3, GHOST_T + 0.9) * (1 - pr(11.5, 12.3));
      at(P.ghost, gx, ny, sc);
      vis(P.ghost, gO * 0.6 * fade);
      var arrowTo = Math.max(tx + (isEarth ? 44 : 62), 40);
      var ay = isEarth ? ny - 30 : ny;
      var gEdge = gx - (isEarth ? 46 : 60);
      P.ghostArrow.setAttribute('d', 'M' + gEdge + ',' + ay + ' L' + arrowTo + ',' + ay + ' M' + (arrowTo + 8) + ',' + (ay - 7) + ' L' + arrowTo + ',' + ay + ' L' + (arrowTo + 8) + ',' + (ay + 7));
      vis(P.ghostArrow, gO * (gx - (isEarth ? 46 : 60) - arrowTo > 20 ? 1 : 0) * fade);
      vis(P.pin, pr(5.6, 6.2) * (1 - pr(11.5, 12)) * fade);
      // landmark reticle
      var rIn = backOut(pr(12, 12.7));
      at(P.ret.g, P.peak[0], P.peak[1] + (isEarth ? 8 : 0), rIn);
      vis(P.ret.g, Math.min(1, rIn) * fade);
      P.ret.spin.setAttribute('transform', 'rotate(' + (reduced ? 0 : (t * 40) % 360).toFixed(1) + ')');
      // movement HUD chevrons
      for (i = 0; i < P.chev.length; i++) P.chev[i].setAttribute('opacity', reduced ? 0.8 : (0.25 + 0.75 * Math.max(0, Math.sin(t * 6 - i * 0.9))).toFixed(3));
      if (isEarth) {
        // fence posts & grass rush past (fast = very near)
        var off = reduced ? 0 : (t * 260) % 90;
        for (i = 0; i < P.posts.length; i++) at(P.posts[i], 660 - ((i * 90 + off) % 720), 0);
        P.grass.setAttribute('transform', 'translate(' + (reduced ? 0 : -((t * 300) % PW)).toFixed(1) + ',0)');
        P.mountains.setAttribute('transform', 'translate(' + (reduced ? 0 : -t * 0.12).toFixed(2) + ',0)');  // barely moves
      } else {
        P.guideSpin.setAttribute('transform', 'translate(' + P.peak[0] + ',' + P.peak[1] + ') rotate(' + (reduced ? 0 : (t * 15) % 360).toFixed(1) + ') scale(' + (1 + (reduced ? 0 : Math.sin(t * 3) * 0.08)).toFixed(3) + ')');
        for (i = 0; i < P.lights.length; i++) P.lights[i].setAttribute('opacity', reduced ? 0.9 : (0.4 + 0.6 * (Math.sin(t * 2.4 + i * 1.3) > 0 ? 1 : 0.3)).toFixed(2));
      }
    }

    function render(tt) {
      t = tt;
      renderPanel(E, true);
      renderPanel(S, false);
    }

    // ---- playback ----
    var playing = true, visible = false, started = false;
    var ICON_PAUSE = '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="1" width="2.4" height="8" rx=".6" fill="currentColor"/><rect x="6.1" y="1" width="2.4" height="8" rx=".6" fill="currentColor"/></svg>';
    var ICON_PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.4 1.2 L8.6 5 L2.4 8.8Z" fill="currentColor"/></svg>';
    function syncBtn() { btn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY; btn.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation'); }
    btn.addEventListener('click', function () { playing = !playing; syncBtn(); });
    syncBtn();

    var io = null;
    if (window.parent !== window || root.hasAttribute('data-guiding-now')) {
      visible = true;
      started = true;
    } else if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(function (entries) {
        visible = entries[entries.length - 1].intersectionRatio >= 0.3;
        if (visible && !started) { started = true; t = 0; }
      }, { threshold: [0, 0.3, 0.6, 1] });
      io.observe(wrap);
    } else { visible = true; started = true; }

    var last = performance.now(), raf = 0, alive = true;
    function frame(now) {
      if (!alive) return;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (playing && visible && !document.hidden) { t += dt; if (t >= DUR) t -= DUR; render(t); }
      raf = requestAnimationFrame(frame);
    }
    render(0);
    raf = requestAnimationFrame(frame);

    var api = {
      seek: function (s) { t = clamp(s, 0, DUR - 0.001); render(t); },
      play: function () { playing = true; syncBtn(); },
      pause: function () { playing = false; syncBtn(); },
      getState: function () { return { t: t, playing: playing, visible: visible, narrow: wrap.classList.contains('gs-narrow') }; },
      destroy: function () {
        alive = false; cancelAnimationFrame(raf);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', layout);
        if (io) io.disconnect();
        if (mqRM) { if (mqRM.removeEventListener) mqRM.removeEventListener('change', onRM); else if (mqRM.removeListener) mqRM.removeListener(onRM); }
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        delete root.__guidingStars;
      }
    };
    root.__guidingStars = api;
    return api;
  }

  function autoMount() {
    var els = document.querySelectorAll('[data-guiding-stars]');
    for (var i = 0; i < els.length; i++) mount(els[i]);
  }
  window.GuidingStars = { mount: mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
  else autoMount();
})();
