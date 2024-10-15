import "./style.css";

const APP_NAME = "Paint IO!";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME; // Added buttons
app.innerHTML = `
  <h1>${APP_NAME}</h1>
  <canvas id="canvas" width="256" height="256"></canvas>
  <button id="clearBtn">Clear</button>
  <button id="undoBtn">Undo</button>
  <button id="redoBtn">Redo</button>
  <button id="thinBtn">Thin</button> 
  <button id="thickBtn">Thick</button>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const ctx = canvas.getContext("2d")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clearBtn")!;
const undoBtn = document.querySelector<HTMLButtonElement>("#undoBtn")!;
const redoBtn = document.querySelector<HTMLButtonElement>("#redoBtn")!;
const thinBtn = document.querySelector<HTMLButtonElement>("#thinBtn")!; // Added buttons variables
const thickBtn = document.querySelector<HTMLButtonElement>("#thickBtn")!;

const cursor = { active: false, x: 0, y: 0 };

// Marker styles
let currentThickness = 2; // Default to thin marker
thinBtn.classList.add("selectedTool"); // Default selected tool - Add CSS

// CSS to highlight the selected button - Remove All then Add to Selected
function setSelectedTool(toolBtn: HTMLButtonElement) {
  thinBtn.classList.remove("selectedTool");
  thickBtn.classList.remove("selectedTool");
  toolBtn.classList.add("selectedTool");
}

class MarkerLine {
    private points: { x: number; y: number }[] = [];
    private thickness: number;
  
    constructor(initialX: number, initialY: number, thickness: number) { // Added to initial
      this.points.push({ x: initialX, y: initialY });
      this.thickness = thickness;
    }
  
    drag(x: number, y: number) {
      this.points.push({ x, y });
    }
  
    display(ctx: CanvasRenderingContext2D) {
      if (this.points.length > 0) {
        ctx.lineWidth = this.thickness; // Set line thickness
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
  
        for (let i = 1; i < this.points.length; i++) {
          ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
      }
    }
  }
  
const paths: MarkerLine[] = [];
const redoStack: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;

function redraw() { 
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const path of paths) {
    path.display(ctx); 
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
    redoStack.length = 0;
    dispatchDrawingChanged();
});

// Event listeners for tool selection
thinBtn.addEventListener("click", () => {
    currentThickness = 2; // Thin line
    setSelectedTool(thinBtn);
  });
  
  thickBtn.addEventListener("click", () => {
    currentThickness = 8; // Thick line
    setSelectedTool(thickBtn);
  });
  

undoBtn.addEventListener("click", () => {
    if (paths.length > 0) {
        const lastPath = paths.pop();
        if (lastPath) {
          redoStack.push(lastPath); 
          dispatchDrawingChanged(); 
        }
      }
});

redoBtn.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const pathToRedo = redoStack.pop();
        if (pathToRedo) {
          paths.push(pathToRedo); 
          dispatchDrawingChanged();
        }
      }
});
  

canvas.addEventListener("mousedown", (e: MouseEvent) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  
    // Create a new MarkerLine and add it to paths
    currentLine = new MarkerLine(cursor.x, cursor.y, currentThickness);
    paths.push(currentLine);
    redoStack.length = 0; // Clear redo stack on new drawing action
    dispatchDrawingChanged(); 
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
  if (cursor.active && currentLine) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    // Add new points to the current line as the user drags the mouse
    currentLine.drag(cursor.x, cursor.y);
    dispatchDrawingChanged(); // Trigger a redraw after each new point
  }
});

canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    currentLine = null;
});

canvas.addEventListener("mouseleave", () => {
  cursor.active = false;
  currentLine = null;
});
