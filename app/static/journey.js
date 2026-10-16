const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SCENES = [
  ["film", "100vh"],
  ["sky", "90vh"],
  ["window", "120vh"],
  ["crew", "150vh"],
  ["way", "160vh"],
  ["rig", "170vh"],
  ["mission", "160vh"],
  ["name", "120vh"],
  ["peel", "210vh"],
];

const TOUR = [
  { name: "Navi", line: "Grissom, spelled backward." },
];

const state = { crew: "", way: "", rig: "", mission: "", name: "" };
let scene = "film";
let progress = 0;
let sky = null;
let tour = [];
let canopus = null;
let regor = null;
let vega = null;
let altair = null;
let peel = null;
let shown = "";
let biasAz = 0;
let biasAlt = 0;
let queued = false;

const stage = document.getElementById("stage");
const skyFrame = document.getElementById("sky-frame");
const canvas = document.getElementById("dome");
const veil = document.getElementById("veil");
const mask = document.getElementById("mask");
const still = document.getElementById("still");
const objects = document.getElementById("objects");
const copy = document.getElementById("copy");
const reticule = document.getElementById("reticule");
const receipt = document.getElementById("receipt");
const discWrap = document.getElementById("disc-wrap");
const disc = document.getElementById("disc");
const plate = document.getElementById("plate");
const sheet = document.getElementById("sheet-scene");
const roleCaption = document.getElementById("role-caption");
const hint = document.getElementById("hint");
const rail = document.getElementById("rail");

const gl = canvas.getContext("webgl", { antialias: true, alpha: false });

const VS = `
attribute vec3 pos;
attribute float mag;
attribute vec3 col;
attribute float alpha;
uniform mat4 mvp;
varying vec3 vCol;
varying float vAlpha;
void main() {
  gl_Position = mvp * vec4(pos, 1.0);
  gl_PointSize = clamp(7.4 - mag, 1.1, 9.0);
  vCol = col;
  vAlpha = alpha;
}`;
const FS = `
precision mediump float;
varying vec3 vCol;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  if (dot(c, c) > 0.25) discard;
  gl_FragColor = vec4(vCol, vAlpha);
}`;
const LINE_VS = `attribute vec3 pos; uniform mat4 mvp; void main() { gl_Position = mvp * vec4(pos, 1.0); }`;
const LINE_FS = `precision mediump float; void main() { gl_FragColor = vec4(0.96, 0.96, 0.97, 0.28); }`;

let lookAz = 200;
let lookAlt = 48;
let fov = 78;
let camRight = [1, 0, 0];
let camUp = [0, 0, 1];
let camForward = [0, 1, 0];
let frameName = "dome";
const packs = {};
const starProg = gl && program(VS, FS);
const lineProg = gl && program(LINE_VS, LINE_FS);
const starLoc = starProg && {
  pos: gl.getAttribLocation(starProg, "pos"),
  mag: gl.getAttribLocation(starProg, "mag"),
  col: gl.getAttribLocation(starProg, "col"),
  alpha: gl.getAttribLocation(starProg, "alpha"),
  mvp: gl.getUniformLocation(starProg, "mvp"),
};
const lineLoc = lineProg && {
  pos: gl.getAttribLocation(lineProg, "pos"),
  mvp: gl.getUniformLocation(lineProg, "mvp"),
};
const starBuf = { dome: gl && gl.createBuffer(), window: gl && gl.createBuffer() };
const lineBuf = gl && gl.createBuffer();
if (gl) {
  const horizon = new Float32Array(181 * 3);
  for (let i = 0; i <= 180; i++) {
    const az = (i / 180) * Math.PI * 2;
    horizon[i * 3] = Math.sin(az) * 100;
    horizon[i * 3 + 1] = Math.cos(az) * 100;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
  gl.bufferData(gl.ARRAY_BUFFER, horizon, gl.STATIC_DRAW);
}

function program(vs, fs) {
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  return prog;
}

function colorOf(bv) {
  const t = bv == null ? 0.6 : Math.max(-0.3, Math.min(1.8, bv));
  return [1, Math.max(0.45, 1 - 0.28 * t), Math.max(0.35, 0.95 - 0.55 * Math.max(0, t))];
}

function place(altDeg, azDeg, plx) {
  const alt = (altDeg * Math.PI) / 180;
  const az = (azDeg * Math.PI) / 180;
  const d = plx == null || plx <= 0 ? 800 : 1000 / plx;
  const c = Math.cos(alt);
  return [d * c * Math.sin(az), d * c * Math.cos(az), d * Math.sin(alt)];
}

function perspective(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, (2 * far * near) * nf, 0,
  ]);
}

