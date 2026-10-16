/* Cookie Time Confidential — flow draft.
   Live pieces: the badge kit, the sky pinch (/transition), Align (/orient), Find (/find).
   Every other plate is a vector stand-in until the raw art arrives. */

const NS = "http://www.w3.org/2000/svg";

const MISSIONS = [
  {
    id: "mercury",
    title: "PROJECT MERCURY",
    kicker: "PROJECT",
    name: "MERCURY",
    blurb: "NASA’s first human spaceflight program; single pilot-spacecraft.",
    body: "Mission Objective: Put a human-operated spacecraft in orbit, bring the pilot back safely, and test human survival in space. Completed 20 unmanned spaceflights before putting humans in orbit, including 4 chimpanzees!",
    asset: "/kiosk/art/project-file-mercury.svg?v=1",
  },
  {
    id: "gemini",
    title: "PROJECT GEMINI",
    kicker: "PROJECT",
    name: "GEMINI",
    blurb: "NASA’s second human spaceflight program; 2 pilot spacecraft",
    body: "Mission Objective: Test orbital docking, spacewalks, long-duration spaceflight, and precision landings. It was a critical step between the single-pilot Mercury Program and the lunar-focused Apollo Program.",
    asset: "/kiosk/art/project-file-gemini.svg?v=1",
  },
  {
    id: "apollo",
    title: "PROJECT APOLLO",
    kicker: "PROJECT",
    name: "APOLLO",
    blurb: "NASA’s third human spaceflight program; 3 crew members per flight",
    body: "Mission objective: Land an American astronaut on the moon and return them safely to Earth. It deposited 12 astronauts on the moon across 6 successful landing missions.",
    asset: "/kiosk/art/project-file-apollo.svg?v=1",
  },
];

const FIGURES = {
  "ursa-major": {
    name: "Ursa Major",
    alias: "The Great Bear",
    role: "Ursa Major has pointer stars that direct you to the North Star, but it has no guiding stars.",
    stars: [[18, 42], [32, 36], [40, 52], [26, 58], [52, 64], [66, 74], [82, 68]],
    links: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6]],
  },
  "canis-major": {
    name: "Canis Major",
    alias: "The Greater Dog",
    role: "Canis Major has a guiding star, Sirius; find that super-bright star first, and you can easily find the rest of the dog.",
    stars: [[72, 28], [58, 40], [46, 52], [36, 66], [52, 74], [64, 62]],
    links: [[0, 1], [1, 2], [2, 3], [2, 5], [5, 4], [3, 4]],
    bright: 0,
  },
  scorpius: {
    name: "Scorpius",
    alias: "Scorpion",
    role: "Scorpius has a guiding star, red Antares, which marks the Scorpion’s heart; find that first, and you can easily trace the rest of the scorpion.",
    stars: [[24, 30], [36, 38], [48, 50], [54, 64], [46, 76], [32, 82], [22, 72]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
    bright: 2,
  },
};

const FLOW = [
  { n: 1, frame: "Idle — Cookie Time", kind: "idle", mode: "idle" },
  { n: 2, frame: "Arrival", kind: "say", text: "Welcome to Morehead Planetarium, the heart of North Carolina’s secret space town!" },
  { n: 3, frame: "Name", kind: "name", text: "What’s your name, cadet?" },
  { n: 4, frame: "Cookie Time", kind: "say", plate: "cookies", text: "Nice to meet you, {name}. At Morehead, we called astronaut training sessions “Cookie Time” to keep them secret. We laid out cookies and drinks whenever they visited, so the name stuck." },
  { n: 5, frame: "Star Navigation", kind: "say", world: "star-sky.svg?v=1", text: "Today, we will teach you Star Navigation, an ancient technique that helps you find your way with the night sky." },
  { n: 6, frame: "Blank badge", kind: "say", live: true, text: "Here’s your badge. You will fill it in as you complete each lesson." },
  { n: 7, frame: "Choose a mission", kind: "mission", text: "To begin your training, choose your mission." },
  { n: 8, frame: "First award", kind: "say", live: true, text: "Congratulations, {name}, you’ve collected your first achievement!" },
  { n: 9, frame: "Star navigation", kind: "say", world: "starnav.png?v=1", play: "guiding", text: "All right, let’s get you space-ready! When you are floating in space, Star Navigation helps you answer: “Which direction am I facing?” and “Where am I?”", playText: "Certain stars act as landmarks. Far-away objects, like a distant mountain peak, stay put in our field of vision, so we can use them to orient ourselves as we move." },
  { n: 10, frame: "Stars as landmarks", kind: "say", plate: "landmarks", text: "Certain stars act as landmarks. Far-away objects, like a distant mountain peak, stay put in our field of vision, so we can use them to orient ourselves as we move." },
  { n: 11, frame: "Guiding stars", kind: "say", plate: "star-globe", text: "We call these fixed stars “Guiding stars”, and astronauts had to memorize 37 of them! Computers used to be very unreliable, so Astronauts had to manually check if they were still on course using these stars." },
  { n: 12, frame: "Rusty at Morehead", kind: "say", plate: "id", text: "Astronaut Russel L. “Rusty” Schweickart practiced this during his training at Morehead Planetarium in the 1960s." },
  { n: 13, frame: "Rusty’s quote", kind: "quote", mode: "quote", quote: "NASA wanted us to carry a solid mental picture of the star field, because we were part of the spacecraft’s navigation system. If the computer quit, the stars were all we had, so we had to know the constellations on sight.", who: "Russell L. “Rusty” Schweickart", meta: ["Apollo 9", "Lunar Module Pilot", "Fun fact: born in Neptune, New Jersey"] },
  { n: 14, frame: "Constellations", kind: "say", text: "To locate those Guiding Stars, astronauts used constellations. Constellations divide the night sky into familiar regions, and certain stars within a constellation act as pointers to Guiding Stars." },
  { n: 15, frame: "Charlie Duke", kind: "say", plate: "id", card: "duke-id.svg?v=1", text: "For astronaut Charlie Duke, learning the constellations was one of the most critical parts of his training:" },
  { n: 16, frame: "Charlie’s quote", kind: "quote", mode: "quote", art: "duke", quote: "We had 37 stars in our onboard computer so we needed to know that the one we had selected for a sighting was the correct one. At Morehead we learned to identify constellations so we were sure that we had the correct star. It was very beneficial training.", who: "Charles M. Duke Jr.", meta: ["Apollo 16", "Lunar Module Pilot", "Fun fact: youngest man on the moon"] },
  { n: 17, frame: "Constellation files", kind: "files", text: "These are a few of the most famous constellations in our sky! Look at their shapes carefully, these constellations will come in handy soon.", moreText: "Let’s see how many you remember! Steer your ship towards the correct constellation." },
  { n: 18, frame: "Game 1 — Constellation ID", kind: "ident", mode: "game" },
  { n: 19, frame: "Second award", kind: "say", live: true, text: "Congratulations, {name}, you’ve collected your second achievement!" },
  { n: 20, frame: "Two stars", kind: "say", plate: "angle", world: "triangle-sky.svg?v=1", text: "Great job! These constellations are our road signs in space. Use them to identify any two guiding stars, and you’ll know where you are." },
  { n: 21, frame: "The window", kind: "sky", mode: "sky", live: true, src: "/transition", text: "But that’s only half the story. In a spaceship, you can’t look at the whole sky at once! Instead, you see a small piece of it through your ship’s window.", tiltText: "Astronauts have to identify which section of the sky they are seeing through that small window. To complicate things further, the spacecraft could be tilted in any direction, so they had to recognize constellations in different orientations!" },
  { n: 22, frame: "Game 2 — Spin the World", kind: "align", mode: "game", live: true },
  { n: 23, frame: "Third award", kind: "say", live: true, text: "Congratulations, {name}, you’ve collected your last designation!" },
  { n: 24, frame: "Almost done", kind: "say", text: "Great job! You are almost done with your training." },
  { n: 25, frame: "Thunderstorm", kind: "storm", mode: "sky", src: "/transition?t=7.2", text: "But oh, no! A thunderstorm is approaching. Your navigation systems could get damaged. Can you identify the guiding star after getting struck by lightning? Use the pointer to click on the labeled star after your navigation system is struck." },
  { n: 26, frame: "Game 3 — Find the guiding star", kind: "find", mode: "game", live: true },
  { n: 27, frame: "Certified", kind: "say", text: "Great work, cadet {name}! Congratulations on completing your training." },
  { n: 28, frame: "Print", kind: "print", mode: "print", live: true, text: "Let's see what designation you earned in training." },
];

