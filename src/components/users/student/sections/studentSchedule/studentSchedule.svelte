<script>
	import { onMount } from 'svelte';
	import { authStore } from '../../../../login/js/auth.js';
	import { studentScheduleStore } from '../../../../../lib/stores/student/studentScheduleStore.js';
	import './studentSchedule.css';

	// Get current date info
	const today = new Date();
	const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'];
	const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const currentMonth = monthNames[today.getMonth()];
	const currentDay = today.getDate();
	const currentDayName = dayNames[today.getDay()];
	
	// Map day index to abbreviated day names for weekdays only
	const dayIndexToAbbrev = {
		1: 'Mon', // Monday
		2: 'Tue', // Tuesday
		3: 'Wed', // Wednesday
		4: 'Thu', // Thursday
		5: 'Fri'  // Friday
	};
	
	// Get current day abbreviation (default to Monday if weekend)
	const todayIndex = today.getDay();
	let selectedDay = dayIndexToAbbrev[todayIndex] || 'Mon'; // Default to Monday if weekend

	// Subscribe to the store
	$: ({ scheduleData, isLoading, isRefreshing, error, lastUpdated } = $studentScheduleStore);

	// Handle refresh functionality
	async function handleRefresh() {
		const authState = $authStore;
		if (authState.isAuthenticated && authState.userData?.id) {
			await studentScheduleStore.forceRefresh(authState.userData.id);
		}
	}

	// Initialize store and set up periodic refresh
	onMount(() => {
		const authState = $authStore;
		if (authState.isAuthenticated && authState.userData?.id) {
			// Initialize store with cached data if available
			const hasCachedData = studentScheduleStore.init(authState.userData.id);
			
			// Load fresh data if no cache or load silently if cached
			studentScheduleStore.loadSchedule(authState.userData.id, hasCachedData);

			// Set up periodic refresh every 5 minutes
			const refreshInterval = setInterval(() => {
				const currentAuthState = $authStore;
				if (currentAuthState.isAuthenticated && currentAuthState.userData?.id) {
					studentScheduleStore.loadSchedule(currentAuthState.userData.id, true); // Silent refresh
				}
			}, 5 * 60 * 1000); // 5 minutes

			// Cleanup interval on component destroy
			return () => {
				clearInterval(refreshInterval);
			};
		}
	});

	// Week days for navigation
	const weekDays = [
		{ day: 'Mon' },
		{ day: 'Tue' },
		{ day: 'Wed' },
		{ day: 'Thu' },
		{ day: 'Fri' }
	];

	// Map day abbreviations to full names
	const dayNameMap = {
		Mon: 'Monday',
		Tue: 'Tuesday', 
		Wed: 'Wednesday',
		Thu: 'Thursday',
		Fri: 'Friday'
	};

	// Reactive statements
	$: currentClasses = scheduleData[selectedDay] || [];
	$: fullDayName = dayNameMap[selectedDay] || 'Monday';

	// Dropdown state
	let isDropdownOpen = false;

	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.schedule-mobile-dropdown')) {
			isDropdownOpen = false;
		}
	}

	// Toggle dropdown
	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}
	
	// Select day and close dropdown
	function selectDay(day) {
		selectedDay = day;
		isDropdownOpen = false;
	}
</script>

<div class="schedule-container" on:click={handleClickOutside} on:keydown={handleClickOutside} role="button" tabindex="0">
	<div class="schedule-header">
		<div class="schedule-header-content">
			<div class="schedule-header-text">
				<h1 class="page-title">Schedule</h1>
				<p class="page-subtitle">Your weekly class schedule</p>
			</div>
		</div>
	</div>

	<div class="week-navigation">
		<div class="week-title">
			<span>{currentDayName}, {currentMonth} {currentDay}</span>
		</div>

		<div class="day-selector">
			{#each weekDays as { day }}
				<button 
					class="day-btn {day === selectedDay ? 'active' : ''}"
					on:click={() => selectDay(day)}
				>
					<div class="day-name">{day}</div>
					<div class="day-name-full">{dayNameMap[day]}</div>
				</button>
			{/each}
		</div>
		
		<!-- Mobile Dropdown -->
		<div class="schedule-mobile-dropdown">
			<button class="schedule-dropdown-toggle-date" on:click={toggleDropdown}>
				<span>{dayNameMap[selectedDay] || 'Select Day'}</span>
				<span class="material-symbols-outlined schedule-dropdown-icon {isDropdownOpen ? 'open' : ''}">
					expand_more
				</span>
			</button>
			
			{#if isDropdownOpen}
				<div class="schedule-dropdown-menu">
					{#each weekDays as { day }}
						<button 
							class="schedule-dropdown-item {day === selectedDay ? 'selected' : ''}"
							on:click={() => selectDay(day)}
						>
							{dayNameMap[day]}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="classes-section">
		<div class="classes-header">
			<h2>{fullDayName} Classes</h2>
			<div class="refresh-controls">
				{#if isRefreshing}
					<div class="silent-refresh-indicator">
						<div class="silent-loader"></div>
						<span>Updating...</span>
					</div>
				{/if}
				<button class="refresh-button" on:click={handleRefresh} disabled={isLoading}>
					<span class="material-symbols-outlined">refresh</span>
				</button>
			</div>
		</div>
		
		{#if isLoading}
			<div class="loading-message">
				<div class="system-loader"></div>
				<p>Loading Schedule...</p>
			</div>
		{:else if error}
			<div class="error-message">
				<div class="error-icon">
					<span class="material-symbols-outlined">error</span>
				</div>
				<p>Error Loading Schedule</p>
				<p>{error}</p>
				<button class="retry-button" on:click={handleRefresh}>
					<span class="material-symbols-outlined">refresh</span>
					Try Again
				</button>
			</div>
		{:else if currentClasses.length > 0}
			<div class="classes-list">
				{#each currentClasses as classItem}
					<div class="class-card {classItem.color}">
						<div class="class-header">
							<h3 class="class-name">{classItem.name}</h3>
							<span class="class-time">{classItem.time}</span>
						</div>
						
						<div class="class-details">
							<div class="class-location">
								<span class="material-symbols-outlined"> location_on</span>
								<span>{classItem.scheduleType === 'activity' ? 'No room' : classItem.room}</span>
							</div>
							{#if classItem.teacher}
								<div class="class-teacher">
									<span class="material-symbols-outlined"> person_book </span>
									<span>{classItem.teacher}</span>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="no-classes-message">
				<div class="no-classes-icon">
					<span class="material-symbols-outlined">event_available</span>
				</div>
				<h3>No Classes Scheduled</h3>
				<p>You don't have any classes scheduled for {fullDayName}. Enjoy your free day!</p>
			</div>
		{/if}
	</div>
</div>