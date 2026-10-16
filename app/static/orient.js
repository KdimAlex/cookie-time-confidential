/* Star charts live in stars.js: EASY, FIELD, GUIDES, SPAN. */

const LEVELS = [
  { name: "Easy", stars: EASY, pair: [2, 3], box: false, study: 5200, limit: 18000, scramble: [40, 100], weight: 1 },
  { name: "Intermediate", stars: GUIDES, pair: [6, 7], box: false, study: 4200, limit: 14000, scramble: [70, 160], weight: 1.5 },
  { name: "Hard", stars: FIELD, pair: [6, 7], box: false, study: 2800, limit: 10000, scramble: [100, 180], weight: 2 },
];

const FIND = [
  { name: "Easy", stars: EASY, target: 0, label: "Navi", watch: 5200, seek: 12000, slow: 14, weight: 1 },
  { name: "Intermediate", stars: GUIDES, target: 1, label: "Capella", watch: 4200, seek: 10000, slow: 20, weight: 1.5 },
  { name: "Hard", stars: FIELD, target: 6, label: "Menkar", watch: 2800, seek: 8000, slow: 26, weight: 2 },
];

function spanOf() {
  return SPAN;
}
const NS = "http://www.w3.org/2000/svg";

const task = document.getElementById("task");
const kicker = document.getElementById("kicker");
const stage = document.getElementById("stage");
const portWrap = document.getElementById("port-wrap");
const field = document.getElementById("field");
const time = document.getElementById("time");
const timeBar = document.getElementById("time-bar");
const timeCount = document.getElementById("time-count");
const sexStars = document.getElementById("sex-stars");
const done = document.getElementById("done");
const readout = document.getElementById("readout");
const found = document.getElementById("found");
const pick = document.getElementById("pick");
const pickAlign = document.getElementById("pick-align");
const pickFind = document.getElementById("pick-find");
const marksEl = document.getElementById("marks");
const again = document.getElementById("again");
const swap = document.getElementById("swap");
const link = document.getElementById("link");
const stem = document.getElementById("stem");
const port = document.getElementById("port");
const sextant = document.getElementById("sextant");

let play = location.pathname === "/find" ? "find" : "align";
let phase = "pick";
let mode = "chart";
let boxed = false;
let index = 0;
let scramble = 0;
let intermediateOpen = null;
let findGoal = null;
let userDelta = 0;
let alignStart = 0;
let frozenFrac = 1;
let turning = false;
let originX = 0;
let holdX = 0;
let lastFrame = 0;
const held = { left: false, right: false };
let spin = 0;
let spinRate = 0;
let spinDrag = 0;
let seekStart = 0;
let pending = [];
let marks = [];
let sexEls = [];
let audio = null;

function level() {
  return LEVELS[index];
}

function later(fn, ms) {
  const id = setTimeout(fn, ms);
  pending.push(id);
}

function cancelPending() {
  pending.forEach(clearTimeout);
  pending = [];
}

function applyClasses() {
  const names = ["is-" + phase];
  if (mode === "window") names.push("is-window");
  if (boxed) names.push("is-boxed");
  if (play === "find") names.push("is-find");
  document.body.className = names.join(" ");
}

function angleError(deg) {
  const a = ((deg % 360) + 360) % 360;
  return a > 180 ? 360 - a : a;
}

function matchPercent(error) {
  return Math.round(10 + 90 * (1 - error / 180));
}

function displayAngle() {
  if (play === "find") return spin;
  if (mode === "chart") return 0;
  return scramble + userDelta;
}

function clearAlignKey() {
  document.getElementById("truth")?.remove();
  document.getElementById("guess-radials")?.remove();
}

function shortestTurn(deg) {
  let a = ((deg % 360) + 360) % 360;
  if (a > 180) a -= 360;
  return a;
}

function showAlignKey() {
  clearAlignKey();
  const stars = level().stars;
  const span = spanOf(stars);
  const turn = shortestTurn(displayAngle());
  const rad = (turn * Math.PI) / 180;
  const co = Math.cos(rad);
  const si = Math.sin(rad);
  const truth = document.createElementNS(NS, "g");
  truth.id = "truth";
  truth.setAttribute("clip-path", "url(#port-clip)");
  truth.setAttribute("pointer-events", "none");
  stars.forEach((star) => {
    if (star[2] <= 1) return;
    const sx = 100 + star[0] * span;
    const sy = 100 - star[1] * span;
    const ringR = Math.max(2.4, star[2] + 1.15);
    const ring = document.createElementNS(NS, "circle");
    ring.setAttribute("cx", sx.toFixed(2));
    ring.setAttribute("cy", sy.toFixed(2));
    ring.setAttribute("r", ringR.toFixed(2));
    truth.appendChild(ring);
    const dx = sx - 100;
    const dy = sy - 100;
    const dist = Math.hypot(dx, dy);
    const touch = ringR + 0.53;
    if (dist < 1 || touch >= dist * 2 || Math.abs(turn) < 0.4) return;
    const trim = (2 * Math.asin(touch / (2 * dist)) * 180) / Math.PI;
    if (Math.abs(turn) <= trim) return;
    const gx = 100 + dx * co - dy * si;
    const gy = 100 + dx * si + dy * co;
    const end = (Math.sign(turn) * trim * Math.PI) / 180;
    const eco = Math.cos(end);
    const esi = Math.sin(end);
    const ex = 100 + dx * eco - dy * esi;
    const ey = 100 + dx * esi + dy * eco;
    const arc = document.createElementNS(NS, "path");
    arc.setAttribute(
      "d",
      `M${gx.toFixed(2)} ${gy.toFixed(2)} A${dist.toFixed(2)} ${dist.toFixed(2)} 0 0 ${turn >= 0 ? 0 : 1} ${ex.toFixed(2)} ${ey.toFixed(2)}`
    );
    truth.appendChild(arc);
  });
  field.insertAdjacentElement("afterend", truth);
}

