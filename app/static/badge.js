const ICONS = {
  mission: ["apollobadge.svg", "skylabbadge.svg", "mercurybadge.svg", "geminibadge.svg"],
  constellation: ["casseopiabadge.svg", "aquilabadge.svg", "canusmajorbadge.svg", "scorpiusbadge.svg", "ursamajorbadge.svg"],
  align: ["cookiebadge.svg"],
};
const LOCAL = {
  mission: { cx: 152.63, cy: 178.02, r: 47.33 },
  constellation: { cx: 466.31, cy: 178.11, r: 47.33 },
  align: { cx: 305.43, cy: 495.85, r: 47.33 },
};
const LOCK = { tx: -7.584, ty: -10.261, s: 1.032 };
const ARCS = {
  top: { cx: 307.84, cy: 329.91, r: 146.45, size: 21.86, cls: "cls-2", mid: -92.66, dir: 1, rot: 93 },
  bottom: { cx: 303.25, cy: 280.28, r: 161.47, size: 24, cls: "cls-1", mid: 92.58, dir: -1, rot: -93 },
};
const LINES = ["top", "bottom"];
const FILLED = ["mission", "constellation", "align"];
const NS = "http://www.w3.org/2000/svg";
const XLINK = "http://www.w3.org/1999/xlink";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const state = {
  top: "MASTER STAR NAVIGATOR",
  bottom: "RUSTY SCHWEICKART",
  mission: "apollobadge.svg",
  constellation: "casseopiabadge.svg",
  align: "cookiebadge.svg",
};
const shown = { top: false, bottom: false };
const letters = { top: [], bottom: [] };
const iconText = new Map();
const dirty = new Set();
let playing = false;
let textDirty = false;
let master = null;

const stack = document.getElementById("stack");
const cloth = document.getElementById("cloth");
const needle = document.getElementById("needle");
const probe = document.getElementById("name-probe");

function toRoot(x, y) {
  return { x: x * LOCK.s + LOCK.tx, y: y * LOCK.s + LOCK.ty };
}

function rootCircle(slot) {
  const local = LOCAL[slot];
  const point = toRoot(local.cx, local.cy);
  return { cx: point.x, cy: point.y, r: local.r * LOCK.s };
}

function placeSlots() {
  for (const slot of FILLED) {
    const ring = rootCircle(slot);
    const el = document.querySelector(`.piece-slot[data-slot="${slot}"]`);
    const size = ((2 * ring.r * (282.9 + 11)) / 282.9 / 612) * 100;
    el.style.left = `${(ring.cx / 612) * 100}%`;
    el.style.top = `${(ring.cy / 612) * 100}%`;
    el.style.width = `${size}%`;
    el.style.height = `${size}%`;
  }
}

function approach(slot) {
  const el = document.querySelector(`.piece-slot[data-slot="${slot}"]`);
  const travel = (el.getBoundingClientRect().width || 88) * 0.62;
  if (slot === "mission") return { x: -travel, y: -travel * 0.7, rotation: -12 };
  if (slot === "constellation") return { x: travel, y: -travel * 0.7, rotation: 12 };
  return { x: 0, y: travel, rotation: 0 };
}

function hideNeedle() {
  needle.style.opacity = "0";
}

function moveNeedle(x, y, deg) {
  needle.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg.toFixed(2)})`);
  needle.style.opacity = "1";
}

function measureGlyph(ch, size) {
  probe.setAttribute("font-size", String(size));
  probe.textContent = ch === " " ? "\u00a0" : ch;
  return Math.max(probe.getComputedTextLength(), size * 0.28);
}

function writeArcs(mode) {
  const layer = cloth.querySelector("#Layer_8");
  if (!layer) return;
  layer.querySelectorAll("text").forEach((node) => node.remove());
  const deg = 180 / Math.PI;
  for (const which of LINES) {
    const arc = ARCS[which];
    const chars = [...state[which].toUpperCase()];
    const widths = chars.map((ch) => measureGlyph(ch, arc.size));
    const total = widths.reduce((sum, width) => sum + width, 0);
    let ang = arc.mid - arc.dir * ((total / 2) / arc.r) * deg;
    const show = mode === "shown" || (mode === "keep" && shown[which]);
    letters[which] = chars.map((ch, index) => {
      const rad = (ang * Math.PI) / 180;
      const x = arc.cx + arc.r * Math.cos(rad);
      const y = arc.cy + arc.r * Math.sin(rad);
      const text = document.createElementNS(NS, "text");
      text.setAttribute("class", arc.cls);
      text.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(ang + arc.rot).toFixed(2)})`);
      const span = document.createElementNS(NS, "tspan");
      span.setAttribute("x", "0");
      span.setAttribute("y", "0");
      span.textContent = ch;
      text.appendChild(span);
      text.style.opacity = show ? "1" : "0";
      layer.appendChild(text);
      const letter = { ch, ang, width: widths[index], el: text };
      ang += arc.dir * (widths[index] / arc.r) * deg;
      return letter;
    });
  }
}