function lookAt(eye, center, up) {
  let zx = eye[0] - center[0];
  let zy = eye[1] - center[1];
  let zz = eye[2] - center[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len; zy /= len; zz /= len;
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len; xy /= len; xz /= len;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  return new Float32Array([
    xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ]);
}

function mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

function norm(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function fieldFor(alt) {
  const wide = Math.min(44, Math.max(16, alt * 1.35));
  const fit = Math.max(7, alt * 2 - 0.6);
  return Math.min(wide, fit);
}

function smooth(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function panCurve(t) {
  const hold = 0.38;
  if (t <= hold) return 0;
  if (t >= 1 - hold) return 1;
  const u = (t - hold) / (1 - 2 * hold);
  return smooth(u);
}

function presence(p) {
  if (reduce) return 1;
  const edge = 0.12;
  if (p < edge) return p / edge;
  if (p > 1 - edge) return (1 - p) / edge;
  return 1;
}

function along(list, p) {
  if (!list.length) return null;
  if (list.length === 1) {
    const a = list[0];
    return { alt: a.alt, az: a.az, fov: fieldFor(a.alt), label: a };
  }
  const n = list.length - 1;
  const x = Math.min(0.999, Math.max(0, p)) * n;
  const i = Math.min(n - 1, Math.floor(x));
  const t = n === 0 ? 0 : x - i;
  const u = panCurve(t);
  const a = list[i];
  const b = list[Math.min(n, i + 1)];
  const dAz = ((b.az - a.az + 540) % 360) - 180;
  return {
    alt: a.alt + (b.alt - a.alt) * u,
    az: (a.az + dAz * u + 360) % 360,
    fov: fieldFor(a.alt) + (fieldFor(b.alt) - fieldFor(a.alt)) * u,
    label: u < 0.5 ? a : b,
  };
}

function upload(name) {
  const pack = sky[name];
  const stars = pack.stars;
  const interleaved = new Float32Array(stars.length * 8);
  const named = [];
  stars.forEach((star, i) => {
    const [, alt, az, vmag, bv, plx, starName] = star;
    const p = place(alt, az, plx);
    interleaved.set(p, i * 8);
    interleaved[i * 8 + 3] = vmag;
    interleaved.set(colorOf(bv), i * 8 + 4);
    interleaved[i * 8 + 7] = Math.max(0.4, Math.min(1, (7.2 - vmag) / 6));
    if (starName) named.push({ name: starName, alt, az, mag: vmag, p });
  });
  gl.bindBuffer(gl.ARRAY_BUFFER, starBuf[name]);
  gl.bufferData(gl.ARRAY_BUFFER, interleaved, gl.STATIC_DRAW);
  packs[name] = { count: stars.length, named };
}

function pose() {
  lookAlt = Math.max(fov / 2, Math.min(90, lookAlt));
  const alt = (lookAlt * Math.PI) / 180;
  const az = (lookAz * Math.PI) / 180;
  const c = Math.cos(alt);
  camForward = [c * Math.sin(az), c * Math.cos(az), Math.sin(alt)];
  camRight = [Math.cos(az), -Math.sin(az), 0];
  camUp = norm(cross(camRight, camForward));
}

function camera() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, rect.width);
  const h = Math.max(1, rect.height);
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  const proj = perspective((fov * Math.PI) / 180, w / h, 0.05, 50000);
  return mul(proj, lookAt([0, 0, 0], camForward, camUp));
}

function project(mvp, p) {
  const w = mvp[3] * p[0] + mvp[7] * p[1] + mvp[11] * p[2] + mvp[15];
  if (w <= 0.05) return null;
  const cx = mvp[0] * p[0] + mvp[4] * p[1] + mvp[8] * p[2] + mvp[12];
  const cy = mvp[1] * p[0] + mvp[5] * p[1] + mvp[9] * p[2] + mvp[13];
  const ndcX = cx / w;
  const ndcY = cy / w;
  if (ndcX < -1.05 || ndcX > 1.05 || ndcY < -1.05 || ndcY > 1.05) return null;
  const rect = canvas.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  return [
    rect.left - stageRect.left + (ndcX * 0.5 + 0.5) * rect.width,
    rect.top - stageRect.top + (1 - (ndcY * 0.5 + 0.5)) * rect.height,
  ];
}

function drawStars(mvp) {
  const pack = packs[frameName];
  if (!pack) return;
  gl.clearColor(0.039, 0.039, 0.047, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(starProg);
  gl.uniformMatrix4fv(starLoc.mvp, false, mvp);
  gl.bindBuffer(gl.ARRAY_BUFFER, starBuf[frameName]);
  const stride = 32;
  gl.enableVertexAttribArray(starLoc.pos);
  gl.vertexAttribPointer(starLoc.pos, 3, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(starLoc.mag);
  gl.vertexAttribPointer(starLoc.mag, 1, gl.FLOAT, false, stride, 12);
  gl.enableVertexAttribArray(starLoc.col);
  gl.vertexAttribPointer(starLoc.col, 3, gl.FLOAT, false, stride, 16);
  gl.enableVertexAttribArray(starLoc.alpha);
  gl.vertexAttribPointer(starLoc.alpha, 1, gl.FLOAT, false, stride, 28);
  gl.drawArrays(gl.POINTS, 0, pack.count);
  gl.useProgram(lineProg);
  gl.uniformMatrix4fv(lineLoc.mvp, false, mvp);
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
  gl.enableVertexAttribArray(lineLoc.pos);
  gl.vertexAttribPointer(lineLoc.pos, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.LINE_LOOP, 0, 181);
}

function aim(alt, az, nextFov, useBias) {
  fov = nextFov;
  lookAlt = alt + (useBias ? biasAlt : 0);
  lookAz = (az + (useBias ? biasAz : 0) + 360) % 360;
  pose();
}

function useFrame(name) {
  if (frameName !== name) {
    frameName = name;
    biasAz = 0;
    biasAlt = 0;
  }
}

function findNamed(list, name) {
  return list.find((star) => star.name === name) || null;
}

function escapeAttr(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function pressed(key, value) {
  return state[key] === value ? "true" : "false";
}

function starPlate() {
  const stars = [
    ["Polaris", 36.1, 0.74, false],
    ["Navi", 53.67, 33.34, true],
    ["Vega", 48.28, 290.53, false],
  ];
  const cx = 180;
  const cy = 268;
  const radius = 168;
  const dots = stars.map(([name, alt, az, label]) => {
    const r = ((90 - alt) / 90) * radius;
    const rad = (az * Math.PI) / 180;
    const x = cx + r * Math.sin(rad);
    const y = cy - r * Math.cos(rad);
    const text = label
      ? `<text x="${(x + 14).toFixed(1)}" y="${(y + 6).toFixed(1)}" fill="#141414" font-family="Helvetica Neue, Helvetica, sans-serif" font-size="22">${name}</text>`
      : "";
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${label ? 4.2 : 2.6}" fill="#141414"/>${text}`;
  }).join("");
  return `<svg viewBox="0 0 360 560" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#141414" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy}" r="3" fill="#db362d"/>
    ${dots}
  </svg>`;
}

function anglePlate() {
  return `<svg viewBox="0 0 360 560" aria-hidden="true">
    <line x1="36" y1="360" x2="324" y2="360" stroke="#141414" stroke-width="1.6"/>
    <line x1="36" y1="360" x2="292" y2="118" stroke="#141414" stroke-width="1.6"/>
    <path d="M148 360 A 112 112 0 0 1 126 268" fill="none" stroke="#db362d" stroke-width="2"/>
    <text x="158" y="332" fill="#141414" font-family="Helvetica Neue, Helvetica, sans-serif" font-size="42">34°</text>
  </svg>`;
}

function linePlate() {
  return `<svg viewBox="0 0 360 560" aria-hidden="true">
    <circle cx="180" cy="268" r="132" fill="#f6f3ec" stroke="#141414" stroke-width="1.5"/>
    <path d="M180 136 A 132 132 0 0 0 180 400 Z" fill="#141414"/>
    <line x1="180" y1="118" x2="180" y2="418" stroke="#db362d" stroke-width="2"/>
  </svg>`;
}

function choiceButton(key, value, frame, kicker, title, lateKicker, lateTitle) {
  const kickerAttrs = lateKicker
    ? ` class="cap-k" data-early="${escapeAttr(kicker)}" data-late="${escapeAttr(lateKicker)}"`
    : "";
  const titleAttrs = lateTitle
    ? ` class="cap-b" data-early="${escapeAttr(title)}" data-late="${escapeAttr(lateTitle)}"`
    : "";
  return `<button type="button" data-key="${key}" data-value="${value}" aria-pressed="${pressed(key, value)}" aria-label="${escapeAttr(title)}">
    ${frame}
    <span class="cap"><i${kickerAttrs}>${kicker}</i><b${titleAttrs}>${title}</b></span>
  </button>`;
}

function wall(room, kind, buttons) {
  const paper = kind === "is-paper" ? " is-paper-room" : "";
  return `<div class="room-wrap${paper}"><p class="room">${room}</p><div class="wall ${kind}">${buttons}</div></div>`;
}

function objectsHtml(id) {
  if (id === "crew") {
    return wall("Crew", "is-people", [
      choiceButton("crew", "cooper", `<span class="frame"><img class="crop-face" src="/archive/portrait-cooper.jpg" alt=""></span>`, "Mercury", "Cooper"),
      choiceButton("crew", "haise", `<span class="frame"><img class="crop-face" src="/archive/portrait-haise.jpg" alt=""></span>`, "Apollo 13", "Haise"),
      choiceButton("crew", "duke", `<span class="frame"><img class="crop-face" src="/archive/portrait-duke.jpg" alt=""></span>`, "Apollo 16", "Duke"),
    ].join(""));
  }
  if (id === "way") {
    return wall("Way", "is-paper", [
      choiceButton("way", "star", `<span class="frame">${starPlate()}</span>`, "Thirty-seven on the computer", "Name the star"),
      choiceButton("way", "angle", `<span class="frame">${anglePlate()}</span>`, "The accounts never name them", "34°"),
      choiceButton("way", "line", `<span class="frame">${linePlate()}</span>`, "When the stars are debris", "Earth's edge"),
    ].join(""));
  }
  if (id === "rig") {
    const pick = (value, kicker, title) => `<button type="button" data-key="rig" data-value="${value}" aria-pressed="${pressed("rig", value)}" aria-label="${escapeAttr(title)}"><span class="cap"><i>${kicker}</i><b>${title}</b></span></button>`;
    return `<div class="rig">
      <p class="room">Machine</p>
      <div class="rig-view">
        <img class="rig-layer ship" data-for="mercury" src="/archive/schematic-mercury.jpg" alt="">
        <img class="rig-layer ship" data-for="gemini" src="/archive/schematic-gemini.jpg" alt="">
        <img class="rig-layer ship" data-for="apollo" src="/archive/craft-apollo.jpg" alt="">
        <img class="rig-layer train" data-for="mercury" src="/archive/trainer-link.jpg" alt="">
        <div class="rig-layer train drawing" data-for="gemini" id="drawing"></div>
      </div>
      <div class="wall is-rig">${pick("mercury", "Mercury", "Link trainer")}${pick("gemini", "Gemini", "Plywood")}${pick("apollo", "Apollo", "A lens in the window")}</div>
    </div>`;
  }
  if (id === "mission") {
    return wall("Flight", "is-people", [
      choiceButton("mission", "faith7", `<span class="frame"><img class="crop-sea" src="/archive/mission-faith7.jpg" alt=""></span>`, "16 May 1963", "Faith 7"),
      choiceButton("mission", "apollo12", `<span class="frame"><img class="crop-walk" src="/archive/mission-apollo12.jpg" alt=""></span>`, "Apollo 12", "Thirty-six seconds"),
      choiceButton("mission", "apollo13", `<span class="frame"><img class="crop-wreck" src="/archive/mission-apollo13.jpg" alt=""></span>`, "Once the debris cleared", "Altair and Vega"),
    ].join(""));
  }
  return "";
}

function stationHtml(id) {
  if (id === "sky") return `<p class="kicker">Guide star</p><h2 id="dock-title">Navi</h2><p class="note" id="dock-line">Grissom, spelled backward.</p>`;
  if (id === "window") return `<p class="kicker" id="win-kicker">The lamp</p><h2 id="win-title">It goes out.</h2><p class="note" id="win-note"></p>`;
  if (id === "name") {
    return `<p class="kicker">The sheet</p><h2>Your name</h2><input class="who" id="who" maxlength="22" autocomplete="off" spellcheck="false" value="${escapeAttr(state.name)}">`;
  }
  return "";
}

function showStation(id) {
  if (shown === id) return;
  shown = id;
  copy.innerHTML = stationHtml(id);
  objects.innerHTML = objectsHtml(id);
  if (id === "rig") loadDrawing();
  const who = document.getElementById("who");
  if (who) who.addEventListener("input", () => {
    state.name = who.value;
    paintDisc();
  });
}

let discKey = "";

function receiptText() {
  const bits = [
    { cooper: "Cooper", haise: "Haise", duke: "Duke" }[state.crew],
    { star: "Name the star", angle: "34°", line: "Earth's edge" }[state.way],
    { mercury: "Mercury", gemini: "Gemini", apollo: "Apollo" }[state.rig],
    { faith7: "Faith 7", apollo12: "Apollo 12", apollo13: "Apollo 13" }[state.mission],
  ].filter(Boolean);
  return bits.join("   ·   ");
}

function paintDisc() {
  if (!window.Patch) return;
  const key = JSON.stringify(state);
  const svg = Patch.patchSvg(state);
  if (key !== discKey) {
    discKey = key;
    disc.innerHTML = svg;
    const face = document.getElementById("peel-face");
    if (face) {
      face.innerHTML = svg;
      face.dataset.key = key;
    }
  }
  const role = Patch.specialist([state.crew, state.way, state.rig, state.mission]);
  roleCaption.textContent = role;
  if (receipt) receipt.textContent = receiptText();
}

function ensurePeel() {
  if (peel || typeof Peel === "undefined" || !Peel.supported) return;
  const el = document.getElementById("peel");
  const size = Math.round(Math.min(window.innerHeight * 0.58, 520));
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  const face = document.getElementById("peel-face");
  face.innerHTML = Patch.patchSvg(state);
  face.dataset.key = JSON.stringify(state);
  discKey = face.dataset.key;
  const r = size * (270 / 560);
  peel = new Peel("#peel", {
    circle: { cx: size / 2, cy: size / 2, r },
    corner: Peel.Corners.BOTTOM_RIGHT,
    setPeelOnInit: false,
  });
  peel.setPeelPath(size, size, size * 0.62, size * 0.58);
  peel.setTimeAlongPath(0);
}

function dockStar(star) {
  const title = document.getElementById("dock-title");
  const line = document.getElementById("dock-line");
  if (!title || !star) return;
  title.textContent = star.name;
  if (line) line.textContent = star.line || "";
}

function placeReticule(screen) {
  if (!screen) {
    reticule.hidden = true;
    return;
  }
  reticule.hidden = false;
  reticule.style.left = `${screen[0]}px`;
  reticule.style.top = `${screen[1]}px`;
}

function projectNamed(mvp, name) {
  const pack = packs[frameName];
  if (!pack) return null;
  const star = pack.named.find((item) => item.name === name);
  if (!star) return null;
  return project(mvp, star.p);
}

async function loadDrawing() {
  const host = document.getElementById("drawing");
  if (!host || host.querySelector("svg")) return;
  const res = await fetch("/cutaway/gemini-trainer.svg");
  if (!res.ok) return;
  host.innerHTML = await res.text();
  const svg = host.querySelector("svg");
  if (svg) {
    svg.setAttribute("viewBox", "90 200 860 560");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  }
  requestRender();
}

function trainerLayers(p) {
  const svg = document.querySelector("#drawing svg");
  if (!svg) return;
  const zeiss = smooth(Math.max(0, (p - 0.18) / 0.28));
  const box = smooth(Math.max(0, (p - 0.52) / 0.3));
  const dome = svg.querySelector("#dome");
  const dumbbell = svg.querySelector("#zeiss");
  const trainer = svg.querySelector("#trainer");
  if (dome) dome.style.opacity = "1";
  if (dumbbell) dumbbell.style.opacity = String(0.15 + 0.85 * zeiss);
  if (trainer) trainer.style.opacity = String(0.12 + 0.88 * box);
  const line = document.getElementById("trainer-line");
  if (!line) return;
  if (p < 0.4) line.textContent = "68 feet across. 44 feet to the apex.";
  else if (p < 0.68) line.textContent = "The latitude axis parks on Chapel Hill, until a flight needs another sky.";
  else line.textContent = "Plywood and two chairs. The window is the crop. Reconstruction.";
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el && el.textContent !== text) el.textContent = text;
}

function scanWall() {
  const wall = objects.querySelector(".wall");
  if (!wall) return;
  const buttons = [...wall.querySelectorAll("button")];
  const picked = buttons.some((button) => button.getAttribute("aria-pressed") === "true");
  wall.classList.toggle("is-picked", picked);
  const lead = Math.min(buttons.length - 1, Math.floor(progress * buttons.length));
  buttons.forEach((button, index) => {
    button.classList.toggle("is-lead", !picked && !reduce && index === lead);
  });
}

function paint() {
  syncFromScroll();
  const p = progress;
  const walls = ["crew", "way", "rig", "mission"].includes(scene);
  const onPaper = scene === "peel";
  stage.classList.toggle("is-film", scene === "film");
  stage.classList.toggle("is-dock", scene === "sky" || scene === "window");
  stage.classList.toggle("is-look", scene === "sky" || scene === "window");
  stage.classList.toggle("is-sign", scene === "name");
  stage.classList.toggle("is-sheet", onPaper);
  showStation(scene);
  hint.hidden = scene !== "film" || window.scrollY > 30;

  skyFrame.classList.remove("is-letterbox");
  skyFrame.style.transform = "none";
  skyFrame.style.borderColor = "transparent";

  let label = null;
  let lamp = 1;
  let hole = 0;
  mask.classList.remove("is-on");
  still.hidden = scene !== "film";
  discWrap.hidden = true;

  if (scene === "film") {
    useFrame("dome");
    const star = tour[0];
    if (star) aim(star.alt, star.az, fieldFor(star.alt), false);
    else aim(50, 33, 36, false);
    const fade = reduce ? 1 : (p < 0.72 ? 1 : 1 - (p - 0.72) / 0.28);
    still.style.opacity = String(fade);
    copy.style.opacity = "0";
  } else if (onPaper) {
    copy.style.opacity = "0";
  } else if (scene === "name") {
    copy.style.opacity = String(presence(p));
  } else if (walls) {
    copy.style.opacity = "0";
  } else {
    copy.style.opacity = String(presence(p));
  }

  if (scene === "sky" && tour.length) {
    useFrame("dome");
    const step = along(tour, p);
    aim(step.alt, step.az, step.fov, true);
    label = step.label;
    canvas.style.opacity = "1";
  }

  if (scene === "window") {
    if (p < 0.46) {
      useFrame("dome");
      const star = tour[0];
      if (star) aim(star.alt, star.az, fieldFor(star.alt), false);
      else aim(50, 33, 40, false);
      lamp = 1 - smooth(p / 0.4);
      setText("win-kicker", "The lamp");
      setText("win-title", p < 0.22 ? "It goes out." : "The sky is moved.");
      setText("win-note", "");
    } else if (canopus) {
      useFrame("window");
      aim(canopus.alt, canopus.az, 68, true);
      lamp = smooth((p - 0.5) / 0.28);
      hole = lamp;
      label = canopus;
      setText("win-kicker", "The window");
      setText("win-title", "Canopus");
      setText("win-note", "Regor is in this patch. Chaffee, spelled backward.");
    }
    canvas.style.opacity = String(Math.max(0.03, lamp));
  } else if (scene !== "film") {
    canvas.style.opacity = walls || onPaper || scene === "name" ? "0" : "1";
  }

  if (scene === "rig") {
    const index = Math.min(2, Math.floor(Math.max(0, p) * 3));
    const local = p * 3 - index;
    const late = reduce ? (local > 0.55 ? 1 : 0) : smooth(Math.max(0, (local - 0.3) / 0.55));
    const key = ["mercury", "gemini", "apollo"][index];
    for (const el of objects.querySelectorAll(".rig-layer")) {
      if (el.dataset.for !== key) {
        el.style.opacity = "0";
        continue;
      }
      el.style.opacity = el.classList.contains("train") ? String(late) : String(key === "apollo" ? 1 : 1 - late);
    }
  }

  if (walls) scanWall();

  if (hole > 0.04) {
    mask.classList.add("is-on");
    mask.style.opacity = String(Math.min(1, hole));
    mask.style.setProperty("--hole", `${(30 / fov) * 70}vh`);
  } else {
    mask.style.opacity = "0";
  }

  const paper = scene === "way" || scene === "name" || onPaper;
  veil.style.background = paper ? "#e7e2d8" : "#0a0a0c";
  if (walls || scene === "name") veil.style.opacity = "1";
  else if (onPaper) veil.style.opacity = String(smooth(Math.min(1, p / 0.3)));
  else veil.style.opacity = "0";

  sheet.classList.toggle("is-on", onPaper);
  if (onPaper) {
    ensurePeel();
    const lift = reduce ? (p > 0.45 ? 1 : 0) : smooth(Math.max(0, (p - 0.18) / 0.72));
    if (peel) peel.setTimeAlongPath(lift);
    roleCaption.style.opacity = String(Math.max(0.15, lift));
    if (receipt) receipt.style.opacity = String(lift);
    paintDisc();
    const role = window.Patch ? Patch.specialist([state.crew, state.way, state.rig, state.mission]) : "";
    if (!role && !receiptText()) roleCaption.textContent = "The sheet is blank.";
  }

  let mvp = null;
  if (gl && sky && scene !== "name" && !walls && !onPaper) {
    mvp = camera();
    drawStars(mvp);
  }
  if (scene === "sky") dockStar(label);
  if (label && mvp && lamp > 0.45) placeReticule(projectNamed(mvp, label.name));
  else reticule.hidden = true;

  const height = document.documentElement.scrollHeight - window.innerHeight;
  rail.style.width = `${height > 0 ? (window.scrollY / height) * 100 : 0}%`;
}

function requestRender() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    paint();
  });
}

