import { Assets, Graphics, Texture, groupD8 } from "pixi.js";
import type { Renderer } from "pixi.js";
import { WW, WH } from "./constants";

// 與舊版 $lib/survival-loop-assets 相同：鍵型別實際上是 string
export type SurvivalSpriteKey = string;

const BASE = "/assets/forest-camp";

export const heroPreviewUrls = {
  male: `${BASE}/male_axe_idle_down_000.png`,
  female: `${BASE}/female_axe_idle_down_000.png`,
} as const;

// --- 尺寸適配 ---
// 新幀為 256x256 畫布（熊 320x256），角色錨點在 [128, 220]（熊 [160, 220]）。
// 實測角色不透明範圍：人物高約 163px（y 57~219），熊高約 169px（y 51~219）。
// 舊遊戲人物顯示高 58（攻擊時 66）、工人 46、山豬 54；熊按比例略大於人 → 64。
const HERO_CHAR_HEIGHT = 163;
const BEAR_CHAR_HEIGHT = 169;
export const CHAR_ANCHOR_Y = 220 / 256;
export const HERO_SCALE = 58 / HERO_CHAR_HEIGHT;
export const HERO_ATTACK_SCALE = 66 / HERO_CHAR_HEIGHT;
const WORKER_SCALE = 46 / HERO_CHAR_HEIGHT;
const BEAR_SCALE = 64 / BEAR_CHAR_HEIGHT;

export interface SpriteMeta {
  anchorX: number;
  anchorY: number;
  scale: number;
}

// 角色類貼圖改用 ooxx 錨點與等比縮放；回傳 null 的鍵沿用舊的 width/height 拉伸路徑
export function spriteMeta(key: SurvivalSpriteKey): SpriteMeta | null {
  if (key.startsWith("hero"))
    return { anchorX: 0.5, anchorY: CHAR_ANCHOR_Y, scale: HERO_SCALE };
  if (
    key.startsWith("lumber") ||
    key.startsWith("hunter") ||
    key.startsWith("clerk")
  )
    return { anchorX: 0.5, anchorY: CHAR_ANCHOR_Y, scale: WORKER_SCALE };
  if (key.startsWith("boar") || key.startsWith("bear"))
    return { anchorX: 0.5, anchorY: CHAR_ANCHOR_Y, scale: BEAR_SCALE };
  return null;
}

// --- 舊鍵 → 新幀對應 ---
// 主角：idle→idle_000；walk1→walk_002、walk2→walk_005（相反跨步）；
// chop1/2/3 與 attack1/2/3→attack_1_001/003/005；work1/2→attack_1_002/004。
const HERO_SUFFIX_MAP: Record<string, [string, number]> = {
  Idle: ["idle", 0],
  Walk1: ["walk", 2],
  Walk2: ["walk", 5],
  Work1: ["attack_1", 2],
  Work2: ["attack_1", 4],
  Chop1: ["attack_1", 1],
  Chop2: ["attack_1", 3],
  Chop3: ["attack_1", 5],
  Attack1: ["attack_1", 1],
  Attack2: ["attack_1", 3],
  Attack3: ["attack_1", 5],
};

// 工人：全部用男主角幀；idle/walk 用 walk 幀、work 用 attack 幀
const WORKER_SUFFIX_MAP: Record<string, [string, number]> = {
  Idle: ["walk", 0],
  Walk1: ["walk", 2],
  Walk2: ["walk", 5],
  Work1: ["attack_1", 2],
  Work2: ["attack_1", 4],
};

const WORKER_PREFIXES = ["lumber", "hunter", "clerk", "clerkWood", "clerkMeat"];

const DIRS = ["down", "up", "left", "right"] as const;

// 各角色需要載入的（動作, 幀號）組合
const HERO_FRAMES: Array<[string, number]> = [
  ["idle", 0],
  ["walk", 0],
  ["walk", 2],
  ["walk", 5],
  ["attack_1", 1],
  ["attack_1", 2],
  ["attack_1", 3],
  ["attack_1", 4],
  ["attack_1", 5],
];
const BEAR_FRAMES: Array<[string, number]> = [
  ["idle", 0],
  ["walk", 2],
  ["walk", 5],
  ["attack_claw", 2],
  ["attack_claw", 5],
];

