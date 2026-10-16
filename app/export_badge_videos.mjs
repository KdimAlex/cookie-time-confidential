/* Render the five badge beats as separate ProRes 4444 movies with alpha.
   Frames are stepped on GSAP's clock so the files match the on-screen timing.

   node export_badge_videos.mjs
   Writes projects/visual-discovery-2026/exports/badge/
*/
import { spawn } from "node:child_process";
import { mkdir, writeFile, rm, readdir, readFile, link } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9347;
const WIDTH = 1920;
const HEIGHT = 1080;
const SCALE = 2;
const FPS = 60;
const DT = 1 / FPS;
const MAX_FRAMES = FPS * 12;
const ROOT = path.resolve(import.meta.dirname, "..");
const SCREEN = process.argv.includes("--screen");
const OUT = path.join(ROOT, "exports", "badge", ...(SCREEN ? ["screens"] : []));
const FRAMES = "/tmp/badge-export-frames";
const PROFILE = "/tmp/badge-export-chrome";
const PAGE = SCREEN
  ? `http://127.0.0.1:8881/kiosk.html?at=30&export=1&v=${Date.now()}`
  : `http://127.0.0.1:8881/badge-kit/demo.html?export=1&v=${Date.now()}`;

const BEATS = SCREEN
  ? [{ file: "01-appear-on-screen.mp4", call: 'window.badge.appear("Rusty Schweickart")' }]
  : [
    { file: "01-appear.mov", call: 'window.badge.appear("Rusty Schweickart")' },
    { file: "02-mission.mov", call: 'window.badge.receiveMission("apollo")' },
    { file: "03-constellation.mov", call: 'window.badge.receiveConstellation("cassiopeia")' },
    { file: "04-performance.mov", call: 'window.badge.receivePerformance("cookie")' },
    { file: "05-designate.mov", call: 'window.badge.designate("COMMANDER")' },
  ].filter((beat) => {
    const only = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
    return only.length === 0 || only.some((name) => beat.file.includes(name));
  });

function cdp(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message || "cdp error"}`));
      else resolve(msg.result || {});
    }
  });
  return (method, params = {}, timeout = 20000) => new Promise((resolve, reject) => {
    const my = ++id;
    const timer = setTimeout(() => {
      pending.delete(my);
      reject(new Error(`timeout ${method}`));
    }, timeout);
    pending.set(my, {
      resolve: (value) => { clearTimeout(timer); resolve(value); },
      reject: (error) => { clearTimeout(timer); reject(error); },
    });
    ws.send(JSON.stringify({ id: my, method, params }));
  });
}

async function waitForJson() {
  for (let i = 0; i < 100; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (response.ok) {
        const list = await response.json();
        const page = list.find((item) => item.type === "page");
        if (page?.webSocketDebuggerUrl) return page;
      }
    } catch { /* chrome still starting */ }
    await sleep(200);
  }
  throw new Error("Chrome did not open a debugging port");
}

async function evaluate(send, expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "page exception");
  }
  return result.result?.value;
}

async function shot(send, file) {
  const { data } = await send("Page.captureScreenshot", {
    format: "png",
    omitBackground: !SCREEN,
    fromSurface: true,
  }, 30000);
  await writeFile(file, Buffer.from(data, "base64"));
}

async function evaluateImageSize(file) {
  const buf = await readFile(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function encode(dir, file) {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", [
      "-y", "-hide_banner", "-loglevel", "error",
      "-framerate", String(FPS),
      "-i", path.join(dir, "%04d.png"),
      "-c:v", "prores_ks",
      "-profile:v", "4444",
      "-pix_fmt", "yuva444p10le",
      "-an",
      file,
    ], { stdio: ["ignore", "inherit", "inherit"] });
    proc.on("error", reject);
    proc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}`))));
  });
}

function encodeScreen(dir, file) {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", [
      "-y", "-hide_banner", "-loglevel", "error",
      "-framerate", String(FPS),
      "-i", path.join(dir, "%04d.png"),
      "-an",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-crf", "16",
      "-preset", "medium",
      "-movflags", "+faststart",
      file,
    ], { stdio: ["ignore", "inherit", "inherit"] });
    proc.on("error", reject);
    proc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`screen ${code}`))));
  });
}

function encodeWebm(dir, file) {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", [
      "-y", "-hide_banner", "-loglevel", "error",
      "-framerate", String(FPS),
      "-i", path.join(dir, "%04d.png"),
      "-an",
      "-c:v", "libvpx-vp9",
      "-pix_fmt", "yuva420p",
      "-b:v", "0",
      "-crf", "12",
      "-auto-alt-ref", "0",
      "-row-mt", "1",
      "-deadline", "good",
      "-cpu-used", "2",
      file,
    ], { stdio: ["ignore", "inherit", "inherit"] });
    proc.on("error", reject);
    proc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`webm ${code}`))));
  });
}

