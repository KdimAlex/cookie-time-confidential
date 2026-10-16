/* Wider sky pinches into the align porthole, then the chart turns once.
   The five study stars are the game's own chart. A full turn brings them home.
   1920×1080 is the video frame. Click or R replays. ?loop=1 repeats. ?t= holds. */

const FRAME = { w: 1920, h: 1080 };
const SHIP = { w: 1296, h: 864, cx: 647.66, cy: 411.42, r: 161.5, ring: 167.42, ringStroke: 10 };
const SCREEN = { x: 108, y: 468, w: 260, h: 132 };
const PORT_R = 96;
const WIDE_R = 280;
const BEAT = { hold: 1.15 * 1.3, pinch: 3.7 * 1.3, settle: 1.35 * 1.3, spin: 10, rest: 1.15 };

const NS = "http://www.w3.org/2000/svg";
const stage = document.getElementById("stage");
const sky = document.getElementById("sky");
const skyField = document.getElementById("sky-field");
const skyDisc = document.getElementById("sky-disc");
const skyRing = document.getElementById("sky-ring");
const skyClip = document.getElementById("sky-clip-circle");
const port = document.getElementById("port");
const portField = document.getElementById("port-field");
const consoleEl = document.getElementById("console");

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const params = new URLSearchParams(location.search);
const scrub = params.has("t") ? Number(params.get("t")) : null;
const loop = params.get("loop") === "1";
const flat = params.get("flat") === "1";
if (flat) document.body.classList.add("is-flat");

const fitScale = Math.max(FRAME.w / SHIP.w, FRAME.h / SHIP.h);
const ox = (FRAME.w - SHIP.w * fitScale) / 2;
const oy = (FRAME.h - SHIP.h * fitScale) / 2;
const hole = {
  cx: ox + SHIP.cx * fitScale,
  cy: oy + SHIP.cy * fitScale,
  disc: SHIP.r * 2 * fitScale,
};

function coverDisc() {
  const corners = [
    [0, 0],
    [FRAME.w, 0],
    [0, FRAME.h],
    [FRAME.w, FRAME.h],
  ];
  let reach = 0;
  for (const [x, y] of corners) {
    reach = Math.max(reach, Math.hypot(x - hole.cx, y - hole.cy));
  }
  return reach * 2 * 1.04;
}

const wide = coverDisc();

let starColor = "";
function starFill() {
  if (!starColor) {
    starColor = getComputedStyle(document.documentElement).getPropertyValue("--ctc-white").trim() || "#f8f9ea";
  }
  return starColor;
}

