<script>
	import './adminDashboard.css';

	// Dashboard statistics (mock data)
	let dashboardStats = [
		{ id: 'students', label: 'Total Students', value: '1,247', icon: 'school', color: 'primary' },
		{ id: 'teachers', label: 'Total Teachers', value: '45', icon: 'person', color: 'primary' },
		{ id: 'sections', label: 'Total Sections', value: '28', icon: 'class', color: 'primary' },
		{ id: 'rooms', label: 'Total Rooms', value: '15', icon: 'meeting_room', color: 'primary' }
	];

	// Quick actions
	let quickActions = [
		{ id: 'create-account', label: 'Create Account', icon: 'person_add', description: 'Add new student or teacher' },
		{ id: 'manage-rooms', label: 'Manage Rooms', icon: 'meeting_room', description: 'Create and assign rooms' },
		{ id: 'assign-schedule', label: 'Assign Schedule', icon: 'schedule', description: 'Manage class schedules' },
		{ id: 'create-section', label: 'Create Section', icon: 'class', description: 'Add new class sections' }
	];

	// Recent activities (mock data)
	let recentActivities = [
		{
			id: 1,
			type: 'account_created',
			message: 'New student account created: John Doe (STU-2024-001)',
			timestamp: '2 minutes ago',
			icon: 'person_add'
		},
		{
			id: 2,
			type: 'schedule_assigned',
			message: 'Schedule assigned to Grade 7-A for Room 101',
			timestamp: '15 minutes ago',
			icon: 'schedule'
		},
		{
			id: 3,
			type: 'room_created',
			message: 'New room created: Room 205 (Building A, Floor 2)',
			timestamp: '1 hour ago',
			icon: 'meeting_room'
		},
		{
			id: 4,
			type: 'section_created',
			message: 'New section created: Grade 8-C',
			timestamp: '2 hours ago',
			icon: 'class'
		},
		{
			id: 5,
			type: 'account_created',
			message: 'New teacher account created: Jane Smith (TCH-2024-002)',
			timestamp: '3 hours ago',
			icon: 'person_add'
		}
	];

	// Handle quick action clicks
	function handleQuickAction(actionId) {
		console.log('Quick action clicked:', actionId);
		// Here you would typically dispatch an event or navigate to the appropriate section
	}
</script>

<div class="dashboard-container">
	<!-- Header -->
	<div class="dashboard-header">
		<div class="header-content">
			<h1 class="page-title">Admin Dashboard</h1>
			<p class="page-subtitle">Overview of school management system statistics</p>
		</div>
	</div>

	<!-- Statistics Section -->
	<div class="stats-section">
		<div class="section-header">
			<h2 class="section-title">System Statistics</h2>
			<p class="section-subtitle">Current overview of your school management system</p>
		</div>
		
		<div class="stats-grid">
			{#each dashboardStats as stat (stat.id)}
				<div class="stat-card stat-{stat.color}">
					<div class="stat-icon">
						<span class="material-symbols-outlined">{stat.icon}</span>
					</div>
					<div class="stat-content">
						<h3 class="stat-value">{stat.value}</h3>
						<p class="stat-label">{stat.label}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Quick Actions Section -->
	<div class="actions-section-dashboard">
		<div class="section-header">
			<h2 class="section-title">Quick Actions</h2>
			<p class="section-subtitle">Frequently used administrative tasks</p>
		</div>
		
		<div class="actions-grid">
			{#each quickActions as action (action.id)}
				<button 
					class="action-card" 
					on:click={() => handleQuickAction(action.id)}
				>
					<div class="action-icon">
						<span class="material-symbols-outlined">{action.icon}</span>
					</div>
					<div class="action-content">
						<h3 class="action-label">{action.label}</h3>
						<p class="action-description">{action.description}</p>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Recent Activities Section -->
	<div class="activities-section">
		<div class="section-header">
			<h2 class="section-title">Recent Activities</h2>
			<p class="section-subtitle">Latest system activities and updates</p>
		</div>
		
		<div class="activities-list">
			{#each recentActivities as activity (activity.id)}
				<div class="activity-item">
					<div class="activity-icon">
						<span class="material-symbols-outlined">{activity.icon}</span>
					</div>
					<div class="activity-content">
						<p class="activity-message">{activity.message}</p>
						<span class="activity-timestamp">{activity.timestamp}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>