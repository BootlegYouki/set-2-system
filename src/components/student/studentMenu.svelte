<script>
	import './sections/styles/studentMenu.css';
	// Props
	let { activeSection = 'grades', isNavRailVisible = true } = $props();

	// Navigation items
	const navigationItems = [
		{
			id: 'grades',
			label: 'My Grades',
			icon: 'grade',
			active: true
		},
		{
			id: 'schedule',
			label: 'Schedule',
			icon: 'schedule',
			active: false
		},
		{
			id: 'documents',
			label: 'Documents',
			icon: 'description',
			active: false
		}
	];

	// Update active state
	$effect(() => {
		navigationItems.forEach(item => {
			item.active = item.id === activeSection;
		});
	});

	// Handle navigation
	function handleNavigation(sectionId) {
		activeSection = sectionId;
		// Dispatch custom event for parent component
		dispatchEvent(new CustomEvent('navigate', {
			detail: { section: sectionId },
			bubbles: true
		}));
	}
</script>

<!-- Navigation Rail (Desktop) -->
<nav class="navigation-rail" class:collapsed={!isNavRailVisible} role="navigation" aria-label="Student portal navigation">
	<div class="rail-container">
		{#each navigationItems as item (item.id)}
			<button 
				class="rail-item" 
				class:active={item.active}
				onclick={() => handleNavigation(item.id)}
				aria-label={item.label}
				aria-current={item.active ? 'page' : undefined}
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
<nav class="bottom-navigation" role="navigation" aria-label="Student portal navigation">
	<div class="nav-container">
		{#each navigationItems as item (item.id)}
			<button 
				class="nav-item" 
				class:active={item.active}
				onclick={() => handleNavigation(item.id)}
				aria-label={item.label}
				aria-current={item.active ? 'page' : undefined}
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