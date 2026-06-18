<script lang="ts">
	import { onMount } from 'svelte';
	import GameShell from '$lib/components/GameShell.svelte';
	import { initApp } from '$lib/game-engine';
	import { Assets, Texture } from 'pixi.js';
	import { survivalSpriteUrls, type SurvivalSpriteKey } from '$lib/survival-loop-assets';
	import { saveScore } from '$lib/scores';
	import { GAME_TIME } from './constants';
	import type { Tree, Beast, Drop, Wk, BtnDef, GameState } from './types';
	import { createLayers, buildGround, buildZones, buildStockTexts, buildClickArea } from './world';
	import { createPlayer, updateCarryVisual } from './player';
	import { spawnTree, spawnBeast } from './entities';
	import { createInputState, createJoystickVisual, setupInput } from './input';
	import { createHud, createButtons, refreshUI as doRefreshUI, type WorkerRefs } from './hud';
	import { startGameLoop } from './game-loop';

	let containerEl: HTMLDivElement;
	let cleanup: (() => void) | undefined;
	let state = $state<'menu' | 'playing' | 'result'>('menu');
	let gameMode = $state<'normal' | 'infinite'>('normal');
	let resultData = $state({ trees: 0, animals: 0, coins: 0, score: 0 });
	let selectedGender = $state<'male' | 'female'>('male');

	async function startGame(mode: 'normal' | 'infinite') {
		gameMode = mode;
		if (cleanup) cleanup();
		containerEl.innerHTML = '';
		state = 'playing';
		const { app, cleanup: appCleanup } = await initApp(containerEl, 0x1a2a1a);

		await Assets.load(Object.values(survivalSpriteUrls));
		const tex = Object.fromEntries(Object.entries(survivalSpriteUrls).map(function ([key, url]) {
			return [key, Texture.from(url)];
		})) as Record<SurvivalSpriteKey, Texture>;

		const layers = createLayers(app.stage);
		buildGround(layers.groundLayer, tex);
		buildZones(layers.zoneLayer, tex);
		const stockTexts = buildStockTexts(layers.zoneLayer);
		buildClickArea(layers.clickArea);

		const { P, pC, pBody, pSprite, pHpBar, pCarryC, pLL, pRL } = createPlayer(tex);
		layers.charLayer.addChild(pC);

		const trees: Tree[] = [];
		const beasts: Beast[] = [];
		const stumps: import('pixi.js').Sprite[] = [];
		const drops: Drop[] = [];
		const allWk: Wk[] = [];
		const btns: BtnDef[] = [];

		const gs: GameState = {
			coins: 0,
			wStock: 0, wLv: 1, wProdT: 0,
			mStock: 0, mLv: 1, mProdT: 0,
			bentoStock: 0, bentoProdT: 0,
			timer: mode === 'normal' ? GAME_TIME : 0,
			score: 0,
			statTrees: 0, statBeasts: 0, statCoins: 0,
			treeSpT: 0, beastSpT: 0,
			depositCD: 0, pickupCD: 0
		};

		const wkRefs: WorkerRefs = {
			wStnWk: null,
			mStnWk: null,
			cutterWk: null,
			hunterWks: [],
			bentoWk: null
		};

		const inp = createInputState();
		const { joyContainer, joyKnob } = createJoystickVisual(layers.hudLayer);
		const { timerHud, scoreHud } = createHud(layers.hudLayer, mode);

		function getState() { return state; }
		function updateCarryVisualFn() { updateCarryVisual(P, pCarryC); }
		function doRefresh() {
			doRefreshUI(mode, gs, P, stockTexts, timerHud, scoreHud, btns, updateCarryVisualFn);
		}

		createButtons(P, gs, wkRefs, allWk, layers.hudLayer, btns, inp, tex, layers.charLayer, layers.fxLayer, app, doRefresh);

		const removeInputListeners = setupInput(app, inp, P, trees, beasts, btns, layers.world, layers.clickArea, joyContainer, joyKnob, getState);

		for (let i = 0; i < 4; i++) spawnTree(trees, stumps, layers.objLayer, tex);
		for (let i = 0; i < 2; i++) spawnBeast(beasts, layers.objLayer, tex);

		function endGame() {
			resultData = { trees: gs.statTrees, animals: gs.statBeasts, coins: gs.statCoins, score: gs.score };
			state = 'result';
			if (mode === 'normal') {
				saveScore('survival-loop', {
					score: gs.score,
					details: { trees: gs.statTrees, bears: gs.statBeasts, coins: gs.statCoins },
					finishedAt: new Date().toISOString()
				});
			}
		}

		startGameLoop(
			app, mode, selectedGender,
			P, pC, pBody, pSprite, pHpBar, pCarryC, pLL, pRL,
			gs, trees, beasts, stumps, drops, allWk, wkRefs,
			btns, inp, tex,
			{ world: layers.world, objLayer: layers.objLayer, itemLayer: layers.itemLayer, charLayer: layers.charLayer, fxLayer: layers.fxLayer },
			stockTexts, timerHud, scoreHud,
			getState, endGame, updateCarryVisualFn
		);

		cleanup = function () {
			removeInputListeners();
			appCleanup();
		};
	}

	function restart() { if (cleanup) cleanup(); containerEl.innerHTML = ''; state = 'menu'; }
	function selectMode(mode: 'normal' | 'infinite') { startGame(mode); }
	function pickGender(g: 'male' | 'female') { selectedGender = g; }
	onMount(function () { return function () { if (cleanup) cleanup(); }; });
</script>

