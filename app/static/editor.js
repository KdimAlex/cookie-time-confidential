const NS = "http://www.w3.org/2000/svg";
const XLINK = "http://www.w3.org/1999/xlink";
const RING = { x: 306, y: 306 };

const stage = document.getElementById("stage");
const guide = document.getElementById("guide");
const txInput = document.getElementById("tx");
const tyInput = document.getElementById("ty");
const scaleInput = document.getElementById("scale");

const initial = {
  base: { tx: 0, ty: 0, s: 1, vx: 0, vy: 0, vw: 612, vh: 612 },
  overlay: { tx: 0, ty: 0, s: 1, vx: 0, vy: 0, vw: 612, vh: 612 },
};

const state = {
  selected: "overlay",
  base: { ...initial.base },
  overlay: { ...initial.overlay },
};

function anchor(layer) {
  return { x: layer.vx + layer.vw / 2, y: layer.vy + layer.vh / 2 };
}

function apply(id) {
  const layer = state[id];
  document.getElementById(id).setAttribute(
    "transform",
    `translate(${layer.tx.toFixed(3)} ${layer.ty.toFixed(3)}) scale(${layer.s.toFixed(5)})`,
  );
  if (id !== state.selected) return;
  if (document.activeElement !== txInput) txInput.value = layer.tx.toFixed(1);
  if (document.activeElement !== tyInput) tyInput.value = layer.ty.toFixed(1);
  if (document.activeElement !== scaleInput) scaleInput.value = layer.s.toFixed(3);
}

function select(id) {
  state.selected = id;
  for (const button of document.querySelectorAll("[data-layer]")) {
    button.setAttribute("aria-pressed", String(button.dataset.layer === id));
  }
  apply(id);
}

function svgPoint(event) {
  const point = stage.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(stage.getScreenCTM().inverse());
}

async function mount(id, url) {
  const text = await fetch(url).then((response) => response.text());
  adopt(id, text);
}

function adopt(id, text) {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  if (doc.querySelector("parsererror")) return false;
  const src = doc.documentElement;
  const box = src.viewBox && src.viewBox.baseVal;
  const group = document.getElementById(id);
  group.replaceChildren();
  for (const child of src.children) {
    if (child.localName === "script") continue;
    group.appendChild(document.importNode(child, true));
  }
  const layer = state[id];
  if (box && box.width && box.height) {
    const x0 = layer.tx + layer.vx * layer.s;
    const y0 = layer.ty + layer.vy * layer.s;
    const x1 = layer.tx + (layer.vx + layer.vw) * layer.s;
    const y1 = layer.ty + (layer.vy + layer.vh) * layer.s;
    const scale = Math.min((x1 - x0) / box.width, (y1 - y0) / box.height);
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    layer.vx = box.x;
    layer.vy = box.y;
    layer.vw = box.width;
    layer.vh = box.height;
    layer.s = scale;
    layer.tx = cx - (box.x + box.width / 2) * scale;
    layer.ty = cy - (box.y + box.height / 2) * scale;
  }
  apply(id);
  return true;
}

let drag = null;

stage.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  const hit = event.target.closest("#base, #overlay");
  if (hit) select(hit.id);
  const point = svgPoint(event);
  const layer = state[state.selected];
  drag = { id: state.selected, x: point.x, y: point.y, tx: layer.tx, ty: layer.ty };
  stage.setPointerCapture(event.pointerId);
});

stage.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const point = svgPoint(event);
  const layer = state[drag.id];
  layer.tx = drag.tx + (point.x - drag.x);
  layer.ty = drag.ty + (point.y - drag.y);
  apply(drag.id);
});

stage.addEventListener("pointerup", () => {
  drag = null;
});
stage.addEventListener("pointercancel", () => {
  drag = null;
});

stage.addEventListener("wheel", (event) => {
  event.preventDefault();
  const layer = state[state.selected];
  const mark = anchor(layer);
  const cx = layer.tx + mark.x * layer.s;
  const cy = layer.ty + mark.y * layer.s;
  layer.s = Math.min(30, Math.max(0.05, layer.s * Math.exp(-event.deltaY * 0.0015)));
  layer.tx = cx - mark.x * layer.s;
  layer.ty = cy - mark.y * layer.s;
  apply(state.selected);
}, { passive: false });

stage.addEventListener("dragover", (event) => {
  event.preventDefault();
});
stage.addEventListener("drop", (event) => {
  event.preventDefault();
  const file = [...event.dataTransfer.files].find((item) => /svg/i.test(item.type) || item.name.toLowerCase().endsWith(".svg"));
  if (file) readReplace(file);
});

