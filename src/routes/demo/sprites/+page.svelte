<script lang="ts">
	import { onMount } from 'svelte';

	type AnimationSpec = {
		frames: number;
		durations: number[];
		hitFrame?: number;
		optional?: boolean;
	};

	type FrameContract = {
		canvas: [number, number];
		anchor: [number, number];
		baselineY: number;
		visualHeight?: [number, number];
		directions?: string[];
	};

	type BatchAsset = {
		id: string;
		label: string;
		kind: string;
		basePath: string;
		actions: string[];
	};

	type StaticAsset = {
		id: string;
		file: string;
		canvas: [number, number];
		anchor: [number, number];
	};

	type BackgroundLayer = { id: string; file: string; alpha: boolean };

	type BackgroundSpec = {
		id: string;
		label: string;
		size: [number, number];
		basePath: string;
		layers: BackgroundLayer[];
	};

	type Manifest = {
		pack?: string;
		assetRoot: string;
		frameContracts: Record<string, FrameContract>;
		animations: Record<string, Record<string, AnimationSpec>>;
		reviewBatch?: BatchAsset[];
		firstReviewBatch?: BatchAsset[];
		statics?: StaticAsset[];
		backgrounds?: BackgroundSpec[];
	};

	type PackEntry = { id: string; label: string; manifest: string };

	let packs = $state<PackEntry[]>([]);
	let selectedPackId = $state('');
	let manifest = $state<Manifest | null>(null);
	let manifestError = $state('');

	let selectedAssetId = $state('');
	let selectedAction = $state('');
	let frameIndex = $state(0);
	let isPlaying = $state(false);
	let missingFrame = $state(false);
	let speed = $state(1);
	let mirrored = $state(false);
	let onionSkin = $state(false);
	let showGuides = $state(true);
	let stageBg = $state<'checker' | 'dark' | 'light'>('checker');
	let auditing = $state(false);
	let audited = $state(false);
	let missingFiles = $state<string[]>([]);
	let timer: number | undefined;

	const batch = $derived(manifest?.reviewBatch ?? manifest?.firstReviewBatch ?? []);
	const statics = $derived(manifest?.statics ?? []);
	const backgrounds = $derived(manifest?.backgrounds ?? []);

	const selectedAsset = $derived(batch.find((asset) => asset.id === selectedAssetId));

	function baseActionName(action: string) {
		return action.replace(/_(down|left|right|up)$/, '');
	}

	const selectedSpec = $derived.by(function () {
		if (!manifest || !selectedAsset) return undefined;
		return manifest.animations[selectedAsset.kind]?.[baseActionName(selectedAction)];
	});

	const contract = $derived.by(function () {
		if (!manifest || !selectedAsset) return undefined;
		return manifest.frameContracts[selectedAsset.kind];
	});

	function frameFile(asset: BatchAsset, action: string, index: number) {
		return `${asset.basePath}/${asset.id}_${action}_${String(index).padStart(3, '0')}.png`;
	}

	const frameSrc = $derived.by(function () {
		if (!selectedAsset || !selectedAction) return '';
		return frameFile(selectedAsset, selectedAction, frameIndex);
	});

	const prevFrameSrc = $derived.by(function () {
		if (!selectedAsset || !selectedSpec || selectedSpec.frames < 2) return '';
		const prev = (frameIndex - 1 + selectedSpec.frames) % selectedSpec.frames;
		return frameFile(selectedAsset, selectedAction, prev);
	});

	const isHitFrame = $derived(
		selectedSpec?.hitFrame !== undefined && frameIndex === selectedSpec.hitFrame
	);

	function clearTimer() {
		if (timer !== undefined) window.clearTimeout(timer);
		timer = undefined;
	}

	function step(delta: number) {
		if (!selectedSpec) return;
		frameIndex = (frameIndex + delta + selectedSpec.frames) % selectedSpec.frames;
		missingFrame = false;
	}

	function scheduleNextFrame() {
		clearTimer();
		if (!isPlaying || !selectedSpec) return;
		const duration = (selectedSpec.durations[frameIndex] ?? 0.1) / speed;
		timer = window.setTimeout(function () {
			step(1);
		}, duration * 1000);
	}

	function selectAsset(id: string) {
		const asset = batch.find((item) => item.id === id);
		if (!asset) return;
		selectedAssetId = id;
		selectedAction = asset.actions[0] ?? '';
		frameIndex = 0;
		missingFrame = false;
	}

	function selectAction(action: string) {
		selectedAction = action;
		frameIndex = 0;
		missingFrame = false;
	}

	async function loadPack(id: string) {
		const pack = packs.find((p) => p.id === id);
		if (!pack) return;
		selectedPackId = id;
		manifest = null;
		manifestError = '';
		audited = false;
		missingFiles = [];
		isPlaying = false;
		try {
			const response = await fetch(pack.manifest);
			if (!response.ok) {
				manifestError = `清單檔尚未交付或無法讀取（HTTP ${response.status}）：${pack.manifest}`;
				return;
			}
			manifest = (await response.json()) as Manifest;
			const first = (manifest.reviewBatch ?? manifest.firstReviewBatch ?? [])[0];
			selectedAssetId = first?.id ?? '';
			selectedAction = first?.actions[0] ?? '';
			frameIndex = 0;
		} catch {
			manifestError = `清單檔解析失敗：${pack.manifest}`;
		}
	}

	function expectedFiles(): string[] {
		if (!manifest) return [];
		const files: string[] = [];
		for (const asset of batch) {
			for (const action of asset.actions) {
				const spec = manifest.animations[asset.kind]?.[baseActionName(action)];
				if (!spec) continue;
				for (let i = 0; i < spec.frames; i++) files.push(frameFile(asset, action, i));
			}
		}
		for (const item of statics) files.push(`${manifest.assetRoot}/${item.file}`);
		for (const bg of backgrounds) {
			for (const layer of bg.layers) files.push(`${bg.basePath}/${layer.file}`);
		}
		return files;
	}

	async function runAudit() {
		auditing = true;
		missingFiles = [];
		const files = expectedFiles();
		const results = await Promise.all(
			files.map(function (file) {
				return new Promise<string | null>(function (resolve) {
					const img = new Image();
					img.onload = function () {
						resolve(null);
					};
					img.onerror = function () {
						resolve(file);
					};
					img.src = file;
				});
			})
		);
		missingFiles = results.filter(function (file): file is string {
			return file !== null;
		});
		audited = true;
		auditing = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') step(-1);
		else if (event.key === 'ArrowRight') step(1);
		else if (event.key === ' ') {
			event.preventDefault();
			isPlaying = !isPlaying;
		}
	}

	onMount(function () {
		const initial = new URLSearchParams(window.location.search).get('pack');
		fetch('/demo/sprites/index.json')
			.then((response) => response.json())
			.then((data: { packs: PackEntry[] }) => {
				packs = data.packs;
				const target =
					packs.find((p) => p.id === initial)?.id ?? packs[0]?.id ?? '';
				if (target) loadPack(target);
			});
		return clearTimer;
	});

	$effect(function () {
		scheduleNextFrame();
		return clearTimer;
	});
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
	<title>Sprite Review — Ad Game</title>
	<meta name="description" content="精靈圖素材包審查工具" />