objects.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-key]");
  if (!button) return;
  state[button.dataset.key] = button.dataset.value;
  for (const el of objects.querySelectorAll(`button[data-key="${button.dataset.key}"]`)) {
    el.setAttribute("aria-pressed", el.dataset.value === state[button.dataset.key] ? "true" : "false");
  }
  scanWall();
  paintDisc();
});

let drag = null;
canvas.addEventListener("pointerdown", (event) => {
  if (!stage.classList.contains("is-look")) return;
  drag = { x: event.clientX, y: event.clientY, az: biasAz, alt: biasAlt };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const rad = ((fov * Math.PI) / 180) / Math.max(1, rect.height);
  biasAz = drag.az + ((event.clientX - drag.x) * rad * 180) / Math.PI;
  biasAlt = drag.alt + ((drag.y - event.clientY) * rad * 180) / Math.PI;
  requestRender();
});
canvas.addEventListener("pointerup", () => {
  drag = null;
});

const root = document.getElementById("steps");
for (const [id, height] of SCENES) {
  const step = document.createElement("section");
  step.className = "step";
  step.dataset.scene = id;
  step.style.height = height;
  root.appendChild(step);
}

const scroller = scrollama()
  .setup({ step: ".journey .step", offset: 0.42, progress: true, threshold: 2 })
  .onStepEnter(() => requestRender())
  .onStepProgress(() => requestRender());

