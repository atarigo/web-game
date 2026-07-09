import { Container, Graphics } from "pixi.js";
import { W, H, COLORS, centeredText } from "$lib/game-engine";
import { DR, WSTN, MSTN, BENTO, MAX_LV, FOREST, HUNT } from "./constants";
import { dist, ucost, popup } from "./helpers";
import type { Player, GameState, Wk, BtnDef } from "./types";
import { spawnWk } from "./workers";
import type { SurvivalSpriteKey } from "./assets";
import type { Texture, Application } from "pixi.js";
import type { StockTexts } from "./world";

export function createHud(hudLayer: Container, mode: "normal" | "infinite") {
  const hudBg = new Graphics();
  hudBg.rect(0, 0, W, 35).fill({ color: 0x000000, alpha: 0.6 });
  hudBg.eventMode = "static";
  hudLayer.addChild(hudBg);
  const timerHud = centeredText("3:00", 55, 18, {
    size: 14,
    color: COLORS.white,
    family: "Arial",
  });
  hudLayer.addChild(timerHud);
  const scoreHud = centeredText("🏆 0", W - 55, 18, {
    size: 14,
    color: COLORS.cyan,
    family: "Arial",
  });
  hudLayer.addChild(scoreHud);
  return { timerHud, scoreHud };
}

