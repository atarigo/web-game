import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { centeredText, COLORS } from '$lib/game-engine';
import type { SurvivalSpriteKey } from '$lib/survival-loop-assets';
import { WW, WH, FOREST, HUNT, WSTN, MSTN, BENTO } from './constants';

export function makeSprite(tex: Record<SurvivalSpriteKey, Texture>, key: SurvivalSpriteKey, width: number, height: number, anchorY = 0.82) {
	const s = new Sprite(tex[key]);
	s.anchor.set(0.5, anchorY);
	s.width = width;
	s.height = height;
	return s;
}

export interface WorldLayers {
	world: Container;
	groundLayer: Container;
	zoneLayer: Container;
	snowLayer: Container;
	clickArea: Graphics;
	objLayer: Container;
	itemLayer: Container;
	charLayer: Container;
	fxLayer: Container;
	hudLayer: Container;
}

export function createLayers(stage: Container): WorldLayers {
	const world = new Container();
	const groundLayer = new Container();
	const zoneLayer = new Container();
	const snowLayer = new Container();
	const clickArea = new Graphics();
	const objLayer = new Container();
	objLayer.sortableChildren = true;
	objLayer.eventMode = 'none';
	const itemLayer = new Container();
	itemLayer.eventMode = 'none';
	const charLayer = new Container();
	charLayer.sortableChildren = true;
	charLayer.eventMode = 'none';
	const fxLayer = new Container();
	fxLayer.eventMode = 'none';
	world.addChild(groundLayer, zoneLayer, snowLayer, clickArea, objLayer, itemLayer, charLayer, fxLayer);
	stage.addChild(world);
	const hudLayer = new Container();
	stage.addChild(hudLayer);
	return { world, groundLayer, zoneLayer, snowLayer, clickArea, objLayer, itemLayer, charLayer, fxLayer, hudLayer };
}

export function buildGround(groundLayer: Container, tex: Record<SurvivalSpriteKey, Texture>) {
	const groundFallback = new Graphics();
	groundFallback.rect(0, 0, WW, WH).fill(0x26353a);
	groundFallback.rect(0, 0, WW, 72).fill(0x27333d);
	groundFallback.rect(20, 36, WW - 40, 6).fill({ color: 0x87979d, alpha: 0.8 });
	groundFallback.circle(FOREST.x, FOREST.y, FOREST.r + 16).fill({ color: 0x263f38, alpha: 0.75 });
	groundFallback.circle(HUNT.x, HUNT.y, HUNT.r + 16).fill({ color: 0x4a3a2c, alpha: 0.65 });
	groundFallback.moveTo(40, 360).bezierCurveTo(120, 330, 300, 330, 380, 360).stroke({ color: 0xd9eef0, width: 18, alpha: 0.12 });
	groundFallback.moveTo(65, 520).bezierCurveTo(145, 470, 280, 470, 355, 515).stroke({ color: 0xd9eef0, width: 22, alpha: 0.12 });
	groundLayer.addChild(groundFallback);

	const groundMap = new Sprite(tex.worldMap as unknown as Texture);
	groundMap.x = 0;
	groundMap.y = 0;
	groundMap.width = WW;
	groundMap.height = WH;
	groundLayer.addChild(groundMap);

	for (let i = 0; i < 25; i++) {
		const patch = new Graphics();
		const px = Math.random() * WW;
		const py = Math.random() * WH;
		const pr = 15 + Math.random() * 25;
		patch.circle(px, py, pr).fill({ color: 0xd9eef0, alpha: 0.05 });
		groundLayer.addChild(patch);
	}
}

