const canvas = document.querySelector("#sky");
const ctx = canvas.getContext("2d");
const root = document.documentElement;
const intro = document.querySelector("#intro");
const experience = document.querySelector("#experience");
const enterButton = document.querySelector("#enter-button");
const paletteButton = document.querySelector("#palette-button");
const soundButton = document.querySelector("#sound-button");
const fullscreenButton = document.querySelector("#fullscreen-button");
const driftButton = document.querySelector("#drift-button");
const fieldGuide = document.querySelector("#field-guide");
const lineReveal = document.querySelector("#line-reveal");
const foundCount = document.querySelector("#found-count");
const progressFill = document.querySelector("#progress-fill");
const keyboardAction = document.querySelector("#keyboard-action");
const finale = document.querySelector("#finale");
const finaleClose = document.querySelector("#finale-close");
const completedPoem = document.querySelector("#completed-poem");
const copyButton = document.querySelector("#copy-button");
const restartButton = document.querySelector("#restart-button");
const nextButton = document.querySelector("#next-field");
const finaleTitle = document.querySelector("#finale-title");
const finaleNote = document.querySelector("#finale-note");
const editionLabel = document.querySelector("#edition");
const statusRegion = document.querySelector("#status");

/* Three fields, three movements. Each carries its own poem, its own five stars
   and the palette it opens in — which is why the palette list is ordered to
   match. The palette button still cycles freely on top of that; a field sets the
   atmosphere it starts in, it does not own it. */
const FIELDS = [
  {
    id: "nocturne",
    edition: "Field 01",
    title: "A sky of your own",
    palette: "nocturne",
    lines: [
      "I touched the dark and found it listening—",
      "a lantern opened where my hand had been.",
      "The distance folded into silver wings;",
      "even the quiet learned a name for me.",
      "By morning, I had taught the stars to stay."
    ],
    stars: [
      { nx: 0.24, ny: 0.31, radius: 5.8 },
      { nx: 0.72, ny: 0.24, radius: 6.4 },
      { nx: 0.57, ny: 0.58, radius: 5.5 },
      { nx: 0.82, ny: 0.69, radius: 6.1 },
      { nx: 0.33, ny: 0.76, radius: 6.8 }
    ]
  },
  {
    id: "ember",
    edition: "Field 02",
    title: "What the fire kept",
    palette: "ember",
    lines: [
      "Something kept a small fire for me here,",
      "banked under ash the colour of old coins.",
      "I knelt, and it remembered how to breathe;",
      "the room came back in amber, one wall at a time.",
      "Nothing was saved. Everything was kept."
    ],
    stars: [
      { nx: 0.18, ny: 0.58, radius: 6.2 },
      { nx: 0.41, ny: 0.27, radius: 5.6 },
      { nx: 0.66, ny: 0.45, radius: 6.6 },
      { nx: 0.79, ny: 0.22, radius: 5.4 },
      { nx: 0.63, ny: 0.78, radius: 6.9 }
    ]
  },
  {
    id: "tide",
    edition: "Field 03",
    title: "Everything the water learned",
    palette: "tide",
    lines: [
      "The water took the shape of what I carried",
      "and gave it back as light, and lighter still.",
      "I let the current have my careful hands.",
      "What I had held so long went out like tide—",
      "and the whole sea turned over, learning me."
    ],
    stars: [
      { nx: 0.30, ny: 0.22, radius: 6.0 },
      { nx: 0.15, ny: 0.72, radius: 6.7 },
      { nx: 0.52, ny: 0.49, radius: 5.5 },
      { nx: 0.84, ny: 0.37, radius: 6.3 },
      { nx: 0.70, ny: 0.80, radius: 5.9 }
    ]
  }
];

const PROGRESS_KEY = "nocturne-fields-found";
const palettes = ["nocturne", "ember", "tide"];

// Progress is a convenience, never a dependency: localStorage throws outright in
// some privacy modes, so every read and write is guarded and a failure leaves a
// perfectly playable site that simply forgets.
function readProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((id) => FIELDS.some((f) => f.id === id)) : [];
  } catch (error) {
    return [];
  }
}

function writeProgress(list) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(list)); }
  catch (error) { /* not fatal */ }
}

