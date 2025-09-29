<script>
	import favicon from '$lib/assets/favicon.svg';
	import '../lib/styles/design-system.css';
	import ToastContainer from '../components/common/ToastContainer.svelte';
	import ModalContainer from '../components/common/ModalContainer.svelte';
	import { authStore } from '../components/login/js/auth.js';
	import { onMount } from 'svelte';
	
	let { children } = $props();
	let isAuthInitialized = $state(false);
	
	// Initialize auth store
	onMount(() => {		
		// Small delay to let app loading show, then initialize auth
		setTimeout(() => {
			authStore.initialize();
			isAuthInitialized = true;
			
			// Signal to app.html that the app is ready
			if (window.appLoadingManager) {
				window.appLoadingManager.setReady();
			}
		}, 2800); // Slightly before the 3-second timeout
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
{/if}

<!-- Global toast container -->
<ToastContainer />

<!-- Global modal container -->
<ModalContainer />