function cap(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}

function frameUrl(char: string, action: string, frame: number, dir: string) {
  return `${BASE}/${char}_${action}_${dir}_${String(frame).padStart(3, "0")}.png`;
}

async function tryLoad(url: string): Promise<Texture | null> {
  try {
    return (await Assets.load(url)) as Texture;
  } catch {
    return null;
  }
}

function genTex(renderer: Renderer, draw: (g: Graphics) => void): Texture {
  const g = new Graphics();
  draw(g);
  const t = renderer.generateTexture(g);
  g.destroy();
  return t;
}

export async function loadForestCampTextures(
  renderer: Renderer,
  gender: "male" | "female",
): Promise<Record<SurvivalSpriteKey, Texture>> {
  // 性別過濾：選男只載男；工人一律用男主角幀，所以選女時男幀也要載
  const genders = gender === "female" ? ["male", "female"] : ["male"];
  const chars = genders.map(function (g) {
    return `${g}_axe`;
  });

  // 1) down 幀（現有素材，必定存在）
  const downUrls: string[] = [];
  for (const char of chars) {
    for (const [action, frame] of HERO_FRAMES) {
      downUrls.push(frameUrl(char, action, frame, "down"));
    }
  }
  for (const [action, frame] of BEAR_FRAMES) {
    downUrls.push(frameUrl("bear", action, frame, "down"));
  }
  await Assets.load(downUrls);

  // 2) up/left/right 方向補圖（之後才會出現）：逐一嘗試，載不到就退回
  const dirTex = new Map<string, Texture>();
  const dirTries: Promise<void>[] = [];
  for (const char of chars) {
    for (const [action, frame] of HERO_FRAMES) {
      for (const dir of DIRS) {
        if (dir === "down") continue;
        const url = frameUrl(char, action, frame, dir);
        dirTries.push(
          tryLoad(url).then(function (t) {
            if (t) dirTex.set(`${char}|${action}|${frame}|${dir}`, t);
          }),
        );
      }
    }
  }
  await Promise.all(dirTries);

  const mirrorCache = new Map<Texture, Texture>();
  function mirrored(t: Texture): Texture {
    let m = mirrorCache.get(t);
    if (!m) {
      m = new Texture({
        source: t.source,
        rotate: groupD8.MIRROR_HORIZONTAL,
      });
      mirrorCache.set(t, m);
    }
    return m;
  }

  function downTex(char: string, action: string, frame: number): Texture {
    return Texture.from(frameUrl(char, action, frame, "down"));
  }

  // 方向退回規則：down 用 down 幀；up 退回 down；
  // left 退回 down、right 退回 down 的水平鏡像（groupD8），讓左右至少相異
  function resolveDir(
    char: string,
    action: string,
    frame: number,
    dir: string,
  ): Texture {
    const down = downTex(char, action, frame);
    if (dir === "down") return down;
    const t = dirTex.get(`${char}|${action}|${frame}|${dir}`);
    if (t) return t;
    if (dir === "right") return mirrored(down);
    return down;
  }

  const tex: Record<SurvivalSpriteKey, Texture> = {};

  // 主角
  for (const g of genders) {
    const char = `${g}_axe`;
    const prefix = `hero${cap(g)}`;
    for (const dir of DIRS) {
      for (const suffix of Object.keys(HERO_SUFFIX_MAP)) {
        const [action, frame] = HERO_SUFFIX_MAP[suffix];
        tex[`${prefix}${cap(dir)}${suffix}`] = resolveDir(
          char,
          action,
          frame,
          dir,
        );
      }
    }
  }

  // 工人（樵夫、獵人、店員）：全部對應男主角幀，靠 tint 區分
  for (const p of WORKER_PREFIXES) {
    for (const dir of DIRS) {
      for (const suffix of Object.keys(WORKER_SUFFIX_MAP)) {
        const [action, frame] = WORKER_SUFFIX_MAP[suffix];
        tex[`${p}${cap(dir)}${suffix}`] = resolveDir(
          "male_axe",
          action,
          frame,
          dir,
        );
      }
    }
  }

  // 山豬鍵併入熊；被擊中幀以鏡像 idle 呈現受擊反應
  tex.boarIdle = downTex("bear", "idle", 0);
  tex.boarHit = mirrored(downTex("bear", "idle", 0));
  tex.boarWalk1 = downTex("bear", "walk", 2);
  tex.boarWalk2 = downTex("bear", "walk", 5);
  tex.bearAttack1 = downTex("bear", "attack_claw", 2);
  tex.bearAttack2 = downTex("bear", "attack_claw", 5);

  // 場景補件：先嘗試載入，載不到就用程式產生佔位貼圖
  function station(color: number) {
    return function (g: Graphics) {
      g.roundRect(-30, -23, 60, 42, 5).fill(color);
      g.roundRect(-34, -31, 68, 14, 3).fill(0x2f3b45);
      g.roundRect(-30, -23, 60, 42, 5).stroke({
        color: 0x7f8f95,
        width: 1,
        alpha: 0.45,
      });
    };
  }

  const sceneDefs: Array<[string, string, (g: Graphics) => void]> = [
    [
      "treeFull",
      "tree_full.png",
      function (g) {
        g.ellipse(0, 6, 18, 8).fill({ color: 0x000000, alpha: 0.2 });
        g.rect(-5, -26, 10, 32).fill(0x6b4f35);
        g.circle(0, -36, 22).fill(0x3f7a45);
        g.circle(-8, -28, 14).fill(0x356b3c);
        g.circle(8, -28, 14).fill(0x2d5c34);
      },
    ],
    [
      "treeDamaged",
      "tree_damaged.png",
      function (g) {
        g.ellipse(0, 6, 16, 7).fill({ color: 0x000000, alpha: 0.2 });
        g.rect(-5, -26, 10, 32).fill(0x6b4f35);
        g.circle(-6, -32, 13).fill(0x3f7a45);
        g.circle(9, -25, 9).fill(0x2d5c34);
      },
    ],
    [
      "treeStump",
      "tree_stump.png",
      function (g) {
        g.ellipse(0, 4, 14, 6).fill({ color: 0x000000, alpha: 0.2 });
        g.rect(-9, -10, 18, 14).fill(0x6b4f35);
        g.ellipse(0, -10, 9, 4).fill(0xa88a64);
      },
    ],
    ["woodStation", "station_wood.png", station(0x564235)],
    ["meatStation", "station_meat.png", station(0x54323a)],
    ["mealShop", "station_bento.png", station(0x5b4b32)],
    [
      "worldMap",
      "map_topdown.png",
      function (g) {
        // 透明佔位：讓舊版內建的向量地面（world.ts 的 groundFallback）直接透出
        g.rect(0, 0, WW, WH).fill({ color: 0x000000, alpha: 0.001 });
      },
    ],
    [
      "itemWood",
      "item_wood.png",
      function (g) {
        g.roundRect(-7, -4, 14, 8, 2).fill(0x8a6a3a);
        g.rect(-4, -1, 8, 3).fill(0x6a4a2a);
      },
    ],
    [
      "itemMeat",
      "item_meat.png",
      function (g) {
        g.circle(0, 0, 7).fill(0xcc4444);
        g.circle(-2, -1, 3).fill(0xee6666);
      },
    ],
    [
      "itemBento",
      "item_bento.png",
      function (g) {
        g.rect(-7, -5, 14, 10).fill(0xeeeeee);
        g.rect(-4, -2, 8, 4).fill(0xcc4444);
      },
    ],
    [
      "itemCoin",
      "item_coin.png",
      function (g) {
        g.circle(0, 0, 7).fill(0xffd700);
        g.circle(0, 0, 4).fill(0xeebb00);
      },
    ],
  ];

  await Promise.all(
    sceneDefs.map(async function ([key, file, draw]) {
      const t = await tryLoad(`${BASE}/${file}`);
      tex[key] = t ?? genTex(renderer, draw);
    }),
  );

  return tex;
}
