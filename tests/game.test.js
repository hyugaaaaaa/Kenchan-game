import { describe, expect, test } from "vitest";
import { createAngerGame } from "../game.js";

function setupDom() {
  document.body.innerHTML = `
    <div id="faceGrid"></div>
    <button id="resetButton" hidden>もう一回</button>
    <div id="angryOverlay" hidden>
      <img id="angryZoomFace" src="img/angry.png" />
      <p id="angryLine"></p>
    </div>
  `;

  return {
    faceGrid: document.getElementById("faceGrid"),
    resetButton: document.getElementById("resetButton"),
    angryOverlay: document.getElementById("angryOverlay"),
    angryZoomFace: document.getElementById("angryZoomFace"),
    angryLineElement: document.getElementById("angryLine"),
  };
}

function clickTile(tile) {
  tile.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function createIntervalMock() {
  return {
    intervalSchedule: () => 1,
    intervalClear: () => {},
  };
}

function createBaseOptions(dom, extra = {}) {
  return {
    ...dom,
    angryLines: ["固定セリフ"],
    enableWobble: false,
    ...createIntervalMock(),
    ...extra,
  };
}

describe("createAngerGame", () => {
  test("renders a 3x3 grid and stores one hazard index", () => {
    const dom = setupDom();
    const random = () => 0.5;
    const game = createAngerGame(createBaseOptions(dom, { gridSize: 3, random }));
    const tiles = dom.faceGrid.querySelectorAll(".face-tile");

    expect(tiles).toHaveLength(9);
    expect(game.getState().hazardIndex).toBe(4);
    expect(game.getState().removedTiles).toBe(0);
    expect(game.getState().angryTiles).toBe(0);
    expect(dom.resetButton.hidden).toBe(true);
    expect(dom.angryOverlay.hidden).toBe(true);
    game.destroy();
  });

  test("safe tile tap removes only that tile", () => {
    const dom = setupDom();
    const random = () => 0; // hazard is tile 0
    const game = createAngerGame(createBaseOptions(dom, { gridSize: 3, random }));
    const tiles = Array.from(dom.faceGrid.querySelectorAll(".face-tile"));

    clickTile(tiles[1]);

    expect(tiles[1].dataset.state).toBe("removed");
    expect(tiles[0].dataset.state).toBe("normal");
    expect(game.getState().removedTiles).toBe(1);
    expect(game.getState().angryTiles).toBe(0);
    game.destroy();
  });

  test("hazard tile tap turns angry and ends game", () => {
    const dom = setupDom();
    const random = () => 0;
    const schedule = () => 1;
    const game = createAngerGame(createBaseOptions(dom, { gridSize: 3, random, schedule }));
    const tiles = Array.from(dom.faceGrid.querySelectorAll(".face-tile"));

    clickTile(tiles[0]);

    expect(tiles[0].dataset.state).toBe("angry");
    expect(game.getState().angryTiles).toBe(1);
    expect(game.getState().gameOver).toBe(true);
    expect(dom.resetButton.hidden).toBe(false);
    expect(dom.angryOverlay.hidden).toBe(false);
    expect(dom.angryZoomFace.getAttribute("src")).toBe("img/angry.png");
    expect(dom.angryLineElement.textContent).toBe("固定セリフ");

    clickTile(tiles[1]);
    expect(tiles[1].dataset.state).toBe("normal");
    expect(game.getState().removedTiles).toBe(0);
    game.destroy();
  });

  test("reset button restarts the game with fresh tiles", () => {
    const dom = setupDom();
    const randomValues = [0, 0.999999];
    let i = 0;
    const random = () => randomValues[i++] ?? 0;
    const game = createAngerGame(createBaseOptions(dom, { gridSize: 3, random }));
    let tiles = Array.from(dom.faceGrid.querySelectorAll(".face-tile"));

    clickTile(tiles[0]);
    expect(game.getState().gameOver).toBe(true);
    expect(dom.resetButton.hidden).toBe(false);

    dom.resetButton.click();

    tiles = Array.from(dom.faceGrid.querySelectorAll(".face-tile"));
    expect(tiles).toHaveLength(9);
    expect(game.getState().gameOver).toBe(false);
    expect(game.getState().removedTiles).toBe(0);
    expect(game.getState().angryTiles).toBe(0);
    expect(game.getState().hazardIndex).toBe(8);
    expect(dom.resetButton.hidden).toBe(true);
    expect(dom.angryOverlay.hidden).toBe(true);
    expect(dom.angryLineElement.textContent).toBe("");
    game.destroy();
  });

  test("supports non-3x3 mode (5x5)", () => {
    const dom = setupDom();
    const random = () => 0.2;
    const game = createAngerGame(createBaseOptions(dom, { gridSize: 5, random }));
    const tiles = dom.faceGrid.querySelectorAll(".face-tile");

    expect(tiles).toHaveLength(25);
    expect(dom.faceGrid.style.gridTemplateColumns).toBe("repeat(5, 1fr)");
    game.destroy();
  });

  test("shows one of the angry lines randomly on hazard", () => {
    const dom = setupDom();
    const randomValues = [0, 0.99]; // hazard index 0 then last line
    let i = 0;
    const random = () => randomValues[i++] ?? 0;
    const lines = ["A", "B", "C", "D"];
    const game = createAngerGame(
      createBaseOptions(dom, { gridSize: 3, random, angryLines: lines })
    );
    const tiles = Array.from(dom.faceGrid.querySelectorAll(".face-tile"));

    clickTile(tiles[0]);
    expect(lines).toContain(dom.angryLineElement.textContent);
    expect(dom.angryLineElement.textContent).toBe("D");
    game.destroy();
  });
});