function buildField(stars, pair) {
  clearAlignKey();
  field.replaceChildren();
  sexStars.replaceChildren();
  sexEls = [];
  stars.forEach((star, i) => {
    const span = spanOf(stars);
    const pick = document.createElementNS(NS, "g");
    pick.setAttribute("class", "star-pick");
    const dot = document.createElementNS(NS, "circle");
    dot.setAttribute("class", "star");
    dot.setAttribute("cx", (100 + star[0] * span).toFixed(2));
    dot.setAttribute("cy", (100 - star[1] * span).toFixed(2));
    dot.setAttribute("r", String(star[2]));
    dot.style.fill = "var(--ctc-white)";
    const clickable = star[2] > 1;
    pick.append(dot);
    if (!clickable) {
      pick.setAttribute("pointer-events", "none");
    } else {
      const hit = document.createElementNS(NS, "circle");
      hit.setAttribute("class", "star-hit");
      hit.setAttribute("cx", dot.getAttribute("cx"));
      hit.setAttribute("cy", dot.getAttribute("cy"));
      hit.setAttribute("r", "7");
      pick.append(hit);
      pick.addEventListener("pointerenter", () => {
        if (play !== "find") return;
        dot.setAttribute("r", (star[2] * 1.4).toFixed(2));
      });
      pick.addEventListener("pointerleave", () => {
        dot.setAttribute("r", String(star[2]));
      });
    }
    field.appendChild(pick);

    const mag = document.createElementNS(NS, "circle");
    mag.setAttribute("r", (star[2] / SPAN).toFixed(4));
    mag.setAttribute("fill", "var(--ctc-white)");
    sexStars.appendChild(mag);
    sexEls.push(mag);
  });

  const span = spanOf(stars);
  const xs = pair.map((i) => 100 + stars[i][0] * span);
  const ys = pair.map((i) => 100 - stars[i][1] * span);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 9;
  const box = document.createElementNS(NS, "rect");
  box.id = "box";
  box.setAttribute("x", (minX - pad).toFixed(2));
  box.setAttribute("y", (minY - pad).toFixed(2));
  box.setAttribute("width", (maxX - minX + pad * 2).toFixed(2));
  box.setAttribute("height", (maxY - minY + pad * 2).toFixed(2));
  field.appendChild(box);
}

function paintSextant(angle) {
  const stars = level().stars;
  const pair = level().pair;
  const cnx = (stars[pair[0]][0] + stars[pair[1]][0]) / 2;
  const cny = (stars[pair[0]][1] + stars[pair[1]][1]) / 2;
  const rad = (angle * Math.PI) / 180;
  const co = Math.cos(rad);
  const si = Math.sin(rad);
  stars.forEach((star, i) => {
    const nx = star[0] * co + star[1] * si;
    const ny = star[1] * co - star[0] * si;
    const el = sexEls[i];
    if (!el) return;
    el.setAttribute("cx", (nx - cnx).toFixed(4));
    el.setAttribute("cy", (-(ny - cny)).toFixed(4));
  });
}

function paint(frac) {
  const angle = displayAngle();
  field.setAttribute("transform", `rotate(${angle.toFixed(3)} 100 100)`);
  const label = document.getElementById("star-label");
  if (label) {
    label.setAttribute("transform", `rotate(${(-angle).toFixed(3)} ${label.getAttribute("x")} ${label.getAttribute("y")})`);
  }
  const mark = document.getElementById("selection");
  if (mark) {
    mark.setAttribute("transform", `rotate(${(-angle).toFixed(3)} ${mark.getAttribute("data-cx")} ${mark.getAttribute("data-cy")})`);
  }
  paintSextant(angle);
  const shown = Math.max(0, Math.min(1, frac));
  time.hidden = phase !== "align" && phase !== "lock" && phase !== "seek";
  timeBar.style.transform = `scaleX(${shown.toFixed(4)})`;
  const counting = play !== "find" && (phase === "align" || phase === "lock");
  timeCount.hidden = !counting;
  if (counting) timeCount.textContent = String(Math.ceil((shown * level().limit) / 1000));
  let budget = 0;
  if (phase === "align") budget = level().limit;
  else if (phase === "seek") budget = FIND[index].seek;
  if (budget) setConsoleClock(String(Math.max(0, Math.ceil((shown * budget) / 1000))));
  else if (phase !== "study") setConsoleClock("");
}

function viewToPage(x, y, angle) {
  const rad = (angle * Math.PI) / 180;
  const co = Math.cos(rad);
  const si = Math.sin(rad);
  const dx = x - 100;
  const dy = y - 100;
  const rx = 100 + dx * co - dy * si;
  const ry = 100 + dx * si + dy * co;
  const rect = port.getBoundingClientRect();
  return {
    x: rect.left + (rx / 200) * rect.width,
    y: rect.top + (ry / 200) * rect.height,
  };
}

function boxAnchor(angle) {
  const box = document.getElementById("box");
  if (!box) return null;
  const x = Number(box.getAttribute("x"));
  const y = Number(box.getAttribute("y"));
  const w = Number(box.getAttribute("width"));
  const h = Number(box.getAttribute("height"));
  const corners = [
    viewToPage(x, y, angle),
    viewToPage(x + w, y, angle),
    viewToPage(x, y + h, angle),
    viewToPage(x + w, y + h, angle),
  ];
  corners.sort((a, b) => b.y - a.y);
  return {
    x: (corners[0].x + corners[1].x) / 2,
    y: (corners[0].y + corners[1].y) / 2,
  };
}

function paintLink() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  link.setAttribute("viewBox", `0 0 ${w} ${h}`);
  if (!boxed || (phase !== "study" && phase !== "align" && phase !== "lock")) return;
  const from = boxAnchor(displayAngle());
  if (!from) return;
  const box = sextant.getBoundingClientRect();
  stem.setAttribute("x1", from.x.toFixed(1));
  stem.setAttribute("y1", from.y.toFixed(1));
  stem.setAttribute("x2", (box.left + box.width / 2).toFixed(1));
  stem.setAttribute("y2", box.top.toFixed(1));
}