for (const button of document.querySelectorAll("[data-layer]")) {
  button.addEventListener("click", () => select(button.dataset.layer));
}

function readNumber(input, fallback) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

txInput.addEventListener("input", () => {
  state[state.selected].tx = readNumber(txInput, state[state.selected].tx);
  apply(state.selected);
});
tyInput.addEventListener("input", () => {
  state[state.selected].ty = readNumber(tyInput, state[state.selected].ty);
  apply(state.selected);
});
scaleInput.addEventListener("input", () => {
  const layer = state[state.selected];
  const next = readNumber(scaleInput, layer.s);
  const mark = anchor(layer);
  const cx = layer.tx + mark.x * layer.s;
  const cy = layer.ty + mark.y * layer.s;
  layer.s = Math.min(30, Math.max(0.05, next));
  layer.tx = cx - mark.x * layer.s;
  layer.ty = cy - mark.y * layer.s;
  apply(state.selected);
});

document.getElementById("show-guide").addEventListener("change", (event) => {
  guide.style.display = event.target.checked ? "" : "none";
});

document.getElementById("center").addEventListener("click", () => {
  const layer = state[state.selected];
  const mark = anchor(layer);
  layer.tx = RING.x - mark.x * layer.s;
  layer.ty = RING.y - mark.y * layer.s;
  apply(state.selected);
});

document.getElementById("reset").addEventListener("click", () => {
  Object.assign(state.base, initial.base);
  Object.assign(state.overlay, initial.overlay);
  loadExact();
});

document.getElementById("replace").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (file) readReplace(file);
  event.target.value = "";
});

function readReplace(file) {
  const reader = new FileReader();
  reader.onload = () => {
    adopt(state.selected, String(reader.result));
  };
  reader.readAsText(file);
}

document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea")) return;
  const step = event.shiftKey ? 10 : 1;
  const layer = state[state.selected];
  if (event.key === "ArrowLeft") layer.tx -= step;
  else if (event.key === "ArrowRight") layer.tx += step;
  else if (event.key === "ArrowUp") layer.ty -= step;
  else if (event.key === "ArrowDown") layer.ty += step;
  else return;
  event.preventDefault();
  apply(state.selected);
});

document.getElementById("download").addEventListener("click", () => {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("xmlns", NS);
  svg.setAttribute("xmlns:xlink", XLINK);
  svg.setAttribute("viewBox", stage.getAttribute("viewBox"));
  const defs = stage.querySelector("defs");
  if (defs) svg.appendChild(defs.cloneNode(true));
  for (const id of ["base", "overlay"]) {
    const group = document.getElementById(id).cloneNode(true);
    group.removeAttribute("id");
    svg.appendChild(group);
  }
  for (const image of svg.querySelectorAll("image")) {
    const href = image.getAttribute("href") || image.getAttributeNS(XLINK, "href") || "";
    const file = href.split("/").pop();
    if (!file) continue;
    image.setAttribute("href", file);
    image.setAttributeNS(XLINK, "href", file);
  }
  const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "badge.svg";
  link.click();
  URL.revokeObjectURL(link.href);
});

function pointImage(image) {
  const href = image.getAttribute("href") || image.getAttributeNS(XLINK, "href") || "";
  const file = href.split("/").pop();
  if (!file || file.endsWith(".svg")) return;
  const url = `/badge/${file}`;
  image.setAttribute("href", url);
  image.setAttributeNS(XLINK, "href", url);
  image.addEventListener("error", () => {
    image.remove();
  });
}

const SLOTS = {
  mission: { cx: 152.63, cy: 178.02, r: 47.33 },
  constellation: { cx: 466.31, cy: 178.11, r: 47.33 },
  align: { cx: 305.43, cy: 495.85, r: 47.33 },
};
const ICON_CIRCLE = { cx: 305.12, cy: 289.88, r: 141.45 };
const ARCS = {
  top: { cx: 307.84, cy: 329.91, r: 146.45, size: 21.86, cls: "cls-2", mid: -92.66, dir: 1, rot: 93 },
  bottom: { cx: 303.25, cy: 280.28, r: 161.47, size: 24, cls: "cls-1", mid: 92.58, dir: -1, rot: -93 },
};
const measureCanvas = document.createElement("canvas").getContext("2d");

function measureGlyph(ch, size) {
  measureCanvas.font = `800 ${size}px Orbitron-Black, Orbitron`;
  return Math.max(measureCanvas.measureText(ch).width, size * 0.28);
}

