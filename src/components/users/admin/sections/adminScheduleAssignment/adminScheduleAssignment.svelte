<script>
	import './adminScheduleAssignment.css';

	// Schedule assignment state
	let isAssigning = false;
	let selectedSection = '';
	let selectedTeacher = '';
	let selectedSubject = '';
	let selectedTimeSlot = '';
	let selectedDay = '';
	let showSuccessMessage = false;
	let successMessage = '';

	// Dropdown states
	let isSectionDropdownOpen = false;
	let isTeacherDropdownOpen = false;
	let isSubjectDropdownOpen = false;
	let isTimeSlotDropdownOpen = false;

	// Filter states for assignments section
	let selectedFilterSection = '';
	let isFilterSectionDropdownOpen = false;
	
	// Day picker states (similar to student schedule)
	let isAdminDayDropdownOpen = false;
	
	// Get current date info for week navigation
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
	let selectedAdminDay = dayIndexToAbbrev[todayIndex] || 'Mon'; // Default to Monday if weekend
	
	// Week days for day picker
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

	// Mock data for dropdowns
	const sections = [
		{ id: 'grade7-a', name: 'Section A', grade: 'Grade 7' },
		{ id: 'grade7-b', name: 'Section B', grade: 'Grade 7' },
		{ id: 'grade8-a', name: 'Section A', grade: 'Grade 8' },
		{ id: 'grade8-b', name: 'Section B', grade: 'Grade 8' },
		{ id: 'grade9-a', name: 'Section A', grade: 'Grade 9' },
		{ id: 'grade10-a', name: 'Section A', grade: 'Grade 10' }
	];

	const teachers = [
		{ id: 'teacher1', name: 'Maria Santos', subject: 'Mathematics' },
		{ id: 'teacher2', name: 'Juan Dela Cruz', subject: 'Science' },
		{ id: 'teacher3', name: 'Ana Garcia', subject: 'English' },
		{ id: 'teacher4', name: 'Pedro Rodriguez', subject: 'Filipino' },
		{ id: 'teacher5', name: 'Carmen Lopez', subject: 'Social Studies' }
	];

	const subjects = [
		{ id: 'math', name: 'Mathematics', icon: 'calculate' },
		{ id: 'science', name: 'Science', icon: 'science' },
		{ id: 'english', name: 'English', icon: 'menu_book' },
		{ id: 'filipino', name: 'Filipino', icon: 'translate' },
		{ id: 'social-studies', name: 'Social Studies', icon: 'public' },
		{ id: 'pe', name: 'Physical Education', icon: 'sports' },
		{ id: 'arts', name: 'Arts', icon: 'palette' },
		{ id: 'tle', name: 'Technology and Livelihood Education', icon: 'engineering' }
	];

	const timeSlots = [
		{ id: 'slot1', time: '7:30 AM - 8:30 AM', period: '1st Period' },
		{ id: 'slot2', time: '8:30 AM - 9:30 AM', period: '2nd Period' },
		{ id: 'slot3', time: '9:30 AM - 10:30 AM', period: '3rd Period' },
		{ id: 'slot4', time: '10:45 AM - 11:45 AM', period: '4th Period' },
		{ id: 'slot5', time: '11:45 AM - 12:45 PM', period: '5th Period' },
		{ id: 'slot6', time: '1:30 PM - 2:30 PM', period: '6th Period' },
		{ id: 'slot7', time: '2:30 PM - 3:30 PM', period: '7th Period' }
	];

	const days = [
		{ id: 'monday', name: 'Monday' },
		{ id: 'tuesday', name: 'Tuesday' },
		{ id: 'wednesday', name: 'Wednesday' },
		{ id: 'thursday', name: 'Thursday' },
		{ id: 'friday', name: 'Friday' }
	];

	// Current schedule assignments (mock data)
	let scheduleAssignments = [
		{
			id: 1,
			grade: 'Grade 7',
			section: 'Section A',
			teacher: 'Maria Santos',
			subject: 'Mathematics',
			day: 'Monday',
			timeSlot: '7:30 AM - 8:30 AM',
			period: '1st Period'
		},
		{
			id: 2,
			grade: 'Grade 7',
			section: 'Section A',
			teacher: 'Juan Dela Cruz',
			subject: 'Science',
			day: 'Monday',
			timeSlot: '8:30 AM - 9:30 AM',
			period: '2nd Period'
		},
		{
			id: 3,
			grade: 'Grade 8',
			section: 'Section A',
			teacher: 'Ana Garcia',
			subject: 'English',
			day: 'Tuesday',
			timeSlot: '7:30 AM - 8:30 AM',
			period: '1st Period'
		}
	];

	// Filtered assignments based on selected filters
	$: filteredAssignments = scheduleAssignments.filter(assignment => {
		const sectionMatch = !selectedFilterSection || 
			(assignment.grade + ' · ' + assignment.section) === selectedFilterSection;
		// Use the new day picker for filtering
		const dayMatch = !selectedAdminDay || assignment.day === dayNameMap[selectedAdminDay];
		return sectionMatch && dayMatch;
	});

	// Close dropdowns when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.scheduleassign-custom-dropdown') && !event.target.closest('.admin-mobile-dropdown')) {
			isSectionDropdownOpen = false;
			isTeacherDropdownOpen = false;
			isSubjectDropdownOpen = false;
			isTimeSlotDropdownOpen = false;
			isFilterSectionDropdownOpen = false;
			isAdminDayDropdownOpen = false;
		}
	}



	// Selection functions
	function selectSection(section) {
		selectedSection = section.id;
		isSectionDropdownOpen = false;
	}

	function selectTeacher(teacher) {
		selectedTeacher = teacher.id;
		isTeacherDropdownOpen = false;
	}

	function selectSubject(subject) {
		selectedSubject = subject.id;
		isSubjectDropdownOpen = false;
	}

	function selectTimeSlot(timeSlot) {
		selectedTimeSlot = timeSlot.id;
		isTimeSlotDropdownOpen = false;
	}



	// Form dropdown toggle functions
	function toggleSectionDropdown() {
		isSectionDropdownOpen = !isSectionDropdownOpen;
	}

	function toggleTeacherDropdown() {
		isTeacherDropdownOpen = !isTeacherDropdownOpen;
	}

	function toggleSubjectDropdown() {
		isSubjectDropdownOpen = !isSubjectDropdownOpen;
	}

	function toggleTimeSlotDropdown() {
		isTimeSlotDropdownOpen = !isTimeSlotDropdownOpen;
	}

	// Filter dropdown toggle functions
	function toggleFilterSectionDropdown() {
		isFilterSectionDropdownOpen = !isFilterSectionDropdownOpen;
	}

	// Day picker functions (similar to student schedule)
	function toggleAdminDayDropdown() {
		isAdminDayDropdownOpen = !isAdminDayDropdownOpen;
	}

	function selectAdminDay(day) {
		selectedAdminDay = day;
		isAdminDayDropdownOpen = false;
	}

	// Filter selection functions
	function selectFilterSection(section) {
		selectedFilterSection = section ? (section.grade + ' · ' + section.name) : '';
		isFilterSectionDropdownOpen = false;
	}

	// Handle form submission
	async function handleAssignSchedule() {
		if (!selectedSection || !selectedTeacher || !selectedSubject || !selectedTimeSlot || !selectedAdminDay) {
			alert('Please fill in all required fields.');
			return;
		}

		isAssigning = true;

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Get selected objects
			const sectionObj = sections.find(s => s.id === selectedSection);
			const teacherObj = teachers.find(t => t.id === selectedTeacher);
			const subjectObj = subjects.find(s => s.id === selectedSubject);
			const timeSlotObj = timeSlots.find(t => t.id === selectedTimeSlot);
			const dayName = dayNameMap[selectedAdminDay];

			// Add to schedule assignments
			const newAssignment = {
				id: scheduleAssignments.length + 1,
				section: sectionObj.name,
				teacher: teacherObj.name,
				subject: subjectObj.name,
				day: dayName,
				timeSlot: timeSlotObj.time,
				period: timeSlotObj.period
			};

			scheduleAssignments = [newAssignment, ...scheduleAssignments];

			// Show success message
			successMessage = `Schedule assigned successfully: ${subjectObj.name} for ${sectionObj.name} on ${dayName} at ${timeSlotObj.time}`;
			showSuccessMessage = true;

			// Reset form
			selectedSection = '';
			selectedTeacher = '';
			selectedSubject = '';
			selectedTimeSlot = '';
			// Keep day picker at current selection

			// Hide success message after 5 seconds
			setTimeout(() => {
				showSuccessMessage = false;
			}, 5000);

		} catch (error) {
			console.error('Error assigning schedule:', error);
			alert('Failed to assign schedule. Please try again.');
		} finally {
			isAssigning = false;
		}
	}

	// Get selected objects for display
	$: selectedSectionObj = sections.find(s => s.id === selectedSection);
	$: selectedTeacherObj = teachers.find(t => t.id === selectedTeacher);
	$: selectedSubjectObj = subjects.find(s => s.id === selectedSubject);
	$: selectedTimeSlotObj = timeSlots.find(t => t.id === selectedTimeSlot);
