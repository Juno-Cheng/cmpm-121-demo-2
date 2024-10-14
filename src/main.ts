import "./style.css";

const APP_NAME = "Paint IO!";
const app = document.querySelector<HTMLDivElement>("#app")!;
addEventListener("mousemove", (event) => {});

document.title = APP_NAME;
app.innerHTML = `
<h1>${APP_NAME}</h1>
<canvas id="canvas" width="256" height="256" ></canvas>
`

