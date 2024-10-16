import "./style.css";

const APP_NAME = "Paint IO!";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME; // Added buttons
app.innerHTML = `
  <h1>${APP_NAME}</h1>
  <canvas id="canvas" width="256" height="256"></canvas>
  <!-- First row for tool buttons -->
  <div id="toolButtons">
    <button id="clearBtn">Clear</button>
    <button id="undoBtn">Undo</button>
    <button id="redoBtn">Redo</button>
    <button id="thinBtn">Thin</button>
    <button id="thickBtn">Thick</button>
  </div>

  <!-- Second row for sticker buttons --> 
  <div id="stickerButtons">
    <button id="rocketBtn">🚀 Rocket</button> 
    <button id="sunglassesBtn">😎 Sunglasses</button>
    <button id="unicornBtn">🦄 Unicorn</button>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const ctx = canvas.getContext("2d")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clearBtn")!;
const undoBtn = document.querySelector<HTMLButtonElement>("#undoBtn")!;
const redoBtn = document.querySelector<HTMLButtonElement>("#redoBtn")!;
const thinBtn = document.querySelector<HTMLButtonElement>("#thinBtn")!; 
const thickBtn = document.querySelector<HTMLButtonElement>("#thickBtn")!;
const rocketBtn = document.querySelector<HTMLButtonElement>("#rocketBtn")!; // New Buttons
const sunglassesBtn = document.querySelector<HTMLButtonElement>("#sunglassesBtn")!;
const unicornBtn = document.querySelector<HTMLButtonElement>("#unicornBtn")!; 
const cursor = { active: false, x: 0, y: 0 };

// Marker styles
let currentThickness = 2; 
thinBtn.classList.add("selectedTool"); // Default selected tool - Add CSS
function setSelectedTool(toolBtn: HTMLButtonElement) {
  thinBtn.classList.remove("selectedTool");
  thickBtn.classList.remove("selectedTool");
  toolBtn.classList.add("selectedTool");
}

// ====Classes====

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

class Sticker {
    public x: number;
    public y: number;
    public _emoji: string;

    get emoji() {
        return this._emoji;
      }
  
    constructor(x: number, y: number, emoji: string) {
      this.x = x;
      this.y = y;
      this._emoji = emoji;
    }
  
    // Update the position of the sticker (for preview when moving)
    move(x: number, y: number) {
      this.x = x;
      this.y = y;
    }

    // Draw the sticker on the canvas
    draw(ctx: CanvasRenderingContext2D) {
      ctx.font = "48px serif"; // Adjust font size as needed
      ctx.fillText(this._emoji, this.x, this.y);
    }
}
  

const paths: (MarkerLine | Sticker)[] = [];  // Now it can hold both MarkerLine and Sticker objects
const redoStack: (MarkerLine | Sticker)[] = []; // Allow both types

let currentLine: MarkerLine | null = null;
let toolPreview: ToolPreview | null = null; // Tool preview object
let currentSticker: Sticker | null = null; //Sticker Objects


function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    for (const path of paths) {
      if (path instanceof MarkerLine) {
        // If the object is a MarkerLine, call display()
        path.display(ctx);
      } else if (path instanceof Sticker) {
        // If the object is a Sticker, call draw()
        path.draw(ctx);
      }
    }
  
    if (!cursor.active && toolPreview) {
      toolPreview.draw(ctx); // Draw tool preview
    }
  
    // Draw the sticker preview if a sticker is selected
    if (!cursor.active && currentSticker) {
        currentSticker.draw(ctx);
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

// Event listeners for sticker buttons
rocketBtn.addEventListener("click", () => {
    currentSticker = new Sticker(cursor.x, cursor.y, "🚀");
    dispatchDrawingChanged();
  });
  
  sunglassesBtn.addEventListener("click", () => {
    currentSticker = new Sticker(cursor.x, cursor.y, "😎");
    dispatchDrawingChanged();
  });
  
  unicornBtn.addEventListener("click", () => {
    currentSticker = new Sticker(cursor.x, cursor.y, "🦄");
    dispatchDrawingChanged();
  });
    

  canvas.addEventListener("mousedown", (e: MouseEvent) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  
    if (currentSticker) {
      // Place the sticker
      currentSticker = new Sticker(cursor.x, cursor.y, currentSticker.emoji); // Finalize sticker position
      paths.push(currentSticker); // Store the sticker in the paths array
      currentSticker = null; // Reset the current sticker
    } else {
      // Handle drawing
      currentLine = new MarkerLine(cursor.x, cursor.y, currentThickness);
      paths.push(currentLine);
      redoStack.length = 0; // Clear redo stack on new drawing action
    }
  
    dispatchDrawingChanged();
  });
  

canvas.addEventListener("mousemove", (e: MouseEvent) => {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  
    if (!cursor.active) {
      // If a sticker is selected, move it with the mouse
      if (currentSticker) {
        currentSticker.move(cursor.x, cursor.y);
      } else {
        // Handle other previews (e.g., tool preview)
        if (!toolPreview) {
          toolPreview = new ToolPreview(cursor.x, cursor.y, currentThickness);
        } else {
          toolPreview.move(cursor.x, cursor.y);
        }
      }
    } else if (currentLine) {
      currentLine.drag(cursor.x, cursor.y); // Add points to the current line when drawing
    }
  
    dispatchDrawingChanged(); // Redraw the canvas
  });
  
  

canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    currentLine = null;
});

canvas.addEventListener("mouseleave", () => {
  cursor.active = false;
  currentLine = null;
});

