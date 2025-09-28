<script>
	import './adminDashboard.css';
	import { onMount } from 'svelte';
	import { api } from '../../../../../routes/api/helper/api-helper.js';
	import { dashboardStore } from '../../../../../lib/stores/admin/dashboardStore.js';

	// Subscribe to dashboard store
	$: ({ data: dashboardStats, isLoading: statsLoading, error: statsError } = $dashboardStore);

	// Local state for activity logs (replacing activityLogsStore)
	let recentActivities = [];
	let activitiesLoading = false;
	let activitiesError = null;
	let hasMoreActivities = true;
	let activityLimit = 4;
	let loadingMore = false;

	// Fetch dashboard statistics from API
	async function fetchDashboardStats(silent = false) {
		try {
			if (!silent) {
				dashboardStore.setLoading(true);
			}
			
			const data = await api.get('/api/dashboard');
			
			if (data.success) {
				// Update the stats with real data
				const newStats = [
					{ id: 'students', label: 'Total Students', value: data.data.students.toLocaleString(), icon: 'school', color: 'primary' },
					{ id: 'teachers', label: 'Total Teachers', value: data.data.teachers.toLocaleString(), icon: 'person', color: 'primary' },
					{ id: 'sections', label: 'Total Sections', value: data.data.sections.toLocaleString(), icon: 'class', color: 'primary' },
					{ id: 'rooms', label: 'Total Rooms', value: data.data.rooms.toLocaleString(), icon: 'meeting_room', color: 'primary' }
				];
				
				dashboardStore.updateData(newStats);
			} else {
				throw new Error(data.error || 'Failed to fetch dashboard statistics');
			}
		} catch (error) {
			console.error('Error fetching dashboard statistics:', error);
			dashboardStore.setError(error.message);
		}
	}



	// Fetch recent activities from API
	async function fetchRecentActivities(silent = false) {
		try {
			if (!silent) {
				activitiesLoading = true;
				activitiesError = null;
			}
			
			const response = await fetch(`/api/activity-logs?limit=${activityLimit}`);
			const data = await response.json();
			
			if (data.success) {
				recentActivities = data.activities;
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
			
			const newLimit = activityLimit + 4;
			const response = await fetch(`/api/activity-logs?limit=${newLimit}`);
			const data = await response.json();
			
			if (data.success) {
				recentActivities = data.activities;
				activityLimit = newLimit;
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

	// Load activities and statistics on component mount
	onMount(() => {
		// Initialize dashboard store with cached data (instant load)
		const cachedData = dashboardStore.getCachedData();
		if (cachedData) {
			dashboardStore.init(cachedData);
		}
		
		// Fetch fresh data (silent if we have cache, visible loading if not)
		fetchDashboardStats(!!cachedData);
		fetchRecentActivities(false); // Always show loading for activity logs
		
		// Set up periodic silent refresh every 30 seconds
		const refreshInterval = setInterval(() => {
			fetchDashboardStats(true); // Always silent for periodic refresh
			fetchRecentActivities(true); // Always silent for periodic refresh
		}, 30000);
		
		// Cleanup interval on component destroy
		return () => {
			clearInterval(refreshInterval);
		};
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
			<p class="dashboard-section-subtitle">Current overview of your school management system</p>
		</div>
		
		{#if statsError}
			<div class="stats-error">
				<span class="material-symbols-outlined">error</span>
				<p>Error loading statistics: {statsError}</p>
				<button class="retry-button" on:click={() => fetchDashboardStats(false)}>
					<span class="material-symbols-outlined">refresh</span>
					Retry
				</button>
			</div>
		{:else}
			<div class="stats-grid">
				{#each dashboardStats as stat (stat.id)}
					<div class="stat-card stat-{stat.color}">
						<div class="stat-icon">
							<span class="material-symbols-outlined">{stat.icon}</span>
						</div>
						<div class="stat-content">
							<h3 class="stat-value">
								{#if statsLoading}
									Loading...
								{:else}
									{stat.value}
								{/if}
							</h3>
							<p class="stat-label">{stat.label}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
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