const state = {
  name: "",
  mission: "apollo",
  constellation: "canis-major",
  constellationMarks: null,
  alignMarks: null,
  findMarks: null,
  badgeSection: "",
  missionAt: MISSIONS.findIndex((mission) => mission.id === "apollo"),
  fileAt: 1,
  round: 0,
};

let badge = null;
let badgeReady = Promise.resolve();
let current = 1;
let epoch = 0;
let crossing = false;
let guiding = false;
let lineMore = false;
let windowTilted = false;

const world = document.getElementById("world");
const sky = document.getElementById("sky");
const plate = document.getElementById("plate");
const slot = document.getElementById("slot");
const BUILDING = "/kiosk/art/building.png?v=2";

function artUrl(file) {
  return `/kiosk/art/${file}`;
}
const terminal = document.getElementById("terminal");
const cast = document.getElementById("cast");
const line = document.getElementById("line");
const nameBox = document.getElementById("name-box");
const nameInput = document.getElementById("name");
const label = document.getElementById("label");
const count = document.getElementById("count");
const live = document.getElementById("live");
const leave = document.getElementById("leave");

function fill(text) {
  const name = state.name || "Cadet";
  return text.replaceAll("{name}", name);
}

let typeTimer = 0;
let typing = false;
let textCtx = null;
let textBuf = null;
let textVoices = [];
let chirpAt = 0;

/* Chirp onsets in the first 5s of the digital-text effect, pulled back
   a few milliseconds so each slice includes the attack and not the next hit. */
const TEXT_CHIRPS = [0.446, 0.536, 0.624, 0.714, 0.804, 0.892, 0.982, 1.07, 1.16, 1.25, 1.34, 1.428, 1.518, 1.606, 1.696, 1.786, 1.874, 1.964, 2.052, 2.142, 2.232, 2.696, 2.786, 2.874, 2.964, 3.052, 3.746, 3.834, 3.924, 4.014, 4.104, 4.192, 4.282, 4.37, 4.46, 4.55];
const TEXT_SLICE = 0.068;

function textAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!textCtx) textCtx = new Ctx();
  if (textCtx.state === "suspended") textCtx.resume();
  return textCtx;
}

function loadTextTick() {
  if (textBuf || loadTextTick.busy) return;
  loadTextTick.busy = true;
  fetch("/audio/text-out.wav")
    .then((res) => {
      if (!res.ok) throw new Error(String(res.status));
      return res.arrayBuffer();
    })
    .then((raw) => {
      const ctx = textAudio();
      if (!ctx) return null;
      return ctx.decodeAudioData(raw.slice(0));
    })
    .then((buf) => { textBuf = buf || null; })
    .catch(() => { loadTextTick.busy = false; });
}

function stopTextTick() {
  const voices = textVoices.splice(0);
  if (!textCtx) return;
  const now = textCtx.currentTime;
  for (const voice of voices) {
    try {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), now);
      voice.gain.gain.linearRampToValueAtTime(0.0001, now + 0.012);
      voice.src.stop(now + 0.016);
    } catch (err) { /* already ended */ }
  }
}

/* One chirp per spoken glyph, sliced from the clip in order. The slice
   speeds up just enough to finish inside a fast letter gap, and a comma
   or period plays once then stays quiet through the hang. */
function tickText(ch, gapMs) {
  if (!ch || ch === " " || !textBuf) return;
  const ctx = textAudio();
  if (!ctx) return;
  const offset = TEXT_CHIRPS[chirpAt % TEXT_CHIRPS.length];
  chirpAt += 1;
  const gap = gapMs == null ? TEXT_SLICE : Math.max(0.012, gapMs / 1000);
  let rate = 1;
  if (gap < TEXT_SLICE) rate = Math.min(1.45, TEXT_SLICE / Math.max(0.03, gap * 0.92));
  rate *= 0.98 + Math.random() * 0.05;
  const heard = TEXT_SLICE / rate;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = textBuf;
  src.playbackRate.value = rate;
  const held = ".!?".includes(ch);
  const comma = ",;:".includes(ch);
  const level = held ? 0.62 : comma ? 0.5 : 0.4 + Math.random() * 0.08;
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(level, now);
  gain.gain.setValueAtTime(level, now + Math.max(0.008, heard - 0.016));
  gain.gain.exponentialRampToValueAtTime(0.0001, now + heard);
  src.connect(gain);
  gain.connect(ctx.destination);
  const voice = { src, gain };
  textVoices.push(voice);
  src.onended = () => {
    const at = textVoices.indexOf(voice);
    if (at >= 0) textVoices.splice(at, 1);
  };
  src.start(now, offset, TEXT_SLICE);
  src.stop(now + heard + 0.02);
}

function stopTyping() {
  window.clearTimeout(typeTimer);
  typeTimer = 0;
  typing = false;
  terminal.classList.remove("is-typing");
  stopTextTick();
}

/* A terminal, not a metronome: most glyphs tick quickly, spaces rush,
   punctuation hangs, and the occasional hitch breaks the rhythm. */
function typeLine(text) {
  stopTyping();
  textAudio();
  const full = fill(text);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || full.length < 2) {
    line.textContent = full;
    return;
  }
  const stamp = epoch;
  let i = 0;
  line.textContent = "";
  typing = true;
  terminal.classList.add("is-typing");
  const stepChar = () => {
    if (stamp !== epoch) return;
    i += 1;
    line.textContent = full.slice(0, i);
    const ch = full[i - 1];
    const last = i >= full.length;
    let delay = 14 + Math.random() * 26;
    if (ch === " ") delay = 6 + Math.random() * 10;
    else if (".!?".includes(ch)) delay = 160 + Math.random() * 200;
    else if (",;:".includes(ch)) delay = 70 + Math.random() * 80;
    if (!last) {
      if (Math.random() < 0.12) delay = 4 + Math.random() * 8;
      else if (Math.random() < 0.07) delay += 50 + Math.random() * 90;
    }
    tickText(ch, last ? null : delay);
    if (last) {
      typing = false;
      terminal.classList.remove("is-typing");
      return;
    }
    typeTimer = window.setTimeout(stepChar, delay);
  };
  typeTimer = window.setTimeout(stepChar, 30);
}

function finishTyping() {
  if (!typing) return false;
  const step = FLOW[current - 1];
  const text = guiding && step.playText ? step.playText : lineMore && step.moreText ? step.moreText : windowTilted && step.tiltText ? step.tiltText : step.text;
  stopTyping();
  if (text) line.textContent = fill(text);
  return true;
}

function svg(tag, attrs, parent) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs || {})) node.setAttribute(key, value);
  if (parent) parent.appendChild(node);
  return node;
}

function withBadge(run) {
  badgeReady.then(() => {
    if (badge) run(badge);
  }).catch(() => {});
}

function showBadge(on) {
  const node = document.getElementById("badge");
  if (node) node.style.visibility = on ? "visible" : "hidden";
}

/* Five beats, the same ones the badge demo plays.
   Walking forward into a beat plays that whole clip. The clip expands,
   shows the new mark, and parks itself. Every other screen holds the
   parked disc. Stepping back or jumping holds the park for that point
   in the story, with the marks already earned. */
function atFrame(frame) {
  const index = FLOW.findIndex((step) => step.frame === frame);
  return index < 0 ? 1 : index + 1;
}

function badgeSection(n) {
  if (n < atFrame("Blank badge")) return "hidden";
  if (n < atFrame("First award")) return "appear";
  if (n < atFrame("Second award")) return "mission";
  if (n < atFrame("Third award")) return "constellation";
  if (n < atFrame("Print")) return "performance";
  return "designate";
}

function badgeSpec(section) {
  const name = state.name || "Cadet";
  const title = sessionTitle().title || "SPACE NAVIGATOR";
  const spec = {
    pose: "dock",
    name,
    title: "",
    mission: "",
    constellation: "",
    rank: "",
  };
  if (section === "hidden") return { pose: "hidden" };
  if (section === "mission" || section === "constellation" || section === "performance" || section === "designate") {
    spec.mission = state.mission;
  }
  if (section === "constellation" || section === "performance" || section === "designate") {
    spec.constellation = state.constellation;
  }
  if (section === "performance" || section === "designate") spec.rank = "cookie";
  if (section === "designate") {
    spec.pose = "aside";
    spec.title = title;
  }
  return spec;
}

function playBadge(badge, section, spec) {
  if (section === "appear") return badge.appear(spec.name);
  if (section === "mission") return badge.receiveMission(spec.mission);
  if (section === "constellation") return badge.receiveConstellation(spec.constellation);
  if (section === "performance") return badge.receivePerformance(spec.rank);
  if (section === "designate") return badge.designate(spec.title);
  return badge.hold(spec);
}

