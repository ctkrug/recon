import "./style.css";
import { clamp01, easeOutCubic, lerp } from "./render/easing";
import { drawFrame, fitCanvasToContainer } from "./render/canvas";
import {
  coverage as coverageOf,
  createExploration,
  pause,
  restart,
  start,
  step,
} from "./sim/explorer";

const GRID_WIDTH = 64;
const GRID_HEIGHT = 40;
const SENSOR_RANGE = 6;

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

function ticks(count: number): HTMLSpanElement[] {
  return Array.from({ length: count }, (_, i) => {
    const span = document.createElement("span");
    span.className = `tick tick-${["tl", "tr", "bl", "br"][i]}`;
    return span;
  });
}

function createPanel(...children: HTMLElement[]): HTMLDivElement {
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.append(...ticks(4), ...children);
  return panel;
}

function createReadoutRow(
  label: string,
  id: string,
): { row: HTMLDivElement; value: HTMLSpanElement } {
  const row = document.createElement("div");
  row.className = "readout";
  const labelEl = document.createElement("span");
  labelEl.className = "readout-label";
  labelEl.textContent = label;
  const value = document.createElement("span");
  value.className = "readout-value";
  value.id = id;
  value.textContent = "—";
  row.append(labelEl, value);
  return { row, value };
}

const app = document.querySelector<HTMLDivElement>("#app")!;

const layout = document.createElement("div");
layout.className = "layout";

// --- Stage (the hero: fog, grid, robot) ---
const stage = document.createElement("div");
stage.className = "stage";
stage.append(...ticks(4));

const canvas = document.createElement("canvas");
canvas.className = "map-canvas";
stage.appendChild(canvas);

const radarSweep = document.createElement("div");
radarSweep.className = "radar-sweep";
stage.appendChild(radarSweep);

// --- HUD rail ---
const hud = document.createElement("aside");
hud.className = "hud";

const wordmark = document.createElement("h1");
wordmark.className = "wordmark";
wordmark.textContent = "RECON";
const tagline = document.createElement("p");
tagline.className = "tagline";
tagline.textContent = "frontier exploration of a fog-covered map";
const titleBlock = document.createElement("div");
titleBlock.className = "title-block";
titleBlock.append(wordmark, tagline);
hud.appendChild(createPanel(titleBlock));

const readoutsWrap = document.createElement("div");
readoutsWrap.className = "readouts";
const coverage = createReadoutRow("Coverage", "readout-coverage");
const steps = createReadoutRow("Steps", "readout-steps");
const elapsed = createReadoutRow("Elapsed", "readout-elapsed");
const statusBanner = document.createElement("p");
statusBanner.className = "status-banner";
statusBanner.id = "status-banner";
statusBanner.textContent = "STANDING BY";
readoutsWrap.append(coverage.row, steps.row, elapsed.row, statusBanner);
hud.appendChild(createPanel(readoutsWrap));

const controls = document.createElement("div");
controls.className = "controls";

const buttonRow = document.createElement("div");
buttonRow.className = "button-row";
const startPauseBtn = document.createElement("button");
startPauseBtn.className = "primary";
startPauseBtn.id = "start-pause-btn";
startPauseBtn.textContent = "Start";
const restartBtn = document.createElement("button");
restartBtn.id = "restart-btn";
restartBtn.textContent = "Restart";
buttonRow.append(startPauseBtn, restartBtn);

const speedField = document.createElement("div");
speedField.className = "field";
const speedLabel = document.createElement("label");
speedLabel.htmlFor = "speed-slider";
speedLabel.textContent = "Speed";
const speedSlider = document.createElement("input");
speedSlider.type = "range";
speedSlider.id = "speed-slider";
speedSlider.min = "1";
speedSlider.max = "10";
speedSlider.value = "5";
speedField.append(speedLabel, speedSlider);

const seedField = document.createElement("div");
seedField.className = "field";
const seedLabel = document.createElement("label");
seedLabel.htmlFor = "seed-input";
seedLabel.textContent = "Seed";
const seedRow = document.createElement("div");
seedRow.className = "button-row";
const seedInput = document.createElement("input");
seedInput.type = "text";
seedInput.id = "seed-input";
const newMapBtn = document.createElement("button");
newMapBtn.id = "new-map-btn";
newMapBtn.textContent = "New map";
seedRow.append(seedInput, newMapBtn);
seedField.append(seedLabel, seedRow);

controls.append(buttonRow, speedField, seedField);
hud.appendChild(createPanel(controls));

layout.append(stage, hud);
app.appendChild(layout);