</script>

<svelte:window on:click={handleClickOutside} />

<div class="scheduleassign-container">
	<!-- Header -->
	<div class="scheduleassign-header">
		<div class="scheduleassign-header-content">
			<h1 class="scheduleassign-page-title">Schedule Assignment</h1>
			<p class="scheduleassign-page-subtitle">Assign subjects and teachers to sections with specific time slots</p>
		</div>
	</div>

	<!-- Success Message -->
	{#if showSuccessMessage}
		<div class="scheduleassign-success-message">
			<span class="material-symbols-outlined scheduleassign-success-icon">check_circle</span>
			<span class="scheduleassign-success-text">{successMessage}</span>
		</div>
	{/if}

	<!-- Schedule Assignment Form -->
	<div class="scheduleassign-form-section">
		<div class="scheduleassign-section-header">
			<h2 class="scheduleassign-section-title">Create Schedule Assignment</h2>
			<p class="scheduleassign-section-subtitle">Select section, teacher, subject, day, and time slot</p>
		</div>

		<form on:submit|preventDefault={handleAssignSchedule}>
				<!-- Section and Teacher Row -->
				<div class="scheduleassign-form-grid">
					<!-- Section Selection -->
					<div class="scheduleassign-form-group">
						<label class="scheduleassign-form-label" for="section">Section *</label>
						<div class="scheduleassign-custom-dropdown" class:open={isSectionDropdownOpen}>
							<button 
								type="button"
								class="scheduleassign-dropdown-button" 
								class:selected={selectedSection}
								on:click={toggleSectionDropdown}
								id="section"
							>
								{#if selectedSectionObj}
								<div class="scheduleassign-selected-option">
									<span class="material-symbols-outlined option-icon">school</span>
									<div class="option-content">
										<span class="option-name">{selectedSectionObj.grade} · {selectedSectionObj.name}</span>
									</div>
								</div>
								{:else}
									<span class="placeholder">Select section</span>
								{/if}
								<span class="material-symbols-outlined scheduleassign-dropdown-arrow">expand_more</span>
							</button>
							<div class="scheduleassign-dropdown-menu">
								{#each sections as section (section.id)}
									<button 
										type="button"
										class="scheduleassign-dropdown-item" 
										class:selected={selectedSection === section.id}
										on:click={() => selectSection(section)}
									>
										<span class="material-symbols-outlined option-icon">school</span>
									<div class="option-content">
										<span class="option-name">{section.grade} · {section.name}</span>
									</div>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Teacher Selection -->
					<div class="scheduleassign-form-group">
						<label class="scheduleassign-form-label" for="teacher">Teacher *</label>
						<div class="scheduleassign-custom-dropdown" class:open={isTeacherDropdownOpen}>
							<button 
								type="button"
								class="scheduleassign-dropdown-button" 
								class:selected={selectedTeacher}
								on:click={toggleTeacherDropdown}
								id="teacher"
							>
								{#if selectedTeacherObj}
								<div class="scheduleassign-selected-option">
									<span class="material-symbols-outlined option-icon">person</span>
									<div class="option-content">
										<span class="option-name">{selectedTeacherObj.name} · {selectedTeacherObj.subject}</span>
									</div>
								</div>
								{:else}
									<span class="placeholder">Select teacher</span>
								{/if}
								<span class="material-symbols-outlined scheduleassign-dropdown-arrow">expand_more</span>
							</button>
							<div class="scheduleassign-dropdown-menu">
								{#each teachers as teacher (teacher.id)}
									<button 
										type="button"
										class="scheduleassign-dropdown-item" 
										class:selected={selectedTeacher === teacher.id}
										on:click={() => selectTeacher(teacher)}
									>
										<span class="material-symbols-outlined option-icon">person</span>
									<div class="option-content">
										<span class="option-name">{teacher.name} · {teacher.subject}</span>
										</div>
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<!-- Subject Selection -->
				<div class="scheduleassign-form-group">
					<label class="scheduleassign-form-label" for="subject">Subject *</label>
					<div class="scheduleassign-custom-dropdown" class:open={isSubjectDropdownOpen}>
						<button 
							type="button"
							class="scheduleassign-dropdown-button" 
							class:selected={selectedSubject}
							on:click={toggleSubjectDropdown}
							id="subject"
						>
							{#if selectedSubjectObj}
								<div class="scheduleassign-selected-option">
									<span class="material-symbols-outlined option-icon">{selectedSubjectObj.icon}</span>
									<div class="option-content">
										<span class="option-name">{selectedSubjectObj.name}</span>
									</div>
								</div>
							{:else}
								<span class="placeholder">Select subject</span>
							{/if}
							<span class="material-symbols-outlined scheduleassign-dropdown-arrow">expand_more</span>
						</button>
						<div class="scheduleassign-dropdown-menu">
							{#each subjects as subject (subject.id)}
								<button 
									type="button"
									class="scheduleassign-dropdown-item" 
									class:selected={selectedSubject === subject.id}
									on:click={() => selectSubject(subject)}
								>
									<span class="material-symbols-outlined option-icon">{subject.icon}</span>
									<div class="option-content">
										<span class="option-name">{subject.name}</span>
									</div>
								</button>
							{/each}
						</div>
				</div>
			</div>

				<!-- Time Slot Row -->
			<div class="scheduleassign-day-timeslot-row">

					<!-- Time Slot Selection -->
					<div class="scheduleassign-form-group">
						<label class="scheduleassign-form-label" for="time-slot">Time Slot *</label>
						<div class="scheduleassign-custom-dropdown" class:open={isTimeSlotDropdownOpen}>
							<button 
								type="button"
								class="scheduleassign-dropdown-button" 
								class:selected={selectedTimeSlot}
								on:click={toggleTimeSlotDropdown}
								id="time-slot"
							>
								{#if selectedTimeSlotObj}
									<div class="scheduleassign-selected-option">
										<span class="material-symbols-outlined option-icon">schedule</span>
										<div class="option-content">
											<span class="option-name">{selectedTimeSlotObj.time}</span>
											<span class="option-description">{selectedTimeSlotObj.period}</span>
										</div>
									</div>
								{:else}
									<span class="placeholder">Select time slot</span>
								{/if}
								<span class="material-symbols-outlined scheduleassign-dropdown-arrow">expand_more</span>
							</button>
							<div class="scheduleassign-dropdown-menu">
								{#each timeSlots as timeSlot (timeSlot.id)}
									<button 
										type="button"
										class="scheduleassign-dropdown-item" 
										class:selected={selectedTimeSlot === timeSlot.id}
										on:click={() => selectTimeSlot(timeSlot)}
									>
										<span class="material-symbols-outlined option-icon">schedule</span>
										<div class="option-content">
											<span class="option-name">{timeSlot.time}</span>
											<span class="option-description">{timeSlot.period}</span>
										</div>
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<!-- Submit Button -->
				<div class="scheduleassign-form-actions">
					<button 
						type="submit" 
						class="scheduleassign-assign-button" 
						class:loading={isAssigning}
						disabled={isAssigning || !selectedSection || !selectedTeacher || !selectedSubject || !selectedTimeSlot || !selectedDay}
					>
						{#if isAssigning}
							<span class="material-symbols-outlined loading-icon">hourglass_empty</span>
							Assigning Schedule...
						{:else}
							<span class="material-symbols-outlined">event</span>
							Assign Schedule
						{/if}
					</button>
				</div>
		</form>
	</div>

	<!-- Current Schedule Assignments -->
	<div class="scheduleassign-assignments-section">
		<div class="scheduleassign-section-header">
			<h2 class="scheduleassign-section-title">Current Schedule Assignments</h2>
			<p class="scheduleassign-section-subtitle">Recently assigned schedules in the system</p>
		</div>

		<!-- Section Filter -->
		<div class="scheduleassign-filter-controls">
			<div class="scheduleassign-custom-dropdown" class:open={isFilterSectionDropdownOpen}>
				<button 
					type="button" 
					class="scheduleassign-dropdown-button" 
					on:click={toggleFilterSectionDropdown}
				>
					<div class="scheduleassign-dropdown-content">
						<span class="scheduleassign-option-name">
							{selectedFilterSection || 'All Sections'}
						</span>
					</div>
					<span class="material-symbols-outlined scheduleassign-dropdown-icon" class:rotated={isFilterSectionDropdownOpen}>
						expand_more
					</span>
				</button>
				{#if isFilterSectionDropdownOpen}
					<div class="scheduleassign-dropdown-menu">
						<button 
							type="button" 
							class="scheduleassign-dropdown-item" 
							on:click={() => selectFilterSection(null)}
						>
							<span class="scheduleassign-option-name">All Sections</span>
						</button>
						{#each sections as section (section.id)}
							<button 
								type="button" 
								class="scheduleassign-dropdown-item" 
								on:click={() => selectFilterSection(section)}
							>
								<span class="scheduleassign-option-name">{section.grade} · {section.name}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Week Navigation and Filter Controls -->
		<div class="admin-week-navigation">
			<div class="admin-week-title">
				<span>{currentDayName}, {currentMonth} {currentDay}</span>
			</div>

			<div class="admin-day-selector">
				{#each weekDays as { day }}
					<button 
						class="admin-day-btn {day === selectedAdminDay ? 'active' : ''}"
						on:click={() => selectAdminDay(day)}
					>
						<div class="admin-day-name">{day}</div>
						<div class="admin-day-name-full">{dayNameMap[day]}</div>
					</button>
				{/each}
			</div>
			
			<!-- Mobile Dropdown -->
			<div class="admin-mobile-dropdown">
				<button class="admin-dropdown-toggle-date" on:click={toggleAdminDayDropdown}>
					<span>{dayNameMap[selectedAdminDay] || 'Select Day'}</span>
					<span class="material-symbols-outlined admin-dropdown-icon {isAdminDayDropdownOpen ? 'open' : ''}">
						expand_more
					</span>
				</button>
				
				{#if isAdminDayDropdownOpen}
					<div class="admin-dropdown-menu">
						{#each weekDays as { day }}
							<button 
								class="admin-dropdown-item {day === selectedAdminDay ? 'selected' : ''}"
								on:click={() => selectAdminDay(day)}
							>
								{dayNameMap[day]}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="scheduleassign-assignments-grid">
			{#if filteredAssignments.length > 0}
				{#each filteredAssignments as assignment (assignment.id)}
					<div class="scheduleassign-assignment-card">
						<div class="scheduleassign-assignment-actions">
							<button class="scheduleassign-action-button scheduleassign-edit-button" title="Edit Assignment">
								<span class="material-symbols-outlined">edit</span>
							</button>
							<button class="scheduleassign-action-button scheduleassign-delete-button" title="Delete Assignment">
								<span class="material-symbols-outlined">delete</span>
							</button>
						</div>
					<div class="scheduleassign-assignment-details">
						<div class="scheduleassign-detail-item">
							<span class="material-symbols-outlined scheduleassign-detail-icon">school</span>
							<span class="scheduleassign-detail-text">{assignment.grade} · {assignment.section}</span>
						</div>
						<div class="scheduleassign-detail-item">
							<span class="material-symbols-outlined scheduleassign-detail-icon">person</span>
							<span class="scheduleassign-detail-text">{assignment.teacher} · {assignment.subject}</span>
						</div>
							<div class="scheduleassign-detail-item">
								<span class="material-symbols-outlined scheduleassign-detail-icon">calendar_today</span>
								<span class="scheduleassign-detail-text">{assignment.day}</span>
							</div>
							<div class="scheduleassign-detail-item">
								<span class="material-symbols-outlined scheduleassign-detail-icon">schedule</span>
								<span class="scheduleassign-detail-text">{assignment.timeSlot} ({assignment.period})</span>
							</div>
						</div>
					</div>
				{/each}
			{:else}
				<div class="scheduleassign-no-schedule">
					<div class="scheduleassign-no-schedule-icon">
						<span class="material-symbols-outlined">event_busy</span>
					</div>
					<div class="scheduleassign-no-schedule-text">
						<h3>No Schedule Found</h3>
						<p>There are no schedule assignments for the selected filters.</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>