function syncBadge(n, prev) {
  const exporting = new URLSearchParams(location.search).has("export");
  const section = badgeSection(n);
  showBadge(section !== "hidden");
  if (exporting || section === state.badgeSection) return;
  const forward = prev + 1 === n;
  const spec = badgeSpec(section);
  state.badgeSection = section;
  /* Print owns its own expansion. The three award seatings stay on playBadge. */
  if (section === "designate") return;
  withBadge((patch) => {
    if (forward && section !== "hidden") return playBadge(patch, section, spec);
    return patch.hold(spec);
  });
}

function isRustyQuote(step) {
  const frame = String((step && step.frame) || "").replace(/[\u2019\u2018']/g, "'");
  return frame === "Rusty's quote";
}

function mountQuote(step, entered) {
  if (isRustyQuote(step)) {
    mountRustyQuote(step, entered);
    return;
  }
  if (step.art === "duke") {
    mountDukeQuote(step, entered);
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = "quote";
  const bubble = document.createElement("blockquote");
  bubble.className = "bubble";
  bubble.textContent = `“${step.quote}”`;
  const pass = document.createElement("aside");
  pass.className = "pass";
  const pic = document.createElement("div");
  pic.className = "who-pic";
  pic.innerHTML = `<svg viewBox="0 0 72 72"><circle cx="36" cy="28" r="14" fill="#8aa0ab"/><path d="M12 68 C16 48 56 48 60 68" fill="#8aa0ab"/></svg>`;
  const facts = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = step.who;
  facts.appendChild(strong);
  step.meta.forEach((item) => {
    const span = document.createElement("span");
    span.textContent = item;
    facts.appendChild(span);
  });
  pass.append(pic, facts);
  wrap.append(bubble, pass);
  plate.appendChild(wrap);
}

/* Rusty’s quote. The bubble art already draws the quote, so this screen
   does not add a second line of type or the pass card.
   Stepping forward from the ID card adds .is-arriving. A direct load
   stays on the finished pose. */
function mountRustyQuote(step, entered) {
  const wrap = document.createElement("div");
  wrap.className = "rusty-quote";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (entered && !reduce) wrap.classList.add("is-arriving");
  const bubble = document.createElement("img");
  bubble.className = "rusty-bubble";
  bubble.src = "/kiosk/art/rusty-quote-bubble.svg?v=1";
  bubble.alt = `“${step.quote}”`;
  const portrait = document.createElement("img");
  portrait.className = "rusty-portrait";
  portrait.src = "/kiosk/art/rusty-portrait.svg?v=1";
  portrait.alt = "";
  wrap.append(bubble, portrait);
  plate.appendChild(wrap);
}

/* Charlie’s quote. Same size as Rusty’s, with the terminal’s double
   green stroke around the field and the quote set inside it.
   Stepping forward from the ID card adds .is-arriving. A direct load
   stays on the finished pose. */
function mountDukeQuote(step, entered) {
  const wrap = document.createElement("div");
  wrap.className = "duke-quote";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (entered && !reduce) wrap.classList.add("is-arriving");
  const bubble = document.createElement("div");
  bubble.className = "duke-bubble";
  const shape = document.createElement("img");
  shape.src = "/kiosk/art/speech-bubble.svg?v=2";
  shape.alt = "";
  const words = document.createElement("img");
  words.className = "duke-words";
  words.src = "/kiosk/art/duke-quote.svg?v=1";
  words.alt = `“${step.quote}”`;
  bubble.append(shape, words);
  const portrait = document.createElement("img");
  portrait.className = "duke-portrait";
  portrait.src = "/kiosk/art/duke-portrait.svg?v=1";
  portrait.alt = "";
  wrap.append(bubble, portrait);
  plate.appendChild(wrap);
}

function apolloMissionAt() {
  const at = MISSIONS.findIndex((mission) => mission.id === "apollo");
  return at >= 0 ? at : 0;
}

/* A leftover Skylab index (or any id no longer in the carousel) would
   read past the array. Land on Apollo instead. */
function resolveMissionAt() {
  const mission = MISSIONS[state.missionAt];
  if (!mission || mission.id === "skylab" || state.mission === "skylab") {
    state.mission = "apollo";
    state.missionAt = apolloMissionAt();
  }
  return MISSIONS[state.missionAt];
}

/* One step, same wrap as the chevrons. Left arrow and a rightward swipe
   both pass -1; right arrow and a leftward swipe both pass +1. */
function stepMission(dir) {
  const count = MISSIONS.length;
  const at = Number.isInteger(state.missionAt) ? state.missionAt : apolloMissionAt();
  state.missionAt = (at + dir + count) % count;
  if (!MISSIONS[state.missionAt] || MISSIONS[state.missionAt].id === "skylab") {
    state.missionAt = apolloMissionAt();
  }
  go(7);
}

const MISSION_SCALE_MIN = 1;
const MISSION_SCALE_MAX = 1.6;
const MISSION_TAP_PX = 16;
const MISSION_SWIPE_PX = 64;
const MISSION_AXIS = 1.25;

let missionSwallowClick = false;
let missionSwallowTimer = 0;

function missionScale(folder) {
  const raw = Number(folder.dataset.scale);
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

function paintMissionScale(folder, scale) {
  const next = Math.min(MISSION_SCALE_MAX, Math.max(MISSION_SCALE_MIN, scale));
  if (next <= 1.001) {
    folder.dataset.scale = "1";
    folder.style.transform = "";
    folder.classList.remove("is-zoomed");
    return 1;
  }
  const shown = Math.round(next * 1000) / 1000;
  folder.dataset.scale = String(shown);
  folder.style.transform = `scale(${shown})`;
  folder.classList.add("is-zoomed");
  return shown;
}

function armMissionClickSwallow() {
  missionSwallowClick = true;
  window.clearTimeout(missionSwallowTimer);
  missionSwallowTimer = window.setTimeout(() => {
    missionSwallowClick = false;
  }, 500);
}

function installMissionClickSwallow() {
  if (installMissionClickSwallow.installed) return;
  installMissionClickSwallow.installed = true;
  document.addEventListener("click", (event) => {
    if (!missionSwallowClick) return;
    missionSwallowClick = false;
    window.clearTimeout(missionSwallowTimer);
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(".folder .go, .folder .pill, .file-row > .pill, .file-row .arrows button")) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

/* Touch on one carousel. A short move stays a tap (the pill still
   clicks). A clear horizontal drag steps once: a leftward swipe is the
   right chevron, a rightward swipe is the left chevron. Two fingers
   scale `scaled` between 1× and 1.6× and never the rest of the kiosk. */
function bindCarouselTouch(folder, onStep, scaleEl) {
  const scaled = scaleEl || folder;
  installMissionClickSwallow();
  const points = new Map();
  let mode = "";
  let startScale = 1;
  let startDist = 1;
  let originX = 0;
  let originY = 0;
  let swipeDir = 0;
  let locked = false;

  function beginPinch() {
    const pts = [...points.values()];
    if (pts.length < 2) return;
    mode = "pinch";
    locked = false;
    swipeDir = 0;
    startDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
    startScale = missionScale(scaled);
  }

  folder.addEventListener("touchstart", (event) => {
    for (const touch of event.changedTouches) {
      points.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
    }
    if (points.size >= 2) {
      beginPinch();
      return;
    }
    if (points.size === 1 && mode !== "pinch") {
      const p = [...points.values()][0];
      originX = p.x;
      originY = p.y;
      mode = "";
      swipeDir = 0;
      locked = false;
    }
  }, { passive: true });

  folder.addEventListener("touchmove", (event) => {
    for (const touch of event.changedTouches) {
      const prev = points.get(touch.identifier);
      if (!prev) continue;
      prev.x = touch.clientX;
      prev.y = touch.clientY;
    }
    if (points.size >= 2) {
      if (mode !== "pinch") beginPinch();
      const pts = [...points.values()];
      const span = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      paintMissionScale(scaled, startScale * (span / startDist));
      event.preventDefault();
      return;
    }
    if (mode === "pinch" || mode === "slide" || points.size !== 1) return;
    const p = [...points.values()][0];
    const dx = p.x - originX;
    const dy = p.y - originY;
    if (!locked) {
      if (Math.abs(dx) < MISSION_TAP_PX && Math.abs(dy) < MISSION_TAP_PX) return;
      if (Math.abs(dx) >= MISSION_TAP_PX && Math.abs(dx) >= Math.abs(dy) * MISSION_AXIS) locked = true;
      else {
        mode = "slide";
        return;
      }
    }
    event.preventDefault();
    swipeDir = Math.abs(dx) >= MISSION_SWIPE_PX ? (dx < 0 ? 1 : -1) : 0;
  }, { passive: false });

  function endGesture(event) {
    const cancel = event.type === "touchcancel";
    for (const touch of event.changedTouches) points.delete(touch.identifier);
    if (points.size > 0) return;
    const dir = !cancel && mode !== "pinch" && swipeDir ? swipeDir : 0;
    const dragged = locked || mode === "pinch" || mode === "slide";
    mode = "";
    swipeDir = 0;
    locked = false;
    if (!dir) {
      if (dragged) armMissionClickSwallow();
      return;
    }
    armMissionClickSwallow();
    onStep(dir);
  }

  folder.addEventListener("touchend", endGesture);
  folder.addEventListener("touchcancel", endGesture);
}

function bindMissionTouch(folder) {
  bindCarouselTouch(folder, stepMission);
}

function mountMission() {
  const mission = resolveMissionAt();
  state.mission = mission.id;
  const row = document.createElement("div");
  row.className = "card-row";
  const folder = document.createElement("article");
  folder.className = "folder";
  if (mission.asset) {
    folder.classList.add("is-asset");
    const art = document.createElement("img");
    art.className = "folder-art";
    art.src = mission.asset;
    art.alt = "";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "go";
    button.textContent = "Confirm Mission";
    button.addEventListener("click", () => go(8));
    folder.append(art, button);
    bindMissionTouch(folder);
    row.append(folder, missionArrows());
    plate.appendChild(row);
    return;
  }
  const top = document.createElement("div");
  top.className = "folder-top";
  const art = document.createElement("div");
  art.className = "art";
  if (mission.id === "gemini") {
    const img = document.createElement("img");
    img.src = "/kiosk/art/gemini.png?v=2";
    img.alt = "";
    art.appendChild(img);
  } else {
    art.classList.add("is-blank");
    art.textContent = mission.name;
  }
  const copy = document.createElement("div");
  copy.className = "copy";
  const mark = document.createElement("img");
  mark.className = "cookie-mark";
  mark.src = "/kiosk/art/cookie-mark.svg";
  mark.alt = "";
  const kicker = document.createElement("p");
  kicker.className = "kicker";
  kicker.textContent = mission.kicker;
  const title = document.createElement("h2");
  title.textContent = mission.name;
  const blurb = document.createElement("p");
  blurb.className = "blurb";
  blurb.textContent = mission.blurb;
  copy.append(mark, kicker, title, blurb);
  top.append(art, copy);
  const body = document.createElement("p");
  body.className = "mission-body";
  body.textContent = mission.body;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pill";
  button.textContent = "Confirm Mission";
  button.addEventListener("click", () => go(8));
  folder.append(top, body, button);
  bindMissionTouch(folder);
  row.append(folder, missionArrows());
  plate.appendChild(row);
}

function missionArrows() {
  const arrows = document.createElement("div");
  arrows.className = "arrows";
  [[-1], [1]].forEach(([dir]) => {
    const button = chevron(dir);
    button.setAttribute("aria-label", dir < 0 ? "Previous mission" : "Next mission");
    button.addEventListener("click", () => stepMission(dir));
    arrows.appendChild(button);
  });
  return arrows;
}

function chevron(dir) {
  const button = document.createElement("button");
  button.type = "button";
  const glyph = document.createElement("img");
  glyph.src = dir < 0 ? "/kiosk/art/chevron-left.svg" : "/kiosk/art/chevron-right.svg";
  glyph.alt = "";
  button.appendChild(glyph);
  return button;
}

const FILE_ART = {
  "ursa-major": "constellation-ursa.svg?v=1",
  "canis-major": "constellation-canis.svg?v=1",
  "scorpius": "constellation-scorpius.svg?v=1",
};

function mountFiles() {
  const order = ["ursa-major", "canis-major", "scorpius"];
  const front = state.fileAt;
  const row = document.createElement("div");
  row.className = "file-row";
  const files = document.createElement("div");
  files.className = "files";
  [-1, 1, 0].forEach((offset) => {
    const id = order[(front + offset + order.length) % order.length];
    const card = document.createElement("img");
    card.className = "const-card";
    card.classList.add(offset === 0 ? "is-front" : "is-side");
    card.classList.add(offset < 0 ? "is-left" : offset > 0 ? "is-right" : "is-center");
    card.src = artUrl(FILE_ART[id]);
    card.alt = FIGURES[id].name;
    files.appendChild(card);
  });
  row.appendChild(files);
  const arrows = document.createElement("div");
    arrows.className = "arrows";
    [-1, 1].forEach((dir) => {
      const button = chevron(dir);
      button.setAttribute("aria-label", dir < 0 ? "Previous constellation" : "Next constellation");
      button.addEventListener("click", () => {
        state.fileAt = (state.fileAt + dir + order.length) % order.length;
        go(atFrame("Constellation files"));
      });
      arrows.appendChild(button);
    });
    const start = document.createElement("button");
    start.type = "button";
    start.className = "pill";
    start.textContent = "Confirm Mission";
    start.addEventListener("click", () => {
      state.constellation = order[state.fileAt];
      state.round = 0;
      state.constellationMarks = [];
      go(atFrame("Game 1 — Constellation ID"));
    });
    row.append(arrows, start);
  bindCarouselTouch(row, (dir) => {
    state.fileAt = (state.fileAt + dir + order.length) % order.length;
    go(atFrame("Constellation files"));
  }, files);
  plate.appendChild(row);
}

function mountLandmarks() {
  mountGuidingWidget();
}

/* Three poses from the Canva export: bite to the right, bite on top, bite to the left. */
function mountStarTap() {
  const hit = document.createElement("button");
  hit.type = "button";
  hit.className = "sky-hit";
  hit.setAttribute("aria-label", "Start Guiding Stars");
  hit.addEventListener("click", beginGuiding);
  plate.appendChild(hit);
}

function fadeBackdrop(url, done) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finish = () => {
    if (world.getAttribute("src") !== url) world.src = url;
    const settle = () => {
      sky.style.transition = "none";
      sky.style.opacity = "0";
      if (done) done();
    };
    if (world.complete && world.getAttribute("src") === url) settle();
    else world.addEventListener("load", settle, { once: true });
  };
  if (reduce) {
    finish();
    return;
  }
  const start = () => {
    sky.style.transition = "none";
    sky.style.opacity = "0";
    window.requestAnimationFrame(() => {
      sky.style.transition = "opacity 1.15s ease";
      sky.style.opacity = "1";
    });
    window.setTimeout(finish, 1200);
  };
  if (sky.getAttribute("src") !== url) {
    sky.addEventListener("load", start, { once: true });
    sky.src = url;
  } else start();
}

function mountGuidingWidget() {
  document.body.classList.add("is-guiding");
  const root = document.createElement("div");
  root.className = "guiding-live";
  root.setAttribute("data-guiding-now", "");
  plate.appendChild(root);
  const api = window.GuidingStars.mount(root);
  const epochAt = epoch;
  let prev = 0;
  const watch = () => {
    if (epoch !== epochAt || !root.isConnected) return;
    const t = api.getState().t;
    if (prev > 15 && t < 1) {
      api.pause();
      window.setTimeout(() => {
        if (epoch === epochAt) next();
      }, 1600);
      return;
    }
    prev = t;
    requestAnimationFrame(watch);
  };
  requestAnimationFrame(watch);
}

function beginGuiding() {
  const step = FLOW[current - 1];
  if (!step || step.play !== "guiding" || guiding || crossing) return;
  guiding = true;
  terminal.classList.remove("is-tap");
  plate.querySelector(".sky-hit")?.remove();
  if (step.playText) typeLine(step.playText);
  mountGuidingWidget();
}

function mountCookies() {
  const wrap = document.createElement("div");
  wrap.className = "cookies";
  [151, -61.55, 0].forEach((spin) => {
    const bit = document.createElement("span");
    bit.style.setProperty("--spin", `${spin}deg`);
    const img = document.createElement("img");
    img.src = "/kiosk/art/cookie.png?v=2";
    img.alt = "";
    bit.appendChild(img);
    wrap.appendChild(bit);
  });
  plate.appendChild(wrap);
}

function mountIdCard() {
  const step = FLOW[current - 1];
  const img = document.createElement("img");
  img.className = "id-card";
  img.src = step && step.card ? artUrl(step.card) : "/kiosk/art/rusty-id.svg?v=1";
  img.alt = "";
  plate.appendChild(img);
}

function mountGlobe() {
  const wrap = document.createElement("div");
  wrap.className = "globe-wrap";
  const root = svg("svg", { viewBox: "0 0 360 360" });
  svg("circle", { cx: "180", cy: "180", r: "150", fill: "none", stroke: "#42f489", "stroke-width": "10" }, root);
  for (let i = 0; i < 8; i += 1) {
    const a = (Math.PI / 4) * i;
    svg("line", {
      x1: 180 + Math.cos(a) * 128,
      y1: 180 + Math.sin(a) * 128,
      x2: 180 + Math.cos(a) * 168,
      y2: 180 + Math.sin(a) * 168,
      stroke: "#42f489",
      "stroke-width": "8",
    }, root);
  }
  svg("ellipse", { cx: "180", cy: "180", rx: "150", ry: "48", fill: "none", stroke: "#1f6b42", "stroke-width": "2" }, root);
  svg("ellipse", { cx: "180", cy: "180", rx: "48", ry: "150", fill: "none", stroke: "#1f6b42", "stroke-width": "2" }, root);
  [[120, 150], [160, 120], [210, 140], [240, 190], [190, 220], [140, 200], [200, 100]].forEach(([x, y]) => {
    svg("circle", { cx: x, cy: y, r: 3, fill: "#fff" }, root);
  });
  wrap.appendChild(root);
  plate.appendChild(wrap);
}

/* Guiding stars. The globe art is the full frame with the black matte
   knocked out, so the portico shows around the disc. */
function mountStarGlobe() {
  const wrap = document.createElement("div");
  wrap.className = "star-globe";
  const globe = document.createElement("img");
  globe.src = "/kiosk/art/constellation-globe.png?v=1";
  globe.alt = "";
  wrap.append(globe);
  plate.appendChild(wrap);
}

/* Gaby’s whole star-navigation applet, played through. The card’s own
   sky is transparent so the page field shows through. */
function mountTriangle() {
  const root = document.createElement("div");
  root.className = "triangle-live";
  root.setAttribute("data-star-navigation", "");
  root.setAttribute("data-star-now", "");
  root.setAttribute("data-star-chrome", "off");
  plate.append(root);
  if (window.StarNavigation) window.StarNavigation.mount(root);
}

function mountLaunch(word, dest) {
  const wrap = document.createElement("div");
  wrap.className = "launch";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pill";
  button.textContent = word;
  button.addEventListener("click", () => go(dest));
  wrap.appendChild(button);
  plate.appendChild(wrap);
}

function mountIdle() {
  const wrap = document.createElement("div");
  wrap.className = "idle";
  const title = document.createElement("h1");
  title.textContent = "COOKIE TIME";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "cookie";
  button.innerHTML = `<img src="/kiosk/art/cookie.png" alt=""><span>Tap to Start</span>`;
  button.addEventListener("click", () => go(2));
  wrap.append(title, button);
  plate.appendChild(wrap);
}

function sessionTitle() {
  if (!window.MissionClassify) return { title: "SPACE NAVIGATOR", align: null, find: null, constellation: null };
  return window.MissionClassify.classify({
    mission: state.mission,
    dominant: state.constellation,
    constellationMarks: state.constellationMarks,
    alignMarks: state.alignMarks,
    findMarks: state.findMarks,
  });
}

/* Zip tracks are 546 wide. Missing marks use those drawn fills
   (MEMORY 406, AGILITY 297, CONTROL 475). A played game replaces its bar.
   Ident is memory, align is agility, find is control. */
const REPORT_TRACK = 546;
const REPORT_DEFAULT = {
  memory: 406 / REPORT_TRACK,
  agility: 297 / REPORT_TRACK,
  control: 475 / REPORT_TRACK,
};

function reportFill(score, fallback) {
  if (score == null || !Number.isFinite(score)) return fallback;
  const clamped = Math.max(0, Math.min(100, score));
  return 0.08 + 0.87 * (clamped / 100);
}

/* The top arc is the mix of the three scores, via MissionClassify.
   Memory is constellation, agility is align, control is find.
   Sky is memory and control. Ship is agility.
   Commander — both sides strong and close (COMMANDER).
   Navigator — the sky leads (MASTER STAR NAVIGATOR, the lockup on the cloth).
   Pilot — agility leads cleanly (PILOT).
   Engineer — the work landed without either side owning it (ENGINEER).
   A missing score borrows that meter’s zip fill (406 / 297 / 475 of 546)
   so a cold open still names a type from the same mix. */
function designationTitle(graded) {
  const memory = graded.constellation == null ? Math.round((406 / REPORT_TRACK) * 100) : graded.constellation;
  const agility = graded.align == null ? Math.round((297 / REPORT_TRACK) * 100) : graded.align;
  const control = graded.find == null ? Math.round((475 / REPORT_TRACK) * 100) : graded.find;
  if (!window.MissionClassify) return "ENGINEER";
  const named = window.MissionClassify.classify({
    constellationScore: memory,
    align: agility,
    find: control,
    mission: state.mission,
    dominant: state.constellation,
  });
  return named.title || "ENGINEER";
}

/* Forward: the line is already solid. The medal parks on the left with the
   title still blank, the meters rise, the designation types, then the
   instructor terminal is removed, then the existing feed-off plays.
   Hold is after the cloth has left.
   A direct ?at= or reduced motion holds the composed pose instead. */
const PRINT = {
  land: 0.28,
  fill: 0.62,
  stagger: 0.16,
  lag: 0.18,
  cause: 220,
  payoff: 450,
  hold: 3000,
};

function sketchSeconds() {
  return 2 * PRINT.stagger + PRINT.lag + PRINT.fill;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function finaleSpec(title) {
  return {
    pose: "dock",
    name: state.name || "Cadet",
    title: title || "",
    mission: state.mission,
    constellation: state.constellation,
    rank: "cookie",
  };
}

function seatReport(stage) {
  const medal = document.querySelector("#badge .badge-place");
  const host = document.getElementById("kiosk");
  if (!medal || !host) return;
  const mark = medal.getBoundingClientRect();
  const frame = host.getBoundingClientRect();
  const gap = Math.max(18, frame.width * 0.028);
  const pad = Math.max(22, frame.width * 0.04);
  let left = mark.right - frame.left + gap;
  let width = frame.width - pad - left;
  if (width < 180) {
    left = frame.width * 0.48;
    width = frame.width - pad - left;
  }
  const top = Math.max(12, mark.top - frame.top);
  let bottom = Math.min(frame.height - 12, mark.bottom - frame.top);
  const bubble = document.getElementById("terminal");
  if (bubble && !bubble.hidden) {
    const box = bubble.getBoundingClientRect();
    if (box.height > 8) bottom = Math.min(bottom, box.top - frame.top - 14);
  }
  if (bottom - top < 168) bottom = top + 168;
  stage.style.left = `${left}px`;
  stage.style.right = "auto";
  stage.style.width = `${Math.max(180, width)}px`;
  stage.style.top = `${top}px`;
  stage.style.height = `${Math.max(180, bottom - top)}px`;
}

function mountPrint(entered) {
  const stamp = epoch;
  const graded = sessionTitle();
  const title = designationTitle(graded);
  const fills = {
    memory: reportFill(graded.constellation, REPORT_DEFAULT.memory),
    agility: reportFill(graded.align, REPORT_DEFAULT.agility),
    control: reportFill(graded.find, REPORT_DEFAULT.control),
  };
  const wrap = document.createElement("div");
  wrap.className = "report";
  wrap.dataset.finale = "line";
  wrap.dataset.title = title;
  wrap.style.setProperty("--land", `${PRINT.land}s`);
  wrap.style.setProperty("--fill-time", `${PRINT.fill}s`);
  wrap.style.setProperty("--stagger", `${PRINT.stagger}s`);
  wrap.style.setProperty("--lag", `${PRINT.lag}s`);
  wrap.setAttribute("role", "region");
  wrap.setAttribute("aria-label", "Training evaluation");
  const stage = document.createElement("div");
  stage.className = "report-stage";
  const meters = document.createElement("div");
  meters.className = "report-meters";
  [
    ["memory", "MEMORY"],
    ["agility", "AGILITY"],
    ["control", "CONTROL"],
  ].forEach(([key, name]) => {
    const meter = document.createElement("div");
    meter.className = "meter";
    meter.dataset.meter = key;
    meter.style.setProperty("--fill", `${(fills[key] * 100).toFixed(2)}%`);
    const label = document.createElement("p");
    label.className = "meter-label";
    label.textContent = name;
    const track = document.createElement("div");
    track.className = "meter-track";
    const fill = document.createElement("span");
    fill.className = "meter-fill";
    track.appendChild(fill);
    meter.append(label, track);
    meters.appendChild(meter);
  });
  stage.appendChild(meters);
  wrap.appendChild(stage);
  plate.appendChild(wrap);

  const alive = () => stamp === epoch && wrap.isConnected;

  withBadge(async (patch) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!alive()) return;
    /* A jump or reduced motion holds the composed pose: title on, meters full,
       speech still up. Walking in from the previous step plays the clip. */
    if (!entered || reduce) {
      await patch.hold({ ...finaleSpec(title), pose: "aside", title });
      if (!alive()) return;
      seatReport(stage);
      wrap.dataset.finale = "settled";
      wrap.classList.add("is-on", "is-settled");
      return;
    }
    if (typeof patch.presentAside === "function") await patch.presentAside();
    else await patch.hold({ ...finaleSpec(""), pose: "aside" });
    if (!alive()) return;
    seatReport(stage);
    wrap.dataset.finale = "stats";
    wrap.classList.add("is-on");
    await wait(Math.round(sketchSeconds() * 1000) + 40);
    if (!alive()) return;
    await wait(PRINT.cause);
    if (!alive()) return;
    wrap.dataset.finale = "title";
    await patch.title(title);
    if (!alive()) return;
    await wait(PRINT.payoff);
    if (!alive()) return;
    wrap.dataset.finale = "away";
    terminal.hidden = true;
    line.textContent = "";
    if (typeof patch.sendOff === "function") await patch.sendOff();
    if (!alive()) return;
    wrap.dataset.finale = "quiet";
    await wait(PRINT.hold);
    if (!alive()) return;
    if (current < FLOW.length && FLOW[current - 1] && FLOW[current - 1].kind === "print") go(current + 1);
  });
}

function restart() {
  state.name = "";
  state.mission = "apollo";
  state.constellation = "canis-major";
  state.constellationMarks = null;
  state.alignMarks = null;
  state.findMarks = null;
  state.badgeSection = "";
  state.missionAt = MISSIONS.findIndex((mission) => mission.id === "apollo");
  state.fileAt = 1;
  state.round = 0;
  nameInput.value = "";
  go(1);
}

function stormAudio() {
  return document.getElementById("storm-crash");
}

/* Unlock during the click that leaves Almost done, then pause at the
   start so the crash itself does not play until the ship is on screen. */
function armStorm() {
  const audio = stormAudio();
  if (!audio) return;
  audio.volume = 0;
  const finish = () => {
    if (audio.dataset.cue === "1") return;
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
  };
  const pending = audio.play();
  if (pending && typeof pending.then === "function") pending.then(finish).catch(() => { audio.volume = 1; });
  else finish();
}

/* One cue: the white flash and /lightning.mp3 (the find game's thunder)
   start together. A second call while that cue is armed does not stack. */
function strikeStorm() {
  const audio = stormAudio();
  if (audio && audio.dataset.cue === "1") return;
  const flash = document.getElementById("storm-flash");
  if (audio) {
    audio.dataset.cue = "1";
    audio.volume = 1;
    audio.pause();
    audio.currentTime = 0;
  }
  if (flash) {
    flash.classList.remove("is-on");
    void flash.offsetWidth;
    flash.classList.add("is-on");
  }
  if (!audio) return;
  const pending = audio.play();
  if (pending && typeof pending.catch === "function") pending.catch(() => {});
}

function quietStorm() {
  const audio = stormAudio();
  const flash = document.getElementById("storm-flash");
  if (flash) flash.classList.remove("is-on");
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.dataset.cue = "";
  audio.volume = 1;
}

function mountStorm(cueEpoch) {
  const step = FLOW[current - 1];
  mountLaunch("Save the Ship!", atFrame("Game 3 — Find the guiding star"));
  slot.hidden = false;
  slot.style.pointerEvents = "none";
  const cue = () => {
    if (epoch !== cueEpoch) return;
    strikeStorm();
  };
  slot.addEventListener("load", cue, { once: true });
  slot.src = step.src;
}

function go(n, holdWorld, holdSlot) {
  n = Math.max(1, Math.min(FLOW.length, n));
  const prev = current;
  const prevStep = FLOW[prev - 1];
  const step = FLOW[n - 1];
  const keepCrash = prevStep && step && prevStep.frame === "Thunderstorm" && step.kind === "find";
  if (step && step.frame === "Thunderstorm") {
    const audio = stormAudio();
    if (audio) audio.dataset.cue = "";
  } else if (!keepCrash) quietStorm();
  epoch += 1;
  stopTyping();
  current = n;
  guiding = false;
  lineMore = false;
  windowTilted = false;
  document.body.dataset.mode = step.mode || "portico";
  document.body.classList.toggle("is-mission", step.kind === "mission");
  document.body.classList.remove("is-guiding");
  document.body.classList.toggle("is-triangle", step.plate === "angle");
  document.body.classList.toggle("is-rusty-quote", isRustyQuote(step));
  document.body.classList.toggle("is-duke-quote", step.art === "duke");
  document.body.classList.remove("is-sendoff");
  const backdrop = step.world ? artUrl(step.world) : BUILDING;
  if (!holdWorld && world.getAttribute("src") !== backdrop) {
    world.src = backdrop;
    sky.style.transition = "none";
    sky.style.opacity = "0";
  }
  count.textContent = String(step.n).padStart(2, "0");
  label.textContent = step.frame;
  live.hidden = !step.live;
  leave.hidden = step.kind !== "align" && step.kind !== "find";
  plate.replaceChildren();
  if (!holdSlot) {
    slot.hidden = true;
    slot.style.transition = "none";
    slot.style.opacity = "";
    slot.style.zIndex = "";
    slot.style.pointerEvents = "";
    slot.style.touchAction = "";
    if (slot.getAttribute("src")) slot.removeAttribute("src");
  }
  nameBox.hidden = true;
  const talking = Boolean(step.text);
  terminal.hidden = !talking;
  cast.hidden = !talking || step.kind === "print";
  terminal.classList.toggle("is-tap", step.kind === "say" || step.kind === "sky" || (step.kind === "files" && !!step.moreText));
  if (step.kind === "print") {
    terminal.classList.remove("is-tap", "is-typing");
    line.textContent = fill(step.text);
  } else if (talking) {
    if (holdSlot) line.textContent = "";
    else typeLine(step.text);
  }
  syncBadge(n, prev);

  if (step.kind === "idle") mountIdle();
  if (step.kind === "name") {
    nameBox.hidden = false;
    nameInput.value = state.name;
    nameInput.focus();
  }
  if (step.kind === "mission") mountMission();
  if (step.kind === "quote") mountQuote(step, prev + 1 === n);
  if (step.kind === "files") mountFiles();
  if (step.kind === "ident") state.constellationMarks = [];
  if (step.plate === "cookies") mountCookies();
  if (step.play === "guiding") mountStarTap();
  if (step.plate === "landmarks") mountLandmarks();
  if (step.plate === "globe") mountGlobe();
  if (step.plate === "id") mountIdCard();
  if (step.plate === "star-globe") mountStarGlobe();
  if (step.plate === "angle") mountTriangle();
  if (step.kind === "storm") mountStorm(epoch);
  if (step.kind === "sky") {
    slot.hidden = false;
    slot.src = step.src;
    const catcher = document.createElement("button");
    catcher.type = "button";
    catcher.className = "sky-hit";
    catcher.setAttribute("aria-label", "Continue");
    catcher.addEventListener("click", next);
    plate.appendChild(catcher);
  }
  if (step.kind === "align" || step.kind === "find" || step.kind === "ident") {
    slot.hidden = false;
    slot.style.touchAction = step.kind === "align" ? "none" : "";
    slot.src = step.kind === "align" ? "/orient?v=85" : step.kind === "find" ? "/find" : "/constellation-run?v=7";
  }
  if (step.kind === "print") mountPrint(prev + 1 === n);
  const url = new URL(location.href);
  url.searchParams.set("at", String(n));
  history.replaceState(null, "", url);
  /* The ident iframe is still on screen while it fades. Leave its keys
     alone until leaveIdent clears it. Every other arrival (Next, a
     direct at=) has already dropped the frame. */
  if ((step.frame === "Second award" || step.frame === "Third award") && !holdSlot) seatKioskKeys();
}

/* A new backdrop fades in under the astronaut and the speech box.
   Leaving Cookie Time, the cookies go first. The line itself stays solid. */
function crossToWorld() {
  if (crossing) return;
  const upcoming = FLOW[current];
  if (!upcoming || !upcoming.world) {
    go(current + 1);
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    go(current + 1);
    return;
  }
  crossing = true;
  const url = artUrl(upcoming.world);
  const fadeCookies = FLOW[current - 1].plate === "cookies";
  /* Same DOM order as the appear: left, center, right. First in, first out.
     Last cookie finishes at 0.84s + 0.5s; lead waits that out before the page moves. */
  const cookieStep = 420;
  const cookieFade = 500;
  const lead = fadeCookies ? cookieStep * 2 + cookieFade + 80 : 0;

  const begin = () => {
    const bits = fadeCookies ? [...document.querySelectorAll(".cookies span")] : [];
    bits.forEach((el) => {
      const opacity = getComputedStyle(el).opacity;
      el.style.animation = "none";
      el.style.opacity = opacity;
    });
    window.requestAnimationFrame(() => {
      bits.forEach((el, i) => {
        el.style.transition = `opacity ${cookieFade}ms ease ${i * cookieStep}ms`;
        el.style.opacity = "0";
        const img = el.querySelector("img");
        if (!img) return;
        /* Freeze the drift when this cookie's fade starts. Opacity is the
           only thing that moves after that, so the two don't jitter. */
        window.setTimeout(() => {
          img.style.animationPlayState = "paused";
        }, i * cookieStep);
      });
    });
    window.setTimeout(() => {
      go(current + 1, true);
      sky.style.transition = "none";
      sky.style.opacity = "0";
      window.requestAnimationFrame(() => {
        sky.style.transition = "opacity 1.15s ease";
        sky.style.opacity = "1";
      });
    }, lead);
    window.setTimeout(() => {
      const settle = () => {
        sky.style.transition = "none";
        sky.style.opacity = "0";
        crossing = false;
      };
      if (world.getAttribute("src") !== url) world.src = url;
      if (world.complete) settle();
      else world.addEventListener("load", settle, { once: true });
    }, lead + 1280);
  };

  if (sky.getAttribute("src") === url) begin();
  else {
    sky.addEventListener("load", begin, { once: true });
    sky.src = url;
  }
}

/* Leaving Stars as landmarks. The navy field, with the widget still on
   it, holds over the portico and the guiding-stars globe, then fades
   off. Same 1.15s ease as a world crossfade. The line swaps solid when
   the fade starts. prefers-reduced-motion and a direct ?at= still cut. */
function crossFromLandmarks() {
  if (crossing) return;
  const upcoming = FLOW[current];
  if (!upcoming || upcoming.frame !== "Guiding stars") {
    go(current + 1);
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    go(current + 1);
    return;
  }
  crossing = true;
  const kiosk = document.getElementById("kiosk");
  const veil = document.createElement("div");
  veil.className = "guiding-veil";
  const stage = document.createElement("div");
  stage.className = "guiding-veil-stage";
  const live = plate.querySelector(".guiding-live");
  if (live) {
    live.style.animation = "none";
    live.style.opacity = "1";
    stage.appendChild(live);
  }
  veil.appendChild(stage);
  kiosk.appendChild(veil);

  let started = false;
  const begin = () => {
    if (started) return;
    started = true;
    go(current + 1, true);
    const img = plate.querySelector(".star-globe img");
    /* CSS transitions wait on a paint, and this kiosk is often covered.
       Step the same 1.15s ease ourselves so the field actually leaves. */
    const start = () => {
      const begun = performance.now();
      const dur = 1150;
      const ease = (u) => {
        const x1 = 0.25;
        const y1 = 0.1;
        const x2 = 0.25;
        const y2 = 1;
        let t = u;
        for (let i = 0; i < 5; i += 1) {
          const cx = 3 * x1;
          const bx = 3 * (x2 - x1) - cx;
          const ax = 1 - cx - bx;
          const dx = (3 * ax * t + 2 * bx) * t + cx;
          if (Math.abs(dx) < 1e-6) break;
          const x = ((ax * t + bx) * t + cx) * t - u;
          t = Math.min(1, Math.max(0, t - x / dx));
        }
        const cy = 3 * y1;
        const by = 3 * (y2 - y1) - cy;
        const ay = 1 - cy - by;
        return ((ay * t + by) * t + cy) * t;
      };
      veil.style.transition = "none";
      const step = () => {
        if (!veil.isConnected) {
          crossing = false;
          return;
        }
        const u = Math.min(1, (performance.now() - begun) / dur);
        veil.style.opacity = String(1 - ease(u));
        if (u < 1) window.setTimeout(step, 16);
        else {
          veil.remove();
          crossing = false;
        }
      };
      step();
    };
    if (img && !img.complete) img.addEventListener("load", start, { once: true });
    else start();
  };

  const preload = new Image();
  preload.addEventListener("load", begin, { once: true });
  preload.addEventListener("error", begin, { once: true });
  preload.src = "/kiosk/art/constellation-globe.png?v=1";
  if (preload.complete) begin();
}

/* Into The window. The sky fades in over the previous plate.
   Astronaut and speech stay put; the line swaps solid when the fade
   starts. Same 1.15s ease. Reduced motion and a direct ?at= still cut. */
function crossToWindow() {
  if (crossing) return;
  const upcoming = FLOW[current];
  if (!upcoming || upcoming.frame !== "The window") {
    go(current + 1);
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    go(current + 1);
    return;
  }
  crossing = true;
  let started = false;
  const begin = () => {
    if (started) return;
    started = true;
    const n = current + 1;
    const step = FLOW[n - 1];
    if (!step || step.frame !== "The window") {
      crossing = false;
      return;
    }
    epoch += 1;
    const fadeEpoch = epoch;
    current = n;
    guiding = false;
    lineMore = false;
    windowTilted = false;
    count.textContent = String(step.n).padStart(2, "0");
    label.textContent = step.frame;
    live.hidden = !step.live;
    leave.hidden = true;
    terminal.hidden = false;
    cast.hidden = false;
    terminal.classList.add("is-tap");
    typeLine(step.text);
    syncBadge(n, n - 1);
    const url = new URL(location.href);
    url.searchParams.set("at", String(n));
    history.replaceState(null, "", url);
    window.requestAnimationFrame(() => {
      slot.style.transition = "opacity 1.15s ease";
      slot.style.opacity = "1";
    });
    window.setTimeout(() => {
      if (epoch !== fadeEpoch) return;
      document.body.dataset.mode = step.mode || "sky";
      document.body.classList.toggle("is-mission", step.kind === "mission");
      document.body.classList.remove("is-guiding");
      document.body.classList.toggle("is-triangle", step.plate === "angle");
      document.body.classList.toggle("is-rusty-quote", isRustyQuote(step));
      document.body.classList.toggle("is-duke-quote", step.art === "duke");
      plate.replaceChildren();
      const catcher = document.createElement("button");
      catcher.type = "button";
      catcher.className = "sky-hit";
      catcher.setAttribute("aria-label", "Continue");
      catcher.addEventListener("click", next);
      plate.appendChild(catcher);
      slot.style.transition = "none";
      slot.style.opacity = "";
      slot.style.zIndex = "";
      crossing = false;
    }, 1200);
  };

  slot.style.transition = "none";
  slot.style.opacity = "0";
  slot.style.zIndex = "4";
  slot.hidden = false;
  slot.addEventListener("load", begin, { once: true });
  slot.src = upcoming.src;
  window.setTimeout(begin, 2500);
}

/* Almost done fades onto the held ship window. The thunderstorm line
   swaps solid as the fade starts. The crash waits until that fade has
   landed, then the find game's own strike follows later, after this
   clip, instead of on top of it. */
function crossToStorm() {
  if (crossing) return;
  const upcoming = FLOW[current];
  if (!upcoming || upcoming.frame !== "Thunderstorm") {
    go(current + 1);
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    go(current + 1);
    return;
  }
  crossing = true;
  let started = false;
  const begin = () => {
    if (started) return;
    started = true;
    const n = current + 1;
    const step = FLOW[n - 1];
    if (!step || step.frame !== "Thunderstorm") {
      crossing = false;
      return;
    }
    epoch += 1;
    const fadeEpoch = epoch;
    current = n;
    guiding = false;
    lineMore = false;
    windowTilted = false;
    count.textContent = String(step.n).padStart(2, "0");
    label.textContent = step.frame;
    live.hidden = !step.live;
    leave.hidden = true;
    terminal.hidden = false;
    cast.hidden = false;
    terminal.classList.remove("is-tap");
    typeLine(step.text);
    syncBadge(n, n - 1);
    const url = new URL(location.href);
    url.searchParams.set("at", String(n));
    history.replaceState(null, "", url);
    window.requestAnimationFrame(() => {
      slot.style.transition = "opacity 1.15s ease";
      slot.style.opacity = "1";
    });
    window.setTimeout(() => {
      if (epoch !== fadeEpoch) return;
      document.body.dataset.mode = step.mode || "sky";
      document.body.classList.toggle("is-mission", false);
      document.body.classList.remove("is-guiding");
      document.body.classList.toggle("is-triangle", false);
      document.body.classList.toggle("is-rusty-quote", false);
      document.body.classList.toggle("is-duke-quote", false);
      plate.replaceChildren();
      mountLaunch("Save the Ship!", atFrame("Game 3 — Find the guiding star"));
      slot.style.transition = "none";
      slot.style.opacity = "";
      slot.style.zIndex = "";
      slot.style.pointerEvents = "none";
      crossing = false;
      strikeStorm();
    }, 1200);
  };

  slot.style.transition = "none";
  slot.style.opacity = "0";
  slot.style.zIndex = "4";
  slot.style.pointerEvents = "none";
  slot.hidden = false;
  slot.addEventListener("load", begin, { once: true });
  slot.src = upcoming.src;
  window.setTimeout(begin, 2500);
}

function next() {
  if (crossing) return;
  const step = FLOW[current - 1];
  if (step.kind === "name") {
    state.name = nameInput.value.trim() || "Cadet";
  }
  if (step.moreText && !lineMore) {
    lineMore = true;
    typeLine(step.moreText);
    return;
  }
  if (step.kind === "files") {
    const order = ["ursa-major", "canis-major", "scorpius"];
    state.constellation = order[state.fileAt];
    state.round = 0;
    state.constellationMarks = [];
  }
  const upcoming = FLOW[current];
  if (step.frame === "Stars as landmarks" && upcoming && upcoming.frame === "Guiding stars") {
    crossFromLandmarks();
    return;
  }
  if (upcoming && upcoming.frame === "The window") {
    crossToWindow();
    return;
  }
  if (upcoming && upcoming.frame === "Thunderstorm") {
    armStorm();
    crossToStorm();
    return;
  }
  if (upcoming && upcoming.world && !step.world) {
    crossToWorld();
    return;
  }
  if (current < FLOW.length) go(current + 1);
}

function back() {
  if (crossing) return;
  if (current > 1) go(current - 1);
}

terminal.addEventListener("click", () => {
  const step = FLOW[current - 1];
  if (step && step.play === "guiding" && !guiding) {
    beginGuiding();
    return;
  }
  if (guiding) return;
  if (step && step.kind === "files" && step.moreText) {
    next();
    return;
  }
  if (finishTyping()) return;
  if (step.kind === "say" || step.kind === "sky") next();
});

nameBox.addEventListener("submit", (event) => {
  event.preventDefault();
  next();
});

document.getElementById("back").addEventListener("click", back);
document.getElementById("next").addEventListener("click", next);
leave.addEventListener("click", next);

/* Keys aimed at the game iframe never reach this window. Constellation
   Run still holds focus when the second award appears, and Spin the World
   still holds it when the third award appears, so ArrowRight never hits
   next(). Park focus here once that plate is actually showing. Playing
   games (ident, align, find) are not these plates, so their arrows stay
   in the frame. */
function seatKioskKeys() {
  const run = () => {
    const step = FLOW[current - 1];
    if (!step || (step.frame !== "Second award" && step.frame !== "Third award")) return;
    if (document.activeElement === nameInput) return;
    try {
      const inner = slot.contentDocument && slot.contentDocument.activeElement;
      if (inner && typeof inner.blur === "function") inner.blur();
    } catch (err) { /* frame already gone */ }
    if (document.activeElement === slot) slot.blur();
    const root = document.getElementById("kiosk");
    if (!root) return;
    if (root.tabIndex < 0) root.tabIndex = -1;
    root.style.outline = "none";
    if (document.activeElement !== root) root.focus({ preventScroll: true });
  };
  run();
  window.requestAnimationFrame(run);
  window.setTimeout(run, 0);
  window.setTimeout(run, 60);
  slot.addEventListener("load", run, { once: true });
}

function gameOwnsArrows() {
  const step = FLOW[current - 1];
  return !!(step && (step.kind === "ident" || step.kind === "align" || step.kind === "find") && !slot.hidden);
}

/* A key whose target is the game frame belongs to that game. The kiosk
   only hears it when focus never entered the frame (the critique bar).
   Hand it through so ArrowRight still steers constellation-run, /orient,
   and /find, and do not treat it as Next. */
function forwardSlotKey(event) {
  if (event.target !== slot || !gameOwnsArrows()) return false;
  try {
    const view = slot.contentWindow;
    if (view) {
      view.dispatchEvent(new view.KeyboardEvent(event.type, {
        key: event.key,
        code: event.code,
        bubbles: true,
        cancelable: true,
      }));
    }
  } catch (err) { /* frame already gone */ }
  return true;
}

window.addEventListener("keydown", (event) => {
  if (event.target === nameInput) return;
  if (forwardSlotKey(event)) return;
  if (event.key === "ArrowRight") next();
  if (event.key === "ArrowLeft") back();
});

window.addEventListener("keyup", (event) => {
  forwardSlotKey(event);
});

/* The run already held the hit or miss. Fade that surface off and let
   the second award show through. The line waits until the game is gone
   so the speech stays solid. Reduced motion cuts. */
function leaveIdent() {
  if (crossing) return;
  const step = FLOW[current - 1];
  if (!step || step.kind !== "ident") return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    next();
    return;
  }
  crossing = true;
  slot.style.zIndex = "8";
  slot.style.pointerEvents = "none";
  slot.style.transition = "none";
  slot.style.opacity = "1";
  go(current + 1, false, true);
  slot.hidden = false;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      slot.style.transition = "opacity 1.15s ease";
      slot.style.opacity = "0";
    });
  });
  window.setTimeout(() => {
    if (!crossing) return;
    slot.hidden = true;
    slot.style.transition = "none";
    slot.style.opacity = "";
    slot.style.zIndex = "";
    slot.style.pointerEvents = "";
    slot.style.touchAction = "";
    if (slot.getAttribute("src")) slot.removeAttribute("src");
    crossing = false;
    const now = FLOW[current - 1];
    if (now && now.text && now.kind !== "print") typeLine(now.text);
    seatKioskKeys();
  }, 1200);
}