const TWEEN_MS = 100;
const MIN_TICKS_PER_SECOND = 1;
const MAX_TICKS_PER_SECOND = 15;
const MAX_FRAME_DT_MS = 250;

let explorationState = createExploration(
  randomSeed(),
  GRID_WIDTH,
  GRID_HEIGHT,
  SENSOR_RANGE,
);
seedInput.value = explorationState.seed;

let prevRobotPos = { x: explorationState.robot.x, y: explorationState.robot.y };
let tweenStartTime = 0;
let elapsedMs = 0;
let tickAccumulatorMs = 0;
let lastFrameTime: number | null = null;
let speedTicksPerSecond = mapSpeed(Number(speedSlider.value));

function mapSpeed(sliderValue: number): number {
  const t = (sliderValue - 1) / 9;
  return MIN_TICKS_PER_SECOND + t * (MAX_TICKS_PER_SECOND - MIN_TICKS_PER_SECOND);
}

function applyStep(): void {
  const before = explorationState.robot;
  explorationState = step(explorationState);
  if (explorationState.robot !== before) {
    prevRobotPos = { x: before.x, y: before.y };
    tweenStartTime = performance.now();
  }
}

function displayRobotPosition(now: number): { x: number; y: number } {
  const progress = clamp01((now - tweenStartTime) / TWEEN_MS);
  const eased = easeOutCubic(progress);
  return {
    x: lerp(prevRobotPos.x, explorationState.robot.x, eased),
    y: lerp(prevRobotPos.y, explorationState.robot.y, eased),
  };
}

function render(now: number): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = fitCanvasToContainer(canvas);
  drawFrame(ctx, width, height, explorationState.belief, displayRobotPosition(now));
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function updateHud(): void {
  const pct = Math.round(coverageOf(explorationState) * 100);
  coverage.value.textContent = `${pct}%`;
  steps.value.textContent = String(explorationState.steps);
  elapsed.value.textContent = formatElapsed(elapsedMs);

  const done = explorationState.status === "done";
  coverage.value.dataset.status = done ? "done" : "";
  statusBanner.dataset.status = done ? "done" : "";
  statusBanner.textContent =
    explorationState.status === "idle"
      ? "STANDING BY"
      : explorationState.status === "running"
        ? "EXPLORING"
        : explorationState.status === "paused"
          ? "PAUSED"
          : "MAP FULLY EXPLORED";

  startPauseBtn.textContent = explorationState.status === "running" ? "Pause" : "Start";
  startPauseBtn.disabled = done;
  radarSweep.style.display = explorationState.status === "idle" ? "block" : "none";
}

function resetTiming(): void {
  prevRobotPos = { x: explorationState.robot.x, y: explorationState.robot.y };
  tweenStartTime = performance.now();
  elapsedMs = 0;
  tickAccumulatorMs = 0;
}

function frame(now: number): void {
  const dt = lastFrameTime === null ? 0 : Math.min(now - lastFrameTime, MAX_FRAME_DT_MS);
  lastFrameTime = now;

  if (explorationState.status === "running") {
    elapsedMs += dt;
    tickAccumulatorMs += dt;
    const tickIntervalMs = 1000 / speedTicksPerSecond;
    while (tickAccumulatorMs >= tickIntervalMs && explorationState.status === "running") {
      tickAccumulatorMs -= tickIntervalMs;
      applyStep();
    }
  }

  render(now);
  updateHud();
  requestAnimationFrame(frame);
}

startPauseBtn.addEventListener("click", () => {
  explorationState =
    explorationState.status === "running"
      ? pause(explorationState)
      : start(explorationState);
});

restartBtn.addEventListener("click", () => {
  explorationState = restart(explorationState);
  seedInput.value = explorationState.seed;
  resetTiming();
});

newMapBtn.addEventListener("click", () => {
  explorationState = restart(explorationState, randomSeed());
  seedInput.value = explorationState.seed;
  resetTiming();
});

function applySeedInput(): void {
  const value = seedInput.value.trim();
  if (!value || value === explorationState.seed) {
    seedInput.value = explorationState.seed;
    return;
  }
  explorationState = restart(explorationState, value);
  resetTiming();
}

seedInput.addEventListener("blur", applySeedInput);
seedInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    applySeedInput();
    seedInput.blur();
  }
});

speedSlider.addEventListener("input", () => {
  speedTicksPerSecond = mapSpeed(Number(speedSlider.value));
});

window.addEventListener("resize", () => render(performance.now()));

updateHud();
requestAnimationFrame(frame);