function syncFromScroll() {
  const steps = [...document.querySelectorAll(".step")];
  if (!steps.length) return;
  const line = window.innerHeight * 0.42;
  let current = steps[0];
  for (const step of steps) {
    if (step.getBoundingClientRect().top <= line) current = step;
  }
  const rect = current.getBoundingClientRect();
  const next = current.dataset.scene;
  if (next !== scene) {
    biasAz = 0;
    biasAlt = 0;
  }
  scene = next;
  progress = Math.max(0, Math.min(0.999, (line - rect.top) / rect.height));
}

window.addEventListener("scroll", () => {
  syncFromScroll();
  requestRender();
}, { passive: true });
window.addEventListener("resize", () => {
  scroller.resize();
  syncFromScroll();
  requestRender();
});
syncFromScroll();

fetch("/api/sky")
  .then((res) => res.json())
  .then((data) => {
    sky = data;
    if (gl) {
      upload("dome");
      upload("window");
    }
    const nav = data.navigation || [];
    tour = TOUR.map((item) => {
      const star = nav.find((entry) => entry.name === item.name);
      return star ? { ...item, index: String(star.index), alt: star.alt, az: star.az, mag: star.mag } : null;
    }).filter(Boolean);
    const windowNamed = (data.window && data.window.stars ? data.window.stars : [])
      .filter((star) => star[6])
      .map((star) => ({ name: star[6], alt: star[1], az: star[2], mag: star[3] }));
    canopus = findNamed(windowNamed, "Canopus");
    regor = findNamed(windowNamed, "Regor");
    vega = nav.find((entry) => entry.name === "Vega");
    altair = nav.find((entry) => entry.name === "Altair");
    if (vega) vega = { ...vega, index: String(vega.index), line: "Once the debris cleared." };
    if (altair) altair = { ...altair, index: String(altair.index), line: "With Vega." };
    requestRender();
  })
  .catch(() => {
    copy.innerHTML = `<h2>The sky table is not built.</h2>`;
  });

paint();
