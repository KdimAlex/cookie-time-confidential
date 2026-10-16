/* Mission badge. Mounts one sticker and plays one action at a time.
   Load gsap, then classify.js, then this file. See README.md. */
(function () {
  const MISSIONS = {
    apollo: "apollobadge.svg",
    skylab: "skylabbadge.svg",
    mercury: "mercurybadge.svg",
    gemini: "geminibadge.svg",
  };
  const CONSTELLATIONS = {
    cassiopeia: "casseopiabadge.svg",
    aquila: "aquilabadge.svg",
    "canis-major": "canusmajorbadge.svg",
    scorpius: "scorpiusbadge.svg",
    "ursa-major": "ursamajorbadge.svg",
  };
  const RANKS = { cookie: "cookiebadge.svg" };
  const FILES = {
    mission: MISSIONS,
    constellation: CONSTELLATIONS,
    rank: RANKS,
  };
  const LOCAL = {
    mission: { cx: 152.63, cy: 178.02, r: 47.33 },
    constellation: { cx: 466.31, cy: 178.11, r: 47.33 },
    rank: { cx: 305.43, cy: 495.85, r: 47.33 },
  };
  const LOCK = { tx: -7.584, ty: -10.261, s: 1.032 };
  const ARCS = {
    title: { cx: 307.84, cy: 329.91, r: 146.45, size: 21.86, cls: "cls-2", mid: -92.66, dir: 1, rot: 93 },
    name: { cx: 303.25, cy: 280.28, r: 161.47, size: 24, cls: "cls-1", mid: 92.58, dir: -1, rot: -93 },
  };
  const NS = "http://www.w3.org/2000/svg";
  const XLINK = "http://www.w3.org/1999/xlink";

  function scriptBase() {
    const script = document.querySelector("script[src*='player.js']");
    return script ? new URL("./", script.src) : new URL("./", window.location.href);
  }

  function fileFor(slot, id) {
    if (!id) return "";
    const table = FILES[slot];
    if (table[id]) return table[id];
    if (Object.values(table).includes(id)) return id;
    return "";
  }

  function MissionBadge(stage, options) {
    const base = new URL(options.base || "assets/", scriptBase());
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const iconText = new Map();
    const popUrl = new URL("pop.mp3", base).href;
    const letters = { title: [], name: [] };
    const shown = { title: false, name: false };
    let presented = false;
    let pose = "present";
    let placeTween = null;
    let chain = Promise.resolve();
    let active = null;

    stage.classList.add("badge-stage");
    document.body.appendChild(stage);
    stage.replaceChildren();
    const place = document.createElement("div");
    place.className = "badge-place";
    const root = document.createElement("div");
    root.className = "badge-stack";
    place.appendChild(root);
    stage.appendChild(place);
    root.insertAdjacentHTML("beforeend", `
      <svg class="cloth" viewBox="0 0 612 612" shape-rendering="geometricPrecision" role="img" aria-label="Mission patch"></svg>
      <div class="piece-slot" data-slot="mission"><div class="piece-clip"><svg viewBox="0 0 612 612" shape-rendering="geometricPrecision"></svg></div></div>
      <div class="piece-slot" data-slot="constellation"><div class="piece-clip"><svg viewBox="0 0 612 612" shape-rendering="geometricPrecision"></svg></div></div>
      <div class="piece-slot" data-slot="rank"><div class="piece-clip"><svg viewBox="0 0 612 612" shape-rendering="geometricPrecision"></svg></div></div>
      <svg class="overlay" viewBox="0 0 612 612" aria-hidden="true">
        <text class="name-probe" visibility="hidden" font-family="Orbitron-Black, Orbitron" font-weight="800">A</text>
        <g class="needle">
          <path d="M-16,0 L-3,-3.4 L14,0 L-3,3.4 Z" fill="#F8F9EA" stroke="#10243f" stroke-width="1.2" />
        </g>
      </svg>
    `);

    const cloth = root.querySelector(".cloth");
    const needle = root.querySelector(".needle");
    const probe = root.querySelector(".name-probe");

    function toRoot(x, y) {
      return { x: x * LOCK.s + LOCK.tx, y: y * LOCK.s + LOCK.ty };
    }

    function placeSlots() {
      for (const [slot, local] of Object.entries(LOCAL)) {
        const point = toRoot(local.cx, local.cy);
        const ring = { cx: point.x, cy: point.y, r: local.r * LOCK.s };
        const el = root.querySelector(`.piece-slot[data-slot="${slot}"]`);
        const size = ((2 * ring.r * (282.9 + 11)) / 282.9 / 612) * 100;
        el.style.left = `${(ring.cx / 612) * 100}%`;
        el.style.top = `${(ring.cy / 612) * 100}%`;
        el.style.width = `${size}%`;
        el.style.height = `${size}%`;
      }
    }

    /* Large while an achievement plays, then a small sticker in the top-right
       corner between lessons. The designation beat parks large in the left
       half so a report can sit on the right, then feeds off the bottom. */
    /* The kiosk plate is shorter than the window. Dock inside that frame
       when one is passed; the demo still uses the window. */
    function frameBox() {
      const frame = options && options.frame;
      const node = !frame ? null : typeof frame === "string" ? document.querySelector(frame) : frame;
      if (!node || !node.getBoundingClientRect) return null;
      const box = node.getBoundingClientRect();
      if (box.width < 8 || box.height < 8) return null;
      return box;
    }

    function placeSize(mode) {
      const box = frameBox();
      const vw = box ? box.width : (document.documentElement.clientWidth || window.innerWidth);
      const vh = box ? box.height : (document.documentElement.clientHeight || window.innerHeight);
      if (mode === "dock") return Math.min(vw * 0.1, vh * 0.14);
      return Math.min(vw * 0.35, vh * 0.5);
    }

    function asideLeft(size) {
      const box = frameBox();
      const vw = box ? box.width : (document.documentElement.clientWidth || window.innerWidth);
      const origin = box ? box.left : 0;
      const half = vw / 2;
      let left = origin + (half - size) / 2;
      const minLeft = origin + 16;
      if (left < minLeft || size + 48 > half) left = minLeft;
      return left;
    }

    /* High in the portico, above the speech box, so the meters have the right half. */
    function asideTop(size) {
      const box = frameBox();
      if (!box) return null;
      const terminal = document.getElementById("terminal");
      let floor = box.bottom;
      if (terminal && !terminal.hidden) {
        const term = terminal.getBoundingClientRect();
        if (term.height > 8 && term.top > box.top + size * 0.3) floor = term.top;
      }
      const portico = Math.max(size + 8, floor - box.top);
      let top = box.top + Math.max(14, (portico - size) * 0.14);
      const minTop = box.top + 12;
      const maxTop = box.top + portico - size - 10;
      if (top < minTop) top = minTop;
      if (top > maxTop) top = Math.max(minTop, maxTop);
      return top;
    }

    /* Paint stays at the large size for both poses. Docking used to shrink
       the layout and scale that small painting back up, which rasterized the
       arc type at sticker size and thickened every letter as soon as the
       flight began. The corner pose is the same painting, scaled down. */
    function placeVars(mode) {
      const size = placeSize("present");
      const shared = {
        width: size,
        height: size,
        transformOrigin: "50% 50%",
      };
      if (mode === "dock") {
        const dock = placeSize("dock");
        const inset = (size - dock) / 2;
        const pad = 16;
        const box = frameBox();
        const vw = document.documentElement.clientWidth || window.innerWidth;
        /* Scale is from the center, so the layout box hangs past the disc.
           Shift by that overhang so the painted sticker, not the layout box,
           sits pad pixels inside the plate's top-right corner. */
        const right = box ? vw - box.right + pad - inset : pad - inset;
        const top = box ? box.top + pad - inset : pad - inset;
        return {
          ...shared,
          position: "fixed",
          left: "auto",
          right,
          top,
          x: 0,
          y: 0,
          xPercent: 0,
          yPercent: 0,
          scale: dock / Math.max(size, 1),
        };
      }
      if (mode === "aside") {
        const parked = asideTop(size);
        return {
          ...shared,
          position: "fixed",
          right: "auto",
          left: asideLeft(size),
          top: parked == null ? "50%" : parked,
          x: 0,
          y: 0,
          xPercent: 0,
          yPercent: parked == null ? -50 : 0,
          scale: 1,
        };
      }
      if (mode === "exit") {
        const vh = document.documentElement.clientHeight || window.innerHeight;
        return {
          ...shared,
          position: "fixed",
          right: "auto",
          left: asideLeft(size),
          top: vh + 36,
          x: 0,
          y: 0,
          xPercent: 0,
          yPercent: 0,
          scale: 1,
        };
      }
      return {
        ...shared,
        position: "fixed",
        right: "auto",
        left: "50%",
        top: "50%",
        x: 0,
        y: 0,
        xPercent: -50,
        yPercent: -50,
        scale: 1,
      };
    }

    function movePlace(mode, animate) {
      const next = placeVars(mode);
      pose = mode;
      const travel = {
        present: { duration: 0.85, ease: "power2.inOut" },
        dock: { duration: 1.05, ease: "power2.inOut" },
        aside: { duration: 0.72, ease: "power2.inOut" },
        exit: { duration: 1.15, ease: "power1.in" },
      }[mode] || { duration: 0.85, ease: "power2.inOut" };
      const first = place.getBoundingClientRect();
      if (placeTween) placeTween.kill();
      gsap.set(place, next);
      if (reduce || !animate || !first.width) {
        placeTween = null;
        return gsap.timeline();
      }
      const last = place.getBoundingClientRect();
      const tl = gsap.timeline();
      placeTween = tl;
      const destScale = next.scale;
      tl.fromTo(place, {
        x: (first.left + first.width / 2) - (last.left + last.width / 2),
        y: (first.top + first.height / 2) - (last.top + last.height / 2),
        scale: destScale * (first.width / Math.max(last.width, 1)),
      }, {
        x: 0,
        y: 0,
        scale: destScale,
        duration: travel.duration,
        ease: travel.ease,
      });
      return tl;
    }

    function playPop() {
      const pop = new Audio(popUrl);
      const played = pop.play();
      if (played) played.catch(() => {});
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

    function writeLine(which, text, visible) {
      const layer = cloth.querySelector("#Layer_8");
      if (!layer) return;
      const arc = ARCS[which];
      layer.querySelectorAll(`text.${arc.cls}`).forEach((node) => node.remove());
      const chars = [...String(text || "").toUpperCase()];
      const deg = 180 / Math.PI;
      const widths = chars.map((ch) => measureGlyph(ch, arc.size));
      const total = widths.reduce((sum, width) => sum + width, 0);
      let ang = arc.mid - arc.dir * ((total / 2) / arc.r) * deg;
      letters[which] = chars.map((ch, index) => {
        const rad = (ang * Math.PI) / 180;
        const x = arc.cx + arc.r * Math.cos(rad);
        const y = arc.cy + arc.r * Math.sin(rad);
        const node = document.createElementNS(NS, "text");
        node.setAttribute("class", arc.cls);
        node.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(ang + arc.rot).toFixed(2)})`);
        const span = document.createElementNS(NS, "tspan");
        span.setAttribute("x", "0");
        span.setAttribute("y", "0");
        span.textContent = ch;
        node.appendChild(span);
        node.style.opacity = visible ? "1" : "0";
        layer.appendChild(node);
        const letter = { ch, ang, el: node };
        ang += arc.dir * (widths[index] / arc.r) * deg;
        return letter;
      });
    }

    function pointImage(image) {
      const href = image.getAttribute("href") || image.getAttributeNS(XLINK, "href") || "";
      const file = href.split("/").pop();
      if (!file || file.startsWith("data:")) return;
      const url = new URL(file, base).href;
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

    function clipOf(slot) {
      return root.querySelector(`.piece-slot[data-slot="${slot}"] .piece-clip`);
    }

    function blankOf(slot) {
      const name = slot === "rank" ? "align" : slot;
      return cloth.querySelector(`[data-slot="${name}"]`);
    }

    function mountIcon(slot, file) {
      const svg = root.querySelector(`.piece-slot[data-slot="${slot}"] svg`);
      if (!file || !iconText.has(file)) {
        svg.replaceChildren();
        return;
      }
      const doc = new DOMParser().parseFromString(iconText.get(file), "image/svg+xml");
      const src = isolate(doc, `${slot}-${file.replace(/\W/g, "")}`);
      svg.replaceChildren(...[...src.children].map((node) => document.importNode(node, true)));
    }

    function approach(slot) {
      const el = root.querySelector(`.piece-slot[data-slot="${slot}"]`);
      const travel = (el.getBoundingClientRect().width || 88) * 0.62;
      if (slot === "mission") return { x: -travel, y: -travel * 0.7, rotation: -12 };
      if (slot === "constellation") return { x: travel, y: -travel * 0.7, rotation: 12 };
      return { x: 0, y: travel, rotation: 0 };
    }

    function paintPose(spec) {
      const mode = spec.pose || "dock";
      hideNeedle();
      writeLine("name", spec.name || "", true);
      writeLine("title", spec.title || "", true);
      shown.name = Boolean(spec.name);
      shown.title = Boolean(spec.title);
      for (const slot of Object.keys(LOCAL)) {
        const file = fileFor(slot, spec[slot]);
        const clip = clipOf(slot);
        const blank = blankOf(slot);
        if (file) {
          mountIcon(slot, file);
          if (blank) blank.style.display = "none";
          gsap.set(clip, { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 });
        } else {
          mountIcon(slot, "");
          if (blank) blank.style.display = "";
          gsap.set(clip, { opacity: 0, scale: 1, x: 0, y: 0, rotation: 0 });
        }
      }
      if (mode === "hidden") {
        gsap.set(root, { autoAlpha: 0, y: 0, scale: 1, rotation: 0 });
        presented = false;
        return gsap.timeline();
      }
      presented = true;
      gsap.set(root, { autoAlpha: 1, y: 0, scale: 1, rotation: 0 });
      return movePlace(mode, false);
    }

    function clearPatches() {
      for (const slot of Object.keys(LOCAL)) {
        const clip = clipOf(slot);
        clip.querySelector("svg").replaceChildren();
        gsap.set(clip, { opacity: 0, scale: 1, x: 0, y: 0, rotation: 0 });
        const blank = blankOf(slot);
        if (blank) blank.style.display = "";
      }
    }

    function typeLine(which, text) {
      writeLine(which, text, reduce);
      shown[which] = reduce && Boolean(String(text || "").trim());
      if (reduce || !letters[which].length) {
        hideNeedle();
        return gsap.timeline();
      }
      const arc = ARCS[which];
      const tl = gsap.timeline();
      letters[which].forEach((letter) => {
        const space = letter.ch === " ";
        tl.call(() => {
          const rad = (letter.ang * Math.PI) / 180;
          const point = toRoot(arc.cx + arc.r * Math.cos(rad), arc.cy + arc.r * Math.sin(rad));
          moveNeedle(point.x, point.y, letter.ang + 90 * arc.dir);
          if (!space) letter.el.style.opacity = "1";
        });
        tl.to({}, { duration: space ? 0.04 : 0.072 });
      });
      tl.call(() => {
        shown[which] = Boolean(String(text || "").trim());
        hideNeedle();
      });
      return tl;
    }

    function seat(slot, file) {
      const clip = clipOf(slot);
      const blank = blankOf(slot);
      if (!file) {
        mountIcon(slot, "");
        gsap.set(clip, { opacity: 0, scale: 1, x: 0, y: 0, rotation: 0 });
        if (blank) blank.style.display = "";
        return gsap.timeline();
      }
      if (reduce) {
        mountIcon(slot, file);
        if (blank) blank.style.display = "none";
        gsap.set(clip, { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 });
        playPop();
        return gsap.timeline();
      }
      const tl = gsap.timeline();
      tl.call(() => {
        mountIcon(slot, file);
        if (blank) blank.style.display = "";
        const from = approach(slot);
        gsap.set(clip, { opacity: 0, scale: 1.16, x: from.x, y: from.y, rotation: from.rotation });
      });
      tl.to(clip, { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1.03, duration: 0.46, ease: "power3.out" });
      tl.call(() => {
        if (blank) blank.style.display = "none";
        playPop();
      });
      tl.to(clip, { scale: 0.975, duration: 0.07, ease: "power1.in" });
      tl.to(clip, { scale: 1, duration: 0.26, ease: "back.out(2)" });
      return tl;
    }

    function enqueue(build) {
      const job = chain.then(() => new Promise((resolve) => {
        const tl = build();
        active = tl;
        if (tl && typeof tl.then === "function" && typeof tl.totalDuration !== "function") {
          tl.then(resolve, resolve);
          return;
        }
        if (!tl || !tl.totalDuration || tl.totalDuration() === 0) {
          resolve();
          return;
        }
        tl.eventCallback("onComplete", () => {
          if (placeTween === tl) placeTween = null;
          resolve();
        });
      }));
      chain = job.then(() => undefined, () => undefined);
      return job;
    }

    async function ready() {
      const font = new FontFace("Orbitron-Black", `url(${new URL("font/Orbitron-Black.ttf", scriptBase()).href})`);
      document.fonts.add(font);
      const files = [...Object.values(MISSIONS), ...Object.values(CONSTELLATIONS), ...Object.values(RANKS)];
      await Promise.all([
        font.load(),
        fetch(new URL("finalbadgeexample.svg?v=2", base)).then((response) => response.text()).then((text) => {
          const doc = new DOMParser().parseFromString(text, "image/svg+xml");
          const src = doc.documentElement;
          cloth.replaceChildren(...[...src.children].map((node) => document.importNode(node, true)));
          for (const image of cloth.querySelectorAll("image")) pointImage(image);
          cloth.querySelectorAll("#Layer_8 text").forEach((node) => node.remove());
        }),
        ...files.map(async (file) => {
          iconText.set(file, await fetch(new URL(`icons/${file}?v=2`, base)).then((response) => response.text()));
        }),
        fetch(popUrl),
      ]);
      placeSlots();
      hideNeedle();
      gsap.set(root, { autoAlpha: 0, y: 0, scale: 1, rotation: 0 });
      movePlace("present", false);
      window.addEventListener("resize", () => {
        if (placeTween) return;
        gsap.set(place, placeVars(pose));
      });
    }

    function rest(seconds) {
      return enqueue(() => gsap.timeline().to({}, { duration: reduce ? 0 : seconds }));
    }

    function recall() {
      return enqueue(() => {
        gsap.set(root, { autoAlpha: 1, y: 0, scale: 1, rotation: 0 });
        return movePlace("present", true);
      });
    }

    function dock() {
      return enqueue(() => movePlace("dock", true));
    }

    function receive(slot, id) {
      return recall()
        .then(() => enqueue(() => seat(slot, fileFor(slot, id))))
        .then(() => rest(0.9))
        .then(() => dock());
    }

    const api = {
      missions: Object.keys(MISSIONS),
      constellations: Object.keys(CONSTELLATIONS),
      ranks: Object.keys(RANKS),

      /* Cloth comes in with empty circles and no type. */
      blank() {
        return enqueue(() => {
          if (active) active.kill();
          clearPatches();
          shown.title = false;
          shown.name = false;
          writeLine("title", "", false);
          writeLine("name", "", false);
          hideNeedle();
          if (reduce) {
            movePlace("present", false);
            gsap.set(root, { autoAlpha: 1, y: 0, scale: 1, rotation: 0 });
            return gsap.timeline();
          }
          const first = !presented;
          presented = true;
          if (first) {
            movePlace("present", false);
            const top = root.getBoundingClientRect().top;
            const travel = Math.max(window.innerHeight - top + 36, root.offsetHeight || 320);
            gsap.set(root, { autoAlpha: 1, y: travel, scale: 1, rotation: 0 });
            return gsap.timeline().to(root, {
              y: 0, duration: 0.92, ease: "power3.out",
            });
          }
          if (pose === "dock") {
            gsap.set(root, { autoAlpha: 1, y: 0, scale: 1, rotation: 0 });
            return movePlace("present", true);
          }
          gsap.set(root, { autoAlpha: 0, y: 28, scale: 0.94, rotation: -4 });
          return gsap.timeline().to(root, {
            autoAlpha: 1, y: 0, scale: 1, rotation: 0, duration: 0.7, ease: "power3.out",
          });
        });
      },

      /* Bottom arc, one letter at a time. */
      name(text) {
        return enqueue(() => typeLine("name", text));
      },

      /* Top arc, one letter at a time. Pass the title from classify(). */
      title(text) {
        return enqueue(() => typeLine("title", text));
      },

      /* Upper left. id: apollo, skylab, mercury, gemini. */
      mission(id) {
        return enqueue(() => seat("mission", fileFor("mission", id)));
      },

      /* Upper right. id: cassiopeia, aquila, canis-major, scorpius, ursa-major. */
      constellation(id) {
        return enqueue(() => seat("constellation", fileFor("constellation", id)));
      },

      /* Bottom circle. id from classify().rank. Null clears it. */
      rank(id) {
        return enqueue(() => seat("rank", fileFor("rank", id)));
      },

      /* After the award is readable, park the sticker at the top right. */
      settle() {
        return rest(0.9).then(() => dock());
      },

      /* Bring the parked sticker back to center. The kiosk plays this as its
         own section, then seats a pin, and parks on the following screen. */
      present() {
        return recall();
      },

      /* Drop whatever is in flight and paint one resting pose. Jumping to a
         screen holds that screen's section instead of replaying earlier beats. */
      hold(spec) {
        const poseSpec = spec || {};
        if (active) {
          active.eventCallback("onComplete", null);
          active.kill();
        }
        if (placeTween) {
          placeTween.eventCallback("onComplete", null);
          placeTween.kill();
        }
        active = null;
        placeTween = null;
        chain = Promise.resolve();
        return enqueue(() => paintPose(poseSpec));
      },

      /* 1. Blank cloth rises, the name is typed, the sticker parks. */
      appear(text) {
        return enqueue(() => {
          if (active) active.kill();
          clearPatches();
          shown.title = false;
          shown.name = false;
          writeLine("title", "", false);
          writeLine("name", "", false);
          hideNeedle();
          gsap.set(root, { autoAlpha: 0 });
          movePlace("present", false);
          presented = true;
          if (reduce) {
            gsap.set(root, { autoAlpha: 1, y: 0, scale: 1, rotation: 0 });
            return gsap.timeline();
          }
          const top = root.getBoundingClientRect().top;
          const travel = Math.max(window.innerHeight - top + 36, root.offsetHeight || 320);
          gsap.set(root, { autoAlpha: 1, y: travel, scale: 1, rotation: 0 });
          return gsap.timeline().to(root, {
            y: 0, duration: 0.92, ease: "power3.out",
          });
        }).then(() => (text ? this.name(text) : null)).then(() => this.settle());
      },

      /* 2–4. Recall from the corner, seat one mark, park again. */
      receiveMission(id) {
        return receive("mission", id);
      },

      receiveConstellation(id) {
        return receive("constellation", id);
      },

      receivePerformance(id) {
        return receive("rank", id);
      },

      /* Left-half park with the marks already seated and the title still blank.
         Same recall-then-aside move designate uses before it types. */
      presentAside() {
        return recall().then(() => enqueue(() => movePlace("aside", true)));
      },

      /* The print. Same feed off the bottom designate uses after the title. */
      sendOff() {
        return enqueue(() => movePlace("exit", true));
      },

      /* 5. Recall, move into the left half, type the designation, then feed
         off the bottom the way the kiosk prints the cloth. */
      designate(text) {
        return recall()
          .then(() => enqueue(() => movePlace("aside", true)))
          .then(() => (text ? this.title(text) : null))
          .then(() => rest(1.2))
          .then(() => enqueue(() => movePlace("exit", true)));
      },

      /* Preview of the five beats. The corner hold stands in for the lesson
         that will play between them on the kiosk. */
      award(input) {
        const record = input || {};
        const graded = window.MissionClassify ? window.MissionClassify.classify(record) : {};
        const mission = record.mission || record.flight || graded.mission;
        const dominant = record.dominant || (typeof record.constellation === "string" ? record.constellation : graded.dominant);
        const title = record.title || graded.title;
        const rank = record.rank === undefined ? graded.rank : record.rank;
        const beats = [];
        if (mission) beats.push(() => this.receiveMission(mission));
        if (dominant) beats.push(() => this.receiveConstellation(dominant));
        if (rank) beats.push(() => this.receivePerformance(rank));
        if (title) beats.push(() => this.designate(title));
        let chain = this.appear(record.name || "");
        beats.forEach((beat) => {
          chain = chain.then(() => rest(1.45)).then(() => beat());
        });
        return chain.then(() => ({ ...graded, mission, dominant, title, rank }));
      },
    };

    api.ready = ready().then(() => api);
    return api;
  }

  window.MissionBadge = {
    mount(root, options) {
      if (!window.gsap) throw new Error("Load gsap before player.js");
      const badge = MissionBadge(root, options || {});
      return badge.ready;
    },
    missions: Object.keys(MISSIONS),
    constellations: Object.keys(CONSTELLATIONS),
    ranks: Object.keys(RANKS),
  };
})();
