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
	
	// Initialize auth store with smooth loading progress
	onMount(() => {
		// Start smooth progress animation
		loadingProgress = 0;
		const smoothProgressInterval = setInterval(() => {
			loadingProgress += 1;
			if (loadingProgress >= 100) {
				loadingProgress = 100;
				clearInterval(smoothProgressInterval);
				// Small delay before showing content for smooth transition
				setTimeout(() => {
					authStore.initialize();
					isAuthInitialized = true;
				}, 300);
			}
		}, 28); // 100 steps over ~2.8 seconds for smooth animation
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
			<span class="material-symbols-outlined onload-icon">school</span>
			
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

	.onload-icon {
		font-size: 120px;
		color: var(--md-sys-color-primary);
		margin: 0 auto 32px;
		display: block;
		transition: color var(--transition-normal, 0.3s ease);
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
			var(--md-sys-color-primary-container) 0%, 
			var(--md-sys-color-secondary-container) 100%);
		border-radius: 3px;
		transition: width 0.1s linear;
		position: relative;
		overflow: hidden;
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
			rgba(255, 255, 255, 0.4) 30%,
			rgba(255, 255, 255, 0.6) 50%,
			rgba(255, 255, 255, 0.4) 70%,
			transparent 100%);
		animation: shimmer 1.2s ease-in-out infinite;
		width: 100px;
	}

	@keyframes shimmer {
		0% { 
			transform: translateX(-120px);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		80% {
			opacity: 1;
		}
		100% { 
			transform: translateX(300px);
			opacity: 0;
		}
	}
</style>
