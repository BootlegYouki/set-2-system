<script>
	import './adminMenu.css';
	// Props
	let { activeSection = $bindable('dashboard'), isNavRailVisible = true, onnavigate } = $props();

	// Navigation items for admin
	const navigationItems = [
		{
			id: 'account-creation',
			label: 'Account Creation',
			icon: 'person_add',
			description: 'Create new student and teacher accounts'
		},
		{
			id: 'room-management',
			label: 'Room Management',
			icon: 'meeting_room',
			description: 'Create and manage rooms, assign to sections and teachers'
		},
		{
			id: 'section-management',
			label: 'Section Management',
			icon: 'groups',
			description: 'Create sections, assign students and advisory teachers'
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