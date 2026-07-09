import { Graphics } from "pixi.js";
import { centeredText, COLORS } from "$lib/game-engine";
import type { Application, Container } from "pixi.js";
import type { IType, Drop } from "./types";

export function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

export function hpBar(
  g: Graphics,
  hp: number,
  max: number,
  ox: number,
  oy: number,
  col: number,
) {
  g.clear();
  const bw = 32;
  g.rect(ox - bw / 2, oy, bw, 4).fill({ color: 0x333333, alpha: 0.5 });
  g.rect(ox - bw / 2, oy, bw * Math.max(0, hp / max), 4).fill(col);
}

export function popup(
  s: string,
  x: number,
  y: number,
  col: number,
  fxLayer: Container,
  app: Application,
) {
  const t = centeredText(s, x, y, { size: 15, color: col, family: "Arial" });
  fxLayer.addChild(t);
  let p = 0;
  const tk = function () {
    p += 0.03;
    t.y -= 1;
    t.alpha = 1 - p;
    if (p >= 1) {
      app.ticker.remove(tk);
      t.destroy();
    }
  };
  app.ticker.add(tk);
}

export function mkGfx(type: IType | "coin"): Graphics {
  const g = new Graphics();
  if (type === "wood")
    g.roundRect(-7, -4, 14, 8, 2)
      .fill(0x8a6a3a)
      .rect(-4, -1, 8, 3)
      .fill(0x6a4a2a);
  else if (type === "meat")
    g.circle(0, 0, 7).fill(0xcc4444).circle(-2, -1, 3).fill(0xee6666);
  else if (type === "coin")
    g.circle(0, 0, 7).fill(COLORS.gold).circle(0, 0, 4).fill(0xeebb00);
  else g.rect(-7, -5, 14, 10).fill(0xeeeeee).rect(-4, -2, 8, 4).fill(0xcc4444);
  return g;
}

export function spawnDrop(
  type: IType | "coin",
  x: number,
  y: number,
  itemLayer: Container,
  drops: Drop[],
) {
  const gfx = mkGfx(type);
  const dx = (Math.random() - 0.5) * 30;
  const dy = (Math.random() - 0.5) * 20;
  gfx.x = x + dx;
  gfx.y = y + dy;
  itemLayer.addChild(gfx);
  drops.push({
    type,
    x: gfx.x,
    y: gfx.y,
    gfx,
    vy: -3,
    bounceY: y + dy,
    landed: false,
    flying: false,
  });
}

export function flyTo(
  d: Drop,
  tx: number,
  ty: number,
  cb: () => void,
  app: Application,
) {
  d.flying = true;
  const fx = d.x,
    fy = d.y;
  let t = 0;
  const tk = function () {
    t += app.ticker.deltaMS;
    const p = Math.min(t / 300, 1);
    d.gfx.x = d.x = fx + (tx - fx) * p;
    d.gfx.y = d.y = fy + (ty - fy) * p - Math.sin(p * Math.PI) * 40;
    if (p >= 1) {
      app.ticker.remove(tk);
      cb();
    }
  };
  app.ticker.add(tk);
}

export function rmDrop(d: Drop, drops: Drop[]) {
  const i = drops.indexOf(d);
  if (i >= 0) drops.splice(i, 1);
  if (!d.gfx.destroyed) d.gfx.destroy();
}

export function ucost(lv: number) {
  return Math.floor(8 * Math.pow(1.6, lv - 1));
}
export function prodMs(lv: number) {
  return 1000 / (1 + (lv - 1) * 0.35);
}

export type PlayerDir = "down" | "up" | "left" | "right";

export function moveDir(dx: number, dy: number): PlayerDir {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}
