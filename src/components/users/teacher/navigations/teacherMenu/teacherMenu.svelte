<script>
	import './teacherMenu.css';
	// Props
	let { teacherActiveSection = $bindable('schedule'), teacherNavRailVisible = true, onnavigate } = $props();

	// Navigation items
	const navigationItems = [
		{
			id: 'schedule',
			label: 'Schedule',
			icon: 'schedule'
		},
		{
			id: 'students',
			label: 'Class Management',
			icon: 'group'
		}
	];

	// Handle navigation
	function handleNavigation(sectionId) {
		teacherActiveSection = sectionId;
		// Call the parent's navigation handler
		if (onnavigate) {
			onnavigate({ detail: { section: sectionId } });
		}
	}
</script>

<!-- Navigation Rail (Desktop) -->
<nav class="navigation-rail" class:collapsed={!teacherNavRailVisible} role="navigation" aria-label="Teacher portal navigation">
	<div class="rail-container">
		{#each navigationItems as item (item.id)}
			<button 
				class="rail-item" 
				class:active={item.id === teacherActiveSection}
				onclick={() => handleNavigation(item.id)}
				aria-label={item.label}
				aria-current={item.id === teacherActiveSection ? 'page' : undefined}
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
<nav class="bottom-navigation" role="navigation" aria-label="Teacher portal navigation">
	<div class="nav-container">
		<!-- Navigation items -->
		{#each navigationItems as item (item.id)}
			<button 
				class="nav-item" 
				class:active={item.id === teacherActiveSection}
				onclick={() => handleNavigation(item.id)}
				aria-label={item.label}
				aria-current={item.id === teacherActiveSection ? 'page' : undefined}
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