<GameShell title="末日生存" onrestart={restart}>
	<div class="game-container" bind:this={containerEl}></div>

	{#if state === 'menu'}
		<div class="menu-overlay">
			<div class="menu-box">
				<p class="menu-title">末日生存</p>

				<div class="char-pick">
					<button class="char-card" class:selected={selectedGender === 'male'} onclick={() => pickGender('male')}>
						<div class="char-frame">
							<img src={survivalSpriteUrls.heroDownIdle} alt="男主角" class="char-img" />
						</div>
						<span class="char-name">ㄅ</span>
					</button>
					<button class="char-card" class:selected={selectedGender === 'female'} onclick={() => pickGender('female')}>
						<div class="char-frame">
							<img src={survivalSpriteUrls.heroFemaleDownIdle} alt="女主角" class="char-img" />
						</div>
						<span class="char-name">ㄆ</span>
					</button>
				</div>

				<div class="menu-modes">
					<button class="menu-mode" onclick={() => selectMode('normal')}>
						<span class="menu-mode-name">一般模式</span>
						<span class="menu-mode-desc">3 分鐘限時挑戰</span>
					</button>
					<button class="menu-mode" onclick={() => selectMode('infinite')}>
						<span class="menu-mode-name">無限模式</span>
						<span class="menu-mode-desc">無時間限制</span>
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if state === 'result'}
		<div class="overlay">
			<div class="overlay-box result">
				<p class="title">時間到！</p>
				<div class="stats">
					<div class="stat-row"><span>🌲 砍倒木頭</span><span>{resultData.trees}</span></div>
					<div class="stat-row"><span>🐻 獵殺熊</span><span>{resultData.animals}</span></div>
					<div class="stat-row"><span>💰 產出金幣</span><span>{resultData.coins}</span></div>
					<div class="stat-row total"><span>🏆 總分</span><span>{resultData.score}</span></div>
				</div>
				<button onclick={restart}>再玩一次</button>
			</div>
		</div>
	{/if}
</GameShell>

<style>
	.game-container {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.overlay-box {
		text-align: center;
		padding: 2rem 3rem;
		border-radius: 12px;
		background: #1a0a2e;
	}

	.result .title {
		font-family: 'Audiowide', sans-serif;
		font-size: 1.8rem;
		color: #00f0ff;
		text-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
		margin-bottom: 1.2rem;
	}

	.stats {
		text-align: left;
		margin-bottom: 1.2rem;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		font-family: 'Arial', sans-serif;
		font-size: 1.1rem;
		color: #e0e0f0;
		padding: 0.4rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.stat-row.total {
		border-bottom: none;
		border-top: 2px solid #ffe156;
		margin-top: 0.4rem;
		padding-top: 0.6rem;
		font-size: 1.4rem;
		color: #ffe156;
		font-weight: bold;
	}

	.overlay-box button {
		font-family: 'Audiowide', sans-serif;
		font-size: 1rem;
		padding: 0.6rem 2rem;
		border: 2px solid #ffe156;
		background: none;
		color: #ffe156;
		border-radius: 8px;
		cursor: pointer;
		margin-top: 0.5rem;
	}

	.overlay-box button:hover {
		background: rgba(255, 225, 86, 0.15);
	}

	.menu-overlay {
		position: fixed;
		inset: 0;
		background: rgba(12, 12, 14, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.menu-box {
		text-align: center;
		padding: 2rem 3rem;
		border-radius: 12px;
		background: #1c1e22;
		border: 1px solid rgba(180, 160, 130, 0.12);
		box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
	}

	.menu-title {
		font-family: 'Audiowide', sans-serif;
		font-size: 1.8rem;
		color: var(--neon-pink, #c4956a);
		text-shadow: 0 0 8px rgba(196, 149, 106, 0.5);
		margin: 0 0 1.5rem;
	}

	/* --- Character Pick --- */

	.char-pick {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.char-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem;
		border: 2px solid rgba(180, 160, 130, 0.15);
		border-radius: 10px;
		background: rgba(180, 160, 130, 0.04);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.char-card:hover {
		border-color: rgba(200, 175, 140, 0.35);
		background: rgba(180, 160, 130, 0.08);
	}

	.char-card.selected {
		border-color: var(--neon-pink, #c4956a);
		background: rgba(196, 149, 106, 0.1);
		box-shadow: 0 0 12px rgba(196, 149, 106, 0.2);
	}

	.char-frame {
		width: 64px;
		height: 64px;
		border: 1px solid rgba(180, 160, 130, 0.2);
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.25);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.char-card.selected .char-frame {
		border-color: rgba(196, 149, 106, 0.4);
	}

	.char-img {
		width: 48px;
		height: 48px;
		image-rendering: pixelated;
		object-fit: contain;
	}

	.char-name {
		font-size: 1rem;
		color: #706b63;
		letter-spacing: 0.1em;
	}

	.char-card.selected .char-name {
		color: var(--neon-pink, #c4956a);
	}

	.menu-modes {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.menu-mode {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		padding: 1rem 2.5rem;
		border: 1px solid rgba(180, 160, 130, 0.25);
		background: rgba(180, 160, 130, 0.06);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.menu-mode:hover {
		background: rgba(180, 160, 130, 0.14);
		border-color: rgba(200, 175, 140, 0.4);
	}

	.menu-mode:active {
		background: rgba(180, 160, 130, 0.2);
	}

	.menu-mode-name {
		font-family: 'Audiowide', sans-serif;
		font-size: 1.1rem;
		color: #d4cfc8;
	}

	.menu-mode-desc {
		font-family: 'Arial', sans-serif;
		font-size: 0.8rem;
		color: #706b63;
	}
</style>
