import { Container, Graphics, Sprite, type Texture } from "pixi.js";
import type { SurvivalSpriteKey } from "./assets";
import { COLORS } from "$lib/game-engine";
import {
  FOREST,
  HUNT,
  DMG,
  AGGRO_R,
  ATK_R,
  BEAR_SPD,
  BEAR_DMG,
  BEAR_ACD,
} from "./constants";
import type { Tree, Beast, Drop, Wk, Player } from "./types";
import { dist, hpBar, popup, spawnDrop } from "./helpers";
import { makeSprite } from "./world";
import type { Application, Container as Cont } from "pixi.js";

export function spawnTree(
  trees: Tree[],
  stumps: Sprite[],
  objLayer: Container,
  tex: Record<SurvivalSpriteKey, Texture>,
) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * (FOREST.r - 15);
  const x = FOREST.x + Math.cos(angle) * radius;
  const y = FOREST.y + Math.sin(angle) * radius;
  const max = 6 + Math.floor(Math.random() * 4);
  const c = new Container();
  c.x = x;
  c.y = y;
  c.zIndex = y;
  const sh = new Graphics();
  sh.ellipse(0, 6, 18, 8).fill({ color: 0x000000, alpha: 0.2 });
  c.addChild(sh);
  const trunk = new Graphics();
  trunk.rect(-5, -26, 10, 32).fill(0x6b4f35);
  c.addChild(trunk);
  const canopy = new Graphics();
  canopy.circle(0, -36, 22).fill(0x496f67);
  canopy.circle(-8, -28, 14).fill(0x3e625b);
  canopy.circle(8, -28, 14).fill(0x334f4b);
  canopy
    .moveTo(-16, -40)
    .lineTo(16, -38)
    .stroke({ color: 0xd7eef0, width: 3, alpha: 0.9 });
  c.addChild(canopy);
  sh.visible = trunk.visible = canopy.visible = false;
  const sprite = makeSprite(tex, "treeFull", 62, 76, 0.9);
  c.addChild(sprite);
  const bar = new Graphics();
  c.addChild(bar);
  objLayer.addChild(c);
  const tree: Tree = { c, sprite, x, y, hp: max, max, bar };
  trees.push(tree);
  hpBar(bar, max, max, 0, -62, COLORS.green);
}

export function hitTree(
  t: Tree,
  trees: Tree[],
  stumps: Sprite[],
  objLayer: Container,
  tex: Record<SurvivalSpriteKey, Texture>,
  drops: Drop[],
  itemLayer: Container,
  fxLayer: Container,
  app: Application,
  stats: { statTrees: number; score: number },
) {
  t.hp -= DMG;
  t.c.x = t.x + (Math.random() - 0.5) * 5;
  setTimeout(function () {
    if (!t.c.destroyed) t.c.x = t.x;
  }, 80);
  popup("-" + DMG, t.x, t.y - 65, COLORS.yellow, fxLayer, app);
  if (t.hp <= 0) {
    const stump = makeSprite(tex, "treeStump", 46, 36, 0.86);
    stump.x = t.x;
    stump.y = t.y;
    stump.zIndex = t.y - 1;
    objLayer.addChild(stump);
    stumps.push(stump);
    if (stumps.length > 8) {
      const old = stumps.shift();
      if (old && !old.destroyed) old.destroy();
    }
    t.c.destroy();
    trees.splice(trees.indexOf(t), 1);
    stats.statTrees++;
    stats.score += 10;
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) spawnDrop("wood", t.x, t.y, itemLayer, drops);
  } else {
    if (t.hp <= t.max / 2)
      t.sprite.texture = tex.treeDamaged as unknown as Texture;
    hpBar(t.bar, t.hp, t.max, 0, -62, COLORS.green);
  }
}

