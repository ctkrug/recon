import "./style.css";
import { OccupancyGrid, Cell } from "./sim/grid";

const app = document.querySelector<HTMLDivElement>("#app")!;

const canvas = document.createElement("canvas");
app.appendChild(canvas);

const grid = new OccupancyGrid(64, 40);

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || window.innerWidth;
  const cssHeight = canvas.clientHeight || window.innerHeight;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
}

function draw() {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e8e8e8";
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillText(
    `Recon scaffold — ${grid.width}x${grid.height} grid, ${grid.countByState(Cell.Unknown)} unknown cells`,
    16,
    32,
  );
}

canvas.style.width = "100%";
canvas.style.height = "100vh";
window.addEventListener("resize", () => {
  resize();
  draw();
});

resize();
draw();
