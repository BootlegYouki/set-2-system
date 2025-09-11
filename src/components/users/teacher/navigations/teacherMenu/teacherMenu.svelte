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
		},
		{
			id: 'advisory',
			label: 'Advisory Class',
			icon: 'supervisor_account'
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
<nav class="teacher-menu-navigation-rail" class:collapsed={!teacherNavRailVisible} role="navigation" aria-label="Teacher portal navigation">
	<div class="teacher-menu-rail-container">
		{#each navigationItems as item (item.id)}
			<button 
				class="teacher-menu-rail-item" 
				class:active={item.id === teacherActiveSection}
				onclick={() => handleNavigation(item.id)}
				aria-label={item.label}
				aria-current={item.id === teacherActiveSection ? 'page' : undefined}
			>
				<div class="teacher-menu-rail-icon-container">
					<span class="material-symbols-outlined teacher-menu-rail-icon">
						{item.icon}
					</span>
				</div>
				<span class="teacher-menu-rail-label">{item.label}</span>
			</button>
		{/each}
	</div>
</nav>

<!-- Bottom Navigation (Mobile) -->
<nav class="teacher-menu-bottom-navigation" role="navigation" aria-label="Teacher portal navigation">
	<div class="teacher-menu-nav-container">
		<!-- Navigation items -->
		{#each navigationItems as item (item.id)}
			<button 
				class="teacher-menu-nav-item" 
				class:active={item.id === teacherActiveSection}
				onclick={() => handleNavigation(item.id)}
				aria-label={item.label}
				aria-current={item.id === teacherActiveSection ? 'page' : undefined}
			>
				<div class="teacher-menu-nav-icon-container">
					<span class="material-symbols-outlined teacher-menu-nav-icon">
						{item.icon}
					</span>
				</div>
			</button>
		{/each}




	</div>
</nav>