const BED_ID = "_S3xX_hlY40";
let bed = null;
let bedReady = false;
let bedWanted = false;

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  bed = new YT.Player("bed", {
    width: "200",
    height: "113",
    videoId: BED_ID,
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
      loop: 1,
      playlist: BED_ID,
      playsinline: 1,
      origin: location.origin,
    },
    events: {
      onReady(event) {
        bedReady = true;
        event.target.setVolume(32);
        if (bedWanted) event.target.playVideo();
      },
      onStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) event.target.playVideo();
      },
    },
  });
};

function loadBed() {
  if (window.parent !== window) return;
  if (document.getElementById("youtube-api")) return;
  const script = document.createElement("script");
  script.id = "youtube-api";
  script.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(script);
}

function startBed() {
  bedWanted = true;
  if (!bedReady || !bed || typeof bed.playVideo !== "function") return;
  try {
    const state = bed.getPlayerState();
    if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) return;
    bed.playVideo();
  } catch (err) {
    bedReady = false;
  }
}

function armAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!audio) audio = new Ctx();
  if (audio.state === "suspended") audio.resume().then(() => playCountdown());
  startBed();
}

const WRONG_BUZZ = 0.175;
let wrongBytes = null;
let wrongBuffer = null;
let wrongLoading = null;
let wrongDecoding = null;

function decodeWrong() {
  if (wrongBuffer || wrongDecoding || !wrongBytes) return;
  armAudio();
  if (!audio) return;
  wrongDecoding = audio.decodeAudioData(wrongBytes.slice(0)).then((buffer) => {
    wrongBuffer = buffer;
    wrongDecoding = null;
  }).catch(() => {
    wrongDecoding = null;
  });
}

function loadWrong() {
  if (wrongBytes || wrongLoading) return;
  wrongLoading = fetch("/wrong.mp3")
    .then((res) => res.arrayBuffer())
    .then((bytes) => {
      wrongBytes = bytes;
      wrongLoading = null;
      decodeWrong();
    })
    .catch(() => {
      wrongLoading = null;
    });
}

let lightningBytes = null;
let lightningBuffer = null;
let lightningLoading = null;
let lightningDecoding = null;
let lightningSource = null;

function decodeLightning() {
  if (lightningBuffer || lightningDecoding || !lightningBytes) return;
  armAudio();
  if (!audio) return;
  lightningDecoding = audio.decodeAudioData(lightningBytes.slice(0)).then((buffer) => {
    lightningBuffer = buffer;
    lightningDecoding = null;
  }).catch(() => {
    lightningDecoding = null;
  });
}

function loadLightning() {
  if (lightningBytes || lightningLoading) return;
  lightningLoading = fetch("/lightning.mp3")
    .then((res) => res.arrayBuffer())
    .then((bytes) => {
      lightningBytes = bytes;
      lightningLoading = null;
      decodeLightning();
    })
    .catch(() => {
      lightningLoading = null;
    });
}

/* True only once the crack can start in this turn. A cold first decode
   used to return here and play later, after the flash had already run. */
function playLightning() {
  armAudio();
  if (!audio) return false;
  if (!lightningBuffer) {
    if (!lightningBytes) {
      loadLightning();
      return false;
    }
    if (lightningDecoding) return false;
    lightningDecoding = audio.decodeAudioData(lightningBytes.slice(0)).then((buffer) => {
      lightningBuffer = buffer;
      lightningDecoding = null;
    }).catch(() => {
      lightningDecoding = null;
    });
    return false;
  }
  if (lightningSource) {
    try {
      lightningSource.stop();
    } catch (err) {
      /* already ended */
    }
    lightningSource = null;
  }
  const source = audio.createBufferSource();
  source.buffer = lightningBuffer;
  const mix = audio.createGain();
  mix.gain.value = 0.75;
  source.connect(mix);
  mix.connect(audio.destination);
  source.start(audio.currentTime);
  lightningSource = source;
  source.onended = () => {
    if (lightningSource === source) lightningSource = null;
  };
  return true;
}

function playWrong() {
  armAudio();
  if (!audio) return;
  if (!wrongBuffer) {
    if (!wrongBytes) {
      loadWrong();
      return;
    }
    if (wrongDecoding) return;
    wrongDecoding = audio.decodeAudioData(wrongBytes.slice(0)).then((buffer) => {
      wrongBuffer = buffer;
      wrongDecoding = null;
      playWrong();
    }).catch(() => {
      wrongDecoding = null;
    });
    return;
  }
  const source = audio.createBufferSource();
  source.buffer = wrongBuffer;
  const mix = audio.createGain();
  mix.gain.value = 1.8;
  source.connect(mix);
  mix.connect(audio.destination);
  source.start(0, 0, WRONG_BUZZ);
}

function click() {
  playWrong();
  if (navigator.vibrate) navigator.vibrate(16);
  portWrap.classList.remove("is-click");
  void portWrap.offsetWidth;
  portWrap.classList.add("is-click");
}

function blip(freq, start, dur, type, peak) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function succeed() {
  armAudio();
  if (!audio) return;
  const t = audio.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const at = t + i * 0.085;
    blip(freq, at, 0.22, "square", 0.09);
    blip(freq / 2, at, 0.26, "triangle", 0.05);
  });
  blip(1568, t + 0.3, 0.14, "square", 0.045);
  if (navigator.vibrate) navigator.vibrate([12, 36, 16, 36, 22]);
  portWrap.classList.remove("is-click");
  void portWrap.offsetWidth;
  portWrap.classList.add("is-click");
}

function startLevel(i) {
  cancelPending();
  stopCountdown();
  turning = false;
  held.left = false;
  held.right = false;
  found.hidden = true;
  if (play === "find") {
    if (i >= FIND.length) {
      showResult();
      return;
    }
    if (i === 0) {
      strikeHold = 0;
      quietParentStorm();
      briefStorm();
      return;
    }
    beginWatch(i);
    return;
  }
  if (i >= LEVELS.length) {
    showResult();
    return;
  }
  index = i;
  const current = level();
  if (i === 0) intermediateOpen = null;
  scramble = 0;
  userDelta = 0;
  spinVel = 0;
  mode = "chart";
  boxed = false;
  phase = "study";
  frozenFrac = 1;
  buildField(current.stars, current.pair);
  kicker.textContent = current.name;
  task.textContent = "1  Study the star map";
  writeConsole([levelLine(current.name), "STUDY THE STAR MAP"]);
  readout.hidden = true;
  readout.textContent = "";
  marksEl.hidden = true;
  again.hidden = true;
  swap.hidden = true;
  swap.parentElement.hidden = true;
  pick.hidden = true;
  applyClasses();
  paint(1);
  scheduleCountdown(current.study);
  later(goDark, current.study);
}

