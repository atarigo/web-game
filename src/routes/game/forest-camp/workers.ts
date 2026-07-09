import { Container, Graphics, type Texture } from "pixi.js";
import { COLORS } from "$lib/game-engine";
import type { SurvivalSpriteKey } from "./assets";
import { ACD, BENTO, WORK_FRAME_MS } from "./constants";
import type { Wk, ClerkRole, Tree, Beast, Drop } from "./types";
import { dist, hpBar, popup, moveDir } from "./helpers";
import { makeSprite } from "./world";
import { hitTree, hitBeast } from "./entities";
import type { Application } from "pixi.js";

export function clerkPrefix(role: ClerkRole) {
  return role === "wood"
    ? "clerkWood"
    : role === "meat"
      ? "clerkMeat"
      : "clerk";
}

export function spawnWk(
  x: number,
  y: number,
  kind: "clerk" | "lumber" | "hunter",
  clerkRole: ClerkRole,
  tex: Record<SurvivalSpriteKey, Texture>,
  charLayer: Container,
  allWk: Wk[],
): Wk {
  const c = new Container();
  c.x = x;
  c.y = y;
  c.zIndex = y;
  const sh = new Graphics();
  sh.ellipse(0, 2, 8, 4).fill({ color: 0x000000, alpha: 0.2 });
  c.addChild(sh);
  const body = new Graphics();
  body
    .rect(-5, -5, 10, 14)
    .fill(
      kind === "lumber" ? 0x466548 : kind === "hunter" ? 0x65543f : 0x5a5f63,
    );
  c.addChild(body);
  const hood = new Graphics();
  hood.circle(0, -12, 7).fill(0x263845);
  c.addChild(hood);
  const head = new Graphics();
  head.circle(1, -11, 5).fill(0xd1a072);
  c.addChild(head);
  sh.visible = body.visible = hood.visible = head.visible = false;
  const sprite = makeSprite(
    tex,
    (kind === "lumber"
      ? "lumberDownIdle"
      : kind === "hunter"
        ? "hunterDownIdle"
        : `${clerkPrefix(clerkRole)}DownIdle`) as SurvivalSpriteKey,
    36,
    46,
    0.86,
  );
  // 工人共用男主角幀，依類型上不同 tint 以便區分（素材層視覺調整）
  sprite.tint =
    kind === "lumber"
      ? 0x8fd48f
      : kind === "hunter"
        ? 0xe6b566
        : clerkRole === "wood"
          ? 0xd9c08a
          : clerkRole === "meat"
            ? 0xe69a9a
            : 0x9fb8e6;
  c.addChild(sprite);
  charLayer.addChild(c);
  const wkHp = kind === "hunter" ? 60 : 0;
  const hpG = new Graphics();
  c.addChild(hpG);
  if (kind === "hunter") hpBar(hpG, wkHp, wkHp, 0, -52, COLORS.green);
  const wk: Wk = {
    c,
    sprite,
    kind,
    clerkRole,
    x,
    y,
    homeX: x,
    homeY: y,
    face: 1,
    dir: "down",
    walkT: 0,
    workCount: 0,
    hunger: "working",
    tgt: null,
    atkT: 0,
    hp: wkHp,
    maxHp: wkHp,
    hpBar: hpG,
  };
  allWk.push(wk);
  return wk;
}

export function setWorkerTexture(
  wk: Wk,
  tex: Record<SurvivalSpriteKey, Texture>,
  timer: number,
) {
  const prefix =
    wk.kind === "lumber"
      ? "lumber"
      : wk.kind === "hunter"
        ? "hunter"
        : clerkPrefix(wk.clerkRole);
  const dir = wk.dir[0].toUpperCase() + wk.dir.slice(1);
  if (wk.hunger === "working" && wk.walkT === 0) {
    const workFrame =
      wk.kind === "clerk"
        ? (Math.floor(timer / 300) % 2) + 1
        : (Math.floor(wk.atkT / WORK_FRAME_MS) % 2) + 1;
    wk.sprite.texture = tex[
      `${prefix}${dir}Work${workFrame}` as SurvivalSpriteKey
    ] as unknown as Texture;
    return;
  }
  if (wk.walkT > 0) {
    wk.sprite.texture = tex[
      `${prefix}${dir}Walk${Math.floor(wk.walkT / 10) % 2 === 0 ? 1 : 2}` as SurvivalSpriteKey
    ] as unknown as Texture;
    return;
  }
  wk.sprite.texture = tex[
    `${prefix}${dir}Idle` as SurvivalSpriteKey
  ] as unknown as Texture;
}