function pointImage(image) {
  const href = image.getAttribute("href") || image.getAttributeNS(XLINK, "href") || "";
  const file = href.split("/").pop();
  if (!file || file.startsWith("data:")) return;
  const url = `/badge/${file}`;
  image.setAttribute("href", url);
  image.setAttributeNS(XLINK, "href", url);
}

function isolate(doc, prefix) {
  const src = doc.documentElement;
  const map = new Map();
  for (const el of src.querySelectorAll("[id]")) {
    const next = `${prefix}-${el.id}`;
    map.set(el.id, next);
    el.id = next;
  }
  for (const el of src.querySelectorAll("[class]")) {
    el.setAttribute(
      "class",
      el.getAttribute("class").split(/\s+/).filter(Boolean).map((name) => (
        name.startsWith("cls-") ? `${prefix}-${name}` : name
      )).join(" "),
    );
  }
  const retarget = (value) => value.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${map.get(id) || `${prefix}-${id}`})`);
  const style = src.querySelector("style");
  if (style) style.textContent = retarget(style.textContent.replace(/\.cls-/g, `.${prefix}-cls-`));
  for (const el of [src, ...src.querySelectorAll("*")]) {
    for (const attr of [...el.attributes]) {
      if (attr.value.includes("url(#")) attr.value = retarget(attr.value);
    }
  }
  return src;
}

function mountIcon(slot) {
  const svg = document.querySelector(`.piece-slot[data-slot="${slot}"] svg`);
  const file = state[slot];
  const doc = new DOMParser().parseFromString(iconText.get(file), "image/svg+xml");
  const src = isolate(doc, `${slot}-${file.replace(/\W/g, "")}`);
  svg.replaceChildren(...[...src.children].map((node) => document.importNode(node, true)));
}

function clipOf(slot) {
  return document.querySelector(`.piece-slot[data-slot="${slot}"] .piece-clip`);
}

function blankOf(slot) {
  return cloth.querySelector(`[data-slot="${slot}"]`);
}

async function loadCloth() {
  const text = await fetch("/badge/finalbadgeexample.svg").then((response) => response.text());
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const src = doc.documentElement;
  cloth.replaceChildren(...[...src.children].map((node) => document.importNode(node, true)));
  for (const image of cloth.querySelectorAll("image")) pointImage(image);
  cloth.querySelectorAll("#Layer_8 text").forEach((node) => node.remove());
}

function preload() {
  const files = FILLED.flatMap((slot) => ICONS[slot]);
  return Promise.all(files.map(async (file) => {
    iconText.set(file, await fetch(`/badge/icons/${file}`).then((response) => response.text()));
  }));
}

function resetBoard() {
  master?.kill();
  playing = false;
  gsap.set(stack, { autoAlpha: 0, y: 36, scale: 0.9, rotation: -6 });
  for (const slot of FILLED) {
    const clip = clipOf(slot);
    clip.querySelector("svg").replaceChildren();
    gsap.set(clip, { opacity: 0, scale: 1, x: 0, y: 0, rotation: 0 });
    const blank = blankOf(slot);
    if (blank) blank.style.display = "";
  }
  shown.top = false;
  shown.bottom = false;
  writeArcs("hidden");
  hideNeedle();
}

function sewLine(which) {
  const tl = gsap.timeline();
  const arc = ARCS[which];
  const line = letters[which];
  tl.call(() => {
    shown[which] = false;
    for (const letter of line) letter.el.style.opacity = "0";
  });
  if (!line.length) return tl;
  line.forEach((letter) => {
    const space = letter.ch === " ";
    tl.call(() => {
      const rad = (letter.ang * Math.PI) / 180;
      const root = toRoot(arc.cx + arc.r * Math.cos(rad), arc.cy + arc.r * Math.sin(rad));
      moveNeedle(root.x, root.y, letter.ang + 90 * arc.dir);
      if (!space) letter.el.style.opacity = "1";
    });
    tl.to({}, { duration: space ? 0.04 : 0.072 });
  });
  tl.call(() => {
    shown[which] = lineHasText(which);
    hideNeedle();
  });
  return tl;
}

function lineHasText(which) {
  return Boolean(state[which].trim());
}

function seatSlot(slot) {
  const tl = gsap.timeline();
  const clip = clipOf(slot);
  tl.call(() => {
    dirty.delete(slot);
    mountIcon(slot);
    const blank = blankOf(slot);
    if (blank) blank.style.display = "";
    const from = approach(slot);
    gsap.set(clip, {
      opacity: 0,
      scale: 1.16,
      x: from.x,
      y: from.y,
      rotation: from.rotation,
    });
  });
  tl.to(clip, {
    opacity: 1,
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1.03,
    duration: 0.46,
    ease: "power3.out",
  });
  tl.call(() => {
    const blank = blankOf(slot);
    if (blank) blank.style.display = "none";
  });
  tl.to(clip, { scale: 0.975, duration: 0.07, ease: "power1.in" });
  tl.to(clip, { scale: 1, duration: 0.26, ease: "back.out(2)" });
  return tl;
}

function present() {
  const tl = gsap.timeline();
  tl.to(stack, { scale: 1.045, rotation: -1.6, duration: 0.28, ease: "power2.out" });
  tl.to(stack, { scale: 1, rotation: 0, duration: 0.38, ease: "power3.inOut" });
  return tl;
}

function finishPlaying() {
  playing = false;
  if (textDirty) {
    textDirty = false;
    writeArcs("shown");
    shown.top = lineHasText("top");
    shown.bottom = lineHasText("bottom");
  }
  for (const slot of dirty) restitch(slot);
  dirty.clear();
}

function ceremony() {
  resetBoard();
  playing = true;
  document.getElementById("play").textContent = "Replay the awarding";
  master = gsap.timeline({ onComplete: finishPlaying });
  master.to(stack, { autoAlpha: 1, y: 0, scale: 1, rotation: 0, duration: 0.9, ease: "power3.out" });
  master.add(sewLine("top"), ">-0.05");
  master.add(sewLine("bottom"), ">+0.08");
  master.add(present(), ">+0.12");
  master.add(seatSlot("mission"));
  master.add(present(), ">+0.08");
  master.add(seatSlot("constellation"));
  master.add(present(), ">+0.08");
  master.add(seatSlot("align"));
}

function showFinal() {
  master?.kill();
  playing = false;
  gsap.set(stack, { autoAlpha: 1, y: 0, scale: 1, rotation: 0 });
  shown.top = lineHasText("top");
  shown.bottom = lineHasText("bottom");
  writeArcs("shown");
  for (const slot of FILLED) {
    const clip = clipOf(slot);
    mountIcon(slot);
    const blank = blankOf(slot);
    if (blank) blank.style.display = "none";
    gsap.set(clip, { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 });
  }
  hideNeedle();
  document.getElementById("play").textContent = "Replay the awarding";
}

function restitch(slot) {
  if (playing) {
    dirty.add(slot);
    return;
  }
  master?.kill();
  const clip = clipOf(slot);
  gsap.set(clip, { opacity: 0, scale: 1, x: 0, y: 0, rotation: 0 });
  const blank = blankOf(slot);
  if (blank) blank.style.display = "";
  master = gsap.timeline();
  master.add(seatSlot(slot));
}

function bindChoices() {
  for (const group of FILLED) {
    const root = document.querySelector(`[data-group="${group}"]`);
    root.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || button.getAttribute("aria-pressed") === "true") return;
      state[group] = button.dataset.value;
      for (const el of root.querySelectorAll("button")) {
        el.setAttribute("aria-pressed", el === button ? "true" : "false");
      }
      if (reduce) {
        mountIcon(group);
        return;
      }
      restitch(group);
    });
  }
}

function bindLine(which, id) {
  document.getElementById(id).addEventListener("input", (event) => {
    state[which] = event.target.value;
    if (playing) {
      textDirty = true;
      return;
    }
    if (shown[which] || reduce) {
      writeArcs("keep");
      shown[which] = lineHasText(which);
    }
  });
}

document.getElementById("play").addEventListener("click", () => {
  if (reduce) showFinal();
  else ceremony();
});

document.querySelector(".patch-choices").addEventListener("submit", (event) => {
  event.preventDefault();
});

bindLine("top", "top-text");
bindLine("bottom", "bottom-text");
bindChoices();
hideNeedle();
placeSlots();

Promise.all([
  preload(),
  loadCloth(),
  document.fonts.load("800 24px Orbitron-Black"),
]).then(() => {
  if (reduce) showFinal();
  else ceremony();
});