/* The window clip starts turning after the pinch. That sentence types
   into the same bubble, with no glyph fade. When the turn
   finishes, the align game opens on this screen. */
function showWindowTilt() {
  const step = FLOW[current - 1];
  if (!step || step.frame !== "The window" || windowTilted || !step.tiltText) return;
  windowTilted = true;
  typeLine(step.tiltText);
}

function revealAlign() {
  const step = FLOW[current - 1];
  if (!step || step.frame !== "The window") return;
  go(atFrame("Game 2 — Spin the World"));
}

window.addEventListener("message", (event) => {
  if (event.origin !== location.origin) return;
  const data = event.data || {};
  if (data.source === "morehead-transition") {
    const step = FLOW[current - 1];
    if (!step || step.frame !== "The window") return;
    if (data.spinning) showWindowTilt();
    if (data.done) revealAlign();
    return;
  }
  if (data.source === "morehead-game") {
    if (data.game === "align") state.alignMarks = data.marks;
    if (data.game === "find") state.findMarks = data.marks;
    if (data.game === "ident" && Array.isArray(data.marks)) state.constellationMarks = data.marks;
    const step = FLOW[current - 1];
    const played = data.game === "guiding"
      ? step && (step.play === "guiding" || step.plate === "landmarks")
      : step && step.kind === data.game;
    if (played) {
      if (data.game === "ident") {
        leaveIdent();
        return;
      }
      window.setTimeout(() => {
        const now = FLOW[current - 1];
        const still = data.game === "guiding"
          ? now && (now.play === "guiding" || now.plate === "landmarks")
          : now && now.kind === data.game;
        if (still) next();
      }, 1600);
    }
  }
});

