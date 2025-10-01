<script>
	import { onMount } from 'svelte';
	import { authStore } from '../../../../login/js/auth.js';
	import './teacherSchedule.css';

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

	// Slot-based colors (each slot gets a designated color)
	const slotColors = ['blue', 'green', 'purple', 'yellow', 'orange'];
	
	// Function to get color based on slot index
	function getSlotColor(slotIndex) {
		return slotColors[slotIndex % slotColors.length];
	}

	// Schedule data from API
	let scheduleData = [];
	let loading = true;
	let error = null;

	// Process schedule data into the format expected by the component
	function processScheduleData(data) {
		const processedSchedule = {
			Mon: [],
			Tue: [],
			Wed: [],
			Thu: [],
			Fri: []
		};

		// Map database day names to abbreviated names
		const dayMapping = {
			'monday': 'Mon',
			'tuesday': 'Tue',
			'wednesday': 'Wed',
			'thursday': 'Thu',
			'friday': 'Fri'
		};

		// Group by day to track slot indices
		const daySlotCounters = {
			Mon: 0,
			Tue: 0,
			Wed: 0,
			Thu: 0,
			Fri: 0
		};

		data.forEach(item => {
			const dayAbbrev = dayMapping[item.day_of_week.toLowerCase()];
			if (dayAbbrev) {
				// Format time from 24-hour to 12-hour format
				const startTime = formatTime(item.start_time);
				const endTime = formatTime(item.end_time);
				
				// Determine the class name and subject
				let className, subject;
				if (item.schedule_type === 'subject') {
					className = item.section_name;
					subject = item.subject_name || 'Unknown Subject';
				} else if (item.schedule_type === 'activity') {
					className = item.activity_type_name || 'Activity';
					subject = item.activity_type_name || 'Activity';
				}

				const classItem = {
					name: className,
					time: `${startTime} - ${endTime}`,
					room: item.room_name || 'TBA',
					subject: subject,
					gradeLevel: item.grade_level, // Add grade level as separate field
					scheduleType: item.schedule_type, // Add schedule type for conditional display
					color: getSlotColor(daySlotCounters[dayAbbrev]) // Assign color based on slot
				};

				processedSchedule[dayAbbrev].push(classItem);
				daySlotCounters[dayAbbrev]++; // Increment slot counter for this day
			}
		});

		return processedSchedule;
	}

	// Format time from 24-hour to 12-hour format
	function formatTime(timeString) {
		const [hours, minutes] = timeString.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
		return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
	}

	// Fetch schedule data from API
	async function fetchScheduleData() {
		try {
			loading = true;
			error = null;

			// Get current user data from auth store
			const authState = $authStore;
			if (!authState.isAuthenticated || !authState.userData?.id) {
				throw new Error('User not authenticated');
			}

			const response = await fetch(`/api/schedules?action=teacher-schedules&teacherId=${authState.userData.id}&schoolYear=2024-2025`);
			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Failed to fetch schedule data');
			}

			scheduleData = processScheduleData(result.data);
		} catch (err) {
			console.error('Error fetching schedule data:', err);
			error = err.message;
			// Fallback to empty schedule
			scheduleData = {
				Mon: [],
				Tue: [],
				Wed: [],
				Thu: [],
				Fri: []
			};
		} finally {
			loading = false;
		}
	}

	// Load schedule data on component mount
	onMount(() => {
		fetchScheduleData();
	});

	// Map day abbreviations to full names
	const dayNameMap = {
		Mon: 'Monday',
		Tue: 'Tuesday', 
		Wed: 'Wednesday',
		Thu: 'Thursday',
		Fri: 'Friday'
	};

	// Week days for navigation
	const weekDays = [
		{ day: 'Mon' },
		{ day: 'Tue' },
		{ day: 'Wed' },
		{ day: 'Thu' },
		{ day: 'Fri' }
	];

	// Reactive statements
	$: currentClasses = scheduleData[selectedDay] || [];
	$: fullDayName = dayNameMap[selectedDay] || 'Monday';

	// Dropdown state
	let isDropdownOpen = false;

	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.teacher-mobile-dropdown')) {
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
	<div class="schedule-schedule-header">
		<h1 class="schedule-page-title">Teaching Schedule</h1>
		<p class="schedule-page-subtitle">Your weekly teaching schedule</p>
	</div>

	<div class="week-navigation">
		<div class="week-title">
			<span>{currentDayName}, {currentMonth} {currentDay}</span>
		</div>

		<div class="schedule-day-selector">
			{#each weekDays as { day }}
				<button 
					class="schedule-day-btn {day === selectedDay ? 'active' : ''}"
					on:click={() => selectDay(day)}
				>
					<div class="day-name">{day}</div>
					<div class="day-name-full">{dayNameMap[day]}</div>
				</button>
			{/each}
		</div>
		
		<!-- Mobile Dropdown -->
		<div class="teacher-mobile-dropdown">
			<button class="teacher-dropdown-toggle-date" on:click={toggleDropdown}>
				<span>{dayNameMap[selectedDay] || 'Select Day'}</span>
				<span class="material-symbols-outlined teacher-dropdown-icon {isDropdownOpen ? 'open' : ''}">
					expand_more
				</span>
			</button>
			
			{#if isDropdownOpen}
				<div class="teacher-dropdown-menu">
					{#each weekDays as { day }}
						<button 
							class="teacher-dropdown-item {day === selectedDay ? 'selected' : ''}"
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
		<h2>{fullDayName} Classes</h2>
		
		{#if loading}
			<div class="loading-message">
				<div class="loading-icon">
					<span class="material-symbols-outlined">schedule</span>
				</div>
				<h3>Loading Schedule...</h3>
				<p>Please wait while we fetch your teaching schedule.</p>
			</div>
		{:else if error}
			<div class="error-message">
				<div class="error-icon">
					<span class="material-symbols-outlined">error</span>
				</div>
				<h3>Error Loading Schedule</h3>
				<p>{error}</p>
				<button class="retry-button" on:click={fetchScheduleData}>
					<span class="material-symbols-outlined">refresh</span>
					Try Again
				</button>
			</div>
		{:else if currentClasses.length > 0}
			<div class="schedule-classes-grid">
				{#each currentClasses as classItem}
					<div class="schedule-class-card {classItem.color}">
						<div class="class-header">
							<h3 class="schedule-class-name">{classItem.name}</h3>
							<span class="schedule-class-time">{classItem.time}</span>
						</div>
						
						<div class="class-details">
							<div class="schedule-class-location">
								<span class="material-symbols-outlined"> location_on</span>
								<span>{classItem.room}</span>
							</div>
							{#if classItem.subject}
								<div class="schedule-class-teacher">
									<span class="material-symbols-outlined"> book </span>
									<span>{classItem.subject}</span>
								</div>
							{/if}
							{#if classItem.gradeLevel && classItem.scheduleType === 'subject'}
								<div class="schedule-class-grade">
									<span class="material-symbols-outlined"> school </span>
									<span>Grade {classItem.gradeLevel}</span>
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