function drawCatalog(group, stars) {
  for (const star of stars) {
    const dot = document.createElementNS(NS, "circle");
    dot.setAttribute("cx", (100 + star[0] * SPAN).toFixed(2));
    dot.setAttribute("cy", (100 - star[1] * SPAN).toFixed(2));
    dot.setAttribute("r", String(star[2]));
    dot.setAttribute("fill", starFill());
    group.appendChild(dot);
  }
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawSurround(group) {
  const rand = mulberry32(20261015);
  const spacing = 13;
  const inner = 102;
  for (let gy = 100 - WIDE_R; gy <= 100 + WIDE_R; gy += spacing) {
    for (let gx = 100 - WIDE_R; gx <= 100 + WIDE_R; gx += spacing) {
      const x = gx + (rand() - 0.5) * spacing * 0.9;
      const y = gy + (rand() - 0.5) * spacing * 0.9;
      const dist = Math.hypot(x - 100, y - 100);
      if (dist < inner || dist > WIDE_R - 6) continue;
      const roll = rand();
      const radius = roll > 0.94 ? 1.15 : roll > 0.78 ? 0.7 : 0.43;
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", x.toFixed(2));
      dot.setAttribute("cy", y.toFixed(2));
      dot.setAttribute("r", radius.toFixed(2));
      dot.setAttribute("fill", starFill());
      group.appendChild(dot);
    }
  }
}

function placePort() {
  const width = hole.disc / (192 / 200);
  port.style.width = `${width}px`;
  port.style.height = `${width}px`;
  port.style.left = `${hole.cx - width / 2}px`;
  port.style.top = `${hole.cy - width / 2}px`;
}

function placeConsole() {
  consoleEl.style.left = `${ox + SCREEN.x * fitScale}px`;
  consoleEl.style.top = `${oy + SCREEN.y * fitScale}px`;
  consoleEl.style.width = `${SCREEN.w * fitScale}px`;
  consoleEl.style.height = `${SCREEN.h * fitScale}px`;
  consoleEl.style.fontSize = `${(SCREEN.h * fitScale) / 5.4}px`;
}

function fit() {
  if (flat) {
    stage.style.transform = "none";
    return;
  }
  const fitted = Math.min(window.innerWidth / FRAME.w, window.innerHeight / FRAME.h);
  stage.style.transform = `scale(${fitted})`;
}

function ease(t) {
  const u = Math.max(0, Math.min(1, t));
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

function sample(t) {
  const holdEnd = BEAT.hold;
  const pinchEnd = holdEnd + BEAT.pinch;
  const settleEnd = pinchEnd + BEAT.settle;
  const spinEnd = settleEnd + BEAT.spin;
  const end = spinEnd + BEAT.rest;
  const parked = { radius: PORT_R, disc: hole.disc, angle: 0, end };
  if (t < holdEnd) return { radius: WIDE_R, disc: wide, angle: 0, end };
  if (t < pinchEnd) {
    const u = ease((t - holdEnd) / BEAT.pinch);
    return {
      radius: WIDE_R + (PORT_R - WIDE_R) * u,
      disc: wide + (hole.disc - wide) * u,
      angle: 0,
      end,
    };
  }
  if (t < settleEnd) return parked;
  if (t < spinEnd) {
    const u = ease((t - settleEnd) / BEAT.spin);
    return { radius: PORT_R, disc: hole.disc, angle: u * 360, end };
  }
  return { radius: PORT_R, disc: hole.disc, angle: 360, end };
}

function apply(frame) {
  const radius = frame.radius;
  const size = frame.disc;
  const ringR = radius * (SHIP.ring / SHIP.r);
  const unit = size / (radius * 2);
  const stroke = (SHIP.ringStroke * fitScale) / unit;
  sky.setAttribute("viewBox", `${100 - radius} ${100 - radius} ${radius * 2} ${radius * 2}`);
  skyDisc.setAttribute("r", Math.max(radius, ringR - stroke / 2).toFixed(3));
  skyClip.setAttribute("r", radius.toFixed(2));
  skyRing.setAttribute("r", ringR.toFixed(3));
  skyRing.setAttribute("stroke-width", stroke.toFixed(3));
  sky.style.width = `${size}px`;
  sky.style.height = `${size}px`;
  sky.style.left = `${hole.cx - size / 2}px`;
  sky.style.top = `${hole.cy - size / 2}px`;
  skyField.setAttribute("transform", `rotate(${frame.angle.toFixed(3)} 100 100)`);
}

drawSurround(skyField);
drawCatalog(skyField, EASY);
drawCatalog(portField, EASY);
placePort();
placeConsole();
fit();
window.addEventListener("resize", fit);

window.TRANSITION_END = BEAT.hold + BEAT.pinch + BEAT.settle + BEAT.spin + BEAT.rest;
window.renderAt = (t) => {
  const frame = sample(Math.max(0, Number(t) || 0));
  apply(frame);
  return frame.radius;
};
window.__ready = Promise.all([
  document.fonts.ready,
  document.getElementById("ship").decode().catch(() => {}),
  document.querySelector("#joy img").decode().catch(() => {}),
]);

const SPIN_AT = BEAT.hold + BEAT.pinch + BEAT.settle;
let start = 0;
let playing = false;
let holdTimer = 0;
let toldSpin = false;

function tellParent(extra) {
  if (!window.parent || window.parent === window) return;
  window.parent.postMessage({ source: "morehead-transition", ...extra }, window.location.origin);
}

function noteSpin(t) {
  if (toldSpin || t < SPIN_AT) return;
  toldSpin = true;
  tellParent({ spinning: true });
}

function render(now) {
  if (!playing) return;
  const t = (now - start) / 1000;
  const frame = sample(t);
  apply(frame);
  noteSpin(t);
  if (t >= frame.end) {
    playing = false;
    apply(sample(frame.end));
    tellParent({ done: true });
    if (loop) holdTimer = window.setTimeout(play, 1600);
    return;
  }
  requestAnimationFrame(render);
}

function play() {
  window.clearTimeout(holdTimer);
  toldSpin = false;
  if (reduce) {
    apply(sample(99));
    noteSpin(99);
    return;
  }
  if (scrub != null && Number.isFinite(scrub)) {
    const held = Math.max(0, scrub);
    apply(sample(held));
    noteSpin(held);
    return;
  }
  start = performance.now();
  playing = true;
  apply(sample(0));
  requestAnimationFrame(render);
}

stage.addEventListener("click", play);
window.addEventListener("keydown", (event) => {
  if (event.key === "r" || event.key === "R") play();
});

if (flat) window.renderAt(scrub != null && Number.isFinite(scrub) ? scrub : 0);
else play();
