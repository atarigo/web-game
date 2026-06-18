import { Container, Graphics } from 'pixi.js';
import { W, H } from '$lib/game-engine';
import { WW, WH, JOY_R, JOY_KNOB, JOY_DEAD } from './constants';
import { dist } from './helpers';
import type { Player, Tree, Beast, BtnDef } from './types';
import type { Application } from 'pixi.js';

export interface InputState {
	keys: Record<string, boolean>;
	joyActive: boolean;
	joyId: number;
	joyBaseX: number;
	joyBaseY: number;
	joyDx: number;
	joyDy: number;
	tapStartX: number;
	tapStartY: number;
	tapTime: number;
	btnTapped: boolean;
}

export function createInputState(): InputState {
	return {
		keys: {},
		joyActive: false,
		joyId: -1,
		joyBaseX: 0, joyBaseY: 0,
		joyDx: 0, joyDy: 0,
		tapStartX: 0, tapStartY: 0,
		tapTime: 0,
		btnTapped: false
	};
}

export function createJoystickVisual(hudLayer: Container) {
	const joyContainer = new Container();
	joyContainer.visible = false;
	hudLayer.addChild(joyContainer);
	const joyBase = new Graphics();
	joyBase.circle(0, 0, JOY_R).fill({ color: 0xffffff, alpha: 0.12 });
	joyBase.circle(0, 0, JOY_R).stroke({ color: 0xffffff, width: 1.5, alpha: 0.25 });
	joyContainer.addChild(joyBase);
	const joyKnob = new Graphics();
	joyKnob.circle(0, 0, JOY_KNOB).fill({ color: 0xffffff, alpha: 0.3 });
	joyContainer.addChild(joyKnob);
	return { joyContainer, joyKnob };
}

function tapTarget(
	appX: number,
	appY: number,
	P: Player,
	trees: Tree[],
	beasts: Beast[],
	world: Container
) {
	const wx = Math.max(10, Math.min(WW - 10, appX - world.x));
	const wy = Math.max(10, Math.min(WH - 10, appY - world.y));

	let bestTree: Tree | null = null;
	let bestD = 30;
	for (let i = 0; i < trees.length; i++) {
		const d2 = dist(trees[i].x, trees[i].y, wx, wy);
		if (d2 < bestD) { bestD = d2; bestTree = trees[i]; }
	}
	if (bestTree) { P.tx = bestTree.x; P.ty = bestTree.y; P.tgt = bestTree; return; }

	let bestBeast: Beast | null = null;
	bestD = 30;
	for (let i = 0; i < beasts.length; i++) {
		const d2 = dist(beasts[i].x, beasts[i].y, wx, wy);
		if (d2 < bestD) { bestD = d2; bestBeast = beasts[i]; }
	}
	if (bestBeast) { P.tx = bestBeast.x; P.ty = bestBeast.y; P.tgt = bestBeast; return; }

	P.tx = wx;
	P.ty = wy;
	P.tgt = null;
}

function canvasToApp(canvas: HTMLCanvasElement, cx: number, cy: number) {
	const rect = canvas.getBoundingClientRect();
	return { x: (cx - rect.left) / rect.width * W, y: (cy - rect.top) / rect.height * H };
}

function handleJoyMove(inp: InputState, px: number, py: number, joyContainer: Container, joyKnob: Graphics) {
	const mdx = px - inp.joyBaseX;
	const mdy = py - inp.joyBaseY;
	const md = Math.sqrt(mdx * mdx + mdy * mdy);
	if (!inp.joyActive && md > JOY_DEAD) {
		inp.joyActive = true;
		joyContainer.visible = true;
	}
	if (inp.joyActive) {
		const clamped = Math.min(md, JOY_R);
		const nx = md > 0 ? mdx / md : 0;
		const ny = md > 0 ? mdy / md : 0;
		joyKnob.x = nx * clamped;
		joyKnob.y = ny * clamped;
		inp.joyDx = nx * (clamped / JOY_R);
		inp.joyDy = ny * (clamped / JOY_R);
	}
}

