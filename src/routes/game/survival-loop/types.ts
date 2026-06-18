import type { Container, Graphics, Sprite } from 'pixi.js';

export type IType = 'wood' | 'meat' | 'coin';
export type PlayerDir = 'down' | 'up' | 'left' | 'right';
export type HState = 'working' | 'toEat' | 'eating' | 'returning';
export type ClerkRole = 'bento' | 'wood' | 'meat';

export interface Drop {
	type: IType | 'coin';
	x: number;
	y: number;
	gfx: Graphics;
	vy: number;
	bounceY: number;
	landed: boolean;
	flying: boolean;
}

export interface Tree {
	c: Container;
	sprite: Sprite;
	x: number;
	y: number;
	hp: number;
	max: number;
	bar: Graphics;
}

export interface Beast {
	c: Container;
	sprite: Sprite;
	x: number;
	y: number;
	hp: number;
	max: number;
	bar: Graphics;
	vx: number;
	vy2: number;
	mt: number;
	walkT: number;
	hitT: number;
	atkCD: number;
	attackT: number;
}

export interface Wk {
	c: Container;
	sprite: Sprite;
	kind: 'clerk' | 'lumber' | 'hunter';
	x: number;
	y: number;
	clerkRole: ClerkRole;
	homeX: number;
	homeY: number;
	face: number;
	dir: PlayerDir;
	walkT: number;
	workCount: number;
	hunger: HState;
	tgt: Tree | Beast | null;
	atkT: number;
	hp: number;
	maxHp: number;
	hpBar: Graphics;
}

export interface Player {
	x: number;
	y: number;
	tx: number;
	ty: number;
	carry: IType[];
	face: number;
	atkT: number;
	walkT: number;
	dir: PlayerDir;
	tgt: Tree | Beast | null;
	hp: number;
	maxHp: number;
	invT: number;
}

export interface GameState {
	coins: number;
	wStock: number;
	wLv: number;
	wProdT: number;
	mStock: number;
	mLv: number;
	mProdT: number;
	bentoStock: number;
	bentoProdT: number;
	timer: number;
	score: number;
	statTrees: number;
	statBeasts: number;
	statCoins: number;
	treeSpT: number;
	beastSpT: number;
	depositCD: number;
	pickupCD: number;
}

export interface BtnDef {
	update: () => void;
	trigger: () => void;
	isVis: () => boolean;
	isOn: () => boolean;
}
