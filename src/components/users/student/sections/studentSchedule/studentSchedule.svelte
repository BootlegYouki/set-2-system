<script>
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
  import './studentSchedule.css';
	const schedule = {
		Mon: [
			{ name: 'Algebra II', time: '08:00 - 08:45', room: 'Room 142', teacher: 'Mrs. Johnson', color: 'blue' },
			{ name: 'English Literature', time: '08:50 - 09:35', room: 'Room 205', teacher: 'Mr. Davis', color: 'green' },
			{ name: 'Biology', time: '09:40 - 10:25', room: 'Room 301', teacher: 'Ms. Wilson', color: 'purple' },
			{ name: 'World History', time: '10:30 - 11:15', room: 'Room 178', teacher: 'Mr. Thompson', color: 'yellow' },
			{ name: 'Physical Education', time: '11:20 - 12:05', room: 'Gymnasium', teacher: 'Coach Martinez', color: 'orange' },
			{ name: 'Lunch', time: '12:05 - 12:35', room: 'Cafeteria', teacher: '', color: 'gray' },
			{ name: 'Spanish II', time: '12:40 - 13:25', room: 'Room 115', teacher: 'Señora Garcia', color: 'pink' },
			{ name: 'Chemistry', time: '13:30 - 14:15', room: 'Lab 201', teacher: 'Dr. Brown', color: 'light-purple' }
		],
		Tue: [
			{ name: 'Mathematics', time: '08:00 - 08:45', room: 'Room 140', teacher: 'Mr. Smith', color: 'blue' },
			{ name: 'Physics', time: '08:50 - 09:35', room: 'Lab 305', teacher: 'Dr. Lee', color: 'green' },
			{ name: 'English Literature', time: '09:40 - 10:25', room: 'Room 205', teacher: 'Mr. Davis', color: 'purple' },
			{ name: 'Art', time: '10:30 - 11:15', room: 'Art Studio', teacher: 'Ms. Taylor', color: 'yellow' },
			{ name: 'Study Hall', time: '11:20 - 12:05', room: 'Library', teacher: '', color: 'orange' },
			{ name: 'Lunch', time: '12:05 - 12:35', room: 'Cafeteria', teacher: '', color: 'gray' },
			{ name: 'Computer Science', time: '12:40 - 13:25', room: 'Lab 101', teacher: 'Mr. Wilson', color: 'pink' },
			{ name: 'Music', time: '13:30 - 14:15', room: 'Music Room', teacher: 'Ms. Anderson', color: 'light-purple' }
		],
		Wed: [
			{ name: 'Biology', time: '08:00 - 08:45', room: 'Room 301', teacher: 'Ms. Wilson', color: 'blue' },
			{ name: 'Algebra II', time: '08:50 - 09:35', room: 'Room 142', teacher: 'Mrs. Johnson', color: 'green' },
			{ name: 'World History', time: '09:40 - 10:25', room: 'Room 178', teacher: 'Mr. Thompson', color: 'purple' },
			{ name: 'Spanish II', time: '10:30 - 11:15', room: 'Room 115', teacher: 'Señora Garcia', color: 'yellow' },
			{ name: 'Physical Education', time: '11:20 - 12:05', room: 'Gymnasium', teacher: 'Coach Martinez', color: 'orange' },
			{ name: 'Lunch', time: '12:05 - 12:35', room: 'Cafeteria', teacher: '', color: 'gray' },
			{ name: 'English Literature', time: '12:40 - 13:25', room: 'Room 205', teacher: 'Mr. Davis', color: 'pink' },
			{ name: 'Geography', time: '13:30 - 14:15', room: 'Room 220', teacher: 'Ms. Clark', color: 'light-purple' }
		],
		Thu: [
			{ name: 'Chemistry', time: '08:00 - 08:45', room: 'Lab 201', teacher: 'Dr. Brown', color: 'blue' },
			{ name: 'World History', time: '08:50 - 09:35', room: 'Room 178', teacher: 'Mr. Thompson', color: 'green' },
			{ name: 'Mathematics', time: '09:40 - 10:25', room: 'Room 140', teacher: 'Mr. Smith', color: 'purple' },
			{ name: 'English Literature', time: '10:30 - 11:15', room: 'Room 205', teacher: 'Mr. Davis', color: 'yellow' },
			{ name: 'Art', time: '11:20 - 12:05', room: 'Art Studio', teacher: 'Ms. Taylor', color: 'orange' },
			{ name: 'Lunch', time: '12:05 - 12:35', room: 'Cafeteria', teacher: '', color: 'gray' },
			{ name: 'Biology', time: '12:40 - 13:25', room: 'Room 301', teacher: 'Ms. Wilson', color: 'pink' },
			{ name: 'Physical Education', time: '13:30 - 14:15', room: 'Gymnasium', teacher: 'Coach Martinez', color: 'light-purple' }
		],
		Fri: [
			// Empty Friday - no classes scheduled
		]
	};

	const weekDays = [
		{ day: 'Mon' },
		{ day: 'Tue' },
		{ day: 'Wed' },
		{ day: 'Thu' },
		{ day: 'Fri' }
	];

	// Map abbreviated days to full day names
	const dayNameMap = {
		'Mon': 'Monday',
		'Tue': 'Tuesday', 
		'Wed': 'Wednesday',
		'Thu': 'Thursday',
		'Fri': 'Friday'
	};

	$: currentClasses = schedule[selectedDay] || [];
	$: fullDayName = dayNameMap[selectedDay] || selectedDay;
	
	// Mobile dropdown state
	let isDropdownOpen = false;
	
	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.mobile-dropdown')) {
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
		<h1 class="page-title">Schedule</h1>
		<p class="page-subtitle">Your weekly class schedule</p>
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
		<div class="mobile-dropdown">
			<button class="dropdown-toggle-date" on:click={toggleDropdown}>
				<span>{dayNameMap[selectedDay] || 'Select Day'}</span>
				<span class="material-symbols-outlined dropdown-icon {isDropdownOpen ? 'open' : ''}">
					expand_more
				</span>
			</button>
			
			{#if isDropdownOpen}
				<div class="dropdown-menu">
					{#each weekDays as { day }}
						<button 
							class="dropdown-item {day === selectedDay ? 'selected' : ''}"
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
		
		{#if currentClasses.length > 0}
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
								<span>{classItem.room}</span>
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