function goDark() {
  phase = "dark";
  task.textContent = "";
  applyClasses();
  later(() => {
    const current = level();
    scramble = openingAngle(current);
    if (current.name === "Intermediate") intermediateOpen = scramble;
    userDelta = 0;
    spinVel = 0;
    mode = "window";
    boxed = current.box;
    applyClasses();
    paint(1);
    later(beginAlign, 260);
  }, 420);
}

function openingAngle(current) {
  const [lo, hi] = current.scramble;
  const mag = lo + Math.random() * (hi - lo);
  const signed = (Math.random() < 0.5 ? -1 : 1) * mag;
  if (current.name !== "Hard" || intermediateOpen == null) return signed;
  const gap = 140 + Math.random() * 50;
  return intermediateOpen + (Math.random() < 0.5 ? gap : -gap);
}

function beginAlign() {
  phase = "align";
  alignStart = performance.now();
  task.textContent = "2  Right the ship";
  writeConsole(["RIGHT THE SHIP"]);
  applyClasses();
  paint(1);
  port.focus({ preventScroll: true });
  loadThruster();
}

function placeLabel(star, text) {
  const label = document.createElementNS(NS, "text");
  label.id = "star-label";
  const span = spanOf(play === "find" ? FIND[index].stars : level().stars);
  label.setAttribute("x", (100 + star[0] * span + 4.2).toFixed(2));
  label.setAttribute("y", (100 - star[1] * span - 3.2).toFixed(2));
  label.textContent = text;
  field.appendChild(label);
}

function starBearing(star) {
  return (Math.atan2(-star[1], star[0]) * 180) / Math.PI;
}

function beginWatch(i) {
  index = i;
  const current = FIND[i];
  const star = current.stars[current.target];
  if (i === 0) findGoal = null;
  if (current.name === "Hard" && findGoal != null) {
    spin = findGoal + 180 - starBearing(star);
  } else {
    spin = Math.random() * 360;
  }
  if (current.name === "Intermediate") findGoal = starBearing(star) + spin;
  spinRate = current.slow;
  spinDrag = 0;
  mode = "window";
  boxed = false;
  phase = "watch";
  scramble = 0;
  userDelta = 0;
  buildField(current.stars, [current.target, current.target]);
  placeLabel(current.stars[current.target], current.label);
  kicker.textContent = current.name;
  task.textContent = current.label;
  writeConsole([levelLine(current.name), "REMEMBER THIS STAR"]);
  readout.hidden = true;
  found.hidden = true;
  marksEl.hidden = true;
  again.hidden = true;
  swap.hidden = true;
  swap.parentElement.hidden = true;
  pick.hidden = true;
  applyClasses();
  paint(1);
  later(beginStrike, current.watch);
}

function introCrashLeft() {
  try {
    if (!window.parent || window.parent === window) return 0;
    const clip = window.parent.document.getElementById("storm-crash");
    if (!clip || clip.paused || !Number.isFinite(clip.duration)) return 0;
    return Math.max(0, clip.duration - clip.currentTime);
  } catch (err) {
    return 0;
  }
}

/* The thunderstorm clip starts on the previous screen. Leaving it
   running put its crack seconds before this round's flash. */
function quietParentStorm() {
  try {
    if (!window.parent || window.parent === window) return;
    const clip = window.parent.document.getElementById("storm-crash");
    if (!clip || clip.paused) return;
    clip.pause();
  } catch (err) {
    /* standalone /find has no parent clip */
  }
}

let strikeHold = 0;

function beginStrike() {
  /* Level 1 is the only round that can still be inside that clip.
     Waiting it out, then adding 40ms, fired the flash after the crack.
     Later rounds already strike on the watch timer. */
  if (index === 0) quietParentStorm();
  else {
    const wait = introCrashLeft();
    if (wait > 0.05) {
      later(beginStrike, Math.ceil(wait * 1000) + 40);
      return;
    }
  }
  if (!playLightning() && strikeHold < 6) {
    strikeHold += 1;
    later(beginStrike, 40);
    return;
  }
  strikeHold = 0;
  phase = "strike";
  spinRate = 1100;
  spinDrag = 0;
  document.getElementById("star-label")?.remove();
  task.textContent = "";
  applyClasses();
  later(() => {
    const current = FIND[index];
    spinDrag = current.slow;
    phase = "seek";
    seekStart = performance.now();
    task.textContent = "Find " + current.label;
    writeConsole(["FIND " + current.label]);
    applyClasses();
    paint(1);
  }, 680);
}

