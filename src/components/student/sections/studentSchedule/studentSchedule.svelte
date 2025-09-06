<script>
	export let selectedWeek = 'October 23';
	export let selectedDay = 'Friday';

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
		{ day: 'Mon', date: 23 },
		{ day: 'Tue', date: 24 },
		{ day: 'Wed', date: 25 },
		{ day: 'Thu', date: 26 },
		{ day: 'Fri', date: 27 }
	];

	let currentClasses = schedule[selectedDay] || [];
</script>

<div class="schedule-container">
	<div class="schedule-header">
		<h1>Schedule</h1>
		<p>Your weekly class schedule</p>
	</div>

	<div class="week-navigation">
		<div class="week-title">
			<button class="nav-btn prev">‹</button>
			<span>Week of {selectedWeek}</span>
			<button class="nav-btn next">›</button>
		</div>

		<div class="day-selector">
			{#each weekDays as { day, date }}
				<button 
					class="day-btn {day === 'Fri' ? 'active' : ''}"
					on:click={() => selectedDay = day}
				>
					<div class="day-name">{day}</div>
					<div class="day-date">{date}</div>
				</button>
			{/each}
		</div>
	</div>

	<div class="classes-section">
		<h2>{selectedDay} Classes</h2>
		
		<div class="classes-list">
			{#each currentClasses as classItem}
				<div class="class-card {classItem.color}">
					<div class="class-header">
						<h3 class="class-name">{classItem.name}</h3>
						<span class="class-time">{classItem.time}</span>
					</div>
					
					<div class="class-details">
						<div class="class-location">
							<span class="location-icon">📍</span>
							<span>{classItem.room}</span>
						</div>
						{#if classItem.teacher}
							<div class="class-teacher">
								<span class="teacher-icon">👤</span>
								<span>{classItem.teacher}</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	@import './studentSchedule.css';
</style>