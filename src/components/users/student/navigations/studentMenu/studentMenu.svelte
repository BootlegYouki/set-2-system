<script>
	import './studentMenu.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { authenticatedFetch } from '../../../../../routes/api/helper/api-helper.js';
	import { authStore } from '../../../../login/js/auth.js';
	import { notificationStore } from '../../stores/notificationStore.js';

	// Props
	let { activeSection = $bindable('grades'), isNavRailVisible = true, onnavigate } = $props();

	// Notification state from shared store - use $ prefix to auto-subscribe
	let unreadNotificationCount = $derived($notificationStore.unreadCount);

	// Navigation items
	const navigationItems = [
		{
			id: 'grades',
			label: 'My Grades',
			icon: 'grade'
		},
		{
			id: 'schedule',
			label: 'Schedule',
			icon: 'schedule'
		},
		{
			id: 'documents',
			label: 'Documents',
			icon: 'description'
		},
		{
			id: 'notifications',
			label: 'Notifications',
			icon: 'notifications',
			hasBadge: true
		},
		{
			id: 'todo',
			label: 'Todo List',
			icon: 'checklist'
		}
	];

	// Fetch notification count and update store
	async function fetchNotificationCount() {
		if (!browser) return;
		
		const authState = $authStore;
		if (!authState.isAuthenticated) return;
		
		try {
			const response = await authenticatedFetch('/api/notifications?limit=1&offset=0');
			if (!response.ok) {
				throw new Error(`Failed to fetch notifications: ${response.status}`);
			}
			
			const result = await response.json();
			if (result.success) {
				const unreadCount = result.data.unreadCount || 0;
				const totalCount = result.data.pagination?.total || 0;
				notificationStore.setCounts(unreadCount, totalCount);
			}
		} catch (err) {
			console.error('Error fetching notification count:', err);
		}
	}

	// Handle navigation
	function handleNavigation(sectionId) {
		activeSection = sectionId;
		// Call the parent's navigation handler
		if (onnavigate) {
			onnavigate({ detail: { section: sectionId } });
		}
	}

	// Component lifecycle
	onMount(() => {
		// Wait for auth store to be initialized before fetching
		let unsubscribe;
		unsubscribe = authStore.subscribe((authState) => {
			if (authState.isAuthenticated) {
				fetchNotificationCount();
				if (unsubscribe) {
					unsubscribe();
				}
			}
		});

		// Refresh notification count every 10 seconds
		const interval = setInterval(() => {
			if ($authStore.isAuthenticated) {
				fetchNotificationCount();
			}
		}, 10000);

		return () => {
			clearInterval(interval);
			if (unsubscribe) unsubscribe();
		};
	});
</script>

<!-- Navigation Rail (Desktop) -->
<nav class="navigation-rail" class:collapsed={!isNavRailVisible} aria-label="Student portal navigation">
	<div class="rail-container">
		{#each navigationItems as item (item.id)}
			<button 
				class="rail-item" 
				class:active={item.id === activeSection}
				onclick={() => handleNavigation(item.id)}
				aria-label={item.label}
				aria-current={item.id === activeSection ? 'page' : undefined}
			>
				<div class="rail-icon-container">
					<span class="material-symbols-outlined rail-icon">
						{item.icon}
					</span>
					{#if item.hasBadge && unreadNotificationCount > 0}
						<span class="menu-notification-badge menu-rail-badge">
							{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
						</span>
					{/if}
				</div>
				<span class="rail-label">{item.label}</span>
			</button>
		{/each}
	</div>
</nav>

<!-- Bottom Navigation (Mobile) -->
<nav class="bottom-navigation" aria-label="Student portal navigation">
	<div class="nav-container">
		<!-- First half of navigation items -->
		{#each navigationItems.slice(0, 2) as item (item.id)}
			<button 
				class="nav-item" 
				class:active={item.id === activeSection}
				onclick={() => handleNavigation(item.id)}
				aria-label={item.label}
				aria-current={item.id === activeSection ? 'page' : undefined}
			>
				<div class="nav-icon-container">
					<span class="material-symbols-outlined nav-icon">
						{item.icon}
					</span>
					{#if item.hasBadge && unreadNotificationCount > 0}
						<span class="menu-notification-badge menu-nav-badge">
							{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
						</span>
					{/if}
				</div>
			</button>
		{/each}

		<!-- Center add_diamond button (Todo List) -->
		<button 
			class="nav-item" 
			class:active={'todo' === activeSection}
			onclick={() => handleNavigation('todo')}
			aria-label="Todo List"
			aria-current={'todo' === activeSection ? 'page' : undefined}
		>
			<div class="nav-icon-container">
				<span class="material-symbols-outlined nav-icon" style="font-variation-settings: 'FILL' 1; font-size: 28px;">checklist</span>
			</div>
		</button>

		<!-- Second half of navigation items -->
		{#each navigationItems.slice(2, 4) as item (item.id)}
			<button 
				class="nav-item" 
				class:active={item.id === activeSection}
				onclick={() => handleNavigation(item.id)}
				aria-label={item.label}
				aria-current={item.id === activeSection ? 'page' : undefined}
			>
				<div class="nav-icon-container">
					<span class="material-symbols-outlined nav-icon">
						{item.icon}
					</span>
					{#if item.hasBadge && unreadNotificationCount > 0}
						<span class="menu-notification-badge menu-nav-badge">
							{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
						</span>
					{/if}
				</div>
			</button>
		{/each}
	</div>
</nav>