<script>
	import favicon from '$lib/assets/favicon.svg';
	import '../lib/styles/design-system.css';
	import ToastContainer from '../components/common/ToastContainer.svelte';
	import ModalContainer from '../components/common/ModalContainer.svelte';
	import { authStore } from '../components/login/js/auth.js';
	import { onMount } from 'svelte';
	
	let { children } = $props();
	let isAuthInitialized = $state(false);
	let loadingProgress = $state(0);
	let loadingStage = $state('Initializing...');
	
	// Loading stages with realistic messages
	const loadingStages = [
		{ progress: 0, message: 'Initializing...' },
		{ progress: 15, message: 'Loading authentication...' },
		{ progress: 35, message: 'Connecting to server...' },
		{ progress: 55, message: 'Fetching user data...' },
		{ progress: 75, message: 'Setting up interface...' },
		{ progress: 90, message: 'Almost ready...' },
		{ progress: 100, message: 'Complete!' }
	];
	
	// Initialize auth store with fake loading progress
	onMount(() => {
		let currentStageIndex = 0;
		
		const progressInterval = setInterval(() => {
			if (currentStageIndex < loadingStages.length) {
				const stage = loadingStages[currentStageIndex];
				loadingProgress = stage.progress;
				loadingStage = stage.message;
				currentStageIndex++;
			} else {
				clearInterval(progressInterval);
				// Small delay before showing content for smooth transition
				setTimeout(() => {
					authStore.initialize();
					isAuthInitialized = true;
				}, 300);
			}
		}, 400); // Each stage takes 400ms for realistic timing
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
	<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="theme-color" content="#1565c0" />
</svelte:head>

<!-- Only render children after auth is initialized to prevent flash -->
{#if isAuthInitialized}
	{@render children?.()}
{:else}
	<!-- Loading state to prevent flash -->
	<div class="loading-container">
		<div class="loading-content">
			<span class="material-symbols-outlined loading-icon">school</span>
			<p class="loading-text">{loadingStage}</p>
			
			<!-- Progress bar -->
			<div class="progress-container">
				<div class="progress-bar">
					<div class="progress-fill" style="width: {loadingProgress}%"></div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Global toast container -->
<ToastContainer />

<!-- Global modal container -->
<ModalContainer />

<style>
	@keyframes pulse {
		0%, 100% { 
			transform: scale(1);
			opacity: 0.8;
		}
		50% { 
			transform: scale(1.1);
			opacity: 1;
		}
	}

	@keyframes float {
		0%, 100% { transform: translateY(0px); }
		50% { transform: translateY(-8px); }
	}

	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		background-color: var(--md-sys-color-surface);
		transition: background-color var(--transition-normal, 0.3s ease);
	}

	.loading-content {
		text-align: center;
	}

	.loading-icon {
		font-size: 48px;
		color: var(--md-sys-color-primary);
		margin: 0 auto 16px;
		display: block;
		animation: pulse 2s ease-in-out infinite, float 3s ease-in-out infinite;
		transition: color var(--transition-normal, 0.3s ease);
	}

	.loading-text {
		color: var(--md-sys-color-on-surface);
		font-family: 'Roboto', sans-serif;
		margin: 0 0 20px 0;
		font-size: 14px;
		font-weight: 400;
		min-height: 20px;
		transition: opacity 0.3s ease;
	}

	.progress-container {
		width: 280px;
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 8px;
	}

	.progress-bar {
		flex: 1;
		height: 6px;
		background-color: var(--md-sys-color-outline-variant);
		border-radius: 3px;
		overflow: hidden;
		position: relative;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, 
			var(--md-sys-color-primary) 0%, 
			var(--md-sys-color-primary-container) 100%);
		border-radius: 3px;
		transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}

	.progress-fill::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(90deg, 
			transparent 0%, 
			rgba(255, 255, 255, 0.3) 50%, 
			transparent 100%);
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(200%); }
	}
</style>