function writeArcs() {
  const layer = document.getElementById("Layer_8");
  if (!layer) return;
  layer.querySelectorAll("text").forEach((node) => node.remove());
  const lines = [
    ["top", document.getElementById("top-text").value],
    ["bottom", document.getElementById("bottom-text").value],
  ];
  for (const [which, raw] of lines) {
    const arc = ARCS[which];
    const letters = [...raw.toUpperCase()];
    const widths = letters.map((ch) => measureGlyph(ch, arc.size));
    const total = widths.reduce((sum, width) => sum + width, 0);
    const deg = 180 / Math.PI;
    let ang = arc.mid - arc.dir * ((total / 2) / arc.r) * deg;
    letters.forEach((ch, index) => {
      const rad = (ang * Math.PI) / 180;
      const text = document.createElementNS(NS, "text");
      text.setAttribute("class", arc.cls);
      text.setAttribute(
        "transform",
        `translate(${(arc.cx + arc.r * Math.cos(rad)).toFixed(2)} ${(arc.cy + arc.r * Math.sin(rad)).toFixed(2)}) rotate(${(ang + arc.rot).toFixed(2)})`,
      );
      const span = document.createElementNS(NS, "tspan");
      span.setAttribute("x", "0");
      span.setAttribute("y", "0");
      span.textContent = ch;
      text.appendChild(span);
      layer.appendChild(text);
      ang += arc.dir * (widths[index] / arc.r) * deg;
    });
  }
}

function isolateIcon(doc, prefix) {
  const src = doc.documentElement;
  const ids = [...src.querySelectorAll("[id]")];
  const map = new Map();
  for (const el of ids) {
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

async function setSlot(slot, file) {
  const layer = document.getElementById("Layer_3");
  if (!layer) return;
  let holder = layer.querySelector(`[data-icon-slot="${slot}"]`);
  if (!holder) {
    holder = document.createElementNS(NS, "g");
    holder.setAttribute("data-icon-slot", slot);
    layer.appendChild(holder);
  }
  holder.replaceChildren();
  const blank = layer.querySelector(`[data-slot="${slot}"]`);
  if (!file) {
    if (blank) blank.style.display = "";
    return;
  }
  const text = await fetch(`/badge/icons/${file}`).then((response) => response.text());
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  if (doc.querySelector("parsererror")) return;
  const src = isolateIcon(doc, `${slot}-${file.replace(/\W/g, "")}`);
  const scale = SLOTS[slot].r / ICON_CIRCLE.r;
  const tx = SLOTS[slot].cx - ICON_CIRCLE.cx * scale;
  const ty = SLOTS[slot].cy - ICON_CIRCLE.cy * scale;
  holder.setAttribute("transform", `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${scale.toFixed(6)})`);
  for (const child of src.children) holder.appendChild(document.importNode(child, true));
  if (blank) blank.style.display = "none";
}

for (const field of document.querySelectorAll("fieldset[data-slot]")) {
  field.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-icon]");
    if (!button) return;
    for (const other of field.querySelectorAll("button")) other.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-pressed", "true");
    setSlot(field.dataset.slot, button.dataset.icon);
  });
}

document.getElementById("top-text").addEventListener("input", writeArcs);
document.getElementById("bottom-text").addEventListener("input", writeArcs);

async function loadExact() {
  const text = await fetch("/badge/finalbadgeexample.svg").then((response) => response.text());
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const src = doc.documentElement;
  stage.querySelector("defs")?.remove();
  const defs = src.querySelector("defs");
  if (defs) stage.insertBefore(document.importNode(defs, true), stage.firstChild);
  const base = document.getElementById("base");
  const overlay = document.getElementById("overlay");
  base.replaceChildren();
  overlay.replaceChildren();
  for (const child of src.children) {
    if (child.localName === "defs") continue;
    const dest = child.id === "Layer_1" ? base : overlay;
    dest.appendChild(document.importNode(child, true));
  }
  for (const image of stage.querySelectorAll("image")) pointImage(image);
  apply("base");
  apply("overlay");
  await document.fonts.load("800 24px Orbitron-Black");
  writeArcs();
}

document.getElementById("reset").addEventListener("click", () => {
  document.getElementById("top-text").value = "MASTER STAR NAVIGATOR";
  document.getElementById("bottom-text").value = "RUSTY SCHWEICKART";
  for (const button of document.querySelectorAll("fieldset[data-slot] button")) {
    button.setAttribute("aria-pressed", button.dataset.icon ? "false" : "true");
  }
}, { capture: true });

select("overlay");
loadExact();
