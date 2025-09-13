<script>
	import './adminMenu.css';
	// Props
	let { adminActiveSection = $bindable('dashboard'), adminNavRailVisible = true, onnavigate } = $props();

	// Navigation items
	const navigationItems = [
		{
			id: 'dashboard',
			label: 'Dashboard',
			icon: 'dashboard'
		},
		{
			id: 'account-creation',
			label: 'Account Creation',
			icon: 'person_add'
		},
		{
			id: 'room-management',
			label: 'Room Management',
			icon: 'meeting_room'
		},
		{
			id: 'schedule-assignment',
			label: 'Schedule Assignment',
			icon: 'schedule'
		},
		{
			id: 'section-management',
			label: 'Section Management',
			icon: 'class'
		},
		{
			id: 'subject-creation',
			label: 'Subject Creation',
			icon: 'subject'
		},
		{
			id: 'document-requests',
			label: 'Document Requests',
			icon: 'description'
		}
	];

	// Handle navigation
	function handleNavigation(sectionId) {
		adminActiveSection = sectionId;
		// Call the parent's navigation handler
		if (onnavigate) {
			onnavigate({ detail: { section: sectionId } });
		}
	}
</script>

<!-- Navigation Rail (Desktop) -->
<nav class="admin-menu-navigation-rail" class:collapsed={!adminNavRailVisible} role="navigation" aria-label="Admin portal navigation">
	<div class="admin-menu-rail-container">
		{#each navigationItems as item (item.id)}
			<button 
				class="admin-menu-rail-item" 
				class:active={item.id === adminActiveSection}
				onclick={() => handleNavigation(item.id)}
				aria-label={item.label}
				aria-current={item.id === adminActiveSection ? 'page' : undefined}
			>
				<div class="admin-menu-rail-icon-container">
					<span class="material-symbols-outlined admin-menu-rail-icon">
						{item.icon}
					</span>
				</div>
				<span class="admin-menu-rail-label">{item.label}</span>
			</button>
		{/each}
	</div>
</nav>

<!-- Bottom Navigation (Mobile) -->
<nav class="admin-menu-bottom-navigation" role="navigation" aria-label="Admin portal navigation">
	<div class="admin-menu-nav-container">
		<!-- Navigation items -->
		{#each navigationItems as item (item.id)}
			<button 
				class="admin-menu-nav-item" 
				class:active={item.id === adminActiveSection}
				onclick={() => handleNavigation(item.id)}
				aria-label={item.label}
				aria-current={item.id === adminActiveSection ? 'page' : undefined}
			>
				<div class="admin-menu-nav-icon-container">
					<span class="material-symbols-outlined admin-menu-nav-icon">
						{item.icon}
					</span>
				</div>
			</button>
		{/each}
	</div>
</nav>