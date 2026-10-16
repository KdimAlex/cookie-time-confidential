const MISSIONS = {
  faith7: { label: "Faith 7", color: "#DB362D" },
  apollo12: { label: "Apollo 12", color: "#123A7A" },
  apollo13: { label: "Apollo 13", color: "#C4A35A" },
};

const CREW = {
  duke: "Duke",
  haise: "Haise",
  cooper: "Cooper",
};

const WAYS = {
  star: "Name the star",
  angle: "Hold the angle",
  line: "Day-night line",
};

const RIGS = {
  mercury: "Mercury",
  gemini: "Gemini",
  apollo: "Apollo",
};

const ROLES = ["Navigator", "Commander", "Pilot", "Engineer"];

const SCORES = {
  duke: { Navigator: 1, Commander: 2 },
  haise: { Engineer: 2, Commander: 1 },
  cooper: { Pilot: 2, Navigator: 1 },
  star: { Navigator: 2 },
  angle: { Pilot: 2, Navigator: 1 },
  line: { Commander: 2, Navigator: 1 },
  mercury: { Pilot: 1, Engineer: 1 },
  gemini: { Engineer: 2 },
  apollo: { Engineer: 2, Navigator: 1 },
  faith7: { Pilot: 2, Navigator: 1 },
  apollo12: { Navigator: 2, Pilot: 1 },
  apollo13: { Commander: 2, Navigator: 1, Engineer: 1 },
};

const stroke = 'fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';

const ICONS = {
  duke: `<polygon points="32,10 54,52 10,52" ${stroke}/>`,
  haise: `<circle cx="32" cy="26" r="14" ${stroke}/><line x1="32" y1="40" x2="32" y2="52" ${stroke}/><line x1="20" y1="52" x2="44" y2="52" ${stroke}/>`,
  cooper: `<path d="M18 42 Q18 14 32 14 Q46 14 46 42 L46 50 L18 50 Z" ${stroke}/>`,
  star: `<polygon points="32,6 38.5,24 58,24 42.5,36 48,54 32,44 16,54 21.5,36 6,24 25.5,24" fill="#fff"/>`,
  angle: `<polyline points="8,48 32,14 56,48" ${stroke}/>`,
  line: `<circle cx="32" cy="32" r="18" ${stroke}/><line x1="32" y1="14" x2="32" y2="50" ${stroke}/>`,
  mercury: `<rect x="12" y="28" width="40" height="16" rx="2" ${stroke}/><path d="M22 28 Q32 12 42 28" ${stroke}/>`,
  gemini: `<rect x="8" y="20" width="48" height="14" ${stroke}/><circle cx="22" cy="46" r="7" ${stroke}/><circle cx="42" cy="46" r="7" ${stroke}/>`,
  apollo: `<rect x="10" y="26" width="44" height="20" ${stroke}/><circle cx="32" cy="36" r="6" ${stroke}/><circle cx="18" cy="16" r="3.5" fill="#fff"/><circle cx="32" cy="16" r="3.5" fill="#fff"/><circle cx="46" cy="16" r="3.5" fill="#fff"/>`,
  Pilot: `<line x1="6" y1="34" x2="58" y2="34" ${stroke}/><polyline points="18,26 32,12 46,26" ${stroke}/>`,
  Navigator: `<circle cx="32" cy="32" r="14" ${stroke}/><line x1="32" y1="8" x2="32" y2="56" ${stroke}/><line x1="8" y1="32" x2="56" y2="32" ${stroke}/>`,
  Engineer: `<rect x="16" y="16" width="32" height="32" ${stroke}/><line x1="16" y1="48" x2="48" y2="16" ${stroke}/>`,
  Commander: `<polygon points="32,8 56,32 32,56 8,32" ${stroke}/>`,
};

function specialist(picks) {
  const keys = picks.filter((key) => SCORES[key]);
  if (!keys.length) return "";
  const scores = { Navigator: 0, Commander: 0, Pilot: 0, Engineer: 0 };
  for (const key of keys) {
    const row = SCORES[key];
    for (const role of ROLES) scores[role] += row[role] || 0;
  }
  const top = Math.max(...ROLES.map((role) => scores[role]));
  return ROLES.find((role) => scores[role] === top);
}

function slot(id, cx, cy) {
  if (!id || !ICONS[id]) return "";
  return `<g transform="translate(${cx - 32} ${cy - 32})">${ICONS[id]}</g>`;
}

function ringText(name, role) {
  const typed = (name || "").trim();
  return (typed || role || "").toUpperCase();
}

function bottomArc(cx, cy, r, spanDeg) {
  const half = (spanDeg * Math.PI) / 360;
  const mid = Math.PI / 2;
  const x0 = cx + r * Math.cos(mid + half);
  const y0 = cy + r * Math.sin(mid + half);
  const x1 = cx + r * Math.cos(mid - half);
  const y1 = cy + r * Math.sin(mid - half);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 0 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

let ringSerial = 0;

function ringLabel(text) {
  const span = Math.min(108, Math.max(68, 52 + text.length * 3.2));
  let size = 18;
  let radius = 208 + size * 0.36;
  let arc = radius * span * (Math.PI / 180);
  while (size * 0.62 * text.length > arc * 0.92 && size > 12) {
    size -= 0.5;
    radius = 208 + size * 0.36;
    arc = radius * span * (Math.PI / 180);
  }
  const id = `ring-text-${ringSerial++}`;
  return `<defs><path id="${id}" fill="none" d="${bottomArc(280, 280, Number(radius.toFixed(2)), span)}"/></defs>
  <text fill="#fff" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${size}" font-weight="500" text-anchor="middle">
    <textPath href="#${id}" startOffset="50%" textLength="${arc.toFixed(1)}" lengthAdjust="spacing">${escapeXml(text)}</textPath>
  </text>`;
}

function patchSvg(state) {
  const role = specialist([state.crew, state.way, state.rig, state.mission]);
  const text = ringText(state.name, role);
  const mission = MISSIONS[state.mission];
  const color = mission ? mission.color : "#2a2c31";
  const stitches = mission
    ? `<circle cx="280" cy="280" r="258" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.35" stroke-dasharray="1.6 3.1"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 560" width="560" height="560">
  <circle cx="280" cy="280" r="270" fill="${color}"/>
  ${stitches}
  <circle cx="280" cy="280" r="228" fill="#0E1C33"/>
  <circle cx="280" cy="280" r="188" fill="#000"/>
  ${slot(state.way, 280, 172)}
  ${slot(state.rig, 388, 280)}
  ${slot(role, 280, 388)}
  ${slot(state.crew, 172, 280)}
  ${text ? ringLabel(text) : ""}
</svg>`;
}

window.Patch = { patchSvg, specialist, MISSIONS, ICONS };

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

if (document.body.classList.contains("patch")) {
const state = {
  crew: "duke",
  way: "star",
  rig: "apollo",
  mission: "apollo12",
  name: "",
};

const mount = document.getElementById("patch");
const nameInput = document.getElementById("name");

function draw() {
  mount.innerHTML = patchSvg(state);
}

function bind(group, key) {
  const root = document.querySelector(`[data-group="${group}"]`);
  root.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state[key] = button.dataset.value;
    for (const el of root.querySelectorAll("button")) {
      el.setAttribute("aria-pressed", el === button ? "true" : "false");
    }
    draw();
  });
}

bind("crew", "crew");
bind("way", "way");
bind("rig", "rig");
bind("mission", "mission");
nameInput.addEventListener("input", () => {
  state.name = nameInput.value;
  draw();
});
draw();
}
