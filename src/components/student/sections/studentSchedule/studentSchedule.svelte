<script>
	export let selectedWeek = 'October 23';
	export let selectedDay = 'Friday';
	
	// Get current date info
	const today = new Date();
	const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'];
	const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const currentMonth = monthNames[today.getMonth()];
	const currentDay = today.getDate();
	const currentDayName = dayNames[today.getDay()];
  import './studentSchedule.css';
	const schedule = {
		Friday: [
			{
				name: 'Algebra II',
				time: '08:00 - 08:45',
				room: 'Room 142',
				teacher: 'Mrs. Johnson',
				color: 'blue'
			},
			{
				name: 'English Literature',
				time: '08:50 - 09:35',
				room: 'Room 205',
				teacher: 'Mr. Davis',
				color: 'green'
			},
			{
				name: 'Biology',
				time: '09:40 - 10:25',
				room: 'Room 301',
				teacher: 'Ms. Wilson',
				color: 'purple'
			},
			{
				name: 'World History',
				time: '10:30 - 11:15',
				room: 'Room 178',
				teacher: 'Mr. Thompson',
				color: 'yellow'
			},
			{
				name: 'Physical Education',
				time: '11:20 - 12:05',
				room: 'Gymnasium',
				teacher: 'Coach Martinez',
				color: 'orange'
			},
			{
				name: 'Lunch',
				time: '12:05 - 12:35',
				room: 'Cafeteria',
				teacher: '',
				color: 'gray'
			},
			{
				name: 'Spanish II',
				time: '12:40 - 13:25',
				room: 'Room 115',
				teacher: 'Señora Garcia',
				color: 'pink'
			},
			{
				name: 'Drama',
				time: '13:30 - 14:15',
				room: 'Theater',
				teacher: 'Ms. White',
				color: 'light-purple'
			}
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

	let currentClasses = schedule[selectedDay] || [];
	$: fullDayName = dayNameMap[selectedDay] || selectedDay;
</script>

<div class="schedule-container">
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
					on:click={() => selectedDay = day}
				>
					<div class="day-name">{day}</div>
					<div class="day-name-full">{dayNameMap[day]}</div>
				</button>
			{/each}
		</div>
	</div>

	<div class="classes-section">
		<h2>{fullDayName} Classes</h2>
		
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
	</div>
</div>