badgeReady = window.MissionBadge
  ? window.MissionBadge.mount(document.getElementById("badge"), { frame: document.getElementById("kiosk") })
  : Promise.resolve();
badgeReady.then((mounted) => {
  badge = mounted;
  if (new URLSearchParams(location.search).has("export")) window.badge = mounted;
}).catch(() => {});

const params = new URLSearchParams(location.search);
const at = Number(params.get("at"));
loadTextTick();
go(Number.isFinite(at) && at >= 1 && at <= FLOW.length ? at : 1);

/* The align and find bed. One player for the whole kiosk, so the games
   do not start a second copy. A seek just before the end skips the
   YouTube end card and keeps the loop even. */
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
        if (event.data === YT.PlayerState.ENDED) event.target.seekTo(0, true);
      },
    },
  });
};

function loadKioskBed() {
  if (document.getElementById("youtube-api")) return;
  const script = document.createElement("script");
  script.id = "youtube-api";
  script.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(script);
}

function startKioskBed() {
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

function loopKioskBed() {
  if (!bedReady || !bed || typeof bed.getDuration !== "function") return;
  let duration = 0;
  let time = 0;
  try {
    duration = bed.getDuration();
    time = bed.getCurrentTime();
  } catch (err) {
    return;
  }
  if (duration > 2 && time > 1 && duration - time < 0.35) bed.seekTo(0, true);
}

window.addEventListener("pointerdown", () => { startKioskBed(); textAudio(); loadTextTick(); }, true);
window.addEventListener("keydown", () => { startKioskBed(); textAudio(); loadTextTick(); }, true);
loadTextTick();
loadKioskBed();
window.setInterval(loopKioskBed, 200);
