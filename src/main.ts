import "./style.css";

const APP_NAME = "Paint IO!";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = `
  <h1>${APP_NAME}</h1>
  <canvas id="canvas" width="256" height="256"></canvas>
  <button id="clearBtn">Clear</button>
  <button id="undoBtn">Undo</button>
  <button id="redoBtn">Redo</button>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const ctx = canvas.getContext("2d")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clearBtn")!;
const undoBtn = document.querySelector<HTMLButtonElement>("#undoBtn")!;
const redoBtn = document.querySelector<HTMLButtonElement>("#redoBtn")!;
const cursor = { active: false, x: 0, y: 0 };


/* Class with a display method:

Rather than having your display list and undo/redo stacks hold geometry information (arrays of x/y pairs), 
have it them objects with objects that have a display(ctx) method that accepts a context parameter 
(the same context from canvas.getContext("2d")).

Implement a class that will be used to represent marker lines. Each command class might have a constructor 
that takes an initial marker position. It might have a method called drag(x,y) that accepts an additional marker
position used to incrementally grow the line as the user drags their mouse cursor.

*/
class MarkerLine {
    private points: { x: number; y: number }[] = [];
  
    constructor(initialX: number, initialY: number) {
      this.points.push({ x: initialX, y: initialY });
    }
  
    // Add a new point as the user drags the mouse
    drag(x: number, y: number) {
      this.points.push({ x, y });
    }
  
    // Display the line on the canvas using the context
    display(ctx: CanvasRenderingContext2D) {
      if (this.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
  
        for (let i = 1; i < this.points.length; i++) {
          ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
      }
    }
  }
  
// Update variables to not use coordinates
const paths: MarkerLine[] = [];
const redoStack: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;

// Updating all Functions
function redraw() { //Redraw just calls drag
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const path of paths) {
    path.display(ctx); // Call on a function that has the details of storoke
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
    currentLine = new MarkerLine(cursor.x, cursor.y);
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