export function updateWorkersAI(
  allWk: Wk[],
  cutterWk: Wk | null,
  hunterWks: Wk[],
  trees: Tree[],
  beasts: Beast[],
  stumps: import("pixi.js").Sprite[],
  objLayer: Container,
  drops: Drop[],
  itemLayer: Container,
  fxLayer: Container,
  app: Application,
  tex: Record<SurvivalSpriteKey, Texture>,
  gs: {
    bentoStock: number;
    score: number;
    statTrees: number;
    statBeasts: number;
  },
  timer: number,
  dt: number,
  tf: number,
  refreshUI: () => void,
) {
  for (let wi = 0; wi < allWk.length; wi++) {
    const wk = allWk[wi];

    if (wk.hunger === "toEat") {
      const d2 = dist(wk.x, wk.y, BENTO.x, BENTO.y + 15);
      if (d2 > 8) {
        const ddx = BENTO.x - wk.x,
          ddy = BENTO.y + 15 - wk.y;
        const dd = Math.sqrt(ddx * ddx + ddy * ddy);
        wk.x += (ddx / dd) * 2.5 * tf;
        wk.y += (ddy / dd) * 2.5 * tf;
        if (Math.abs(ddx) > 0.5) wk.face = ddx > 0 ? 1 : -1;
        wk.dir = moveDir(ddx, ddy);
        wk.walkT++;
      } else {
        wk.hunger = "eating";
        wk.walkT = 0;
      }
    } else if (wk.hunger === "eating") {
      if (gs.bentoStock > 0) {
        gs.bentoStock--;
        wk.workCount = 0;
        if (wk.kind === "hunter" && wk.hp < wk.maxHp) {
          wk.hp = wk.maxHp;
          hpBar(wk.hpBar, wk.hp, wk.maxHp, 0, -52, COLORS.green);
          popup("+❤️", wk.x, wk.y - 50, COLORS.green, fxLayer, app);
        }
        wk.hunger = "returning";
        refreshUI();
      }
    } else if (wk.hunger === "returning") {
      const d2 = dist(wk.x, wk.y, wk.homeX, wk.homeY);
      if (d2 > 8) {
        const ddx = wk.homeX - wk.x,
          ddy = wk.homeY - wk.y;
        const dd = Math.sqrt(ddx * ddx + ddy * ddy);
        wk.x += (ddx / dd) * 2.5 * tf;
        wk.y += (ddy / dd) * 2.5 * tf;
        if (Math.abs(ddx) > 0.5) wk.face = ddx > 0 ? 1 : -1;
        wk.dir = moveDir(ddx, ddy);
        wk.walkT++;
      } else {
        wk.hunger = "working";
        wk.walkT = 0;
      }
    } else if (wk.hunger === "working") {
      if (wk === cutterWk) {
        if (wk.tgt && wk.tgt.c.destroyed) wk.tgt = null;
        if (!wk.tgt && trees.length > 0) {
          let best: Tree | null = null,
            bd = Infinity;
          for (let j = 0; j < trees.length; j++) {
            const d2 = dist(wk.x, wk.y, trees[j].x, trees[j].y);
            if (d2 < bd) {
              bd = d2;
              best = trees[j];
            }
          }
          wk.tgt = best;
        }
        if (wk.tgt) {
          const d2 = dist(wk.x, wk.y, wk.tgt.x, wk.tgt.y);
          if (d2 > 25) {
            const ddx = wk.tgt.x - wk.x,
              ddy = wk.tgt.y - wk.y;
            const dd = Math.sqrt(ddx * ddx + ddy * ddy);
            wk.x += (ddx / dd) * 2 * tf;
            wk.y += (ddy / dd) * 2 * tf;
            if (Math.abs(ddx) > 0.5) wk.face = ddx > 0 ? 1 : -1;
            wk.dir = moveDir(ddx, ddy);
            wk.walkT++;
          } else {
            wk.walkT = 0;
            wk.atkT -= dt;
            if (wk.atkT <= 0) {
              wk.atkT = ACD;
              const before = trees.length;
              hitTree(
                wk.tgt as Tree,
                trees,
                stumps,
                objLayer,
                tex,
                drops,
                itemLayer,
                fxLayer,
                app,
                gs,
              );
              if (trees.length < before) {
                wk.tgt = null;
                wk.workCount++;
                if (wk.workCount >= 5) wk.hunger = "toEat";
              }
            }
          }
        }
      }

      if (hunterWks.indexOf(wk) >= 0) {
        if (wk.tgt && (wk.tgt as Beast).c.destroyed) wk.tgt = null;
        if (!wk.tgt && beasts.length > 0) {
          let best: Beast | null = null,
            bd = Infinity;
          for (let j = 0; j < beasts.length; j++) {
            const d2 = dist(wk.x, wk.y, beasts[j].x, beasts[j].y);
            if (d2 < bd) {
              bd = d2;
              best = beasts[j];
            }
          }
          wk.tgt = best;
        }
        if (wk.tgt) {
          const d2 = dist(wk.x, wk.y, wk.tgt.x, wk.tgt.y);
          if (d2 > 25) {
            const ddx = wk.tgt.x - wk.x,
              ddy = wk.tgt.y - wk.y;
            const dd = Math.sqrt(ddx * ddx + ddy * ddy);
            wk.x += (ddx / dd) * 2 * tf;
            wk.y += (ddy / dd) * 2 * tf;
            if (Math.abs(ddx) > 0.5) wk.face = ddx > 0 ? 1 : -1;
            wk.dir = moveDir(ddx, ddy);
            wk.walkT++;
          } else {
            wk.walkT = 0;
            wk.atkT -= dt;
            if (wk.atkT <= 0) {
              wk.atkT = ACD;
              const before = beasts.length;
              hitBeast(
                wk.tgt as Beast,
                beasts,
                drops,
                itemLayer,
                fxLayer,
                app,
                tex,
                gs,
              );
              if (beasts.length < before) {
                wk.tgt = null;
                wk.workCount++;
                if (wk.workCount >= 5) wk.hunger = "toEat";
              }
            }
          }
        }
      }
    }

    wk.c.x = wk.x;
    wk.c.y = wk.y;
    wk.c.zIndex = wk.y;
    wk.c.scale.x = 1;
    setWorkerTexture(wk, tex, timer);
  }
}
