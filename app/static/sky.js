const canvas = document.getElementById("sky");
const namesEl = document.getElementById("names");
const hoverEl = document.getElementById("hover");
const focusEl = document.getElementById("focus");
const reveal = document.getElementById("reveal");
const readout = document.getElementById("readout");
let steps = [];
let specs = [];
let revealAmount = 0;
const applets = Object.create(null);
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
}
`;

const FS = `
precision mediump float;
varying vec3 vCol;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  if (dot(c, c) > 0.25) discard;
  gl_FragColor = vec4(vCol, vAlpha);
}
`;

const LINE_VS = `
attribute vec3 pos;
uniform mat4 mvp;
void main() {
  gl_Position = mvp * vec4(pos, 1.0);
}
`;

const LINE_FS = `
precision mediump float;
void main() {
  gl_FragColor = vec4(0.96, 0.96, 0.97, 0.28);
}
`;

let sky = null;
let frame = "dome";
let points = [];
let camRight = [1, 0, 0];
let camUp = [0, 0, 1];
let camForward = [0, 1, 0];
let lookAz = 0;
let lookAlt = 42;
let fov = 78;
let hovered = null;
let focusedName = null;
let dragging = false;
let lastX = 0;
let lastY = 0;

function colorOf(bv) {
  const t = bv == null ? 0.6 : Math.max(-0.3, Math.min(1.8, bv));
  return [
    1,
    Math.max(0.45, 1 - 0.28 * t),
    Math.max(0.35, 0.95 - 0.55 * Math.max(0, t)),
  ];
}

function distancePc(plx) {
  if (plx == null || plx <= 0) return 800;
  return 1000 / plx;
}

function place(altDeg, azDeg, plx) {
  const alt = (altDeg * Math.PI) / 180;
  const az = (azDeg * Math.PI) / 180;
  const d = distancePc(plx);
  const c = Math.cos(alt);
  return [d * c * Math.sin(az), d * c * Math.cos(az), d * Math.sin(alt)];
}

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

function program(vs, fs) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog));
  }
  return prog;
}

const starProg = program(VS, FS);
const lineProg = program(LINE_VS, LINE_FS);
const starLoc = {
  pos: gl.getAttribLocation(starProg, "pos"),
  mag: gl.getAttribLocation(starProg, "mag"),
  col: gl.getAttribLocation(starProg, "col"),
  alpha: gl.getAttribLocation(starProg, "alpha"),
  mvp: gl.getUniformLocation(starProg, "mvp"),
};
const lineLoc = {
  pos: gl.getAttribLocation(lineProg, "pos"),
  mvp: gl.getUniformLocation(lineProg, "mvp"),
};

const starBuf = gl.createBuffer();
const lineBuf = gl.createBuffer();
const horizon = new Float32Array(181 * 3);
for (let i = 0; i <= 180; i++) {
  const az = (i / 180) * Math.PI * 2;
  horizon[i * 3] = Math.sin(az) * 100;
  horizon[i * 3 + 1] = Math.cos(az) * 100;
  horizon[i * 3 + 2] = 0;
}
gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
gl.bufferData(gl.ARRAY_BUFFER, horizon, gl.STATIC_DRAW);

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
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
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
      o[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

function norm(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function domeFloor() {
  return fov / 2;
}

function pose() {
  lookAlt = Math.max(domeFloor(), Math.min(90, lookAlt));
  const alt = (lookAlt * Math.PI) / 180;
  const az = (lookAz * Math.PI) / 180;
  const c = Math.cos(alt);
  camForward = [c * Math.sin(az), c * Math.cos(az), Math.sin(alt)];
  camRight = [Math.cos(az), -Math.sin(az), 0];
  camUp = norm(cross(camRight, camForward));
}

function turn(yaw, pitch) {
  lookAz = (lookAz + (yaw * 180) / Math.PI + 360) % 360;
  lookAlt += (pitch * 180) / Math.PI;
  pose();
}

function camera() {
  const aspect = canvas.width / Math.max(1, canvas.height);
  const proj = perspective((fov * Math.PI) / 180, aspect, 0.05, 50000);
  const view = lookAt([0, 0, 0], camForward, camUp);
  return mul(proj, view);
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, canvas.clientWidth);
  const h = Math.max(1, canvas.clientHeight);
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
}

function loadFrame() {
  const pack = sky[frame];
  const pos = new Float32Array(pack.stars.length * 3);
  const mag = new Float32Array(pack.stars.length);
  const col = new Float32Array(pack.stars.length * 3);
  const alpha = new Float32Array(pack.stars.length);
  points = [];
  hovered = null;
  namesEl.replaceChildren();
  pack.stars.forEach((star, i) => {
    const [, alt, az, vmag, bv, plx, name] = star;
    const p = place(alt, az, plx);
    pos.set(p, i * 3);
    mag[i] = vmag;
    col.set(colorOf(bv), i * 3);
    alpha[i] = Math.max(0.4, Math.min(1, (7.2 - vmag) / 6));
    const entry = { star, p, nameEl: null };
    if (name) {
      const el = document.createElement("div");
      el.className = "name";
      el.textContent = name;
      namesEl.appendChild(el);
      entry.nameEl = el;
    }
    points.push(entry);
  });
  const interleaved = new Float32Array(pack.stars.length * 8);
  for (let i = 0; i < pack.stars.length; i++) {
    interleaved.set(pos.subarray(i * 3, i * 3 + 3), i * 8);
    interleaved[i * 8 + 3] = mag[i];
    interleaved.set(col.subarray(i * 3, i * 3 + 3), i * 8 + 4);
    interleaved[i * 8 + 7] = alpha[i];
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
  gl.bufferData(gl.ARRAY_BUFFER, interleaved, gl.STATIC_DRAW);
  points.count = pack.stars.length;
}

function projectToScreen(mvp, p) {
  const x = p[0];
  const y = p[1];
  const z = p[2];
  const w = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15];
  if (w <= 0.05) return null;
  const cx = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12];
  const cy = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13];
  const ndcX = cx / w;
  const ndcY = cy / w;
  if (ndcX < -1.05 || ndcX > 1.05 || ndcY < -1.05 || ndcY > 1.05) return null;
  const rect = canvas.getBoundingClientRect();
  return [
    (ndcX * 0.5 + 0.5) * rect.width,
    (1 - (ndcY * 0.5 + 0.5)) * rect.height,
  ];
}

function draw() {
  if (!gl || !sky) return;
  resize();
  const mvp = camera();
  gl.clearColor(0.039, 0.039, 0.047, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(starProg);
  gl.uniformMatrix4fv(starLoc.mvp, false, mvp);
  gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
  const stride = 8 * 4;
  gl.enableVertexAttribArray(starLoc.pos);
  gl.vertexAttribPointer(starLoc.pos, 3, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(starLoc.mag);
  gl.vertexAttribPointer(starLoc.mag, 1, gl.FLOAT, false, stride, 12);
  gl.enableVertexAttribArray(starLoc.col);
  gl.vertexAttribPointer(starLoc.col, 3, gl.FLOAT, false, stride, 16);
  gl.enableVertexAttribArray(starLoc.alpha);
  gl.vertexAttribPointer(starLoc.alpha, 1, gl.FLOAT, false, stride, 28);
  gl.drawArrays(gl.POINTS, 0, points.count || 0);

  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(lineProg);
  gl.uniformMatrix4fv(lineLoc.mvp, false, mvp);
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
  gl.enableVertexAttribArray(lineLoc.pos);
  gl.vertexAttribPointer(lineLoc.pos, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.LINE_LOOP, 0, 181);

  for (const entry of points) {
    if (!entry.nameEl) continue;
    const screen = projectToScreen(mvp, entry.p);
    if (!screen || entry.star[6] === focusedName) {
      entry.nameEl.style.display = "none";
      continue;
    }
    entry.nameEl.style.display = "block";
    entry.nameEl.classList.toggle("is-hot", entry === hovered);
    entry.nameEl.style.transform = `translate(${screen[0] + 8}px, ${screen[1] - 12}px)`;
  }
  if (!hovered) {
    hoverEl.hidden = true;
  } else {
    const screen = projectToScreen(mvp, hovered.p);
    hoverEl.hidden = !screen;
    if (screen) hoverEl.style.transform = `translate(${screen[0]}px, ${screen[1]}px)`;
  }
  const focused = points.find((entry) => entry.star[6] === focusedName);
  if (!focused || revealAmount < 0.01) {
    focusEl.hidden = true;
    reveal.hidden = true;
  } else {
    const screen = projectToScreen(mvp, focused.p);
    focusEl.hidden = !screen;
    reveal.hidden = !screen;
    if (screen) {
      focusEl.style.opacity = String(revealAmount);
      focusEl.style.transform = `translate(${screen[0]}px, ${screen[1]}px)`;
      reveal.style.opacity = String(revealAmount);
      reveal.style.left = `${screen[0]}px`;
      reveal.style.top = `${screen[1]}px`;
    }
  }
}

function caption() {
  return "";
}

function fieldFor(alt) {
  const wide = Math.min(44, Math.max(16, alt * 1.35));
  const fit = Math.max(7, alt * 2 - 0.6);
  return Math.min(wide, fit);
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

const HOLD = 0.38;
const FADE = 0.05;

function panCurve(t) {
  if (t <= HOLD) return 0;
  if (t >= 1 - HOLD) return 1;
  const u = (t - HOLD) / (1 - 2 * HOLD);
  return smooth(u);
}

function emphasis(t) {
  if (t <= HOLD - FADE) return { which: "from", amount: 1 };
  if (t < HOLD) return { which: "from", amount: smooth((HOLD - t) / FADE) };
  if (t <= 1 - HOLD) return { which: null, amount: 0 };
  if (t < 1 - HOLD + FADE) return { which: "to", amount: smooth((t - (1 - HOLD)) / FADE) };
  return { which: "to", amount: 1 };
}

function storyProgress() {
  if (!steps.length) return 0;
  const trigger = window.innerHeight * 0.5;
  const centers = steps.map((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top + rect.height * 0.5;
  });
  if (centers[0] >= trigger) return 0;
  const last = centers.length - 1;
  if (centers[last] <= trigger) return last;
  for (let i = 0; i < last; i++) {
    if (centers[i] <= trigger && centers[i + 1] >= trigger) {
      const span = centers[i + 1] - centers[i];
      return span ? i + (trigger - centers[i]) / span : i;
    }
  }
  return last;
}

function defaultApplet(star, host) {
  host.replaceChildren();
  const index = document.createElement("span");
  index.className = "reveal-index";
  index.textContent = String(star.index).padStart(2, "0");
  const name = document.createElement("strong");
  name.className = "reveal-name";
  name.textContent = star.name;
  const fig = document.createElement("span");
  fig.className = "reveal-fig";
  fig.textContent = `${star.mag}   ${star.alt}°`;
  host.append(index, name, fig);
}

let openName = null;
function syncApplet(star, amount) {
  revealAmount = amount;
  if (!star || amount < 0.01) {
    focusedName = null;
    openName = null;
    reveal.classList.remove("is-live");
    for (const el of steps) el.classList.remove("is-centered");
    return;
  }
  focusedName = star.name;
  reveal.classList.toggle("is-live", amount > 0.82);
  for (const el of steps) el.classList.toggle("is-centered", el.dataset.aim === star.name);
  if (openName !== star.name) {
    openName = star.name;
    const mount = applets[star.name] || defaultApplet;
    mount(star, reveal);
  }
}

function applyScroll() {
  if (!specs.length || dragging) return;
  if (!points.count) {
    frame = "dome";
    loadFrame();
  }
  const s = storyProgress();
  const last = specs.length - 1;
  const i = Math.min(last, Math.floor(s));
  const t = s >= last ? 0 : s - i;
  const u = s >= last ? 0 : panCurve(t);
  const from = specs[i];
  const to = specs[Math.min(last, i + 1)];
  const dAz = ((to.az - from.az + 540) % 360) - 180;
  fov = from.fov + (to.fov - from.fov) * u;
  lookAz = (from.az + dAz * u + 360) % 360;
  lookAlt = from.alt + (to.alt - from.alt) * u;
  pose();

  if (s <= 0) syncApplet(specs[0], 1);
  else if (s >= last) syncApplet(specs[last], 1);
  else {
    const beat = emphasis(t);
    const star = beat.which === "from" ? from : beat.which === "to" ? to : null;
    syncApplet(star, beat.amount);
  }
}

let queued = false;
function requestDraw() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    applyScroll();
    draw();
  });
}

function registerApplet(name, mount) {
  applets[name] = mount;
  if (openName === name) openName = null;
}

function pick(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const mvp = camera();
  let best = null;
  let bestD = 28;
  for (const entry of points) {
    if (!entry.star[6]) continue;
    const screen = projectToScreen(mvp, entry.p);
    if (!screen) continue;
    const d = Math.hypot(screen[0] - x, screen[1] - y);
    if (d < bestD) {
      best = entry;
      bestD = d;
    }
  }
  const changed = best !== hovered;
  hovered = best;
  if (!best) {
    if (changed) {
      readout.textContent = caption();
      draw();
    }
    return;
  }
  const [, alt, az, mag, , plx, name] = best.star;
  const dist = plx && plx > 0 ? `  ${(1000 / plx).toFixed(1)} pc` : "";
  readout.textContent = `${name}  ${mag}  alt ${alt}°  az ${az}°${dist}`;
  if (changed) draw();
  else {
    const screen = projectToScreen(mvp, best.p);
    hoverEl.hidden = !screen;
    if (screen) hoverEl.style.transform = `translate(${screen[0]}px, ${screen[1]}px)`;
  }
}

canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
  canvas.classList.add("dragging");
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointerup", (event) => {
  dragging = false;
  canvas.classList.remove("dragging");
  canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (dragging) {
    const rect = canvas.getBoundingClientRect();
    const radPerPx = ((fov * Math.PI) / 180) / rect.height;
    turn((event.clientX - lastX) * radPerPx, (lastY - event.clientY) * radPerPx);
    lastX = event.clientX;
    lastY = event.clientY;
    draw();
    return;
  }
  pick(event.clientX, event.clientY);
});

canvas.addEventListener("pointerleave", () => {
  if (dragging) return;
  hovered = null;
  readout.textContent = caption();
  draw();
});

window.addEventListener("resize", requestDraw);
window.addEventListener("scroll", requestDraw, { passive: true });

function buildSteps() {
  const root = document.getElementById("steps");
  root.replaceChildren();
  specs = sky.navigation.map((star) => ({
    name: star.name,
    alt: star.alt,
    az: star.az,
    fov: fieldFor(star.alt),
    index: star.index,
    mag: star.mag,
  }));
  for (const star of specs) {
    const step = document.createElement("section");
    step.className = "step";
    step.dataset.frame = "dome";
    step.dataset.aim = star.name;
    root.appendChild(step);
  }
  steps = [...root.children];
  requestDraw();
}

window.registerApplet = registerApplet;

if (!gl) {
  readout.textContent = "This view needs WebGL.";
} else {
  fetch("/api/sky")
    .then((res) => {
      if (!res.ok) throw new Error("missing");
      return res.json();
    })
    .then((data) => {
      sky = data;
      buildSteps();
    })
    .catch(() => {
      readout.textContent = "Sky table is not built.";
    });
}
