<script lang="ts">
	import { onMount } from 'svelte';

	type AnimationSpec = {
		frames: number;
		durations: number[];
		hitFrame?: number;
		optional?: boolean;
	};

	type BatchAsset = {
		id: string;
		label: string;
		kind: 'character' | 'bear';
		basePath: string;
		actions: string[];
	};

	type BackgroundLayer = {
		id: string;
		file: string;
		alpha: boolean;
	};

	type BackgroundSpec = {
		id: string;
		label: string;
		size: [number, number];
		basePath: string;
		layers: BackgroundLayer[];
		metadata: string;
	};

	type Manifest = {
		assetRoot: string;
		frameContracts: {
			character: { canvas: [number, number]; anchor: [number, number]; baselineY: number; visualHeight: [number, number] };
			bear: { canvas: [number, number]; anchor: [number, number]; baselineY: number; visualHeight: [number, number] };
		};
		animations: {
			character: Record<string, AnimationSpec>;
			bear: Record<string, AnimationSpec>;
		};
		firstReviewBatch: BatchAsset[];
		backgrounds: BackgroundSpec[];
	};

	let manifest = $state<Manifest | null>(null);
	let selectedAssetId = $state('male_axe');
	let selectedAction = $state('idle_down');
	let frameIndex = $state(0);
	let isPlaying = $state(false);
	let missingFrame = $state(false);
	let timer: number | undefined;

	const selectedAsset = $derived(manifest?.firstReviewBatch.find((asset) => asset.id === selectedAssetId));

	const selectedSpec = $derived.by(function () {
		if (!manifest || !selectedAsset) return undefined;
		const actionName = selectedAction.replace(/_(down|left|right|up)$/, '');
		return manifest.animations[selectedAsset.kind][actionName];
	});

	const contract = $derived.by(function () {
		if (!manifest || !selectedAsset) return undefined;
		return manifest.frameContracts[selectedAsset.kind];
	});

	const frameSrc = $derived.by(function () {
		if (!selectedAsset) return '';
		return `${selectedAsset.basePath}/${selectedAsset.id}_${selectedAction}_${String(frameIndex).padStart(3, '0')}.png`;
	});

	function selectAsset(id: string) {
		const asset = manifest?.firstReviewBatch.find((item) => item.id === id);
		if (!asset) return;
		selectedAssetId = id;
		selectedAction = asset.actions[0];
		frameIndex = 0;
		missingFrame = false;
	}

	function selectAction(action: string) {
		selectedAction = action;
		frameIndex = 0;
		missingFrame = false;
	}

	function step(delta: number) {
		if (!selectedSpec) return;
		frameIndex = (frameIndex + delta + selectedSpec.frames) % selectedSpec.frames;
		missingFrame = false;
	}

	function togglePlayback() {
		isPlaying = !isPlaying;
	}

	function clearTimer() {
		if (timer !== undefined) window.clearTimeout(timer);
		timer = undefined;
	}

	function scheduleNextFrame() {
		clearTimer();
		if (!isPlaying || !selectedSpec) return;
		const duration = selectedSpec.durations[frameIndex] ?? 0.1;
		timer = window.setTimeout(function () {
			step(1);
		}, duration * 1000);
	}

	onMount(function () {
		fetch('/demo/ooxx/ooxx-art-manifest.json')
			.then((response) => response.json())
			.then((data: Manifest) => {
				manifest = data;
				selectedAssetId = data.firstReviewBatch[0]?.id ?? 'male_axe';
				selectedAction = data.firstReviewBatch[0]?.actions[0] ?? 'idle_down';
			});

		return clearTimer;
	});

	$effect(function () {
		scheduleNextFrame();
		return clearTimer;
	});
</script>

<svelte:head>
	<title>OOXX Art Demo</title>
	<meta name="description" content="Animation and background layer review page for OOXX art production." />
</svelte:head>

