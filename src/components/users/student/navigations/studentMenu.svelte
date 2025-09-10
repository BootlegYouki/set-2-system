<script>
	import './styles/studentMenu.css';
	// Props
	let { activeSection = $bindable('grades'), isNavRailVisible = true, onnavigate } = $props();

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
			icon: 'notifications'
		},
		{
			id: 'todo',
			label: 'Todo List',
			icon: 'checklist'
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
<nav class="navigation-rail" class:collapsed={!isNavRailVisible} role="navigation" aria-label="Student portal navigation">
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
<nav class="bottom-navigation" role="	navigation" aria-label="Student portal navigation">
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

		<!-- Center add_diamond button (Todo List) -->
		<button 
			class="nav-item" 
			class:active={'todo' === activeSection}
			onclick={() => handleNavigation('todo')}
			aria-label="Todo List"
			aria-current={'todo' === activeSection ? 'page' : undefined}
		>
			<div class="nav-icon-container">
				<span class="material-symbols-outlined nav-icon" style="font-variation-settings: 'FILL' 1; font-size: 28px;">add_diamond</span>
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