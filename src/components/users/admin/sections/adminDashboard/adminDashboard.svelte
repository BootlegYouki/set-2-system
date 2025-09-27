<script>
	import './adminDashboard.css';
	import { onMount } from 'svelte';

	// Dashboard statistics (mock data)
	let dashboardStats = [
		{ id: 'students', label: 'Total Students', value: '1,247', icon: 'school', color: 'primary' },
		{ id: 'teachers', label: 'Total Teachers', value: '45', icon: 'person', color: 'primary' },
		{ id: 'sections', label: 'Total Sections', value: '28', icon: 'class', color: 'primary' },
		{ id: 'rooms', label: 'Total Rooms', value: '15', icon: 'meeting_room', color: 'primary' }
	];



	// Recent activities (loaded from API)
	let recentActivities = [];
	let activitiesLoading = true;
	let activitiesError = null;
	let activityLimit = 4;
	let hasMoreActivities = true;
	let loadingMore = false;



	// Fetch recent activities from API
	async function fetchRecentActivities() {
		try {
			activitiesLoading = true;
			activitiesError = null;
			const response = await fetch(`/api/activity-logs?limit=${activityLimit}`);
			const data = await response.json();
			
			if (data.success) {
				recentActivities = data.activities;
				// Check if there are more activities to load
				hasMoreActivities = data.activities.length === activityLimit;
			} else {
				throw new Error(data.error || 'Failed to fetch activities');
			}
		} catch (error) {
			console.error('Error fetching activities:', error);
			activitiesError = error.message;
		} finally {
			activitiesLoading = false;
		}
	}

	// Load more activities
	async function loadMoreActivities() {
		try {
			loadingMore = true;
			activitiesError = null;
			
			const newLimit = activityLimit + 4;
			const response = await fetch(`/api/activity-logs?limit=${newLimit}`);
			const data = await response.json();
			
			if (data.success) {
				recentActivities = data.activities;
				activityLimit = newLimit;
				// Check if there are more activities to load
				hasMoreActivities = data.activities.length === newLimit;
			} else {
				throw new Error(data.error || 'Failed to fetch more activities');
			}
		} catch (error) {
			console.error('Error loading more activities:', error);
			activitiesError = error.message;
		} finally {
			loadingMore = false;
		}
	}

	// Load activities on component mount
	onMount(() => {
		fetchRecentActivities();
	});
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



	<!-- Recent Activities Section -->
	<div class="activities-section">
		<div class="section-header">
			<h2 class="section-title">Activity Logs</h2>
			<button 
				class="refresh-button" 
				on:click={fetchRecentActivities}
				disabled={activitiesLoading}
				title="Refresh activity logs"
			>
				<span class="material-symbols-outlined">refresh</span>
				Refresh
			</button>
		</div>
		
		<div class="activities-list">
			{#if activitiesLoading}
				<div class="activities-loading">
					<div class="dashboard-loader"></div>
					<p>Loading recent activities...</p>
				</div>
			{:else if activitiesError}
				<div class="activities-error">
					<span class="material-symbols-outlined error-icon">error</span>
					<p>Error loading activities: {activitiesError}</p>
				</div>
			{:else if recentActivities.length === 0}
				<div class="activities-empty">
					<span class="material-symbols-outlined">inbox</span>
					<p>No recent activities found</p>
				</div>
			{:else}
				{#each recentActivities as activity (activity.id)}
					<div class="activity-item">
						<div class="activity-icon">
							<span class="material-symbols-outlined">{activity.icon}</span>
						</div>
						<div class="activity-content">
							<p class="activity-message">{activity.message}</p>
							{#if activity.performed_by && activity.performed_by !== 'System'}
								<p class="activity-user">{activity.performed_by}</p>
							{/if}
						</div>
						<span class="activity-timestamp">{activity.timestamp}</span>
					</div>
				{/each}
				
				<!-- View More Button -->
				{#if hasMoreActivities && !activitiesLoading}
					<div class="view-more-container">
						<button 
							class="view-more-button" 
							on:click={loadMoreActivities}
							disabled={loadingMore}
						>
							{#if loadingMore}
								<div class="load-more"></div>
							{:else}
								<span class="material-symbols-outlined">expand_more</span>
								View More Activities
							{/if}
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>