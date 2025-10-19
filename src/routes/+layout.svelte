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
			
			initializeInactivityWatcher();
		}, 2800);
	});


const INACTIVITY_MS = 4 * 60 * 60 * 1000;
const HEARTBEAT_DEBOUNCE_MS = 5 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'lastActivityTimestamp';

let inactivityTimer = null;
let lastHeartbeatSent = 0;

function getStoredLastActivity() {
	try {
		const v = localStorage.getItem(LAST_ACTIVITY_KEY);
		return v ? Number(v) : null;
	} catch (e) {
		return null;
	}
}

function setStoredLastActivity(ts) {
	try {
		localStorage.setItem(LAST_ACTIVITY_KEY, String(ts));
	} catch (e) {
		// ignore
	}
}

function clearStoredLastActivity() {
	try {
		localStorage.removeItem(LAST_ACTIVITY_KEY);
	} catch (e) {}
}

function scheduleInactivityCheck() {
	if (inactivityTimer) {
		clearTimeout(inactivityTimer);
		inactivityTimer = null;
	}

	const last = getStoredLastActivity() || Date.now();
	const elapsed = Date.now() - last;
	const remaining = INACTIVITY_MS - elapsed;

	if (remaining <= 0) {
		// expired already
		handleInactivityTimeout();
		return;
	}

	inactivityTimer = setTimeout(handleInactivityTimeout, remaining);
}

async function sendHeartbeatIfNeeded() {
	try {
		if (!authState?.isAuthenticated || !authState.userData) return;
		const now = Date.now();
		if (now - lastHeartbeatSent < HEARTBEAT_DEBOUNCE_MS) return;


		const userInfo = {
			id: authState.userData.id,
			name: authState.userData.name,
			account_number: authState.userData.accountNumber,
			account_type: authState.userData.account_type || authState.userData.accountType
		};


		await fetch('/api/auth/heartbeat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-user-info': JSON.stringify(userInfo)
			},
			body: JSON.stringify({ timestamp: new Date().toISOString() })
		});

		lastHeartbeatSent = now;
	} catch (err) {
		// heartbeat failure shouldn't break the app
		console.warn('Heartbeat failed', err);
	}
}

function markActivity() {
	if (!window?.localStorage) return;
	const now = Date.now();
	setStoredLastActivity(now);
	scheduleInactivityCheck();

	sendHeartbeatIfNeeded();
}

function handleInactivityTimeout() {
	if (authState?.isAuthenticated) {
		authStore.logout();
		clearStoredLastActivity();
	}
}

let activityListenersInstalled = false;

function installActivityListeners() {
	if (activityListenersInstalled) return;
	activityListenersInstalled = true;

	const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
	events.forEach(ev => window.addEventListener(ev, markActivity, { passive: true }));
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			markActivity();
		}
	});


	window.addEventListener('storage', (e) => {
		if (e.key === LAST_ACTIVITY_KEY) {
			scheduleInactivityCheck();
		}
	});
}

function uninstallActivityListeners() {
	if (!activityListenersInstalled) return;
	activityListenersInstalled = false;
	const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
	events.forEach(ev => window.removeEventListener(ev, markActivity));
	document.removeEventListener('visibilitychange', () => {});
	window.removeEventListener('storage', () => {});
}

function initializeInactivityWatcher() {
	// Only run in browser
	if (typeof window === 'undefined') return;


	const stored = getStoredLastActivity();
	if (!stored) {
		setStoredLastActivity(Date.now());
	}

	installActivityListeners();
	scheduleInactivityCheck();

	// Clean up on unload
	window.addEventListener('beforeunload', () => {
		uninstallActivityListeners();
		if (inactivityTimer) clearTimeout(inactivityTimer);
	});
}
</script>

<svelte:head>
	<link rel="icon" href={currentFavicon} />
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