async function main() {
  await rm(FRAMES, { recursive: true, force: true });
  await rm(PROFILE, { recursive: true, force: true });
  await mkdir(FRAMES, { recursive: true });
  await mkdir(OUT, { recursive: true });

  const chrome = spawn(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--mute-audio",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--allow-file-access-from-files",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  chrome.stderr.on("data", (chunk) => {
    const line = String(chunk);
    if (/DevTools listening/.test(line)) process.stderr.write(line);
  });

  try {
    const page = await waitForJson();
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve);
      ws.addEventListener("error", () => reject(new Error("devtools socket failed")));
    });
    const send = cdp(ws);
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: SCALE,
      mobile: false,
    });
    await send("Emulation.setDefaultBackgroundColorOverride", {
      color: { r: 0, g: 0, b: 0, a: 0 },
    });
    if (SCREEN) {
      await send("Page.addScriptToEvaluateOnNewDocument", {
        source: `document.addEventListener("DOMContentLoaded", () => {
          const style = document.createElement("style");
          style.textContent = "#critique{display:none!important}html,body{background:#07090d!important}#terminal.is-tap #line::after{display:none!important}";
          document.documentElement.appendChild(style);
          const world = document.getElementById("world");
          if (!world) return;
          const moon = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          moon.setAttribute("cx", "1248");
          moon.setAttribute("cy", "148");
          moon.setAttribute("r", "56");
          moon.setAttribute("fill", "#f4f4f4");
          world.appendChild(moon);
        });`,
      });
    }
    await send("Page.navigate", { url: PAGE });
    let badge = null;
    for (let i = 0; i < 80 && !badge; i += 1) {
      await sleep(150);
      badge = await evaluate(send, "Boolean(window.badge)");
    }
    if (!badge) throw new Error("Badge did not mount");

    const frozen = await evaluate(send, `(() => {
      gsap.ticker.lagSmoothing(0);
      if (typeof gsap.ticker.sleep === "function") gsap.ticker.sleep();
      const native = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = () => 0;
      window.__t = gsap.globalTimeline.time();
      return window.__t;
    })()`);
    await sleep(250);
    const held = await evaluate(send, "gsap.globalTimeline.time()");
    if (Math.abs(held - frozen) > 0.02) {
      throw new Error(`GSAP clock still running (${frozen} -> ${held})`);
    }
    console.log(`clock held at ${held.toFixed(3)}s`);

    for (const beat of BEATS) {
      const dir = path.join(FRAMES, beat.file);
      await rm(dir, { recursive: true, force: true });
      await mkdir(dir);
      await evaluate(send, `window.__done = false; (${beat.call}).then(() => { window.__done = true; }); true`);
      let count = 0;
      await shot(send, path.join(dir, String(count).padStart(4, "0") + ".png"));
      count += 1;
      while (count < MAX_FRAMES) {
        const step = await evaluate(send, `(() => {
          if (window.__done) return { done: true };
          window.__t += ${DT};
          gsap.updateRoot(window.__t);
          const r = document.querySelector(".badge-place").getBoundingClientRect();
          return { done: false, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) };
        })()`);
        if (step.done) break;
        await shot(send, path.join(dir, String(count).padStart(4, "0") + ".png"));
        if (count % 30 === 0) console.log(`  ${beat.file} frame ${count}  x ${step.x} y ${step.y} w ${step.w}`);
        count += 1;
      }
      if (count >= MAX_FRAMES) throw new Error(`${beat.file} did not finish`);
      const sample = path.join(dir, "0000.png");
      const size = await evaluateImageSize(sample);
      if (size.width !== WIDTH * SCALE || size.height !== HEIGHT * SCALE) {
        throw new Error(`${beat.file} captured at ${size.width}x${size.height}, expected ${WIDTH * SCALE}x${HEIGHT * SCALE}`);
      }
      const out = path.join(OUT, beat.file);
      if (SCREEN) {
        await encodeScreen(dir, out);
      } else {
        await encode(dir, out);
        const webm = path.join(OUT, "for-figma", beat.file.replace(/\.mov$/, ".webm"));
        await mkdir(path.join(OUT, "for-figma"), { recursive: true });
        await encodeWebm(dir, webm);
        await link(out, path.join(OUT, "for-figma", beat.file)).catch(async () => {
          await rm(path.join(OUT, "for-figma", beat.file), { force: true });
          await link(out, path.join(OUT, "for-figma", beat.file));
        });
      }
      if (!SCREEN) {
        const matte = out.replace(/\.mov$/, "-matte.mp4");
        await new Promise((resolve, reject) => {
          const proc = spawn("ffmpeg", [
            "-y", "-hide_banner", "-loglevel", "error",
            "-i", out,
            "-an",
            "-vf", "alphaextract,format=yuv420p",
            "-c:v", "libx264",
            "-crf", "14",
            "-preset", "medium",
            "-movflags", "+faststart",
            matte,
          ], { stdio: ["ignore", "inherit", "inherit"] });
          proc.on("error", reject);
          proc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`matte ${code}`))));
        });
      }
      const frames = (await readdir(dir)).filter((name) => name.endsWith(".png")).length;
      console.log(`${beat.file}  ${size.width}x${size.height}  ${FPS}fps  ${frames} frames  ${(frames / FPS).toFixed(2)}s`);
      await rm(dir, { recursive: true, force: true });
    }
    ws.close();
  } finally {
    chrome.kill("SIGKILL");
  }
}

if (!existsSync(CHROME)) throw new Error("Chrome not found");
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