export function spawnBeast(
  beasts: Beast[],
  objLayer: Container,
  tex: Record<SurvivalSpriteKey, Texture>,
) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * (HUNT.r - 15);
  const x = HUNT.x + Math.cos(angle) * radius;
  const y = HUNT.y + Math.sin(angle) * radius;
  const max = 16 + Math.floor(Math.random() * 6);
  const c = new Container();
  c.x = x;
  c.y = y;
  c.zIndex = y;
  const sh = new Graphics();
  sh.ellipse(0, 4, 16, 7).fill({ color: 0x000000, alpha: 0.2 });
  c.addChild(sh);
  const body = new Graphics();
  body.ellipse(0, -10, 18, 11).fill(0x6f6257);
  c.addChild(body);
  const head = new Graphics();
  head.circle(16, -15, 8).fill(0x756555);
  c.addChild(head);
  const snout = new Graphics();
  snout.poly([22, -14, 30, -11, 22, -8]).fill(0xb9c1bf);
  c.addChild(snout);
  const eye = new Graphics();
  eye.circle(19, -17, 2).fill(0x071014);
  c.addChild(eye);
  const legs = new Graphics();
  for (const lx of [-10, -3, 5, 12]) legs.rect(lx, -2, 4, 10).fill(0x3d332b);
  c.addChild(legs);
  sh.visible =
    body.visible =
    head.visible =
    snout.visible =
    eye.visible =
    legs.visible =
      false;
  const sprite = makeSprite(tex, "boarIdle", 72, 54, 0.82);
  c.addChild(sprite);
  const bar = new Graphics();
  c.addChild(bar);
  objLayer.addChild(c);
  const b: Beast = {
    c,
    sprite,
    x,
    y,
    hp: max,
    max,
    bar,
    vx: (Math.random() - 0.5) * 0.5,
    vy2: (Math.random() - 0.5) * 0.5,
    mt: 1200 + Math.random() * 1500,
    walkT: 0,
    hitT: 0,
    atkCD: 0,
    attackT: 0,
  };
  beasts.push(b);
  hpBar(bar, max, max, 0, -36, COLORS.red);
}

export function hitBeast(
  b: Beast,
  beasts: Beast[],
  drops: Drop[],
  itemLayer: Container,
  fxLayer: Container,
  app: Application,
  tex: Record<SurvivalSpriteKey, Texture>,
  stats: { statBeasts: number; score: number },
) {
  b.hp -= DMG;
  b.hitT = 220;
  b.sprite.texture = tex.boarHit as unknown as Texture;
  b.c.x = b.x + (Math.random() - 0.5) * 6;
  setTimeout(function () {
    if (!b.c.destroyed) b.c.x = b.x;
  }, 80);
  popup("-" + DMG, b.x, b.y - 32, COLORS.red, fxLayer, app);
  if (b.hp <= 0) {
    b.c.destroy();
    beasts.splice(beasts.indexOf(b), 1);
    stats.statBeasts++;
    stats.score += 10;
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) spawnDrop("meat", b.x, b.y, itemLayer, drops);
  } else {
    hpBar(b.bar, b.hp, b.max, 0, -36, COLORS.red);
  }
}

export function hitPlayerByBeast(
  dmg: number,
  P: Player,
  fxLayer: Container,
  app: Application,
  onDie: () => void,
) {
  if (P.invT > 0) return;
  P.hp -= dmg;
  popup("-" + dmg, P.x, P.y - 45, COLORS.red, fxLayer, app);
  if (P.hp <= 0) {
    P.hp = 0;
    onDie();
  }
}

export function hitHunterByBeast(
  wk: Wk,
  dmg: number,
  allWk: Wk[],
  hunterWks: Wk[],
  fxLayer: Container,
  app: Application,
) {
  wk.hp -= dmg;
  popup("-" + dmg, wk.x, wk.y - 35, COLORS.red, fxLayer, app);
  wk.c.x = wk.x + (Math.random() - 0.5) * 5;
  setTimeout(function () {
    if (!wk.c.destroyed) wk.c.x = wk.x;
  }, 80);
  if (wk.hp <= 0) {
    wk.c.destroy();
    const idx = allWk.indexOf(wk);
    if (idx >= 0) allWk.splice(idx, 1);
    const hi = hunterWks.indexOf(wk);
    if (hi >= 0) hunterWks.splice(hi, 1);
    popup("💀獵人陣亡", wk.x, wk.y - 50, COLORS.red, fxLayer, app);
  } else {
    hpBar(wk.hpBar, wk.hp, wk.maxHp, 0, -52, COLORS.green);
    if (wk.hp <= wk.maxHp * 0.1 && wk.hunger === "working") {
      wk.tgt = null;
      wk.hunger = "toEat";
    }
  }
}

