export function createAngerGame(options) {
  const {
    faceGrid,
    resetButton = null,
    angryOverlay = null,
    angryZoomFace = null,
    angryLineElement = null,
    angryLines = [],
    bodyElement = document.body,
    faceNormalSrc = "img/normal.png",
    faceAngrySrc = "img/angry.png",
    gridSize = 3,
    random = Math.random,
    schedule = setTimeout,
    intervalSchedule = setInterval,
    intervalClear = clearInterval,
    wobbleIntervalMs = 260,
    enableWobble = true,
  } = options;

  const totalTiles = gridSize * gridSize;
  let hazardIndex = randomIndex(totalTiles, random);
  let angryIndex = -1;
  let gameOver = false;
  let wobbleIntervalId = null;

  renderGrid();
  setResetVisible(false);
  setAngryOverlayVisible(false);
  if (enableWobble) startWobbleLoop();
  faceGrid.addEventListener("click", handleGridClick);
  if (resetButton) resetButton.addEventListener("click", resetGame);

  function renderGrid() {
    faceGrid.innerHTML = "";
    faceGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    for (let i = 0; i < totalTiles; i += 1) {
      const tile = document.createElement("img");
      tile.className = "face-tile";
      tile.alt = `顔 ${i + 1}`;
      tile.src = faceNormalSrc;
      tile.dataset.index = String(i);
      tile.dataset.state = "normal";

      tile.onerror = function () {
        const label = tile.dataset.state === "angry" ? "rage face missing" : "normal face missing";
        tile.src = makeFallback(label, "#ffd8d8", "#7d0000", 320, 320);
      };

      faceGrid.appendChild(tile);
    }
  }

  function handleGridClick(event) {
    const tile = event.target.closest(".face-tile");
    if (!tile || !faceGrid.contains(tile)) return;
    if (gameOver) return;
    if (tile.dataset.state === "removed") return;

    const tappedIndex = Number(tile.dataset.index);

    if (tappedIndex === hazardIndex) {
      setTileAngry(tile);
      angryIndex = tappedIndex;
      gameOver = true;
      setResetVisible(true);
      setAngryOverlayVisible(true);
      setAngryLine();
      clearWobbling();

      bodyElement.classList.add("rage");
      schedule(() => {
        bodyElement.classList.remove("rage");
      }, 500);
      return;
    }

    setTileRemoved(tile);
    if (enableWobble) refreshWobbling();
  }

  function resetGame() {
    bodyElement.classList.remove("rage");
    gameOver = false;
    angryIndex = -1;
    hazardIndex = randomIndex(totalTiles, random);
    renderGrid();
    setResetVisible(false);
    setAngryOverlayVisible(false);
    clearAngryLine();
    if (enableWobble) startWobbleLoop();
  }

  function setResetVisible(visible) {
    if (!resetButton) return;
    resetButton.classList.toggle("is-visible", visible);
    resetButton.hidden = !visible;
  }

  function setAngryOverlayVisible(visible) {
    if (!angryOverlay) return;
    if (angryZoomFace) angryZoomFace.src = faceAngrySrc;
    angryOverlay.classList.toggle("is-visible", visible);
    angryOverlay.hidden = !visible;
  }

  function setAngryLine() {
    if (!angryLineElement) return;
    if (!Array.isArray(angryLines) || angryLines.length === 0) {
      angryLineElement.textContent = "";
      return;
    }
    angryLineElement.textContent = pickRandomLine(angryLines, random);
  }

  function clearAngryLine() {
    if (!angryLineElement) return;
    angryLineElement.textContent = "";
  }

  function setTileRemoved(tile) {
    tile.dataset.state = "removed";
    tile.classList.remove("angry");
    tile.classList.remove("is-wobbling");
    tile.classList.add("removed");
    tile.src = faceNormalSrc;
  }

  function setTileAngry(tile) {
    tile.dataset.state = "angry";
    tile.classList.add("angry");
    tile.classList.remove("is-wobbling");
    tile.classList.remove("removed");
    tile.src = faceAngrySrc;
  }

  function startWobbleLoop() {
    stopWobbleLoop();
    refreshWobbling();
    wobbleIntervalId = intervalSchedule(() => {
      if (gameOver) return;
      refreshWobbling();
    }, wobbleIntervalMs);
  }

  function stopWobbleLoop() {
    if (wobbleIntervalId === null) return;
    intervalClear(wobbleIntervalId);
    wobbleIntervalId = null;
  }

  function refreshWobbling() {
    clearWobbling();
    const candidates = Array.from(faceGrid.querySelectorAll(".face-tile")).filter(
      (tile) => tile.dataset.state === "normal"
    );
    if (candidates.length === 0) return;

    const wobbleCount = Math.min(
      candidates.length,
      1 + Math.floor(random() * Math.min(3, candidates.length))
    );
    const picked = pickUnique(candidates, wobbleCount, random);
    for (const tile of picked) {
      tile.classList.add("is-wobbling");
      tile.style.animationDelay = `${Math.floor(random() * 120)}ms`;
    }
  }

  function clearWobbling() {
    const wobbling = faceGrid.querySelectorAll(".face-tile.is-wobbling");
    for (const tile of wobbling) {
      tile.classList.remove("is-wobbling");
      tile.style.animationDelay = "";
    }
  }

  function destroy() {
    faceGrid.removeEventListener("click", handleGridClick);
    if (resetButton) resetButton.removeEventListener("click", resetGame);
    stopWobbleLoop();
  }

  function getState() {
    const tiles = Array.from(faceGrid.querySelectorAll(".face-tile"));
    return {
      totalTiles: tiles.length,
      angryTiles: tiles.filter((tile) => tile.dataset.state === "angry").length,
      removedTiles: tiles.filter((tile) => tile.dataset.state === "removed").length,
      angryIndex,
      hazardIndex,
      gameOver,
    };
  }

  return { destroy, getState };
}

function randomIndex(length, random = Math.random) {
  return Math.floor(random() * length);
}

function pickUnique(items, count, random = Math.random) {
  const pool = [...items];
  const picked = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const idx = randomIndex(pool.length, random);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

function pickRandomLine(lines, random = Math.random) {
  if (lines.length === 1) return lines[0];
  return lines[randomIndex(lines.length, random)];
}

export function makeFallback(text, bg, fg, w, h) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='22' fill='${fg}'>${text}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
