<script>
	import './adminMenu.css';
	// Props
	let { activeSection = $bindable('dashboard'), isNavRailVisible = true, onnavigate } = $props();

	// Navigation items for admin
	const navigationItems = [
		{
			id: 'dashboard',
			label: 'Dashboard',
			icon: 'dashboard'
		},
		{
			id: 'users',
			label: 'User Management',
			icon: 'group'
		},
		{
			id: 'reports',
			label: 'Reports',
			icon: 'assessment'
		},
		{
			id: 'settings',
			label: 'System Settings',
			icon: 'settings'
		},
		{
			id: 'analytics',
			label: 'Analytics',
			icon: 'analytics'
		}
	];

	// Handle navigation
	function handleNavigation(sectionId) {
		activeSection = sectionId;
		// Call the parent's navigation handler
		if (onnavigate) {
			onnavigate({ detail: { section: sectionId } });
		}
	}
</script>

<!-- Navigation Rail (Desktop) -->
<nav class="navigation-rail" class:collapsed={!isNavRailVisible} role="navigation" aria-label="Admin portal navigation">
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
				</div>
				<span class="rail-label">{item.label}</span>
			</button>
		{/each}
	</div>
</nav>

<!-- Bottom Navigation (Mobile) -->
<nav class="bottom-navigation" role="navigation" aria-label="Admin portal navigation">
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
				</div>
			</button>
		{/each}

		<!-- Center dashboard button -->
		<button 
			class="nav-item" 
			class:active={'dashboard' === activeSection}
			onclick={() => handleNavigation('dashboard')}
			aria-label="Dashboard"
			aria-current={'dashboard' === activeSection ? 'page' : undefined}
		>
			<div class="nav-icon-container">
				<span class="material-symbols-outlined nav-icon" style="font-variation-settings: 'FILL' 1; font-size: 28px;">dashboard</span>
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
				</div>
			</button>
		{/each}
	</div>
</nav>