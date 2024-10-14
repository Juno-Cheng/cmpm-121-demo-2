import "./style.css";

const APP_NAME = "Paint IO!";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = `
  <h1>${APP_NAME}</h1>
  <canvas id="canvas" width="256" height="256"></canvas>
  <button id="clearBtn">Clear</button>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const ctx = canvas.getContext("2d")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clearBtn")!;
const paths: Array<Array<{ x: number; y: number }>> = [];
let currentPath: Array<{ x: number; y: number }> = [];

const cursor = { active: false, x: 0, y: 0 };

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const path of paths) {
    if (path.length > 0) {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);

      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    }
  }
}

function dispatchDrawingChanged() {
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
}

canvas.addEventListener("drawing-changed", () => {
  redraw();
});

clearBtn.addEventListener("click", () => {
  paths.length = 0; 
  dispatchDrawingChanged();
});

canvas.addEventListener("mousedown", (e: MouseEvent) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentPath = [{ x: cursor.x, y: cursor.y }];
  paths.push(currentPath);
  dispatchDrawingChanged(); 
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    currentPath.push({ x: cursor.x, y: cursor.y });
    dispatchDrawingChanged(); 
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentPath = [];
});

canvas.addEventListener("mouseleave", () => {
  cursor.active = false;
});
