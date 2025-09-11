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
	import './teacherSchedule.css';

	const schedule = {
		Mon: [
			{ name: 'Grade 10 - Section A', time: '08:00 - 08:45', room: 'Room 142', students: '25 students', color: 'blue' },
			{ name: 'Grade 10 - Section B', time: '08:50 - 09:35', room: 'Room 142', students: '28 students', color: 'green' },
			{ name: 'Grade 9 - Section A', time: '09:40 - 10:25', room: 'Room 142', students: '22 students', color: 'purple' },
			{ name: 'Planning Period', time: '10:30 - 11:15', room: 'Room 142', students: '', color: 'yellow' },
			{ name: 'Grade 12 - Section A', time: '11:20 - 12:05', room: 'Room 142', students: '18 students', color: 'orange' },
			{ name: 'Lunch', time: '12:05 - 12:35', room: 'Faculty Lounge', students: '', color: 'gray' },
			{ name: 'Grade 8 - Section B', time: '12:40 - 13:25', room: 'Room 142', students: '30 students', color: 'pink' },
			{ name: 'Tutoring/Office Hours', time: '13:30 - 14:15', room: 'Room 142', students: 'Open', color: 'light-purple' }
		],
		Tue: [
			{ name: 'Grade 10 - Section A', time: '08:00 - 08:45', room: 'Room 142', students: '25 students', color: 'blue' },
			{ name: 'Grade 10 - Section B', time: '08:50 - 09:35', room: 'Room 142', students: '28 students', color: 'green' },
			{ name: 'Grade 9 - Section A', time: '09:40 - 10:25', room: 'Room 142', students: '22 students', color: 'purple' },
			{ name: 'Faculty Meeting', time: '10:30 - 11:15', room: 'Conference Room', students: '', color: 'yellow' },
			{ name: 'Grade 12 - Section A', time: '11:20 - 12:05', room: 'Room 142', students: '18 students', color: 'orange' },
			{ name: 'Lunch', time: '12:05 - 12:35', room: 'Faculty Lounge', students: '', color: 'gray' },
			{ name: 'Grade 8 - Section B', time: '12:40 - 13:25', room: 'Room 142', students: '30 students', color: 'pink' },
			{ name: 'Grading/Prep Time', time: '13:30 - 14:15', room: 'Room 142', students: '', color: 'light-purple' }
		],
		Wed: [
			{ name: 'Grade 10 - Section A', time: '08:00 - 08:45', room: 'Room 142', students: '25 students', color: 'blue' },
			{ name: 'Grade 10 - Section B', time: '08:50 - 09:35', room: 'Room 142', students: '28 students', color: 'green' },
			{ name: 'Grade 9 - Section A', time: '09:40 - 10:25', room: 'Room 142', students: '22 students', color: 'purple' },
			{ name: 'Planning Period', time: '10:30 - 11:15', room: 'Room 142', students: '', color: 'yellow' },
			{ name: 'Grade 12 - Section A', time: '11:20 - 12:05', room: 'Room 142', students: '18 students', color: 'orange' },
			{ name: 'Lunch', time: '12:05 - 12:35', room: 'Faculty Lounge', students: '', color: 'gray' },
			{ name: 'Grade 8 - Section B', time: '12:40 - 13:25', room: 'Room 142', students: '30 students', color: 'pink' },
			{ name: 'Parent Conferences', time: '13:30 - 14:15', room: 'Room 142', students: 'Scheduled', color: 'light-purple' }
		],
		Thu: [
			{ name: 'Grade 10 - Section A', time: '08:00 - 08:45', room: 'Room 142', students: '25 students', color: 'blue' },
			{ name: 'Grade 10 - Section B', time: '08:50 - 09:35', room: 'Room 142', students: '28 students', color: 'green' },
			{ name: 'Grade 9 - Section A', time: '09:40 - 10:25', room: 'Room 142', students: '22 students', color: 'purple' },
			{ name: 'Department Meeting', time: '10:30 - 11:15', room: 'Math Office', students: '', color: 'yellow' },
			{ name: 'Grade 12 - Section A', time: '11:20 - 12:05', room: 'Room 142', students: '18 students', color: 'orange' },
			{ name: 'Lunch', time: '12:05 - 12:35', room: 'Faculty Lounge', students: '', color: 'gray' },
			{ name: 'Grade 8 - Section B', time: '12:40 - 13:25', room: 'Room 142', students: '30 students', color: 'pink' },
			{ name: 'Tutoring/Office Hours', time: '13:30 - 14:15', room: 'Room 142', students: 'Open', color: 'light-purple' }
		],
		Fri: [
			{ name: 'Grade 10 - Section A', time: '08:00 - 08:45', room: 'Room 142', students: '25 students', color: 'blue' },
			{ name: 'Grade 10 - Section B', time: '08:50 - 09:35', room: 'Room 142', students: '28 students', color: 'green' },
			{ name: 'Grade 9 - Section A', time: '09:40 - 10:25', room: 'Room 142', students: '22 students', color: 'purple' },
			{ name: 'Planning Period', time: '10:30 - 11:15', room: 'Room 142', students: '', color: 'yellow' },
			{ name: 'Grade 12 - Section A', time: '11:20 - 12:05', room: 'Room 142', students: '18 students', color: 'orange' },
			{ name: 'Lunch', time: '12:05 - 12:35', room: 'Faculty Lounge', students: '', color: 'gray' },
			{ name: 'Grade 8 - Section B', time: '12:40 - 13:25', room: 'Room 142', students: '30 students', color: 'pink' },
			{ name: 'Weekly Planning', time: '13:30 - 14:15', room: 'Room 142', students: '', color: 'light-purple' }
		]
	};

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
	$: currentClasses = schedule[selectedDay] || [];
	$: fullDayName = dayNameMap[selectedDay] || 'Monday';

	// Dropdown state
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
		<h1 class="page-title">Teaching Schedule</h1>
		<p class="page-subtitle">Your weekly teaching schedule</p>
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
							{#if classItem.students}
								<div class="class-teacher">
									<span class="material-symbols-outlined"> groups </span>
									<span>{classItem.students}</span>
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