export function updateBeastsAI(
  beasts: Beast[],
  P: Player,
  hunterWks: Wk[],
  allWk: Wk[],
  tex: Record<SurvivalSpriteKey, Texture>,
  fxLayer: Container,
  app: Application,
  dt: number,
  tf: number,
  onPlayerDie: () => void,
) {
  for (let i = 0; i < beasts.length; i++) {
    const a = beasts[i];
    a.hitT -= dt;
    a.atkCD -= dt;
    a.attackT -= dt;

    let aggroX = 0,
      aggroY = 0;
    let hasAggro = false;
    let aggroIsPlayer = false;
    let aggroWk: Wk | null = null;

    const dP = dist(a.x, a.y, P.x, P.y);
    let dH = Infinity;
    let closestHunter: Wk | null = null;
    for (let hi = 0; hi < hunterWks.length; hi++) {
      if (!hunterWks[hi].c.destroyed) {
        const hd = dist(a.x, a.y, hunterWks[hi].x, hunterWks[hi].y);
        if (hd < dH) {
          dH = hd;
          closestHunter = hunterWks[hi];
        }
      }
    }

    if (dP < AGGRO_R || dH < AGGRO_R) {
      if (dist(a.x, a.y, HUNT.x, HUNT.y) < HUNT.r + 40) {
        if (dP <= dH) {
          aggroX = P.x;
          aggroY = P.y;
          hasAggro = true;
          aggroIsPlayer = true;
        } else if (closestHunter) {
          aggroX = closestHunter.x;
          aggroY = closestHunter.y;
          hasAggro = true;
          aggroWk = closestHunter;
        }
      }
    }

    if (hasAggro) {
      const ddx = aggroX - a.x,
        ddy = aggroY - a.y;
      const dd = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dd > ATK_R) {
        a.x += (ddx / dd) * BEAR_SPD * tf;
        a.y += (ddy / dd) * BEAR_SPD * tf;
      }
      if (dd <= ATK_R && a.atkCD <= 0) {
        a.atkCD = BEAR_ACD;
        a.attackT = 420;
        if (aggroIsPlayer)
          hitPlayerByBeast(BEAR_DMG, P, fxLayer, app, onPlayerDie);
        else if (aggroWk)
          hitHunterByBeast(aggroWk, BEAR_DMG, allWk, hunterWks, fxLayer, app);
      }
      a.walkT += tf;
    } else {
      const homeDist = dist(a.x, a.y, HUNT.x, HUNT.y);
      if (homeDist > HUNT.r - 10) {
        const ddx = HUNT.x - a.x,
          ddy = HUNT.y - a.y;
        const dd = Math.sqrt(ddx * ddx + ddy * ddy);
        a.x += (ddx / dd) * 1.5 * tf;
        a.y += (ddy / dd) * 1.5 * tf;
        a.walkT += tf;
      } else {
        a.mt -= dt;
        if (a.mt <= 0) {
          a.vx = (Math.random() - 0.5) * 0.5;
          a.vy2 = (Math.random() - 0.5) * 0.5;
          a.mt = 1500 + Math.random() * 2000;
        }
        a.x += a.vx * tf;
        a.y += a.vy2 * tf;
        a.walkT += Math.abs(a.vx) + Math.abs(a.vy2) > 0.05 ? tf : 0;
      }
    }

    if (a.hitT > 0) {
      a.sprite.texture = tex.boarHit as unknown as Texture;
    } else if (a.attackT > 0) {
      a.sprite.texture = tex[
        a.attackT > 210 ? "bearAttack1" : "bearAttack2"
      ] as unknown as Texture;
    } else {
      a.sprite.texture = tex[
        Math.floor(a.walkT / 18) % 2 === 0 ? "boarWalk1" : "boarWalk2"
      ] as unknown as Texture;
    }
    if (!a.c.destroyed) {
      a.c.x = a.x;
      a.c.y = a.y;
      a.c.zIndex = a.y;
    }
  }
}