</svelte:head>

<main>
	<header class="topbar">
		<a href="/" class="back-link" aria-label="回首頁">←</a>
		<div>
			<p class="eyebrow">Sprite Review</p>
			<h1>精靈圖審查</h1>
		</div>
		<div class="pack-picker">
			{#each packs as pack}
				<button class:active={selectedPackId === pack.id} onclick={() => loadPack(pack.id)}>
					{pack.label}
				</button>
			{/each}
		</div>
	</header>

	{#if manifestError}
		<p class="loading">{manifestError}</p>
	{:else if manifest}
		<section class="workspace">
			<div class="viewer">
				{#if selectedAsset && selectedSpec && contract}
					<div
						class="stage"
						class:bg-dark={stageBg === 'dark'}
						class:bg-light={stageBg === 'light'}
					>
						<div
							class="frame-box"
							class:hit={isHitFrame}
							style={`--frame-w: ${contract.canvas[0]}; --frame-h: ${contract.canvas[1]}; --anchor-x: ${contract.anchor[0]}; --anchor-y: ${contract.anchor[1]};`}
						>
							{#if onionSkin && prevFrameSrc}
								<img class="onion" class:mirrored src={prevFrameSrc} alt="前一幀" />
							{/if}
							<img
								class:mirrored
								src={frameSrc}
								alt={`${selectedAsset.label} ${selectedAction} 第 ${frameIndex + 1} 幀`}
								onerror={() => (missingFrame = true)}
								onload={() => (missingFrame = false)}
							/>
							{#if showGuides}
								<div class="baseline"></div>
								<div class="centerline"></div>
								<div class="anchor"></div>
							{/if}
							{#if isHitFrame}
								<span class="hit-tag">命中幀</span>
							{/if}
							{#if missingFrame}
								<div class="missing">
									<span>檔案缺漏</span>
									<code>{frameSrc}</code>
								</div>
							{/if}
						</div>
					</div>

					<div class="transport">
						<button onclick={() => step(-1)} aria-label="上一幀">‹</button>
						<button onclick={() => (isPlaying = !isPlaying)}>
							{isPlaying ? '暫停' : '播放'}
						</button>
						<button onclick={() => step(1)} aria-label="下一幀">›</button>
						<span class="frame-readout">第 {frameIndex + 1} / {selectedSpec.frames} 幀</span>
					</div>

					<div class="toggles">
						<div class="toggle-group" role="group" aria-label="播放速度">
							{#each [0.25, 0.5, 1] as s}
								<button class:active={speed === s} onclick={() => (speed = s)}>{s}x</button>
							{/each}
						</div>
						<button class:active={mirrored} onclick={() => (mirrored = !mirrored)}>鏡像</button>
						<button class:active={onionSkin} onclick={() => (onionSkin = !onionSkin)}>洋蔥皮</button>
						<button class:active={showGuides} onclick={() => (showGuides = !showGuides)}>輔助線</button>
						<div class="toggle-group" role="group" aria-label="底色">
							<button class:active={stageBg === 'checker'} onclick={() => (stageBg = 'checker')}>格紋</button>
							<button class:active={stageBg === 'dark'} onclick={() => (stageBg = 'dark')}>深</button>
							<button class:active={stageBg === 'light'} onclick={() => (stageBg = 'light')}>淺</button>
						</div>
					</div>
				{:else}
					<p class="loading">此素材包沒有可播放的動畫。</p>
				{/if}
			</div>

			<aside class="panel">
				{#if batch.length > 0}
					<section class="control-group">
						<h2>素材</h2>
						<div class="segmented">
							{#each batch as asset}
								<button class:active={selectedAssetId === asset.id} onclick={() => selectAsset(asset.id)}>
									{asset.label}
								</button>
							{/each}
						</div>
					</section>
				{/if}

				{#if selectedAsset}
					<section class="control-group">
						<h2>動作</h2>
						<div class="segmented actions">
							{#each selectedAsset.actions as action}
								<button class:active={selectedAction === action} onclick={() => selectAction(action)}>
									{action}
								</button>
							{/each}
						</div>
					</section>
				{/if}

				{#if contract && selectedSpec}
					<section class="metrics">
						<h2>規格</h2>
						<dl>
							<div><dt>畫布</dt><dd>{contract.canvas[0]} x {contract.canvas[1]}</dd></div>
							<div><dt>錨點</dt><dd>{contract.anchor[0]}, {contract.anchor[1]}</dd></div>
							<div><dt>基準線</dt><dd>y = {contract.baselineY}</dd></div>
							{#if contract.visualHeight}
								<div><dt>身高</dt><dd>{contract.visualHeight[0]}-{contract.visualHeight[1]} px</dd></div>
							{/if}
							<div><dt>每幀時長</dt><dd>{selectedSpec.durations.join(', ')}</dd></div>
							<div>
								<dt>命中幀</dt>
								<dd>{selectedSpec.hitFrame === undefined ? '無' : `第 ${selectedSpec.hitFrame + 1} 幀`}</dd>
							</div>
						</dl>
					</section>
				{/if}

				<section class="metrics">
					<h2>缺漏檢查</h2>
					<button class="audit-btn" onclick={runAudit} disabled={auditing}>
						{auditing ? '檢查中...' : '檢查整包檔案'}
					</button>
					{#if audited}
						{#if missingFiles.length === 0}
							<p class="audit-ok">全部 {expectedFiles().length} 個檔案齊全。</p>
						{:else}
							<p class="audit-bad">缺 {missingFiles.length} 個檔案：</p>
							<ul class="audit-list">
								{#each missingFiles as file}
									<li><code>{file}</code></li>
								{/each}
							</ul>
						{/if}
					{/if}
				</section>
			</aside>
		</section>

		{#if statics.length > 0}
			<section class="statics">
				<h2>靜態圖</h2>
				<div class="static-grid">
					{#each statics as item}
						<div class="static-card">
							<div
								class="static-box"
								class:bg-light={stageBg === 'light'}
								style={`aspect-ratio: ${item.canvas[0]} / ${item.canvas[1]};`}
							>
								<img src={`${manifest.assetRoot}/${item.file}`} alt={item.id} />
								{#if showGuides}
									<div
										class="static-anchor"
										style={`left: ${(item.anchor[0] / item.canvas[0]) * 100}%; top: ${(item.anchor[1] / item.canvas[1]) * 100}%;`}
									></div>
								{/if}
							</div>
							<span>{item.id}</span>
							<small>{item.canvas[0]} x {item.canvas[1]}</small>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if backgrounds.length > 0}
			<section class="statics">
				<h2>背景圖層</h2>
				{#each backgrounds as bg}
					<div class="layer-strip">
						<div class="layer-title">
							<strong>{bg.label}</strong>
							<span>{bg.size[0]} x {bg.size[1]}</span>
						</div>
						<div class="background-preview">
							{#each bg.layers as layer}
								<img src={`${bg.basePath}/${layer.file}`} alt={`${bg.label} ${layer.id}`} />
							{/each}
						</div>
					</div>
				{/each}
			</section>
		{/if}
	{:else}
		<p class="loading">載入素材包中...</p>
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

	.pack-picker {
		display: flex;
		gap: 8px;
		margin-left: auto;
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
		text-decoration: none;
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
	.statics {
		border: 1px solid rgba(239, 232, 218, 0.16);
		background: rgba(14, 20, 18, 0.72);
	}

	.viewer {
		min-height: 520px;
		display: grid;
		grid-template-rows: 1fr auto auto;
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

	.stage.bg-dark {
		background: #0b0f0e;
	}

	.stage.bg-light {
		background: #d8d4c8;
	}

	.frame-box {
		position: relative;
		width: calc(var(--frame-w) * 1px);
		height: calc(var(--frame-h) * 1px);
		outline: 1px solid rgba(241, 216, 154, 0.5);
		transform: scale(1.72);
		transform-origin: center;
	}

	.frame-box.hit {
		outline: 2px solid rgba(255, 90, 90, 0.9);
	}

	.frame-box img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	img.mirrored {
		transform: scaleX(-1);
	}

	img.onion {
		opacity: 0.35;
		filter: grayscale(0.6);
	}

	.hit-tag {
		position: absolute;
		top: 4px;
		right: 4px;
		padding: 1px 6px;
		background: rgba(255, 90, 90, 0.85);
		color: #fff;
		font-size: 10px;
		border-radius: 3px;
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

	.toggles {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 12px;
	}

	.toggle-group {
		display: flex;
		gap: 0;
	}

	.toggle-group button {
		border-radius: 0;
	}

	.toggle-group button:first-child {
		border-radius: 6px 0 0 6px;
	}

	.toggle-group button:last-child {
		border-radius: 0 6px 6px 0;
	}

	button {
		min-height: 36px;
		padding: 0 12px;
		border-radius: 6px;
		cursor: pointer;
		font: inherit;
		font-size: 13px;
	}

	button:hover,
	button.active {
		border-color: rgba(241, 216, 154, 0.72);
		background: rgba(83, 77, 49, 0.72);
	}

	button:disabled {
		opacity: 0.5;
		cursor: wait;
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

	.audit-btn {
		margin-top: 10px;
		width: 100%;
	}

	.audit-ok {
		margin: 10px 0 0;
		color: #7fd6a0;
		font-size: 13px;
	}

	.audit-bad {
		margin: 10px 0 4px;
		color: #ff9a7a;
		font-size: 13px;
	}

	.audit-list {
		margin: 0;
		padding-left: 18px;
		display: grid;
		gap: 4px;
		max-height: 220px;
		overflow: auto;
	}

	.statics {
		max-width: 1180px;
		margin: 16px auto 0;
		padding: 16px;
	}

	.static-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 12px;
		margin-top: 12px;
	}

	.static-card {
		display: grid;
		gap: 4px;
		padding: 10px;
		border: 1px solid rgba(239, 232, 218, 0.12);
		background: rgba(255, 255, 255, 0.035);
	}

	.static-card span {
		color: #f1d89a;
		font-size: 12px;
	}

	.static-card small {
		color: #a99f8d;
	}

	.static-box {
		position: relative;
		width: 100%;
		background:
			linear-gradient(45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
			linear-gradient(-45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
			#101512;
		background-size: 16px 16px;
	}

	.static-box.bg-light {
		background: #d8d4c8;
	}

	.static-box img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.static-anchor {
		position: absolute;
		width: 8px;
		height: 8px;
		margin: -4px 0 0 -4px;
		border-radius: 50%;
		background: #ffcf5d;
		pointer-events: none;
	}

	.layer-strip {
		margin-top: 10px;
	}

	.layer-title {
		display: flex;
		justify-content: space-between;
		gap: 12px;
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
		background: #101512;
	}

	.background-preview img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.loading {
		text-align: center;
		padding: 30vh 0;
	}

	@media (max-width: 840px) {
		main {
			padding: 12px;
		}

		.topbar {
			flex-wrap: wrap;
		}

		.pack-picker {
			width: 100%;
			margin-left: 0;
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
	}
</style>