function handleJoyEnd(
	inp: InputState,
	endX: number,
	endY: number,
	joyContainer: Container,
	P: Player,
	trees: Tree[],
	beasts: Beast[],
	world: Container
) {
	if (!inp.joyActive) {
		const elapsed = Date.now() - inp.tapTime;
		const tdx = endX - inp.tapStartX;
		const tdy = endY - inp.tapStartY;
		if (elapsed < 300 && Math.sqrt(tdx * tdx + tdy * tdy) < 15) {
			if (!inp.btnTapped) tapTarget(inp.tapStartX, inp.tapStartY, P, trees, beasts, world);
		}
	}
	inp.btnTapped = false;
	inp.joyActive = false;
	inp.joyId = -1;
	inp.joyDx = 0;
	inp.joyDy = 0;
	joyContainer.visible = false;
}

export function setupInput(
	app: Application,
	inp: InputState,
	P: Player,
	trees: Tree[],
	beasts: Beast[],
	btns: BtnDef[],
	world: Container,
	clickArea: Graphics,
	joyContainer: Container,
	joyKnob: Graphics,
	getState: () => string
): () => void {
	function onKeyDown(e: KeyboardEvent) {
		inp.keys[e.key] = true;
		if (getState() !== 'playing') return;
		if (e.key >= '1' && e.key <= '9') {
			const idx = parseInt(e.key) - 1;
			const visible = btns.filter(function (b) { return b.isVis(); });
			if (idx < visible.length) visible[idx].trigger();
		}
	}
	function onKeyUp(e: KeyboardEvent) { inp.keys[e.key] = false; }
	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);

	const canvas = app.canvas;

	canvas.addEventListener('touchstart', function (e: TouchEvent) {
		e.preventDefault();
		if (getState() !== 'playing') return;
		const t = e.changedTouches[0];
		const p = canvasToApp(canvas, t.clientX, t.clientY);
		inp.joyId = t.identifier;
		inp.tapStartX = p.x;
		inp.tapStartY = p.y;
		inp.tapTime = Date.now();
		inp.joyBaseX = p.x;
		inp.joyBaseY = p.y;
		inp.joyDx = 0;
		inp.joyDy = 0;
		inp.joyActive = false;
		joyContainer.x = p.x;
		joyContainer.y = p.y;
		joyKnob.x = 0;
		joyKnob.y = 0;
	}, { passive: false });

	canvas.addEventListener('touchmove', function (e: TouchEvent) {
		e.preventDefault();
		for (let i = 0; i < e.changedTouches.length; i++) {
			const t = e.changedTouches[i];
			if (t.identifier !== inp.joyId) continue;
			const p = canvasToApp(canvas, t.clientX, t.clientY);
			handleJoyMove(inp, p.x, p.y, joyContainer, joyKnob);
		}
	}, { passive: false });

	canvas.addEventListener('touchend', function (e: TouchEvent) {
		for (let i = 0; i < e.changedTouches.length; i++) {
			const t = e.changedTouches[i];
			if (t.identifier !== inp.joyId) continue;
			const p = canvasToApp(canvas, t.clientX, t.clientY);
			handleJoyEnd(inp, p.x, p.y, joyContainer, P, trees, beasts, world);
		}
	});

	canvas.addEventListener('touchcancel', function () {
		inp.joyActive = false;
		inp.joyId = -1;
		inp.joyDx = 0;
		inp.joyDy = 0;
		joyContainer.visible = false;
	});

	clickArea.on('pointerdown', function (e: any) {
		if (getState() !== 'playing') return;
		if (e.pointerType === 'touch') return;
		const gx = e.global.x;
		const gy = e.global.y;
		inp.joyId = e.pointerId;
		inp.tapStartX = gx;
		inp.tapStartY = gy;
		inp.tapTime = Date.now();
		inp.joyBaseX = gx;
		inp.joyBaseY = gy;
		inp.joyDx = 0;
		inp.joyDy = 0;
		inp.joyActive = false;
		joyContainer.x = gx;
		joyContainer.y = gy;
		joyKnob.x = 0;
		joyKnob.y = 0;
	});

	app.stage.eventMode = 'static';
	app.stage.hitArea = { contains: function () { return true; } };

	app.stage.on('pointermove', function (e: any) {
		if (e.pointerType === 'touch') return;
		if (inp.joyId < 0) return;
		handleJoyMove(inp, e.global.x, e.global.y, joyContainer, joyKnob);
	});

	app.stage.on('pointerup', function (e: any) {
		if (e.pointerType === 'touch') return;
		if (e.pointerId !== inp.joyId) return;
		handleJoyEnd(inp, e.global.x, e.global.y, joyContainer, P, trees, beasts, world);
	});

	return function () {
		window.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('keyup', onKeyUp);
	};
}
