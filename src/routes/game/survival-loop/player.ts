import { Container, Graphics, type Texture } from 'pixi.js';
import { centeredText, COLORS } from '$lib/game-engine';
import type { SurvivalSpriteKey } from '$lib/survival-loop-assets';
import { BENTO, HERO_ATTACK_FRAME_MS, HERO_ATTACK_ANIM_MS, HERO_CHOP_FRAME_MS, HERO_CHOP_ANIM_MS, ACD } from './constants';
import type { Player, IType, Tree, Beast, Drop } from './types';
import { dist, hpBar, popup, spawnDrop } from './helpers';
import { makeSprite } from './world';
import type { Application } from 'pixi.js';

export function createPlayer(tex: Record<SurvivalSpriteKey, Texture>) {
	const P: Player = {
		x: BENTO.x, y: BENTO.y + 60,
		tx: BENTO.x, ty: BENTO.y + 60,
		carry: [],
		face: 1, atkT: 0, walkT: 0,
		dir: 'down',
		tgt: null,
		hp: 100, maxHp: 100, invT: 0
	};

	const pC = new Container();
	const pBody = new Container();
	pC.addChild(pBody);

	const pShadow = new Graphics();
	pShadow.ellipse(0, 3, 13, 5).fill({ color: 0x000000, alpha: 0.25 });
	pBody.addChild(pShadow);
	const pLL = new Graphics(); pLL.rect(-6, 8, 5, 13).fill(0x4a4a6a);
	const pRL = new Graphics(); pRL.rect(1, 8, 5, 13).fill(0x4a4a6a);
	pBody.addChild(pLL, pRL);
	const pTorso = new Graphics(); pTorso.rect(-7, -10, 14, 20).fill(0x3a6aaa);
	pBody.addChild(pTorso);
	const pHead = new Graphics(); pHead.circle(0, -19, 9).fill(0xdda070);
	pBody.addChild(pHead);
	const pEye = new Graphics(); pEye.circle(3, -20, 2).fill(0x222222);
	pBody.addChild(pEye);

	const pSprite = makeSprite(tex, 'heroFemaleDownIdle', 48, 58, 0.86);
	pBody.addChild(pSprite);
	pShadow.visible = pLL.visible = pRL.visible = pTorso.visible = pHead.visible = pEye.visible = false;

	const pHpBar = new Graphics();
	pC.addChild(pHpBar);

	const pCarryC = new Container();
	pC.addChild(pCarryC);
	pC.x = P.x;
	pC.y = P.y;

	return { P, pC, pBody, pSprite, pHpBar, pCarryC, pLL, pRL };
}

export function setPlayerDir(P: Player, dx: number, dy: number) {
	if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return;
	if (Math.abs(dx) > Math.abs(dy)) P.dir = dx > 0 ? 'right' : 'left';
	else P.dir = dy > 0 ? 'down' : 'up';
}

export function heroTexture(
	tex: Record<SurvivalSpriteKey, Texture>,
	P: Player,
	gender: string,
	action: 'idle' | 'walk' | 'work' | 'chop' | 'attack',
	frame = 1
): Texture {
	const genderCap = gender[0].toUpperCase() + gender.slice(1);
	const dir = P.dir[0].toUpperCase() + P.dir.slice(1);
	const suffix = action === 'idle'
		? 'Idle'
		: action === 'walk'
			? `Walk${frame}`
			: action === 'work'
				? `Work${frame}`
				: action === 'chop'
					? `Chop${frame}`
					: `Attack${frame}`;
	return tex[`hero${genderCap}${dir}${suffix}` as SurvivalSpriteKey] as unknown as Texture;
}

export function updateCarryVisual(P: Player, pCarryC: Container) {
	pCarryC.removeChildren();
	let wc = 0, mc = 0, cc = 0;
	for (let i = 0; i < P.carry.length; i++) {
		if (P.carry[i] === 'wood') wc++;
		else if (P.carry[i] === 'meat') mc++;
		else cc++;
	}
	const parts: string[] = [];
	if (wc > 0) parts.push('🪵' + wc);
	if (mc > 0) parts.push('🥩' + mc);
	if (cc > 0) parts.push('💰' + cc);
	if (parts.length === 0) return;
	const spacing = 32;
	const totalW = parts.length * spacing;
	for (let i = 0; i < parts.length; i++) {
		const t = centeredText(parts[i], -totalW / 2 + spacing / 2 + i * spacing, -68, { size: 10, color: COLORS.yellow, family: 'Arial' });
		pCarryC.addChild(t);
	}
}

export function updatePlayerVisual(
	P: Player,
	pC: Container,
	pBody: Container,
	pSprite: import('pixi.js').Sprite,
	pHpBar: Graphics,
	pLL: Graphics,
	pRL: Graphics,
	tex: Record<SurvivalSpriteKey, Texture>,
	gender: string,
	moving: boolean,
	atkRange: boolean
) {
	pC.x = P.x;
	pC.y = P.y;
	pC.zIndex = P.y;
	pBody.scale.x = 1;
	if (atkRange && P.tgt && P.atkT > ACD - ('vx' in P.tgt ? HERO_ATTACK_ANIM_MS : HERO_CHOP_ANIM_MS)) {
		const isBearTarget = 'vx' in P.tgt;
		const frameMs = isBearTarget ? HERO_ATTACK_FRAME_MS : HERO_CHOP_FRAME_MS;
		const frame = Math.min(3, Math.floor((ACD - P.atkT) / frameMs) + 1);
		pSprite.texture = heroTexture(tex, P, gender, isBearTarget ? 'attack' : 'chop', frame);
		pSprite.width = 56;
		pSprite.height = 66;
	} else if (moving) {
		const frame = Math.floor(P.walkT / 8) % 2 === 0 ? 1 : 2;
		pSprite.texture = heroTexture(tex, P, gender, 'walk', frame);
		pSprite.width = 48;
		pSprite.height = 58;
	} else {
		pSprite.texture = heroTexture(tex, P, gender, 'idle');
		pSprite.width = 48;
		pSprite.height = 58;
	}
	pSprite.y = moving ? Math.sin(P.walkT * 0.35) * 2 : 0;
	pC.alpha = P.invT > 0 ? (Math.floor(P.invT / 100) % 2 === 0 ? 0.3 : 1) : 1;
	hpBar(pHpBar, P.hp, P.maxHp, 0, -58, P.hp > P.maxHp * 0.3 ? COLORS.green : COLORS.red);
	const sw = Math.sin(P.walkT * 0.3) * 3;
	pLL.y = sw;
	pRL.y = -sw;
}

export function playerDie(
	P: Player,
	drops: Drop[],
	itemLayer: Container,
	fxLayer: Container,
	app: Application,
	refreshUI: () => void
) {
	for (let i = 0; i < P.carry.length; i++) {
		spawnDrop(P.carry[i], P.x + (Math.random() - 0.5) * 20, P.y + (Math.random() - 0.5) * 20, itemLayer, drops);
	}
	P.carry = [];
	P.x = BENTO.x; P.y = BENTO.y + 60;
	P.tx = P.x; P.ty = P.y;
	P.tgt = null;
	P.hp = P.maxHp;
	P.invT = 1500;
	popup('💀復活！', BENTO.x, BENTO.y + 30, COLORS.yellow, fxLayer, app);
	refreshUI();
}
