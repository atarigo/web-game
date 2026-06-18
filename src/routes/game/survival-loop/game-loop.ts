import type { Application, Container, Sprite, Texture } from 'pixi.js';
import { W, H } from '$lib/game-engine';
import { SPD, CAP, ACD, DR, PR, WW, WH, WSTN, MSTN, BENTO } from './constants';
import type { Player, Tree, Beast, Drop, GameState, BtnDef, Wk } from './types';
import type { InputState } from './input';
import type { WorkerRefs } from './hud';
import type { SurvivalSpriteKey } from '$lib/survival-loop-assets';
import { dist, hpBar, popup, spawnDrop, flyTo, rmDrop, mkGfx, prodMs, moveDir } from './helpers';
import { setPlayerDir, updatePlayerVisual, playerDie, heroTexture } from './player';
import { hitTree, hitBeast, spawnTree, spawnBeast, updateBeastsAI } from './entities';
import { updateWorkersAI } from './workers';
import { refreshUI as doRefreshUI } from './hud';
import type { StockTexts } from './world';

export function startGameLoop(
	app: Application,
	mode: 'normal' | 'infinite',
	gender: string,
	P: Player,
	pC: Container,
	pBody: Container,
	pSprite: Sprite,
	pHpBar: import('pixi.js').Graphics,
	pCarryC: Container,
	pLL: import('pixi.js').Graphics,
	pRL: import('pixi.js').Graphics,
	gs: GameState,
	trees: Tree[],
	beasts: Beast[],
	stumps: Sprite[],
	drops: Drop[],
	allWk: Wk[],
	wkRefs: WorkerRefs,
	btns: BtnDef[],
	inp: InputState,
	tex: Record<SurvivalSpriteKey, Texture>,
	layers: {
		world: Container;
		objLayer: Container;
		itemLayer: Container;
		charLayer: Container;
		fxLayer: Container;
	},
	stockTexts: StockTexts,
	timerHud: import('pixi.js').Text,
	scoreHud: import('pixi.js').Text,
	getState: () => string,
	endGame: () => void,
	updateCarryVisualFn: () => void
) {
	function refreshUI() {
		doRefreshUI(mode, gs, P, stockTexts, timerHud, scoreHud, btns, updateCarryVisualFn);
	}

	function onPlayerDie() {
		playerDie(P, drops, layers.itemLayer, layers.fxLayer, app, refreshUI);
	}

	app.ticker.add(function () {
		if (getState() !== 'playing') return;
		const dt = Math.min(app.ticker.deltaMS, 33);
		const tf = dt / 16.67;

		if (mode === 'normal') {
			gs.timer -= dt;
			if (gs.timer <= 0) { gs.timer = 0; refreshUI(); endGame(); return; }
		} else {
			gs.timer += dt;
		}

		if (P.invT > 0) P.invT -= dt;

		let inputDx = 0, inputDy = 0;
		let directInput = false;

		let kx = 0, ky = 0;
		if (inp.keys['w'] || inp.keys['W'] || inp.keys['ArrowUp']) ky = -1;
		if (inp.keys['s'] || inp.keys['S'] || inp.keys['ArrowDown']) ky = 1;
		if (inp.keys['a'] || inp.keys['A'] || inp.keys['ArrowLeft']) kx = -1;
		if (inp.keys['d'] || inp.keys['D'] || inp.keys['ArrowRight']) kx = 1;
		if (kx !== 0 || ky !== 0) {
			const kd = Math.sqrt(kx * kx + ky * ky);
			inputDx = kx / kd;
			inputDy = ky / kd;
			directInput = true;
		}

		if (inp.joyActive && (Math.abs(inp.joyDx) > 0.05 || Math.abs(inp.joyDy) > 0.05)) {
			inputDx = inp.joyDx;
			inputDy = inp.joyDy;
			directInput = true;
		}

		if (directInput) { P.tgt = null; }

		if (P.tgt) {
			if (P.tgt.c.destroyed) {
				P.tgt = null;
				P.tx = P.x;
				P.ty = P.y;
			} else {
				P.tx = P.tgt.x;
				P.ty = P.tgt.y;
			}
		}

		let moving = false;
		const inRange = P.tgt && dist(P.x, P.y, P.tgt.x, P.tgt.y) < 30;

		if (directInput) {
			P.x += inputDx * SPD * tf;
			P.y += inputDy * SPD * tf;
			P.x = Math.max(10, Math.min(WW - 10, P.x));
			P.y = Math.max(10, Math.min(WH - 10, P.y));
			P.tx = P.x;
			P.ty = P.y;
			if (Math.abs(inputDx) > 0.1) P.face = inputDx > 0 ? 1 : -1;
			setPlayerDir(P, inputDx, inputDy);
			moving = true;
			P.tgt = null;
			for (let i = 0; i < trees.length; i++) {
				if (dist(P.x, P.y, trees[i].x, trees[i].y) < 30) { P.tgt = trees[i]; break; }
			}
			if (!P.tgt) {
				for (let i = 0; i < beasts.length; i++) {
					if (dist(P.x, P.y, beasts[i].x, beasts[i].y) < 30) { P.tgt = beasts[i]; break; }
				}
			}
		} else {
			const dx = P.tx - P.x;
			const dy = P.ty - P.y;
			const d = Math.sqrt(dx * dx + dy * dy);
			if (d > 3 && !inRange) {
				P.x += (dx / d) * SPD * tf;
				P.y += (dy / d) * SPD * tf;
				if (Math.abs(dx) > 0.5) P.face = dx > 0 ? 1 : -1;
				setPlayerDir(P, dx, dy);
				moving = true;
			}
		}

		if (moving) { P.walkT++; } else { P.walkT = 0; }

		P.atkT -= dt;
		const atkRange = P.tgt && !P.tgt.c.destroyed && dist(P.x, P.y, P.tgt.x, P.tgt.y) < 30;
		if (atkRange && P.tgt && P.atkT <= 0) {
			P.atkT = ACD;
			if ('vx' in P.tgt) hitBeast(P.tgt as Beast, beasts, drops, layers.itemLayer, layers.fxLayer, app, tex, gs);
			else hitTree(P.tgt as Tree, trees, stumps, layers.objLayer, tex, drops, layers.itemLayer, layers.fxLayer, app, gs);
		}
		if (atkRange && P.tgt) setPlayerDir(P, P.tgt.x - P.x, P.tgt.y - P.y);

		updatePlayerVisual(P, pC, pBody, pSprite, pHpBar, pLL, pRL, tex, gender, moving, !!atkRange);

		const camX = Math.max(0, Math.min(WW - W, P.x - W / 2));
		const camY = Math.max(0, Math.min(WH - H, P.y - H / 2));
		layers.world.x = -camX;
		layers.world.y = -camY;

		for (let i = 0; i < drops.length; i++) {
			const dd = drops[i];
			if (dd.flying || dd.landed) continue;
			dd.vy += 0.2 * tf;
			dd.gfx.y += dd.vy * tf;
			if (dd.gfx.y >= dd.bounceY) {
				dd.gfx.y = dd.bounceY;
				dd.vy = -dd.vy * 0.3;
				if (Math.abs(dd.vy) < 0.5) { dd.landed = true; dd.vy = 0; }
			}
			dd.y = dd.gfx.y;
		}

		gs.pickupCD -= dt;
		if (gs.pickupCD <= 0) {
			for (let i = 0; i < drops.length; i++) {
				const dd = drops[i];
				if (dd.flying || !dd.landed) continue;
				if (dist(dd.x, dd.y, P.x, P.y) > PR) continue;
				const typeCount = P.carry.filter(function (c) { return c === dd.type; }).length;
				const typeCap = dd.type === 'coin' ? 500 : CAP;
				if (typeCount >= typeCap) continue;
				gs.pickupCD = 80;
				const tp = dd.type as import('./types').IType;
				flyTo(dd, P.x, P.y - 15, function () { P.carry.push(tp); rmDrop(dd, drops); refreshUI(); }, app);
				break;
			}
		}

		gs.depositCD -= dt;
		if (gs.depositCD <= 0) {
			if (dist(P.x, P.y, WSTN.x, WSTN.y) < DR) {
				const wi = P.carry.indexOf('wood');
				if (wi >= 0) {
					gs.depositCD = 150;
					P.carry.splice(wi, 1);
					const g = mkGfx('wood');
					g.x = P.x; g.y = P.y - 10;
					layers.itemLayer.addChild(g);
					const tmp: Drop = { type: 'wood', x: P.x, y: P.y - 10, gfx: g, vy: 0, bounceY: P.y, landed: true, flying: false };
					flyTo(tmp, WSTN.x, WSTN.y, function () { gs.wStock++; g.destroy(); refreshUI(); }, app);
				}
			}
			if (dist(P.x, P.y, MSTN.x, MSTN.y) < DR) {
				const mi = P.carry.indexOf('meat');
				if (mi >= 0) {
					gs.depositCD = 150;
					P.carry.splice(mi, 1);
					const g = mkGfx('meat');
					g.x = P.x; g.y = P.y - 10;
					layers.itemLayer.addChild(g);
					const tmp: Drop = { type: 'meat', x: P.x, y: P.y - 10, gfx: g, vy: 0, bounceY: P.y, landed: true, flying: false };
					flyTo(tmp, MSTN.x, MSTN.y, function () { gs.mStock++; g.destroy(); refreshUI(); }, app);
				}
			}
			if (dist(P.x, P.y, BENTO.x, BENTO.y) < DR) {
				const ci = P.carry.indexOf('coin');
				if (ci >= 0) {
					gs.depositCD = 150;
					P.carry.splice(ci, 1);
					const g = mkGfx('coin');
					g.x = P.x; g.y = P.y - 10;
					layers.itemLayer.addChild(g);
					const tmp: Drop = { type: 'coin', x: P.x, y: P.y - 10, gfx: g, vy: 0, bounceY: P.y, landed: true, flying: false };
					flyTo(tmp, BENTO.x, BENTO.y, function () { gs.coins++; g.destroy(); refreshUI(); }, app);
				}
			}
		}

		const wStnActive = (wkRefs.wStnWk && wkRefs.wStnWk.hunger === 'working') || dist(P.x, P.y, WSTN.x, WSTN.y) < DR;
		if (gs.wStock > 0 && wStnActive) {
			gs.wProdT += dt;
			if (gs.wProdT >= prodMs(gs.wLv)) {
				gs.wProdT = 0;
				gs.wStock--;
				gs.statCoins++; gs.score += 10;
				spawnDrop('coin', WSTN.x + 15, WSTN.y + 10, layers.itemLayer, drops);
				if (wkRefs.wStnWk && wkRefs.wStnWk.hunger === 'working') {
					wkRefs.wStnWk.workCount++;
					if (wkRefs.wStnWk.workCount >= 5) wkRefs.wStnWk.hunger = 'toEat';
				}
				refreshUI();
			}
		} else { gs.wProdT = 0; }

		const mStnActive = (wkRefs.mStnWk && wkRefs.mStnWk.hunger === 'working') || dist(P.x, P.y, MSTN.x, MSTN.y) < DR;
		if (gs.mStock > 0 && mStnActive) {
			gs.mProdT += dt;
			if (gs.mProdT >= prodMs(gs.mLv) * 1.538) {
				gs.mProdT = 0;
				gs.mStock--;
				gs.statCoins += 2; gs.score += 20;
				spawnDrop('coin', MSTN.x - 10, MSTN.y + 10, layers.itemLayer, drops);
				spawnDrop('coin', MSTN.x + 30, MSTN.y + 10, layers.itemLayer, drops);
				if (wkRefs.mStnWk && wkRefs.mStnWk.hunger === 'working') {
					wkRefs.mStnWk.workCount++;
					if (wkRefs.mStnWk.workCount >= 5) wkRefs.mStnWk.hunger = 'toEat';
				}
				refreshUI();
			}
		} else { gs.mProdT = 0; }

		const bentoActive = (wkRefs.bentoWk && wkRefs.bentoWk.hunger === 'working') || dist(P.x, P.y, BENTO.x, BENTO.y) < DR;
		if (bentoActive && gs.coins > 0) {
			gs.bentoProdT += dt;
			if (gs.bentoProdT >= 1200) {
				gs.bentoProdT = 0;
				gs.coins--;
				gs.bentoStock++; gs.score += 10;
				popup('+🍱', BENTO.x, BENTO.y - 30, 0xe0e0f0, layers.fxLayer, app);
				if (wkRefs.bentoWk && wkRefs.bentoWk.hunger === 'working') {
					wkRefs.bentoWk.workCount++;
					if (wkRefs.bentoWk.workCount >= 5) {
						if (gs.bentoStock > 0) { gs.bentoStock--; wkRefs.bentoWk.workCount = 0; }
						else { wkRefs.bentoWk.hunger = 'eating'; }
					}
				}
				refreshUI();
			}
		} else { gs.bentoProdT = 0; }

		updateBeastsAI(beasts, P, wkRefs.hunterWks, allWk, tex, layers.fxLayer, app, dt, tf, onPlayerDie);

		gs.treeSpT += dt;
		if (gs.treeSpT > 2500 && trees.length < 5) { gs.treeSpT = 0; spawnTree(trees, stumps, layers.objLayer, tex); }
		gs.beastSpT += dt;
		if (gs.beastSpT > 1000 && beasts.length < 8) { gs.beastSpT = 0; spawnBeast(beasts, layers.objLayer, tex); }

		updateWorkersAI(allWk, wkRefs.cutterWk, wkRefs.hunterWks, trees, beasts, stumps, layers.objLayer, drops, layers.itemLayer, layers.fxLayer, app, tex, gs, gs.timer, dt, tf, refreshUI);

		refreshUI();
	});

	refreshUI();
}