function starAt(clientX, clientY) {
  const stars = FIND[index].stars;
  const nodes = field.querySelectorAll(".star");
  const unit = port.getBoundingClientRect().width / 200;
  const limit = 18 * unit;
  let best = -1;
  let bestD = limit;
  nodes.forEach((el, i) => {
    if (!stars[i] || stars[i][2] <= 1) return;
    const rect = el.getBoundingClientRect();
    const d = Math.hypot(clientX - (rect.left + rect.width / 2), clientY - (rect.top + rect.height / 2));
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

function markSelection(hit) {
  if (hit < 0) return;
  const star = FIND[index].stars[hit];
  const span = spanOf(FIND[index].stars);
  const cx = 100 + star[0] * span;
  const cy = 100 - star[1] * span;
  const half = 8;
  const mark = document.createElementNS(NS, "g");
  mark.id = "selection";
  mark.setAttribute("pointer-events", "none");
  mark.setAttribute("data-cx", cx.toFixed(2));
  mark.setAttribute("data-cy", cy.toFixed(2));
  const square = document.createElementNS(NS, "rect");
  square.setAttribute("x", (cx - half).toFixed(2));
  square.setAttribute("y", (cy - half).toFixed(2));
  square.setAttribute("width", String(half * 2));
  square.setAttribute("height", String(half * 2));
  const across = document.createElementNS(NS, "line");
  across.setAttribute("x1", (cx - 11).toFixed(2));
  across.setAttribute("x2", (cx + 11).toFixed(2));
  across.setAttribute("y1", cy.toFixed(2));
  across.setAttribute("y2", cy.toFixed(2));
  const down = document.createElementNS(NS, "line");
  down.setAttribute("x1", cx.toFixed(2));
  down.setAttribute("x2", cx.toFixed(2));
  down.setAttribute("y1", (cy - 11).toFixed(2));
  down.setAttribute("y2", (cy + 11).toFixed(2));
  mark.append(square, across, down);
  field.appendChild(mark);
}

function lockFind(hit) {
  if (phase !== "seek") return;
  const current = FIND[index];
  const right = hit === current.target;
  marks.push({ name: current.name, right });
  phase = "lock";
  task.textContent = "";
  found.hidden = false;
  found.textContent = right ? "Right" : "Wrong";
  writeConsole([right ? "RIGHT" : "WRONG"]);
  markSelection(hit);
  applyClasses();
  paint(0);
  playKeypad();
  if (right) later(succeed, 420);
  else later(click, 420);
  later(() => startLevel(index + 1), 6600);
}

function showPick() {
  play = "";
  phase = "pick";
  mode = "chart";
  boxed = false;
  spinRate = 0;
  spinDrag = 0;
  marks = [];
  buildField(EASY, [2, 3]);
  kicker.textContent = "";
  task.textContent = "";
  writeConsole(CONSOLE_TEXT.split("\n"));
  pick.hidden = false;
  again.hidden = true;
  swap.hidden = true;
  swap.parentElement.hidden = true;
  marksEl.hidden = true;
  found.hidden = true;
  readout.hidden = true;
  applyClasses();
  paint(1);
}

function startGame(next) {
  play = next;
  marks = [];
  pick.hidden = true;
  armAudio();
  startLevel(0);
}

const SHIP = { w: 1296, h: 864, cx: 647.66, cy: 411.42, r: 161.5 };
const SCREEN = { x: 108, y: 468, w: 260, h: 132 };
const CONSOLE_TEXT = "NAVIGATION\nSYSTEM\n! FAILURE !";
const consoleText = document.getElementById("console");
consoleText.value = CONSOLE_TEXT;

function placeConsole() {
  const scale = Math.max(window.innerWidth / SHIP.w, window.innerHeight / SHIP.h);
  const ox = (window.innerWidth - SHIP.w * scale) / 2;
  const oy = (window.innerHeight - SHIP.h * scale) / 2;
  consoleText.style.left = `${ox + SCREEN.x * scale}px`;
  consoleText.style.top = `${oy + SCREEN.y * scale}px`;
  consoleText.style.width = `${SCREEN.w * scale}px`;
  consoleText.style.height = `${SCREEN.h * scale}px`;
  consoleText.style.fontSize = `${(SCREEN.h * scale) / 5.4}px`;
}

let consoleHead = "";
let consoleClock = "";
let consoleJob = 0;

function typeGap(ch) {
  if (ch === "\n") return 60 + Math.random() * 140;
  if (Math.random() < 0.1) return 90 + Math.random() * 170;
  if (Math.random() < 0.28) return 34 + Math.random() * 46;
  return 11 + Math.random() * 24;
}

function levelLine(name) {
  return `${name}:`;
}

function writeConsole(lines, done) {
  const head = lines.filter((line) => line != null && line !== "").join("\n");
  if (head === consoleHead) {
    if (done) done();
    return;
  }
  consoleHead = head;
  const job = ++consoleJob;
  let i = 0;
  const step = () => {
    if (job !== consoleJob) return;
    if (i >= head.length) {
      consoleText.value = head + consoleClock;
      if (done) done();
      return;
    }
    i += 1;
    consoleText.value = head.slice(0, i) + "▌";
    setTimeout(step, typeGap(head[i - 1]));
  };
  consoleText.value = "▌";
  setTimeout(step, typeGap(""));
}

function briefStorm() {
  index = 0;
  phase = "brief";
  mode = "window";
  boxed = false;
  clearAlignKey();
  field.replaceChildren();
  kicker.textContent = "";
  task.textContent = "";
  readout.hidden = true;
  found.hidden = true;
  marksEl.hidden = true;
  again.hidden = true;
  swap.hidden = true;
  swap.parentElement.hidden = true;
  pick.hidden = true;
  applyClasses();
  paint(1);
  writeConsole(["CAPSULE SIM", "HITS STORM", "NAV MAY", "DRIFT OFF"], () => {
    later(() => beginWatch(0), 1800);
  });
}

function setConsoleClock(text) {
  const next = text ? `\n${text}` : "";
  if (next === consoleClock) return;
  consoleClock = next;
  if (consoleText.value.replace(/▌$/, "").length >= consoleHead.length) {
    consoleText.value = consoleHead + consoleClock;
  }
}

function placeShip() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.max(vw / SHIP.w, vh / SHIP.h);
  const ox = (vw - SHIP.w * scale) / 2;
  const oy = (vh - SHIP.h * scale) / 2;
  const holeCx = ox + SHIP.cx * scale;
  const holeCy = oy + SHIP.cy * scale;
  const portW = (SHIP.r * 2 * scale) / (192 / 200);
  port.style.width = `${portW}px`;
  stage.style.left = "0px";
  stage.style.top = "0px";
  stage.style.translate = "none";
  const pr = port.getBoundingClientRect();
  stage.style.left = `${holeCx - (pr.left + pr.width / 2)}px`;
  stage.style.top = `${holeCy - (pr.top + pr.height / 2)}px`;
  placeConsole();
}

function placeReadout() {
  if (readout.hidden) return;
  const below = port.getBoundingClientRect().bottom + 20;
  readout.style.bottom = "auto";
  readout.style.left = "auto";
  readout.style.right = "28px";
  readout.style.translate = "none";
  readout.style.top = `${Math.round(below)}px`;
}

function placeStage() {
  placeShip();
  placeReadout();
}

window.addEventListener("resize", placeStage);
placeShip();

function lock() {
  if (phase !== "align") return;
  const current = level();
  const left = current.limit - (performance.now() - alignStart);
  frozenFrac = Math.max(0, left) / current.limit;
  const error = angleError(displayAngle());
  const percent = matchPercent(error);
  marks.push({ name: current.name, error, percent, weight: current.weight });
  phase = "lock";
  turning = false;
  hushThruster();
  task.textContent = "";
  showAlignKey();
  readout.hidden = false;
  readout.innerHTML = `${percent}%<small>${Math.round(error)}°</small>`;
  writeConsole([`${percent}%`, `${Math.round(error)}°`]);
  applyClasses();
  paint(frozenFrac);
  placeReadout();
  if (percent > 80) succeed();
  else click();
  later(() => startLevel(index + 1), 5400);
}

function showResult() {
  clearAlignKey();
  phase = "result";
  mode = "window";
  boxed = false;
  task.textContent = "";
  kicker.textContent = "";
  readout.hidden = true;
  found.hidden = true;
  pick.hidden = true;
  let rows;
  let total;
  if (play === "find") {
    const correct = marks.filter((mark) => mark.right).length;
    total = Math.round((correct / 3) * 100);
    rows = marks.map((mark) => `<li><span>${mark.name}</span><span>${mark.right ? "Right" : "Wrong"}</span></li>`);
  } else {
    const weightSum = marks.reduce((sum, mark) => sum + mark.weight, 0);
    total = Math.round(marks.reduce((sum, mark) => sum + mark.percent * mark.weight, 0) / weightSum);
    rows = marks.map((mark) => `<li><span>${mark.name}</span><span>${mark.percent}%</span></li>`);
  }
  marksEl.innerHTML = rows.join("") + `<li class="total"><span></span><span>${total}%</span></li>`;
  writeConsole(["COMPLETE", `${total}%`]);
  marksEl.hidden = true;
  again.hidden = true;
  swap.hidden = true;
  swap.parentElement.hidden = true;
  applyClasses();
  paint(frozenFrac);
  if (window.parent && window.parent !== window) {
    const payload = play === "find"
      ? marks.map((mark) => ({ name: mark.name, right: !!mark.right }))
      : marks.map((mark) => ({ name: mark.name, percent: mark.percent, weight: mark.weight }));
    window.parent.postMessage(
      { source: "morehead-game", game: play, total, marks: payload },
      window.location.origin,
    );
  }
}

const joyBase = document.getElementById("joy-base");
const joyStick = document.getElementById("joy-stick");
let stickLean = 0;
let stickVel = 0;
let stickHold = null;
let stickTouchId = null;
let stickPull = 0;
let spinVel = 0;
let idleTime = 0;
let wiggle = 0;

function stickDesired() {
  if (play === "find" || phase !== "align") {
    if (stickHold !== null) releaseStick();
    return 0;
  }
  if (stickHold !== null) return stickPull;
  let lean = 0;
  if (held.left) lean -= 1;
  if (held.right) lean += 1;
  if (turning) {
    const deflection = holdX - originX;
    const dead = 8;
    if (Math.abs(deflection) >= dead) {
      const signed = deflection - Math.sign(deflection) * dead;
      lean += Math.max(-1, Math.min(1, signed / 120));
    }
  }
  return Math.max(-1, Math.min(1, lean));
}

function pullFromClientX(clientX) {
  const rect = joyBase.getBoundingClientRect();
  const dx = clientX - (rect.left + rect.width / 2);
  return Math.max(-1, Math.min(1, dx / 118));
}

function pullFromPointer(event) {
  return pullFromClientX(event.clientX);
}

function paintStick(dt) {
  if (!dt) return;
  const desired = stickDesired();
  const tugged = stickHold !== null && phase === "align";
  const stiffness = tugged ? 460 : 140;
  const damping = tugged ? 28 : 20;
  stickVel += ((desired - stickLean) * stiffness - stickVel * damping) * dt;
  stickLean += stickVel * dt;
  if (stickLean > 1) {
    stickLean = 1;
    if (stickVel > 0) stickVel = 0;
  }
  if (stickLean < -1) {
    stickLean = -1;
    if (stickVel < 0) stickVel = 0;
  }
  const nudge = idleNudge(dt, desired);
  joyStick.style.transform = `rotate(${(stickLean * 36 + nudge).toFixed(2)}deg)`;
  joyBase.setAttribute("aria-valuenow", stickLean.toFixed(2));
}

function idleNudge(dt, desired) {
  const idle =
    phase === "align" &&
    stickHold === null &&
    !held.left &&
    !held.right &&
    !turning &&
    Math.abs(desired) < 0.02 &&
    Math.abs(stickLean) < 0.04 &&
    Math.abs(stickVel) < 0.25;
  if (!idle) {
    idleTime = 0;
    wiggle += (0 - wiggle) * (1 - Math.exp(-14 * dt));
    if (Math.abs(wiggle) < 0.04) wiggle = 0;
    return wiggle;
  }
  idleTime += dt;
  const rest = 2.4;
  const burst = 0.72;
  const t = idleTime % (rest + burst);
  let target = 0;
  if (t > rest) {
    const u = (t - rest) / burst;
    target = Math.sin(u * Math.PI * 5) * Math.sin(Math.PI * u) * 8;
  }
  wiggle = target;
  return wiggle;
}

function turnRate() {
  return Math.max(-1, Math.min(1, stickLean));
}

function stepCapsule(dt) {
  const cmd = turnRate();
  const thrust = 88;
  const drag = 1.7;
  spinVel += cmd * thrust * dt;
  spinVel *= Math.exp(-drag * dt);
  spinVel = Math.max(-42, Math.min(42, spinVel));
  if (cmd === 0 && Math.abs(spinVel) < 0.08) spinVel = 0;
  userDelta += spinVel * dt;
  paintThruster(cmd);
}

let thruster = null;
let thrusterBytes = null;
let thrusterBuffer = null;
let thrusterLoading = null;
let thrusterDecoding = null;

const COUNTDOWN_HIT = 3;
let countdownBytes = null;
let countdownBuffer = null;
let countdownLoading = null;
let countdownDecoding = null;
let countdownSource = null;
let countdownPlayed = false;
let studyEndsAt = 0;

let keypadBytes = null;
let keypadBuffer = null;
let keypadLoading = null;
let keypadDecoding = null;

function decodeKeypad() {
  if (keypadBuffer || keypadDecoding || !keypadBytes) return;
  armAudio();
  if (!audio) return;
  keypadDecoding = audio.decodeAudioData(keypadBytes.slice(0)).then((buffer) => {
    keypadBuffer = buffer;
    keypadDecoding = null;
  }).catch(() => {
    keypadDecoding = null;
  });
}

function loadKeypad() {
  if (keypadBytes || keypadLoading) return;
  keypadLoading = fetch("/keypad.mp3")
    .then((res) => res.arrayBuffer())
    .then((bytes) => {
      keypadBytes = bytes;
      keypadLoading = null;
      decodeKeypad();
    })
    .catch(() => {
      keypadLoading = null;
    });
}

function playKeypad() {
  armAudio();
  if (!audio) return;
  if (!keypadBuffer) {
    if (!keypadBytes) {
      loadKeypad();
      return;
    }
    if (keypadDecoding) return;
    keypadDecoding = audio.decodeAudioData(keypadBytes.slice(0)).then((buffer) => {
      keypadBuffer = buffer;
      keypadDecoding = null;
      playKeypad();
    }).catch(() => {
      keypadDecoding = null;
    });
    return;
  }
  const source = audio.createBufferSource();
  source.buffer = keypadBuffer;
  const mix = audio.createGain();
  mix.gain.value = 3.5;
  source.connect(mix);
  mix.connect(audio.destination);
  source.start();
}

function loadCountdown() {
  if (countdownBytes || countdownLoading) return;
  countdownLoading = fetch("/countdown.mp3")
    .then((res) => res.arrayBuffer())
    .then((bytes) => {
      countdownBytes = bytes;
      countdownLoading = null;
    })
    .catch(() => {
      countdownLoading = null;
    });
}

function stopCountdown() {
  if (!countdownSource) return;
  try {
    countdownSource.stop();
  } catch (err) {
    /* already ended */
  }
  countdownSource = null;
}

function playCountdown() {
  if (countdownPlayed || countdownSource) return;
  if (phase !== "study" || play === "find") return;
  const remain = (studyEndsAt - performance.now()) / 1000;
  if (remain > COUNTDOWN_HIT + 0.08 || remain <= -0.05) return;
  const offset = Math.max(0, COUNTDOWN_HIT - remain);
  armAudio();
  if (!audio || audio.state !== "running") return;
  if (!countdownBuffer) {
    if (!countdownBytes) {
      loadCountdown();
      return;
    }
    if (countdownDecoding) return;
    countdownDecoding = audio.decodeAudioData(countdownBytes.slice(0)).then((buffer) => {
      countdownBuffer = buffer;
      countdownDecoding = null;
      playCountdown();
    }).catch(() => {
      countdownDecoding = null;
    });
    return;
  }
  if (offset >= countdownBuffer.duration) return;
  const source = audio.createBufferSource();
  source.buffer = countdownBuffer;
  const mix = audio.createGain();
  mix.gain.value = 0.7;
  source.connect(mix);
  mix.connect(audio.destination);
  countdownPlayed = true;
  source.start(0, offset);
  countdownSource = source;
  source.onended = () => {
    if (countdownSource === source) countdownSource = null;
  };
}

function scheduleCountdown(studyMs) {
  countdownPlayed = false;
  studyEndsAt = performance.now() + studyMs;
  const delay = studyMs - COUNTDOWN_HIT * 1000;
  if (delay <= 0) playCountdown();
  else later(playCountdown, delay);
}

function hushThruster() {
  if (!thruster || !audio) return;
  const t = audio.currentTime;
  thruster.mix.gain.cancelScheduledValues(t);
  thruster.mix.gain.setValueAtTime(0.0001, t);
}

function loadThruster() {
  if (thrusterBytes || thrusterLoading) return;
  thrusterLoading = fetch("/thruster.mp3")
    .then((res) => res.arrayBuffer())
    .then((bytes) => {
      thrusterBytes = bytes;
      thrusterLoading = null;
    })
    .catch(() => {
      thrusterLoading = null;
    });
}

function startThruster() {
  if (thruster) return;
  armAudio();
  if (!audio) return;
  if (!thrusterBuffer) {
    if (!thrusterBytes) {
      loadThruster();
      return;
    }
    if (thrusterDecoding) return;
    thrusterDecoding = audio.resume().then(() => audio.decodeAudioData(thrusterBytes.slice(0))).then((buffer) => {
      thrusterBuffer = buffer;
      thrusterDecoding = null;
      if (Math.abs(turnRate()) >= 0.02) startThruster();
    }).catch(() => {
      thrusterDecoding = null;
    });
    return;
  }
  const source = audio.createBufferSource();
  source.buffer = thrusterBuffer;
  source.loop = true;
  const mix = audio.createGain();
  mix.gain.value = 0.0001;
  source.connect(mix);
  mix.connect(audio.destination);
  source.start();
  thruster = { mix, source };
}

function ensureThruster() {
  if (thruster) return;
  startThruster();
}

function paintThruster(cmd) {
  const amount = Math.min(1, Math.abs(cmd));
  if (amount >= 0.02) ensureThruster();
  if (!thruster || !audio) return;
  const t = audio.currentTime;
  const gain = thruster.mix.gain;
  const level = amount < 0.02 ? 0.0001 : 1.69 * (0.02 + amount * 0.38);
  gain.cancelScheduledValues(t);
  gain.setValueAtTime(Math.max(0.0001, gain.value), t);
  gain.setTargetAtTime(level, t, amount < 0.02 ? 0.09 : 0.04);
}

port.addEventListener("pointerdown", (event) => {
  if (play === "find" && phase === "seek") {
    if (event.button !== undefined && event.button !== 0) return;
    const hit = starAt(event.clientX, event.clientY);
    if (hit < 0) return;
    event.preventDefault();
    lockFind(hit);
    return;
  }
  onDown(event);
});
sextant.addEventListener("pointerdown", onDown);
function grabStick(event) {
  if (phase !== "align") return;
  if (stickHold !== null) return;
  if (event.button !== undefined && event.button !== 0) return;
  stickHold = event.pointerId;
  stickPull = pullFromPointer(event);
  joyBase.classList.add("is-held");
  try {
    joyBase.setPointerCapture(event.pointerId);
  } catch (err) {
    /* synthetic events have nothing to capture */
  }
  armAudio();
  event.preventDefault();
}

function moveStick(event) {
  if (stickHold !== event.pointerId) return;
  stickPull = pullFromPointer(event);
}

function releaseStick(event) {
  if (event && stickHold !== event.pointerId) return;
  stickHold = null;
  stickTouchId = null;
  joyBase.classList.remove("is-held");
}

joyBase.addEventListener("pointerdown", grabStick);
joyBase.addEventListener("pointermove", moveStick);
joyBase.addEventListener("pointerup", releaseStick);
joyBase.addEventListener("pointercancel", releaseStick);

/* A finger is a touch gesture. Pointer capture inside the kiosk iframe gets
   cancelled when the page treats that finger as a scroll, so the stick never
   moves. These listeners tug the same knob and keep the page from scrolling. */
const TOUCH_HOLD = "touch";
const touchListen = { passive: false, capture: true };

function grabTouch(event) {
  if (phase !== "align") return;
  if (stickTouchId !== null) return;
  const t = event.changedTouches[0];
  if (!t) return;
  event.preventDefault();
  stickTouchId = t.identifier;
  stickHold = TOUCH_HOLD;
  stickPull = pullFromClientX(t.clientX);
  joyBase.classList.add("is-held");
  armAudio();
}

function moveTouch(event) {
  if (stickTouchId === null) return;
  const t = [...event.touches].find((touch) => touch.identifier === stickTouchId);
  if (!t) return;
  if (event.cancelable) event.preventDefault();
  stickPull = pullFromClientX(t.clientX);
}

function endTouch(event) {
  if (stickTouchId === null) return;
  const ended = [...event.changedTouches].some((touch) => touch.identifier === stickTouchId);
  if (!ended) return;
  if (event.cancelable) event.preventDefault();
  stickTouchId = null;
  if (stickHold === TOUCH_HOLD) {
    stickHold = null;
    joyBase.classList.remove("is-held");
  }
}

joyBase.addEventListener("touchstart", grabTouch, touchListen);
joyBase.addEventListener("touchmove", moveTouch, touchListen);
joyBase.addEventListener("touchend", endTouch, touchListen);
joyBase.addEventListener("touchcancel", endTouch, touchListen);
window.addEventListener("touchmove", moveTouch, { passive: false });
window.addEventListener("touchend", endTouch, { passive: false });
window.addEventListener("touchcancel", endTouch, { passive: false });

window.addEventListener("pointermove", (event) => {
  if (turning) holdX = event.clientX;
  moveStick(event);
});
window.addEventListener("pointerup", (event) => {
  turning = false;
  releaseStick(event);
});
window.addEventListener("pointercancel", (event) => {
  turning = false;
  releaseStick(event);
});

function onDown(event) {
  if (phase !== "align") return;
  if (event.button !== undefined && event.button !== 0) return;
  armAudio();
  turning = true;
  originX = event.clientX;
  holdX = event.clientX;
  event.preventDefault();
}

done.addEventListener("pointerdown", armAudio);
done.addEventListener("click", lock);
again.addEventListener("click", () => {
  marks = [];
  startLevel(0);
});
swap.addEventListener("click", () => {
  startGame(play === "find" ? "align" : "find");
});
pickAlign.addEventListener("click", () => startGame("align"));
pickFind.addEventListener("click", () => startGame("find"));

function arrowDir(event) {
  if (event.key === "ArrowLeft" || event.code === "ArrowLeft") return -1;
  if (event.key === "ArrowRight" || event.code === "ArrowRight") return 1;
  return 0;
}

window.addEventListener("keydown", (event) => {
  if (event.target === consoleText) return;
  const dir = arrowDir(event);
  if (dir) {
    if (dir < 0) held.left = true;
    else held.right = true;
    armAudio();
    event.preventDefault();
  } else if (event.key === "Enter" && phase === "align") {
    lock();
  }
});
window.addEventListener("keyup", (event) => {
  if (event.target === consoleText) return;
  const dir = arrowDir(event);
  if (dir < 0) held.left = false;
  if (dir > 0) held.right = false;
});
window.addEventListener("blur", () => {
  held.left = false;
  held.right = false;
  releaseStick();
});

function frame(now) {
  requestAnimationFrame(frame);
  const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0;
  lastFrame = now;
  if (phase === "study" && studyEndsAt) {
    setConsoleClock(String(Math.max(0, Math.ceil((studyEndsAt - now) / 1000))));
  }
  if (phase === "align") {
    stepCapsule(dt);
    const left = level().limit - (now - alignStart);
    if (left <= 0) {
      lock();
      return;
    }
    paint(left / level().limit);
  } else if (play === "find" && (phase === "watch" || phase === "strike" || phase === "seek" || phase === "lock")) {
    if (spinDrag) {
      spinRate = spinDrag + (spinRate - spinDrag) * Math.exp(-4.4 * dt);
      if (Math.abs(spinRate - spinDrag) < 0.5) {
        spinRate = spinDrag;
        spinDrag = 0;
      }
    }
    spin += spinRate * dt;
    if (phase === "seek") {
      const current = FIND[index];
      const left = current.seek - (now - seekStart);
      if (left <= 0) {
        lockFind(-1);
        return;
      }
      paint(left / current.seek);
    } else if (phase === "lock") {
      paint(0);
    } else {
      paint(1);
    }
  }
  paintLink();
  paintStick(dt);
}

requestAnimationFrame(frame);
document.title = play === "find" ? "Find the star" : "Align the stars";
loadBed();
loadCountdown();
loadKeypad();
loadWrong();
loadLightning();
window.addEventListener("pointerdown", armAudio);
startLevel(0);
