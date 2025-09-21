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
		// Wait for resource loading to complete or minimum time, whichever is longer
		const checkResourcesAndAuth = () => {
			const isAuthenticated = window.appLoadingManager?.checkAuthState() || false;
			const minimumDelay = isAuthenticated ? 3400 : 4400; // Added 2 seconds to waiting time
			
			// Check if resources are loaded
			const resourcesComplete = window.resourceLoadingManager?.isComplete || false;
			
			if (resourcesComplete) {
				// Resources are loaded, initialize auth and signal app ready
				authStore.initialize();
				isAuthInitialized = true;
				
				// Wait for actual content to be visible before hiding loading
				const waitForVisibleContent = () => {
					// Check for login page or authenticated content
					const loginElement = document.querySelector('.login-container, .login-page, [class*="login"]');
					const studentPortal = document.querySelector('.student-portal');
					const teacherPortal = document.querySelector('.teacher-portal');
					const adminPortal = document.querySelector('.admin-portal');
					const appContainer = document.querySelector('.app-container');
					
					// Check if any content is visible and has rendered
					const hasVisibleContent = loginElement || studentPortal || teacherPortal || adminPortal;
					const appContainerHasContent = appContainer && appContainer.children.length > 0;
					
					if (hasVisibleContent && appContainerHasContent) {
						// Content is visible, safe to hide loading
						setTimeout(() => {
							if (window.appLoadingManager && !window.appLoadingManager.isReady) {
								window.appLoadingManager.setReady();
							}
						}, 50); // Small delay to ensure rendering is complete
					} else {
						// Content not visible yet, check again
						setTimeout(waitForVisibleContent, 50);
					}
				};
				
				// Start checking for visible content after a small delay
				setTimeout(waitForVisibleContent, 100);
			} else {
				// Resources not loaded yet, wait for them
				if (window.resourceLoadingManager) {
					window.resourceLoadingManager.onComplete(() => {
						authStore.initialize();
						isAuthInitialized = true;
						
						// Wait for actual content to be visible before hiding loading
						const waitForVisibleContent = () => {
							// Check for login page or authenticated content
							const loginElement = document.querySelector('.login-container, .login-page, [class*="login"]');
							const studentPortal = document.querySelector('.student-portal');
							const teacherPortal = document.querySelector('.teacher-portal');
							const adminPortal = document.querySelector('.admin-portal');
							const appContainer = document.querySelector('.app-container');
							
							// Check if any content is visible and has rendered
							const hasVisibleContent = loginElement || studentPortal || teacherPortal || adminPortal;
							const appContainerHasContent = appContainer && appContainer.children.length > 0;
							
							if (hasVisibleContent && appContainerHasContent) {
								// Content is visible, safe to hide loading
								setTimeout(() => {
									if (window.appLoadingManager && !window.appLoadingManager.isReady) {
										window.appLoadingManager.setReady();
									}
								}, 50); // Small delay to ensure rendering is complete
							} else {
								// Content not visible yet, check again
								setTimeout(waitForVisibleContent, 50);
							}
						};
						
						// Start checking for visible content after a small delay
						setTimeout(waitForVisibleContent, 100);
					});
				} else {
					// Fallback if resource manager not available
					setTimeout(() => {
						authStore.initialize();
						isAuthInitialized = true;
						
						// Wait for actual content to be visible before hiding loading
						const waitForVisibleContent = () => {
							// Check for login page or authenticated content
							const loginElement = document.querySelector('.login-container, .login-page, [class*="login"]');
							const studentPortal = document.querySelector('.student-portal');
							const teacherPortal = document.querySelector('.teacher-portal');
							const adminPortal = document.querySelector('.admin-portal');
							const appContainer = document.querySelector('.app-container');
							
							// Check if any content is visible and has rendered
							const hasVisibleContent = loginElement || studentPortal || teacherPortal || adminPortal;
							const appContainerHasContent = appContainer && appContainer.children.length > 0;
							
							if (hasVisibleContent && appContainerHasContent) {
								// Content is visible, safe to hide loading
								setTimeout(() => {
									if (window.appLoadingManager && !window.appLoadingManager.isReady) {
										window.appLoadingManager.setReady();
									}
								}, 50); // Small delay to ensure rendering is complete
							} else {
								// Content not visible yet, check again
								setTimeout(waitForVisibleContent, 50);
							}
						};
						
						// Start checking for visible content after a small delay
						setTimeout(waitForVisibleContent, 100);
					}, minimumDelay);
				}
			}
		};
		
		// Small delay to ensure resource tracking is initialized
		setTimeout(checkResourcesAndAuth, 100);
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

<style>
	/* Layout styles can be added here if needed */
</style>