export function refreshUI(
  mode: "normal" | "infinite",
  gs: GameState,
  P: Player,
  stockTexts: StockTexts,
  timerHud: import("pixi.js").Text,
  scoreHud: import("pixi.js").Text,
  btns: BtnDef[],
  updateCarryVisual: () => void,
) {
  const sec =
    mode === "normal"
      ? Math.max(0, Math.ceil(gs.timer / 1000))
      : Math.floor(gs.timer / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  timerHud.text = m + ":" + (s < 10 ? "0" : "") + s;
  if (mode === "normal" && sec <= 10) timerHud.style.fill = COLORS.red;
  scoreHud.text = "🏆 " + gs.score;
  stockTexts.wStockT.text = gs.wStock > 0 ? "🪵" + gs.wStock : "";
  stockTexts.mStockT.text = gs.mStock > 0 ? "🥩" + gs.mStock : "";
  stockTexts.bStockT.text = gs.bentoStock > 0 ? "🍱" + gs.bentoStock : "";
  stockTexts.bCoinT.text = gs.coins > 0 ? "💰" + gs.coins : "";
  stockTexts.wLvT.text = "Lv" + gs.wLv;
  stockTexts.mLvT.text = "Lv" + gs.mLv;
  updateCarryVisual();
  for (let i = 0; i < btns.length; i++) btns[i].update();
}

export function mkBtn(
  getText: () => string,
  isVis: () => boolean,
  isOn: () => boolean,
  onClick: () => void,
  yPos: number,
  hudLayer: Container,
  btns: BtnDef[],
  inp: { btnTapped: boolean },
  doRefresh: () => void,
): BtnDef {
  const c = new Container();
  c.x = W / 2;
  c.y = yPos;
  const bg = new Graphics();
  bg.roundRect(-70, -15, 140, 30, 6)
    .fill({ color: 0x1a1a2e, alpha: 0.9 })
    .roundRect(-70, -15, 140, 30, 6)
    .stroke({ color: COLORS.cyan, width: 1, alpha: 0.5 });
  c.addChild(bg);
  const lbl = centeredText(getText(), 0, 0, {
    size: 11,
    color: COLORS.white,
    family: "Arial",
  });
  c.addChild(lbl);
  c.eventMode = "static";
  c.cursor = "pointer";
  function doTrigger() {
    if (isOn()) {
      inp.btnTapped = true;
      onClick();
      doRefresh();
    }
  }
  c.on("pointerdown", doTrigger);
  hudLayer.addChild(c);
  c.visible = false;
  const def: BtnDef = {
    isVis,
    isOn,
    trigger: doTrigger,
    update: function () {
      const v = isVis();
      c.visible = v;
      if (v) {
        lbl.text = getText();
        c.alpha = isOn() ? 1 : 0.6;
      }
    },
  };
  btns.push(def);
  return def;
}

export interface WorkerRefs {
  wStnWk: Wk | null;
  mStnWk: Wk | null;
  cutterWk: Wk | null;
  hunterWks: Wk[];
  bentoWk: Wk | null;
}

export function createButtons(
  P: Player,
  gs: GameState,
  wkRefs: WorkerRefs,
  allWk: Wk[],
  hudLayer: Container,
  btns: BtnDef[],
  inp: { btnTapped: boolean },
  tex: Record<SurvivalSpriteKey, Texture>,
  charLayer: Container,
  fxLayer: Container,
  app: Application,
  doRefresh: () => void,
) {
  function pNearW() {
    return dist(P.x, P.y, WSTN.x, WSTN.y) < DR;
  }
  function pNearM() {
    return dist(P.x, P.y, MSTN.x, MSTN.y) < DR;
  }
  function pNearB() {
    return dist(P.x, P.y, BENTO.x, BENTO.y) < DR;
  }
  function hasBentoStock() {
    return gs.bentoStock > 0;
  }
  function useBentoStock() {
    if (gs.bentoStock > 0) gs.bentoStock--;
  }
  function carryCoins() {
    let n = 0;
    for (let i = 0; i < P.carry.length; i++) if (P.carry[i] === "coin") n++;
    return n;
  }
  function spendCoins(amount: number) {
    for (let i = 0; i < amount; i++) {
      const ci = P.carry.indexOf("coin");
      if (ci >= 0) P.carry.splice(ci, 1);
    }
  }

  mkBtn(
    function () {
      return "雇用店員 🍱1";
    },
    function () {
      return pNearW() && !wkRefs.wStnWk;
    },
    function () {
      return hasBentoStock();
    },
    function () {
      useBentoStock();
      wkRefs.wStnWk = spawnWk(
        WSTN.x + 25,
        WSTN.y,
        "clerk",
        "wood",
        tex,
        charLayer,
        allWk,
      );
      wkRefs.wStnWk.homeX = WSTN.x + 25;
      wkRefs.wStnWk.homeY = WSTN.y;
      popup("+👷", WSTN.x, WSTN.y - 30, COLORS.green, fxLayer, app);
    },
    H - 55,
    hudLayer,
    btns,
    inp,
    doRefresh,
  );
  mkBtn(
    function () {
      return "雇用樵夫 🍱1";
    },
    function () {
      return pNearW() && !wkRefs.cutterWk;
    },
    function () {
      return hasBentoStock();
    },
    function () {
      useBentoStock();
      wkRefs.cutterWk = spawnWk(
        FOREST.x,
        FOREST.y + 30,
        "lumber",
        "bento",
        tex,
        charLayer,
        allWk,
      );
      wkRefs.cutterWk.homeX = FOREST.x;
      wkRefs.cutterWk.homeY = FOREST.y + 30;
      popup("+🪓", WSTN.x, WSTN.y - 30, COLORS.green, fxLayer, app);
    },
    H - 95,
    hudLayer,
    btns,
    inp,
    doRefresh,
  );
  mkBtn(
    function () {
      return gs.wLv >= MAX_LV
        ? "木材站 MAX"
        : "⬆木材站Lv" + (gs.wLv + 1) + " 💰" + ucost(gs.wLv);
    },
    function () {
      return pNearW() && gs.wLv < MAX_LV;
    },
    function () {
      return carryCoins() >= ucost(gs.wLv);
    },
    function () {
      spendCoins(ucost(gs.wLv));
      gs.wLv++;
      popup("⬆Lv" + gs.wLv, WSTN.x, WSTN.y - 40, COLORS.cyan, fxLayer, app);
    },
    H - 135,
    hudLayer,
    btns,
    inp,
    doRefresh,
  );

  mkBtn(
    function () {
      return "雇用店員 🍱1";
    },
    function () {
      return pNearM() && !wkRefs.mStnWk;
    },
    function () {
      return hasBentoStock();
    },
    function () {
      useBentoStock();
      wkRefs.mStnWk = spawnWk(
        MSTN.x + 25,
        MSTN.y,
        "clerk",
        "meat",
        tex,
        charLayer,
        allWk,
      );
      wkRefs.mStnWk.homeX = MSTN.x + 25;
      wkRefs.mStnWk.homeY = MSTN.y;
      popup("+👷", MSTN.x, MSTN.y - 30, COLORS.green, fxLayer, app);
    },
    H - 55,
    hudLayer,
    btns,
    inp,
    doRefresh,
  );
  mkBtn(
    function () {
      return "雇用獵人 🍱1";
    },
    function () {
      return pNearM() && wkRefs.hunterWks.length < 2;
    },
    function () {
      return hasBentoStock();
    },
    function () {
      useBentoStock();
      const ox = wkRefs.hunterWks.length === 0 ? 0 : 20;
      const hw = spawnWk(
        HUNT.x + ox,
        HUNT.y + 30,
        "hunter",
        "bento",
        tex,
        charLayer,
        allWk,
      );
      hw.homeX = HUNT.x + ox;
      hw.homeY = HUNT.y + 30;
      wkRefs.hunterWks.push(hw);
      popup("+🏹", MSTN.x, MSTN.y - 30, COLORS.green, fxLayer, app);
    },
    H - 95,
    hudLayer,
    btns,
    inp,
    doRefresh,
  );
  mkBtn(
    function () {
      return gs.mLv >= MAX_LV
        ? "肉品站 MAX"
        : "⬆肉品站Lv" + (gs.mLv + 1) + " 💰" + ucost(gs.mLv);
    },
    function () {
      return pNearM() && gs.mLv < MAX_LV;
    },
    function () {
      return carryCoins() >= ucost(gs.mLv);
    },
    function () {
      spendCoins(ucost(gs.mLv));
      gs.mLv++;
      popup("⬆Lv" + gs.mLv, MSTN.x, MSTN.y - 40, COLORS.cyan, fxLayer, app);
    },
    H - 135,
    hudLayer,
    btns,
    inp,
    doRefresh,
  );

  mkBtn(
    function () {
      return "吃便當 🍱1";
    },
    function () {
      return pNearB();
    },
    function () {
      return hasBentoStock() && P.hp < P.maxHp;
    },
    function () {
      useBentoStock();
      P.hp = P.maxHp;
      popup("+❤️", P.x, P.y - 65, COLORS.green, fxLayer, app);
    },
    H - 55,
    hudLayer,
    btns,
    inp,
    doRefresh,
  );
  mkBtn(
    function () {
      return "雇用店員 🍱1";
    },
    function () {
      return pNearB() && !wkRefs.bentoWk;
    },
    function () {
      return hasBentoStock();
    },
    function () {
      useBentoStock();
      wkRefs.bentoWk = spawnWk(
        BENTO.x + 25,
        BENTO.y,
        "clerk",
        "bento",
        tex,
        charLayer,
        allWk,
      );
      wkRefs.bentoWk.homeX = BENTO.x + 25;
      wkRefs.bentoWk.homeY = BENTO.y;
      popup("+👷", BENTO.x, BENTO.y - 30, COLORS.green, fxLayer, app);
    },
    H - 95,
    hudLayer,
    btns,
    inp,
    doRefresh,
  );
}