<main>
	<header class="topbar">
		<a href="/" class="back-link" aria-label="Back to home">←</a>
		<div>
			<p class="eyebrow">OOXX Art Review</p>
			<h1>Animation Contract</h1>
		</div>
	</header>

	{#if manifest && selectedAsset && selectedSpec && contract}
		<section class="workspace">
			<div class="viewer">
				<div class="stage" style={`--frame-w: ${contract.canvas[0]}; --frame-h: ${contract.canvas[1]}; --anchor-x: ${contract.anchor[0]}; --anchor-y: ${contract.anchor[1]};`}>
					<div class="frame-box">
						<img
							src={frameSrc}
							alt={`${selectedAsset.label} ${selectedAction} frame ${frameIndex}`}
							onerror={() => (missingFrame = true)}
							onload={() => (missingFrame = false)}
						/>
						<div class="baseline"></div>
						<div class="centerline"></div>
						<div class="anchor"></div>
						{#if missingFrame}
							<div class="missing">
								<span>PNG missing</span>
								<code>{frameSrc}</code>
							</div>
						{/if}
					</div>
				</div>

				<div class="transport">
					<button onclick={() => step(-1)} aria-label="Previous frame">‹</button>
					<button onclick={togglePlayback}>{isPlaying ? 'Pause' : 'Play'}</button>
					<button onclick={() => step(1)} aria-label="Next frame">›</button>
					<span class="frame-readout">Frame {frameIndex + 1} / {selectedSpec.frames}</span>
				</div>
			</div>

			<aside class="panel">
				<section class="control-group">
					<h2>Asset</h2>
					<div class="segmented">
						{#each manifest.firstReviewBatch as asset}
							<button class:active={selectedAssetId === asset.id} onclick={() => selectAsset(asset.id)}>
								{asset.label}
							</button>
						{/each}
					</div>
				</section>

				<section class="control-group">
					<h2>Action</h2>
					<div class="segmented actions">
						{#each selectedAsset.actions as action}
							<button class:active={selectedAction === action} onclick={() => selectAction(action)}>
								{action}
							</button>
						{/each}
					</div>
				</section>

				<section class="metrics">
					<h2>Spec</h2>
					<dl>
						<div><dt>Canvas</dt><dd>{contract.canvas[0]} x {contract.canvas[1]}</dd></div>
						<div><dt>Anchor</dt><dd>{contract.anchor[0]}, {contract.anchor[1]}</dd></div>
						<div><dt>Baseline</dt><dd>y = {contract.baselineY}</dd></div>
						<div><dt>Visual height</dt><dd>{contract.visualHeight[0]}-{contract.visualHeight[1]}</dd></div>
						<div><dt>Durations</dt><dd>{selectedSpec.durations.join(', ')}</dd></div>
						<div><dt>Hit frame</dt><dd>{selectedSpec.hitFrame === undefined ? 'none' : selectedSpec.hitFrame + 1}</dd></div>
					</dl>
				</section>
			</aside>
		</section>

		<section class="backgrounds">
			<h2>Background Layers</h2>
			{#each manifest.backgrounds as bg}
				<div class="layer-strip">
					<div class="layer-title">
						<strong>{bg.label}</strong>
						<span>{bg.size[0]} x {bg.size[1]}</span>
					</div>
					<div class="background-preview">
						{#each bg.layers as layer}
							<img src={`${bg.basePath}/${layer.file}`} alt={`${bg.label} ${layer.id} layer`} />
						{/each}
					</div>
					<div class="layers">
						{#each bg.layers as layer}
							<div class="layer">
								<span>{layer.id}</span>
								<small>{layer.alpha ? 'alpha' : 'opaque'}</small>
								<code>{bg.basePath}/{layer.file}</code>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</section>
	{:else}
		<p class="loading">Loading manifest...</p>
	{/if}
</main>

<style>
	main {
		min-height: 100vh;
		padding: 18px;
		background:
			linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
			#16201d;
		background-size: 24px 24px;
		color: #efe8da;
	}

	.topbar {
		display: flex;
		align-items: center;
		gap: 14px;
		max-width: 1180px;
		margin: 0 auto 18px;
	}

	.back-link,
	button {
		border: 1px solid rgba(239, 232, 218, 0.2);
		background: rgba(20, 28, 25, 0.88);
		color: #efe8da;
	}

	.back-link {
		display: grid;
		width: 40px;
		height: 40px;
		place-items: center;
		border-radius: 6px;
		font-size: 24px;
	}

	.eyebrow {
		margin: 0 0 2px;
		color: #d6b46d;
		font-size: 12px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h1,
	h2 {
		margin: 0;
		letter-spacing: 0;
	}

	h1 {
		font-size: 26px;
	}

	h2 {
		font-size: 15px;
		color: #f1d89a;
	}

	.workspace {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 340px;
		gap: 16px;
		max-width: 1180px;
		margin: 0 auto;
	}

	.viewer,
	.panel,
	.backgrounds {
		border: 1px solid rgba(239, 232, 218, 0.16);
		background: rgba(14, 20, 18, 0.72);
	}

	.viewer {
		min-height: 520px;
		display: grid;
		grid-template-rows: 1fr auto;
		align-items: center;
		justify-items: center;
		padding: 18px;
		overflow: hidden;
	}

	.stage {
		display: grid;
		place-items: center;
		width: min(100%, 560px);
		aspect-ratio: 1;
		background:
			linear-gradient(45deg, rgba(255, 255, 255, 0.055) 25%, transparent 25%),
			linear-gradient(-45deg, rgba(255, 255, 255, 0.055) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.055) 75%),
			linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.055) 75%);
		background-position: 0 0, 0 12px, 12px -12px, -12px 0;
		background-size: 24px 24px;
	}

	.frame-box {
		position: relative;
		width: calc(var(--frame-w) * 1px);
		height: calc(var(--frame-h) * 1px);
		outline: 1px solid rgba(241, 216, 154, 0.5);
		image-rendering: auto;
		transform: scale(1.72);
		transform-origin: center;
	}

	img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.baseline,
	.centerline,
	.anchor {
		position: absolute;
		pointer-events: none;
	}

	.baseline {
		left: 0;
		right: 0;
		top: calc(var(--anchor-y) * 1px);
		border-top: 1px solid rgba(75, 173, 112, 0.85);
	}

	.centerline {
		top: 0;
		bottom: 0;
		left: calc(var(--anchor-x) * 1px);
		border-left: 1px solid rgba(96, 168, 220, 0.75);
	}

	.anchor {
		left: calc((var(--anchor-x) * 1px) - 4px);
		top: calc((var(--anchor-y) * 1px) - 4px);
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #ffcf5d;
	}

	.missing {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 14px;
		background: rgba(11, 15, 14, 0.88);
		text-align: center;
	}

	.missing span {
		color: #ffcf5d;
		font-weight: 700;
	}

	code {
		max-width: 100%;
		overflow-wrap: anywhere;
		color: #b9dcc7;
		font-size: 11px;
	}

	.transport {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 18px;
	}

	button {
		min-height: 36px;
		padding: 0 12px;
		border-radius: 6px;
		cursor: pointer;
		font: inherit;
	}

	button:hover,
	button.active {
		border-color: rgba(241, 216, 154, 0.72);
		background: rgba(83, 77, 49, 0.72);
	}

	.frame-readout {
		min-width: 110px;
		color: #d6ccb9;
		font-size: 13px;
	}

	.panel {
		padding: 16px;
	}

	.control-group + .control-group,
	.metrics {
		margin-top: 18px;
	}

	.segmented {
		display: grid;
		grid-template-columns: 1fr;
		gap: 8px;
		margin-top: 10px;
	}

	.actions {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.actions button {
		padding-inline: 8px;
		font-size: 12px;
	}

	dl {
		display: grid;
		gap: 8px;
		margin-top: 10px;
	}

	dl div {
		display: grid;
		grid-template-columns: 110px 1fr;
		gap: 8px;
		align-items: start;
	}

	dt {
		color: #a99f8d;
	}

	dd {
		margin: 0;
		color: #efe8da;
		overflow-wrap: anywhere;
	}

	.backgrounds {
		max-width: 1180px;
		margin: 16px auto 0;
		padding: 16px;
	}

	.layer-strip {
		margin-top: 10px;
	}

	.layer-title {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		color: #efe8da;
	}

	.layer-title span {
		color: #a99f8d;
	}

	.background-preview {
		position: relative;
		overflow: hidden;
		width: 100%;
		aspect-ratio: 16 / 9;
		margin-top: 12px;
		border: 1px solid rgba(239, 232, 218, 0.14);
		background:
			linear-gradient(45deg, rgba(255, 255, 255, 0.055) 25%, transparent 25%),
			linear-gradient(-45deg, rgba(255, 255, 255, 0.055) 25%, transparent 25%),
			#101512;
		background-size: 20px 20px;
	}

	.background-preview img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.layers {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		margin-top: 10px;
	}

	.layer {
		display: grid;
		gap: 4px;
		min-height: 96px;
		align-content: start;
		padding: 10px;
		border: 1px solid rgba(239, 232, 218, 0.12);
		background: rgba(255, 255, 255, 0.035);
	}

	.layer span {
		color: #f1d89a;
	}

	.layer small {
		color: #a99f8d;
	}

	.loading {
		text-align: center;
		padding: 30vh 0;
	}

	@media (max-width: 840px) {
		main {
			padding: 12px;
		}

		.workspace {
			grid-template-columns: 1fr;
		}

		.viewer {
			min-height: 430px;
		}

		.frame-box {
			transform: scale(1.28);
		}

		.layers {
			grid-template-columns: 1fr;
		}
	}
</style>