export function buildZones(zoneLayer: Container, tex: Record<SurvivalSpriteKey, Texture>) {
	function zoneCircle(x: number, y: number, r: number, color: number) {
		const g = new Graphics();
		g.circle(x, y, r).fill({ color, alpha: 0.2 });
		g.circle(x, y, r).stroke({ color, width: 1, alpha: 0.15 });
		zoneLayer.addChild(g);
	}
	zoneCircle(FOREST.x, FOREST.y, FOREST.r, 0x2a5a2a);
	zoneCircle(HUNT.x, HUNT.y, HUNT.r, 0x5a3a1a);

	function zoneMark(x: number, y: number, color: number) {
		const g = new Graphics();
		g.circle(x, y, 36).fill({ color, alpha: 0.15 });
		g.circle(x, y, 36).stroke({ color, width: 1, alpha: 0.2 });
		zoneLayer.addChild(g);
	}
	zoneMark(WSTN.x, WSTN.y, 0x6a4a2a);
	zoneMark(MSTN.x, MSTN.y, 0x8a3a2a);
	zoneMark(BENTO.x, BENTO.y, 0x8a7a3a);

	function makeStn(x: number, y: number, label: string, key: SurvivalSpriteKey) {
		const c = new Container();
		c.x = x;
		c.y = y;
		const base = new Graphics();
		base.roundRect(-30, -23, 60, 42, 5).fill(key === 'meatStation' ? 0x54323a : key === 'mealShop' ? 0x5b4b32 : 0x564235);
		base.roundRect(-34, -31, 68, 14, 3).fill(0x2f3b45);
		base.roundRect(-30, -23, 60, 42, 5).stroke({ color: 0x7f8f95, width: 1, alpha: 0.45 });
		base.visible = false;
		c.addChild(base);
		const sprite = makeSprite(tex, key, 74, 64, 0.78);
		c.addChild(sprite);
		zoneLayer.addChild(c);
		zoneLayer.addChild(centeredText(label, x, y + 28, { size: 10, color: COLORS.muted, family: 'Arial' }));
	}
	makeStn(WSTN.x, WSTN.y, '木材站', 'woodStation');
	makeStn(MSTN.x, MSTN.y, '肉品站', 'meatStation');
	makeStn(BENTO.x, BENTO.y, '便當店', 'mealShop');

	zoneLayer.addChild(centeredText('森林', FOREST.x, FOREST.y - FOREST.r - 12, { size: 11, color: COLORS.muted, family: 'Arial' }));
	zoneLayer.addChild(centeredText('獵場', HUNT.x, HUNT.y - HUNT.r - 12, { size: 11, color: COLORS.muted, family: 'Arial' }));
}

export interface StockTexts {
	wStockT: ReturnType<typeof centeredText>;
	mStockT: ReturnType<typeof centeredText>;
	wLvT: ReturnType<typeof centeredText>;
	mLvT: ReturnType<typeof centeredText>;
	bStockT: ReturnType<typeof centeredText>;
	bCoinT: ReturnType<typeof centeredText>;
}

export function buildStockTexts(zoneLayer: Container): StockTexts {
	const wStockT = centeredText('', WSTN.x, WSTN.y - 28, { size: 11, color: COLORS.yellow, family: 'Arial' });
	const mStockT = centeredText('', MSTN.x, MSTN.y - 28, { size: 11, color: COLORS.yellow, family: 'Arial' });
	const wLvT = centeredText('Lv1', WSTN.x, WSTN.y - 40, { size: 10, color: COLORS.cyan, family: 'Arial' });
	const mLvT = centeredText('Lv1', MSTN.x, MSTN.y - 40, { size: 10, color: COLORS.cyan, family: 'Arial' });
	const bStockT = centeredText('', BENTO.x - 20, BENTO.y - 38, { size: 11, color: COLORS.yellow, family: 'Arial' });
	const bCoinT = centeredText('', BENTO.x + 20, BENTO.y - 38, { size: 11, color: COLORS.gold, family: 'Arial' });
	zoneLayer.addChild(wStockT, mStockT, wLvT, mLvT, bStockT, bCoinT);
	return { wStockT, mStockT, wLvT, mLvT, bStockT, bCoinT };
}

export function buildClickArea(clickArea: Graphics) {
	clickArea.rect(0, 0, WW, WH).fill({ color: 0x000000, alpha: 0.001 });
	clickArea.eventMode = 'static';
	clickArea.cursor = 'pointer';
}
