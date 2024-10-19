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
  <div id="stickerButtons"></div> <!-- Sticker buttons will be created dynamically -->

  <!-- Third row for export button -->
  <div id="exportButtonRow">
    <button id="exportBtn">Export</button>
  </div>

  <!-- Fourth row for tool property slider -->
  <div id="sliderRow">
    <label for="rotationSlider">Tool Property (Rotation):</label>
    <input type="range" id="rotationSlider" min="0" max="360" value="0">
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const ctx = canvas.getContext("2d")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clearBtn")!;
const undoBtn = document.querySelector<HTMLButtonElement>("#undoBtn")!;
const redoBtn = document.querySelector<HTMLButtonElement>("#redoBtn")!;
const thinBtn = document.querySelector<HTMLButtonElement>("#thinBtn")!;
const thickBtn = document.querySelector<HTMLButtonElement>("#thickBtn")!;
const exportBtn = document.querySelector<HTMLButtonElement>("#exportBtn")!;
const rotationSlider = document.querySelector<HTMLInputElement>("#rotationSlider")!;

const cursor = { active: false, x: 0, y: 0 };

// Marker styles
let currentThickness = 2; 
let currentRotation = 0;
thinBtn.classList.add("selectedTool"); // Default selected tool

function setSelectedTool(toolBtn: HTMLButtonElement) {
  thinBtn.classList.remove("selectedTool");
  thickBtn.classList.remove("selectedTool");
  toolBtn.classList.add("selectedTool");
}

// ==== Utility Functions ====

function getRandomColor(): string {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// ==== Classes ====

class ToolPreview {
  private x: number;
  private y: number;
  private thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  move(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

class MarkerLine {
  private points: { x: number; y: number }[] = [];
  private thickness: number;
  private color: string;

  constructor(initialX: number, initialY: number, thickness: number, color: string) {
    this.points.push({ x: initialX, y: initialY });
    this.thickness = thickness;
    this.color = color; // Set color for this line
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length > 0) {
      ctx.lineWidth = this.thickness;
      ctx.strokeStyle = this.color; // Set stroke color
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
  public rotation: number; // New property for rotation

  constructor(x: number, y: number, emoji: string, rotation: number = 0) {
    this.x = x;
    this.y = y;
    this._emoji = emoji;
    this.rotation = rotation; // Set rotation
  }

  move(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); // Save the current context state
    ctx.translate(this.x, this.y); // Move to sticker position
    ctx.rotate((this.rotation * Math.PI) / 180); // Rotate the context
    ctx.font = "48px serif";
    ctx.fillText(this._emoji, 0, 0); // Draw emoji at rotated angle
    ctx.restore(); // Restore the context state
  }
}


let stickers = [
  { emoji: "🚀", name: "Rocket" },
  { emoji: "😎", name: "Sunglasses" },
  { emoji: "🦄", name: "Unicorn" },
  { emoji: "🍕", name: "Pizza" },
  { emoji: "🐱", name: "Cat" },
  { emoji: "🌈", name: "Rainbow" },
  { emoji: "🎨", name: "Palette" },
  { emoji: "🐶", name: "Dog" },
  { emoji: "🔥", name: "Fire" },
  { emoji: "🌟", name: "Star" }
];

function createStickerButtons() {
  const stickerButtonsDiv = document.getElementById("stickerButtons")!;
  stickerButtonsDiv.innerHTML = '';

  stickers.forEach(sticker => {
    const button = document.createElement('button');
    button.textContent = `${sticker.emoji} ${sticker.name}`;
    button.addEventListener('click', () => {
      currentSticker = new Sticker(cursor.x, cursor.y, sticker.emoji);
      dispatchDrawingChanged();
    });
    stickerButtonsDiv.appendChild(button);
  });

  const customBtn = document.createElement('button');
  customBtn.textContent = 'Custom';
  customBtn.addEventListener('click', () => {
    const customEmoji = prompt("Enter a custom sticker emoji", "🍕");
    const customName = prompt("Enter a custom sticker name", "Pizza");

    if (customEmoji && customName) {
      stickers.push({ emoji: customEmoji, name: customName });
      createStickerButtons();
    }
  });
  stickerButtonsDiv.appendChild(customBtn);
}

createStickerButtons();

const paths: (MarkerLine | Sticker)[] = [];
const redoStack: (MarkerLine | Sticker)[] = [];
let currentLine: MarkerLine | null = null;
let toolPreview: ToolPreview | null = null;
let currentSticker: Sticker | null = null;

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  paths.forEach(path => {
    if (path instanceof MarkerLine) {
      path.display(ctx);
    } else if (path instanceof Sticker) {
      path.draw(ctx);
    }
  });

  if (!cursor.active && toolPreview) {
    toolPreview.draw(ctx);
  }

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

// Tool selection event listeners
thinBtn.addEventListener("click", () => {
  currentThickness = 2;
  setSelectedTool(thinBtn);
  toolPreview = new ToolPreview(cursor.x, cursor.y, currentThickness);
  dispatchDrawingChanged();
});

thickBtn.addEventListener("click", () => {
  currentThickness = 8;
  setSelectedTool(thickBtn);
  toolPreview = new ToolPreview(cursor.x, cursor.y, currentThickness);
  dispatchDrawingChanged();
});

// Undo/Redo Event Listeners
undoBtn.addEventListener("click", () => {
  if (paths.length > 0) {
    const lastPath = paths.pop();
    if (lastPath) redoStack.push(lastPath);
    dispatchDrawingChanged();
  }
});

redoBtn.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const pathToRedo = redoStack.pop();
    if (pathToRedo) paths.push(pathToRedo);
    dispatchDrawingChanged();
  }
});

// Mouse event listeners for drawing or placing stickers
canvas.addEventListener("mousedown", (e: MouseEvent) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (currentSticker) {
    currentSticker = new Sticker(cursor.x, cursor.y, currentSticker._emoji, currentRotation);
    paths.push(currentSticker); 
    currentSticker = null; 
  } else {
    currentLine = new MarkerLine(cursor.x, cursor.y, currentThickness, getRandomColor());
    paths.push(currentLine);
    redoStack.length = 0;
  }

  dispatchDrawingChanged();
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (!cursor.active && currentSticker) {
    currentSticker.move(cursor.x, cursor.y);
  } else if (!cursor.active && toolPreview) {
    toolPreview.move(cursor.x, cursor.y);
  } else if (cursor.active && currentLine) {
    currentLine.drag(cursor.x, cursor.y);
  }

  dispatchDrawingChanged();
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;
});

canvas.addEventListener("mouseleave", () => {
  cursor.active = false;
  currentLine = null;
});

// Export Button Logic
exportBtn.addEventListener('click', () => {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext('2d')!;
  exportCtx.scale(4, 4);

  paths.forEach(path => {
    if (path instanceof MarkerLine) {
      path.display(exportCtx);
    } else if (path instanceof Sticker) {
      path.draw(exportCtx);
    }
  });

  const anchor = document.createElement('a');
  anchor.href = exportCanvas.toDataURL('image/png');
  anchor.download = 'sketchpad.png';
  anchor.click();
});

// Rotation Slide Logic
rotationSlider.addEventListener("input", () => {
  currentRotation = parseInt(rotationSlider.value);
  
  // Update the tool preview if a sticker is selected
  if (currentSticker) {
    currentSticker.rotation = currentRotation;
    dispatchDrawingChanged(); // Redraw the preview
  }
});