let completed = readProgress();
let fieldIndex = 0;
let memoryStars = [];
let poemLines = [];

let stars = [];
let particles = [];
let pointer = { x: -1000, y: -1000 };
let width = 0;
let height = 0;
let dpr = 1;
let started = false;
let found = 0;
let paletteIndex = 0;
let soundEnabled = false;
let audioContext;
let revealTimer;
let driftStrength = 0;
let animationFrame;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seedStars();
}

function seedStars() {
  const count = Math.min(230, Math.max(90, Math.floor((width * height) / 6500)));
  stars = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.25 + 0.2,
    alpha: Math.random() * 0.55 + 0.18,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.25 + 0.05,
    layer: index % 3
  }));
}

function accentColor(alpha = 1) {
  const hex = getComputedStyle(root).getPropertyValue("--accent").trim();
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function drawStar(x, y, radius, alpha) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 5);
  glow.addColorStop(0, `rgba(255,255,255,${alpha})`);
  glow.addColorStop(0.16, accentColor(alpha * 0.95));
  glow.addColorStop(1, accentColor(0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${Math.min(1, alpha + 0.2)})`;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.8, radius * 0.42), 0, Math.PI * 2);
  ctx.fill();
}

function draw(time = 0) {
  ctx.clearRect(0, 0, width, height);
  for (const star of stars) {
    const parallaxX = pointer.x > 0 ? (pointer.x - width / 2) * 0.0025 * (star.layer + 1) : 0;
    const parallaxY = pointer.y > 0 ? (pointer.y - height / 2) * 0.0025 * (star.layer + 1) : 0;
    const twinkle = reducedMotion ? 0 : Math.sin(time * 0.001 * star.speed + star.phase) * 0.18;
    ctx.fillStyle = `rgba(255,255,255,${star.alpha + twinkle})`;
    ctx.beginPath();
    ctx.arc(star.x + parallaxX, star.y + parallaxY, star.r, 0, Math.PI * 2);
    ctx.fill();
    if (driftStrength > 0.01) star.y = (star.y + driftStrength * (0.25 + star.layer * 0.22)) % height;
  }
  if (started) {
    const awakened = memoryStars.filter((star) => star.found);
    if (awakened.length > 1) {
      ctx.strokeStyle = accentColor(0.28);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      awakened.forEach((star, index) => {
        const x = star.nx * width;
        const y = star.ny * height;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    for (const star of memoryStars) {
      const x = star.nx * width;
      const y = star.ny * height;
      const distance = Math.hypot(pointer.x - x, pointer.y - y);
      const nearby = distance < 85;
      const pulse = reducedMotion ? 0 : Math.sin(time * 0.003 + x) * 0.7;
      const radius = star.radius + pulse + (nearby ? 2.5 : 0);
      drawStar(x, y, radius, star.found ? 1 : nearby ? 0.95 : 0.62);
      if (!star.found) {
        ctx.strokeStyle = accentColor(nearby ? 0.46 : 0.13);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius * (nearby ? 3.4 : 2.35), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  particles = particles.filter((particle) => particle.life > 0);
  for (const particle of particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    particle.life -= 0.018;
    ctx.fillStyle = accentColor(Math.max(0, particle.life));
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, Math.max(0.05, particle.size * Math.max(0, particle.life)), 0, Math.PI * 2);
    ctx.fill();
  }
  driftStrength *= 0.985;
  animationFrame = requestAnimationFrame(draw);
}

function burst(x, y, amount = 32) {
  for (let index = 0; index < amount; index += 1) {
    const angle = (Math.PI * 2 * index) / amount + Math.random() * 0.2;
    const speed = Math.random() * 3.6 + 0.6;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, size: Math.random() * 2.2 + 0.8 });
  }
}

function chime(noteIndex) {
  if (!soundEnabled) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const frequencies = [261.63, 329.63, 392, 523.25, 659.25];
  oscillator.type = "sine";
  oscillator.frequency.value = frequencies[noteIndex % frequencies.length];
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 1.5);
}

function revealLine(index) {
  window.clearTimeout(revealTimer);
  lineReveal.classList.remove("visible", "leaving");
  lineReveal.textContent = poemLines[index];
  requestAnimationFrame(() => lineReveal.classList.add("visible"));
  revealTimer = window.setTimeout(() => {
    lineReveal.classList.remove("visible");
    lineReveal.classList.add("leaving");
  }, 2350);
}

function setStatus(text) {
  if (statusRegion) statusRegion.textContent = text;
}

// Loading a field is the only place memoryStars and poemLines are built, so the
// two can never drift apart. `found` is per-field; `completed` is the suite.
function loadField(index) {
  fieldIndex = Math.max(0, Math.min(FIELDS.length - 1, index));
  const field = FIELDS[fieldIndex];
  memoryStars = field.stars.map((star) => ({ ...star, found: false }));
  poemLines = field.lines;
  root.dataset.palette = field.palette === "nocturne" ? "" : field.palette;
  paletteIndex = palettes.indexOf(field.palette);
  editionLabel.textContent = `${field.edition} / ${String(FIELDS.length).padStart(2, "0")}`;
  particles = [];
  found = 0;
  foundCount.textContent = "0";
  progressFill.style.width = "0";
  fieldGuide.style.opacity = "1";
  lineReveal.textContent = "";
  lineReveal.classList.remove("visible", "leaving");
}

function firstUnfinishedField() {
  const next = FIELDS.findIndex((field) => !completed.includes(field.id));
  return next === -1 ? 0 : next;
}

function markFieldComplete() {
  const id = FIELDS[fieldIndex].id;
  if (!completed.includes(id)) {
    completed = completed.concat(id);
    writeProgress(completed);
  }
}

function awaken(star) {
  if (!started || star.found || !finale.hidden) return;
  star.found = true;
  const index = found;
  found += 1;
  foundCount.textContent = String(found);
  progressFill.style.width = `${(found / memoryStars.length) * 100}%`;
  fieldGuide.style.opacity = found > 0 ? "0" : "1";
  burst(star.nx * width, star.ny * height, 45);
  chime(index);
  revealLine(index);
  setStatus(`${found} of ${memoryStars.length} found. ${poemLines[index]}`);
  if (found === memoryStars.length) window.setTimeout(showFinale, 2600);
}

function awakenAt(x, y) {
  const candidate = memoryStars.filter((star) => !star.found).map((star) => ({ star, distance: Math.hypot(x - star.nx * width, y - star.ny * height) })).sort((a, b) => a.distance - b.distance)[0];
  if (candidate && candidate.distance < 55) awaken(candidate.star);
}

function showFinale() {
  markFieldComplete();
  lineReveal.classList.remove("visible");
  const field = FIELDS[fieldIndex];
  const allDone = FIELDS.every((f) => completed.includes(f.id));
  finaleTitle.textContent = allDone ? "Three skies, and the dark between them" : field.title;
  completedPoem.textContent = poemLines.join("\n");
  finaleNote.textContent = allDone
    ? "That is the whole suite. The fields keep what you found; begin again whenever the night is long."
    : `Field ${fieldIndex + 1} of ${FIELDS.length}. There is another sky waiting.`;
  nextButton.hidden = allDone;
  restartButton.textContent = allDone ? "Begin the suite again" : "Wander this field again";
  finale.hidden = false;
  // The next field is the thing to do, so it is the thing that gets focus —
  // except at the end of the suite, where it is hidden and cannot hold any.
  (allDone ? restartButton : nextButton).focus();
  setStatus(allDone
    ? "The suite is complete. All three fields found."
    : `Field ${fieldIndex + 1} complete. ${poemLines.join(" ")}`);
}

function goToNextField() {
  const next = fieldIndex + 1;
  if (next >= FIELDS.length) return;
  closeFinale();
  loadField(next);
  setStatus(`${FIELDS[next].edition}. Five fragments are waiting.`);
  announceField();
}

// A field change is a real scene change, so it gets the same treatment a poem
// line does: shown in the middle of the screen, then allowed to fade.
function announceField() {
  const field = FIELDS[fieldIndex];
  window.clearTimeout(revealTimer);
  lineReveal.classList.remove("leaving");
  lineReveal.textContent = field.edition;
  requestAnimationFrame(() => lineReveal.classList.add("visible"));
  revealTimer = window.setTimeout(() => {
    lineReveal.classList.remove("visible");
    lineReveal.classList.add("leaving");
  }, 1600);
}

// Closing the finale hides the button that was just pressed — both the close
// button and "Begin again" live inside it — so focus has to be handed somewhere
// rendered, or the keyboard user is left on <body> with nothing selected.
function closeFinale() {
  if (finale.hidden) return;
  finale.hidden = true;
  keyboardAction.focus({ preventScroll: true });
}

function resetExperience() {
  // "Begin again" after the whole suite starts the suite over, progress and all.
  if (FIELDS.every((f) => completed.includes(f.id))) {
    completed = [];
    writeProgress(completed);
    closeFinale();
    loadField(0);
    setStatus("The suite begins again. Field 01.");
    announceField();
    return;
  }
  closeFinale();
  loadField(fieldIndex);
}

function begin() {
  if (started) return;
  started = true;
  loadField(firstUnfinishedField());
  intro.classList.add("is-leaving");
  burst(width * 0.5, height * 0.5, 80);
  chime(0);
  setStatus(`${FIELDS[fieldIndex].edition}. Five fragments are waiting in the dark.`);
  window.setTimeout(() => {
    intro.hidden = true;
    experience.hidden = false;
    keyboardAction.focus({ preventScroll: true });
  }, 650);
}

enterButton.addEventListener("click", begin);
document.querySelector(".identity").addEventListener("click", () => {
  // Returning to the title is not "begin the suite again": it must never clear
  // progress, so it reloads the current field rather than calling resetExperience.
  closeFinale();
  loadField(fieldIndex);
  started = false;
  experience.hidden = true;
  intro.hidden = false;
  // Same reason as closeFinale: whatever had focus is inside the section that
  // just went away.
  enterButton.focus({ preventScroll: true });
  requestAnimationFrame(() => intro.classList.remove("is-leaving"));
});
canvas.addEventListener("pointermove", (event) => (pointer = { x: event.clientX, y: event.clientY }));
canvas.addEventListener("pointerleave", () => (pointer = { x: -1000, y: -1000 }));
canvas.addEventListener("pointerdown", (event) => awakenAt(event.clientX, event.clientY));
keyboardAction.addEventListener("click", () => {
  const next = memoryStars.find((star) => !star.found);
  if (next) awaken(next);
});
paletteButton.addEventListener("click", () => {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  const palette = palettes[paletteIndex];
  root.dataset.palette = palette === "nocturne" ? "" : palette;
  paletteButton.setAttribute("aria-label", `Atmosphere: ${palettes[(paletteIndex + 1) % palettes.length]}. Change atmosphere`);
  burst(width - 70, 65, 20);
});
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.classList.toggle("sound-button-active", soundEnabled);
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
  soundButton.setAttribute("aria-label", `Turn sound ${soundEnabled ? "off" : "on"}`);
  if (soundEnabled) chime(found);
});
fullscreenButton.addEventListener("click", async () => {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
  else await document.exitFullscreen?.();
});
document.addEventListener("fullscreenchange", () => fullscreenButton.setAttribute("aria-label", document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen"));
driftButton.addEventListener("click", () => { driftStrength = 8; burst(width * 0.5, height * 0.55, 70); });
copyButton.addEventListener("click", async () => {
  const text = `A sky of your own\n\n${poemLines.join("\n")}\n\n— composed in Nocturne`;
  try { await navigator.clipboard.writeText(text); copyButton.textContent = "Copied to clipboard"; }
  catch { copyButton.textContent = "Copy unavailable"; }
  window.setTimeout(() => (copyButton.textContent = "Copy poem"), 1800);
});
restartButton.addEventListener("click", resetExperience);
nextButton.addEventListener("click", goToNextField);
finaleClose.addEventListener("click", closeFinale);
// An overlay with no Escape is a keyboard trap in everything but name.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !finale.hidden) closeFinale();
});
window.addEventListener("resize", resize);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelAnimationFrame(animationFrame);
  else animationFrame = requestAnimationFrame(draw);
});

resize();
draw();
