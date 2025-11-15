<script>
	import favicon from '$lib/assets/favicon.svg';
	import faviconAdmin from '$lib/assets/favicon-admin.svg';
	import faviconStudent from '$lib/assets/favicon-student.svg';
	import faviconTeacher from '$lib/assets/favicon-teacher.svg';
	import '../lib/styles/design-system.css';
	import ToastContainer from '../components/common/ToastContainer.svelte';
	import ModalContainer from '../components/common/ModalContainer.svelte';
	import { authStore } from '../components/login/js/auth.js';
	import { onMount } from 'svelte';
	import { tick } from 'svelte';
	
	let { children } = $props();
	let isAuthInitialized = $state(false);
	let authState = $state();
	
	// Subscribe to auth store changes
	$effect(() => {
		const unsubscribe = authStore.subscribe(value => {
			authState = value;
		});
		return unsubscribe;
	});
	
	// Reactive favicon based on user type
	let currentFavicon = $derived(
		!authState?.isAuthenticated
			? favicon
			: authState.userType === 'admin'
			? faviconAdmin
			: authState.userType === 'student'
			? faviconStudent
			: authState.userType === 'teacher'
			? faviconTeacher
			: favicon
	);
	
	// Initialize auth store
	onMount(() => {		
	
		setTimeout(() => {
			authStore.initialize();
			isAuthInitialized = true;
			
		
			if (window.appLoadingManager) {
				window.appLoadingManager.setReady();
			}
		}, 2800);
	});
</script>

<svelte:head>
	<link rel="icon" href={currentFavicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
	<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
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
