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
const thinBtn = document.querySelector<HTMLButtonElement>("#thinBtn")!; 
const thickBtn = document.querySelector<HTMLButtonElement>("#thickBtn")!;

const cursor = { active: false, x: 0, y: 0 };

// Marker styles
let currentThickness = 2; 
thinBtn.classList.add("selectedTool"); 

// CSS to highlight the selected button - Remove All then Add to Selected
function setSelectedTool(toolBtn: HTMLButtonElement) {
  thinBtn.classList.remove("selectedTool");
  thickBtn.classList.remove("selectedTool");
  toolBtn.classList.add("selectedTool");
}

class ToolPreview{
    private x: number;
    private y: number;
    private thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.x = x;
        this.y = y;
        this.thickness = thickness;
    }

    // Update the position of the preview
    move(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    // Draw the preview on the canvas
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2); // Draw a circle
        ctx.strokeStyle = "gray"; // Set preview color
        ctx.lineWidth = 1; // Preview border width
        ctx.stroke();
    }

}

class MarkerLine { // Command Pattern for Drawing
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
let toolPreview: ToolPreview | null = null; // Tool preview object

function redraw() { 
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const path of paths) {
    path.display(ctx); 
  }

  if (toolPreview && !cursor.active) {
    toolPreview.draw(ctx);
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
    if (toolPreview) {
      toolPreview = new ToolPreview(cursor.x, cursor.y, currentThickness); // Update tool preview size
    }
    dispatchDrawingChanged();
});

thickBtn.addEventListener("click", () => {
    currentThickness = 8; // Thick line
    setSelectedTool(thickBtn);
    if (toolPreview) {
      toolPreview = new ToolPreview(cursor.x, cursor.y, currentThickness); // Update tool preview size
    }
    dispatchDrawingChanged();
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
  
    currentLine = new MarkerLine(cursor.x, cursor.y, currentThickness);
    paths.push(currentLine);
    redoStack.length = 0; 
    toolPreview = null;
    dispatchDrawingChanged(); 
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  
    if (!cursor.active) {
      // Show the tool preview when the mouse is moving but not drawing
      if (!toolPreview) {
        toolPreview = new ToolPreview(cursor.x, cursor.y, currentThickness);
      } else {
        toolPreview.move(cursor.x, cursor.y);
      }
    } else if (currentLine) {
      // Add points to the current line when drawing
      currentLine.drag(cursor.x, cursor.y);
    }
  
    dispatchDrawingChanged(); // Trigger a redraw after each move
  });
  

canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    currentLine = null;
});

canvas.addEventListener("mouseleave", () => {
  cursor.active = false;
  currentLine = null;
});
