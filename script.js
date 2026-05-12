import { createAngerGame } from "./game.js";

const faceGrid = document.getElementById("faceGrid");
const resetButton = document.getElementById("resetButton");
const angryOverlay = document.getElementById("angryOverlay");
const angryZoomFace = document.getElementById("angryZoomFace");
const angryLine = document.getElementById("angryLine");
const modeLabel = document.getElementById("modeLabel");
const modeRule = document.getElementById("modeRule");
const modeButtons = Array.from(document.querySelectorAll(".mode-button"));
const angryLines = [
  "誰の許可得てクリックしてんねん",
  "お前のそういうとこがアカンねん",
  "親の顔が見てみたいわ",
  "お前、明日からもう来なくていいよ。",
  "キメェー",
  "そうですか、そうですね",
  "やめてくれへん？？",
  "I'm gay",
  "顔があかんわ",
  "なにを四天王"
];
const specialAngryLines = [
  "あなたには飲ませる人を選ぶ権利があるわ❤️",
  "私のタイプだわ❤️三杯飲みなさいよ❤️",
];

let currentSize = 3;
let game = null;

mountGame(currentSize);

for (const button of modeButtons) {
  button.addEventListener("click", () => {
    const nextSize = Number(button.dataset.size);
    if (!nextSize || nextSize === currentSize) return;

    currentSize = nextSize;
    updateModeUi();
    mountGame(currentSize);
  });
}

function mountGame(gridSize) {
  if (game) game.destroy();
  game = createAngerGame({
    faceGrid,
    resetButton,
    angryOverlay,
    angryZoomFace,
    angryLineElement: angryLine,
    angryLines,
    specialAngryLines,
    faceNormalSrc: "img/normal.png",
    faceNormalSrcs: ["img/normal.png", "img/normal2.png"],
    faceAngrySrc: "img/angry.png",
    faceSpecialAngrySrc: "img/kiss.png",
    specialAngryRate: 0.2,
    gridSize,
  });
  updateModeUi();
}

function updateModeUi() {
  const totalFaces = currentSize * currentSize;
  modeLabel.textContent = `${currentSize}x${currentSize}`;
  modeRule.textContent = `${totalFaces}個のうち1個だけハズレ（押すと怒る）`;
  for (const button of modeButtons) {
    const size = Number(button.dataset.size);
    button.classList.toggle("is-active", size === currentSize);
  }
}
