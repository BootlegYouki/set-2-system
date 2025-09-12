<script>
	import './adminScheduleAssignment.css';
	import { toastStore } from '../../../../common/js/toastStore.js';

	// Schedule assignment state
	let isAssigning = false;
	let selectedFormYear = '';
	let selectedFormSection = '';
	let selectedFormDay = '';
	let selectedFormSubject = '';
	let selectedFormTimeSlot = '';


	// Form dropdown states
	let isFormYearDropdownOpen = false;
	let isFormSectionDropdownOpen = false;
	let isFormDayDropdownOpen = false;
	let isFormSubjectDropdownOpen = false;
	let isFormTimeSlotDropdownOpen = false;

	// Legacy variables for backward compatibility
	let selectedSection = '';
	let selectedTeacher = '';
	let selectedSubject = '';
	let selectedTimeSlot = '';
	let selectedDay = '';

	// Legacy dropdown states
	let isSectionDropdownOpen = false;
	let isTeacherDropdownOpen = false;
	let isSubjectDropdownOpen = false;
	let isTimeSlotDropdownOpen = false;

	// Filter states for assignments section
	let selectedFilterYear = '';
	let selectedFilterSection = '';
	let isFilterYearDropdownOpen = false;
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
	const years = [
		{ id: '1st-year', name: '1st Year' },
		{ id: '2nd-year', name: '2nd Year' },
		{ id: '3rd-year', name: '3rd Year' },
		{ id: '4th-year', name: '4th Year' }
	];

	const sections = [
		{ id: 'grade7-a', name: 'Section A', grade: 'Grade 7', year: '1st-year' },
		{ id: 'grade7-b', name: 'Section B', grade: 'Grade 7', year: '1st-year' },
		{ id: 'grade8-a', name: 'Section A', grade: 'Grade 8', year: '2nd-year' },
		{ id: 'grade8-b', name: 'Section B', grade: 'Grade 8', year: '2nd-year' },
		{ id: 'grade9-a', name: 'Section A', grade: 'Grade 9', year: '3rd-year' },
		{ id: 'grade9-b', name: 'Section B', grade: 'Grade 9', year: '3rd-year' },
		{ id: 'grade10-a', name: 'Section A', grade: 'Grade 10', year: '4th-year' },
		{ id: 'grade10-b', name: 'Section B', grade: 'Grade 10', year: '4th-year' }
	];

	const teachers = [
		{ id: 'teacher1', name: 'Ms. Maria Santos' },
		{ id: 'teacher2', name: 'Mr. Juan Dela Cruz' },
		{ id: 'teacher3', name: 'Ms. Ana Garcia' },
		{ id: 'teacher4', name: 'Mr. Pedro Rodriguez' },
		{ id: 'teacher5', name: 'Ms. Carmen Lopez' },
		{ id: 'teacher6', name: 'Mr. Jose Reyes' },
		{ id: 'teacher7', name: 'Ms. Rosa Fernandez' },
		{ id: 'teacher8', name: 'Mr. Miguel Torres' },
		{ id: 'teacher9', name: 'Ms. Elena Morales' },
		{ id: 'teacher10', name: 'Mr. Carlos Mendoza' }
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

	// Dynamic time slots that can be managed by admin
	let timeSlots = [
		{ id: 'slot1', time: '7:30 AM - 8:30 AM', period: '1st Period' },
		{ id: 'slot2', time: '8:30 AM - 9:30 AM', period: '2nd Period' },
		{ id: 'slot3', time: '9:30 AM - 10:30 AM', period: '3rd Period' },
		{ id: 'slot4', time: '10:45 AM - 11:45 AM', period: '4th Period' },
		{ id: 'slot5', time: '11:45 AM - 12:45 PM', period: '5th Period' },
		{ id: 'slot6', time: '1:30 PM - 2:30 PM', period: '6th Period' },
		{ id: 'slot7', time: '2:30 PM - 3:30 PM', period: '7th Period' }
	];
	
	// Add Schedule State
	let isAddingSchedule = false;
	let newSchedule = { startTime: '', endTime: '' };
	// Array to store saved schedules for current selection
	let savedSchedules = [];
	let isFormTeacherDropdownOpen = false;
	let selectedFormTeacher = '';

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
			year: '1st-year',
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
			year: '1st-year',
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
			year: '2nd-year',
			grade: 'Grade 8',
			section: 'Section A',
			teacher: 'Ana Garcia',
			subject: 'English',
			day: 'Tuesday',
			timeSlot: '7:30 AM - 8:30 AM',
			period: '1st Period'
		},
		{
			id: 4,
			year: '1st-year',
			grade: 'Grade 7',
			section: 'Section B',
			teacher: 'Pedro Rodriguez',
			subject: 'Filipino',
			day: 'Wednesday',
			timeSlot: '9:30 AM - 10:30 AM',
			period: '3rd Period'
		},
		{
			id: 5,
			year: '3rd-year',
			grade: 'Grade 9',
			section: 'Section A',
			teacher: 'Carmen Lopez',
			subject: 'Social Studies',
			day: 'Thursday',
			timeSlot: '10:45 AM - 11:45 AM',
			period: '4th Period'
		},
		{
			id: 6,
			year: '4th-year',
			grade: 'Grade 10',
			section: 'Section A',
			teacher: 'Ana Garcia',
			subject: 'English',
			day: 'Friday',
			timeSlot: '1:30 PM - 2:30 PM',
			period: '6th Period'
		}
	];

	// Filter sections based on selected year
	$: filteredSections = selectedFilterYear ? sections.filter(section => section.year === selectedFilterYear) : [];

	// Filter form sections based on selected form year
	$: filteredFormSections = selectedFormYear ? sections.filter(section => section.year === selectedFormYear) : [];

	// Get selected objects for form display
	$: selectedFormYearObj = years.find(y => y.id === selectedFormYear);
	$: selectedFormSectionObj = sections.find(s => s.id === selectedFormSection);
	$: selectedFormDayObj = days.find(d => d.id === selectedFormDay);
	$: selectedFormSubjectObj = subjects.find(s => s.id === selectedFormSubject);
	$: selectedFormTimeSlotObj = timeSlots.find(t => t.id === selectedFormTimeSlot);
	$: selectedFormTeacherObj = teachers.find(t => t.id === selectedFormTeacher);

	// Clear saved schedules when selection changes
	$: if (selectedFormYear || selectedFormSection || selectedFormDay) {
		savedSchedules = [];
	}

	// Filtered assignments based on selected filters
	$: filteredAssignments = scheduleAssignments.filter(assignment => {
		// Require year and section selection - if either is not selected, return empty array
		if (!selectedFilterYear || !selectedFilterSection) return false;
		
		const yearMatch = assignment.year === selectedFilterYear;
		const sectionMatch = (assignment.grade + ' · ' + assignment.section) === selectedFilterSection;
		// Use the new day picker for filtering
		const dayMatch = !selectedAdminDay || assignment.day === dayNameMap[selectedAdminDay];
		return yearMatch && sectionMatch && dayMatch;
	});
	
	// Check if year and section are selected for display logic
	$: isYearSelected = !!selectedFilterYear;
	$: isSectionSelected = !!selectedFilterSection;

	// Close dropdowns when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.scheduleassign-custom-dropdown') && !event.target.closest('.admin-mobile-dropdown')) {
			// Legacy dropdowns
			isSectionDropdownOpen = false;
			isTeacherDropdownOpen = false;
			isSubjectDropdownOpen = false;
			isTimeSlotDropdownOpen = false;
			// Filter dropdowns
			isFilterYearDropdownOpen = false;
			isFilterSectionDropdownOpen = false;
			isAdminDayDropdownOpen = false;
			// New form dropdowns
			isFormYearDropdownOpen = false;
			isFormSectionDropdownOpen = false;
			isFormDayDropdownOpen = false;
			isFormSubjectDropdownOpen = false;
			isFormTimeSlotDropdownOpen = false;
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
	function toggleFilterYearDropdown() {
		isFilterYearDropdownOpen = !isFilterYearDropdownOpen;
	}

	function toggleFilterSectionDropdown() {
		isFilterSectionDropdownOpen = !isFilterSectionDropdownOpen;
	}

	// Filter selection functions
	function selectFilterYear(year) {
		selectedFilterYear = year ? year.id : null;
		// Reset section selection when year changes
		selectedFilterSection = '';
		isFilterYearDropdownOpen = false;
	}

	function selectFilterSection(section) {
		selectedFilterSection = section ? (section.grade + ' · ' + section.name) : null;
		isFilterSectionDropdownOpen = false;
	}

	// Day picker functions (similar to student schedule)
	function toggleAdminDayDropdown() {
		isAdminDayDropdownOpen = !isAdminDayDropdownOpen;
	}

	function selectAdminDay(day) {
		selectedAdminDay = day;
		isAdminDayDropdownOpen = false;
	}

	// New form dropdown toggle functions
	function toggleFormYearDropdown() {
		isFormYearDropdownOpen = !isFormYearDropdownOpen;
	}

	function toggleFormSectionDropdown() {
		if (!selectedFormYear) return; // Disabled if no year selected
		isFormSectionDropdownOpen = !isFormSectionDropdownOpen;
	}

	function toggleFormDayDropdown() {
		if (!selectedFormSection) return; // Disabled if no section selected
		isFormDayDropdownOpen = !isFormDayDropdownOpen;
	}

	function toggleFormSubjectDropdown() {
		if (!selectedFormDay) return; // Disabled if no day selected
		isFormSubjectDropdownOpen = !isFormSubjectDropdownOpen;
	}

	function toggleFormTimeSlotDropdown() {
		if (!selectedFormSubject) return; // Disabled if no subject selected
		isFormTimeSlotDropdownOpen = !isFormTimeSlotDropdownOpen;
	}

	// New form selection functions with cascading reset
	function selectFormYear(year) {
		selectedFormYear = year ? year.id : '';
		// Reset all subsequent selections
		selectedFormSection = '';
		selectedFormDay = '';
		selectedFormSubject = '';
		selectedFormTimeSlot = '';
		isFormYearDropdownOpen = false;
	}

	function selectFormSection(section) {
		selectedFormSection = section ? section.id : '';
		// Reset all subsequent selections
		selectedFormDay = '';
		selectedFormSubject = '';
		selectedFormTimeSlot = '';
		isFormSectionDropdownOpen = false;
	}

	function selectFormDay(day) {
		selectedFormDay = day ? day.id : '';
		// Reset all subsequent selections
		selectedFormSubject = '';
		selectedFormTimeSlot = '';
		isFormDayDropdownOpen = false;
	}

	function selectFormSubject(subject) {
		selectedFormSubject = subject ? subject.id : '';
		// Reset subsequent selections
		selectedFormTimeSlot = '';
		isFormSubjectDropdownOpen = false;
	}

	function selectFormTimeSlot(timeSlot) {
		selectedFormTimeSlot = timeSlot ? timeSlot.id : '';
		isFormTimeSlotDropdownOpen = false;
	}



	// Handle form submission for new card-based approach
	async function handleAssignSchedule() {
		if (!selectedFormYear || !selectedFormSection || !selectedFormDay || !selectedFormSubject || !selectedFormTimeSlot) {
			toastStore.warning('Please select year level, section, day, subject, and time slot');
			return;
		}

		isAssigning = true;

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Create new assignment
			const newAssignment = {
				id: scheduleAssignments.length + 1,
				year: selectedFormYear,
				grade: selectedFormSectionObj.grade,
				section: selectedFormSectionObj.name,
				teacher: 'TBD', // Will be assigned later
				subject: selectedFormSubjectObj.name,
				day: selectedFormDayObj.name,
				timeSlot: selectedFormTimeSlotObj.time,
				period: selectedFormTimeSlotObj.period
			};

			// Add to assignments array
			scheduleAssignments = [...scheduleAssignments, newAssignment];

			// Show success toast
			toastStore.success(`Schedule assigned successfully for ${selectedFormSectionObj.grade} ${selectedFormSectionObj.name}`);

			// Reset only subject and time slot selections to allow adding more subjects
			selectedFormSubject = '';
			selectedFormTimeSlot = '';
			
			// Close any open dropdowns
			isFormSubjectDropdownOpen = false;

		} catch (error) {
			console.error('Error assigning schedule:', error);
			toastStore.error('Failed to assign schedule. Please try again.');
		} finally {
			isAssigning = false;
		}
	}

	// Reset form function
	function resetForm() {
		selectedFormYear = '';
		selectedFormSection = '';
		selectedFormDay = '';
		selectedFormSubject = '';
		selectedFormTimeSlot = '';
		
		// Close all dropdowns
			isFormYearDropdownOpen = false;
			isFormSectionDropdownOpen = false;
			isFormDayDropdownOpen = false;
			isFormSubjectDropdownOpen = false;
			isFormTimeSlotDropdownOpen = false;
			isFormTeacherDropdownOpen = false;
		
		// Hide success message
		showSuccessMessage = false;
	}
	
	// Reset day selection and subsequent selections
	function resetDaySelection() {
		selectedFormDay = '';
		selectedFormSubject = '';
		selectedFormTimeSlot = '';
		
		// Close related dropdowns
		isFormDayDropdownOpen = false;
		isFormSubjectDropdownOpen = false;
		isFormTimeSlotDropdownOpen = false;
		isFormTeacherDropdownOpen = false;
	}

	// New form teacher dropdown functions
	function toggleFormTeacherDropdown() {
		isFormTeacherDropdownOpen = !isFormTeacherDropdownOpen;
	}

	function selectFormTeacher(teacher) {
		selectedFormTeacher = teacher ? teacher.id : '';
		isFormTeacherDropdownOpen = false;
	}

	// Add schedule functions
	function handleAddSchedule() {
		if (!newSchedule.startTime || !newSchedule.endTime || !selectedFormSubject || !selectedFormTeacher) {
			toastStore.warning('Please fill in all required fields');
			return;
		}

		isAssigning = true;

		try {
				// Create new assignment
				const newAssignment = {
					id: scheduleAssignments.length + 1,
					year: selectedFormYear,
					grade: selectedFormSectionObj.grade,
					section: selectedFormSectionObj.name,
					teacher: selectedFormTeacherObj.name,
					subject: selectedFormSubjectObj.name,
					day: selectedFormDayObj.name,
					timeSlot: `${newSchedule.startTime} - ${newSchedule.endTime}`,
					period: 'Custom Period'
				};

				// Add to assignments array
				scheduleAssignments = [...scheduleAssignments, newAssignment];

				// Add to saved schedules for current selection
				const savedSchedule = {
					id: Date.now(),
					startTime: newSchedule.startTime,
					endTime: newSchedule.endTime,
					subject: selectedFormSubjectObj.name,
					subjectIcon: selectedFormSubjectObj.icon,
					teacher: selectedFormTeacherObj.name
				};
				savedSchedules = [...savedSchedules, savedSchedule];

			// Show success toast
			toastStore.success(`Schedule assigned successfully for ${selectedFormSectionObj.grade} ${selectedFormSectionObj.name}`);

			// Reset form
			newSchedule = { startTime: '', endTime: '' };
			selectedFormSubject = '';
			selectedFormTeacher = '';
			isAddingSchedule = false;

		} catch (error) {
			console.error('Error assigning schedule:', error);
			toastStore.error('Failed to assign schedule. Please try again.');
		} finally {
			isAssigning = false;
		}
	}

	function cancelAddSchedule() {
		newSchedule = { startTime: '', endTime: '' };
		selectedFormSubject = '';
		selectedFormTeacher = '';
		isAddingSchedule = false;
		isFormSubjectDropdownOpen = false;
		isFormTeacherDropdownOpen = false;
	}

	function removeSchedule(scheduleId) {
		savedSchedules = savedSchedules.filter(schedule => schedule.id !== scheduleId);
	}

	// Import/Export functions
	let fileInput;

	function exportSchedules() {
		if (savedSchedules.length === 0) return;
		
		const exportData = {
			version: '1.0',
			exportDate: new Date().toISOString(),
			grade: selectedFormSectionObj.grade,
			section: selectedFormSectionObj.name,
			day: selectedFormDayObj.name,
			schedules: savedSchedules
		};
		
		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		
		const link = document.createElement('a');
		link.href = url;
		link.download = `schedule_${selectedFormSectionObj.grade}_${selectedFormSectionObj.name}_${selectedFormDayObj.name}_${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		
		URL.revokeObjectURL(url);
		
		// Show success toast
		toastStore.success(`Successfully exported ${savedSchedules.length} schedule(s)`);
	}

	function importSchedules() {
		fileInput.click();
	}

	function handleFileImport(event) {
		const file = event.target.files[0];
		if (!file) return;
		
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const importData = JSON.parse(e.target.result);
				
				// Validate import data structure
				if (!importData.schedules || !Array.isArray(importData.schedules)) {
					toastStore.error('Invalid file format. Please select a valid schedule export file.');
					return;
				}
				
				// Validate each schedule has required fields
				const validSchedules = importData.schedules.filter(schedule => 
					schedule.id && schedule.subject && schedule.teacher && 
					schedule.startTime && schedule.endTime
				);
				
				if (validSchedules.length === 0) {
					toastStore.error('No valid schedules found in the imported file.');
					return;
				}
				
				// Generate new IDs to avoid conflicts
				const importedSchedules = validSchedules.map(schedule => ({
					...schedule,
					id: Date.now() + Math.random()
				}));
				
				// Add to existing schedules
				savedSchedules = [...savedSchedules, ...importedSchedules];
				
				// Show success toast
				toastStore.success(`Successfully imported ${importedSchedules.length} schedule(s)`);
				
			} catch (error) {
				toastStore.error('Error reading file. Please make sure it\'s a valid JSON file.');
			}
		};
		reader.readAsText(file);
		
		// Reset file input
		event.target.value = '';
	}
	


	// Get selected objects for display
	$: selectedSectionObj = sections.find(s => s.id === selectedSection);
	$: selectedTeacherObj = teachers.find(t => t.id === selectedTeacher);
	$: selectedSubjectObj = subjects.find(s => s.id === selectedSubject);
	$: selectedTimeSlotObj = timeSlots.find(t => t.id === selectedTimeSlot);
</script>

<svelte:window on:click={handleClickOutside} />

<!-- Hidden file input for importing schedules -->
<input 
	type="file" 
	accept=".json" 
	bind:this={fileInput} 
	on:change={handleFileImport}
	style="display: none;"
/>

<div class="scheduleassign-container">
	<!-- Header -->
	<div class="scheduleassign-header">
		<div class="scheduleassign-header-content">
			<h1 class="scheduleassign-page-title">Schedule Assignment</h1>
			<p class="scheduleassign-page-subtitle">Assign subjects and teachers to sections with specific time slots</p>
		</div>
	</div>



	<!-- Schedule Assignment Form -->
	<div class="scheduleassign-form-section">
		<div class="scheduleassign-section-header">
			<h2 class="scheduleassign-section-title">Create Schedule Assignment</h2>
			<p class="scheduleassign-section-subtitle">Select section, teacher, subject, day, and time slot</p>
		</div>

		<form on:submit|preventDefault={handleAssignSchedule}>
			<div class="scheduleassign-hierarchical-form">
				<p class="scheduleassign-form-instruction">Select year level and section, then choose a day to add schedule assignments.</p>

				<!-- Year Level and Section Selection Row -->
				<div class="scheduleassign-selection-row">
					<!-- Year Level Selection -->
					<div class="scheduleassign-form-group">
						<label class="scheduleassign-form-label" for="form-year">Year Level *</label>
						<div class="scheduleassign-custom-dropdown" class:open={isFormYearDropdownOpen}>
							<button 
								type="button"
								class="scheduleassign-dropdown-button" 
								class:selected={selectedFormYear}
								on:click={toggleFormYearDropdown}
								id="form-year"
							>
								{#if selectedFormYearObj}
									<div class="scheduleassign-selected-option">
										<span class="material-symbols-outlined option-icon">school</span>
										<div class="option-content">
											<span class="option-name">{selectedFormYearObj.name}</span>
										</div>
									</div>
								{:else}
									<span class="placeholder">Select year level</span>
								{/if}
								<span class="material-symbols-outlined scheduleassign-dropdown-arrow">expand_more</span>
							</button>
							<div class="scheduleassign-dropdown-menu">
								{#each years as year (year.id)}
									<button 
										type="button"
										class="scheduleassign-dropdown-item" 
										class:selected={selectedFormYear === year.id}
										on:click={() => selectFormYear(year)}
									>
										<span class="material-symbols-outlined option-icon">school</span>
										<div class="option-content">
											<span class="option-name">{year.name}</span>
										</div>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Section Selection -->
					<div class="scheduleassign-form-group">
						<label class="scheduleassign-form-label" for="form-section">Section *</label>
						<div class="scheduleassign-custom-dropdown" class:open={isFormSectionDropdownOpen} class:disabled={!selectedFormYear}>
							<button 
								type="button"
								class="scheduleassign-dropdown-button" 
								class:selected={selectedFormSection}
								class:disabled={!selectedFormYear}
								on:click={toggleFormSectionDropdown}
								id="form-section"
								disabled={!selectedFormYear}
							>
								{#if selectedFormSectionObj}
									<div class="scheduleassign-selected-option">
										<span class="material-symbols-outlined option-icon">class</span>
										<div class="option-content">
											<span class="option-name">{selectedFormSectionObj.grade} · {selectedFormSectionObj.name}</span>
										</div>
									</div>
								{:else}
									<span class="placeholder">{selectedFormYear ? 'Select section' : 'Select year level first'}</span>
								{/if}
								<span class="material-symbols-outlined scheduleassign-dropdown-arrow">expand_more</span>
							</button>
							<div class="scheduleassign-dropdown-menu">
								{#each filteredFormSections as section (section.id)}
									<button 
										type="button"
										class="scheduleassign-dropdown-item" 
										class:selected={selectedFormSection === section.id}
										on:click={() => selectFormSection(section)}
									>
										<span class="material-symbols-outlined option-icon">class</span>
										<div class="option-content">
											<span class="option-name">{section.grade} · {section.name}</span>
										</div>
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<!-- Day Selection Grid -->
				{#if selectedFormYear && selectedFormSection}
					<div class="scheduleassign-day-selection">
						<label class="scheduleassign-form-label">Select Day *</label>
						<div class="scheduleassign-day-grid">
							{#each days as day (day.id)}
								<button 
									type="button"
									class="scheduleassign-day-button" 
									class:selected={selectedFormDay === day.id}
									on:click={() => selectFormDay(day)}
								>
									<span class="material-symbols-outlined">calendar_today</span>
									<span class="day-name">{day.name}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

				<!-- Add Schedule Section -->
				{#if selectedFormYear && selectedFormSection && selectedFormDay}
					<div class="scheduleassign-add-section">
						<div class="scheduleassign-section-header">
					<h3 class="scheduleassign-section-title">
						Schedule for {selectedFormSectionObj.grade} {selectedFormSectionObj.name} - {selectedFormDayObj.name}
					</h3>
					<div class="scheduleassign-import-export-actions">
						<button 
							type="button" 
							class="scheduleassign-import-button"
							on:click={importSchedules}
							title="Import schedules from file"
						>
							<span class="material-symbols-outlined">upload</span>
							Import
						</button>
						<button 
							type="button" 
							class="scheduleassign-export-button"
							on:click={exportSchedules}
							title="Export schedules to file"
							disabled={savedSchedules.length === 0}
						>
							<span class="material-symbols-outlined">download</span>
							Export
						</button>
					</div>
				</div>

						<!-- Saved Schedules -->
						{#if savedSchedules.length > 0}
							<div class="scheduleassign-saved-schedules">
								{#each savedSchedules as schedule (schedule.id)}
								<div class="scheduleassign-assignment-card">
									<div class="scheduleassign-assignment-header">
										<div class="scheduleassign-assignment-info">
											<h3 class="scheduleassign-assignment-title">{schedule.subject}</h3>
										<p class="scheduleassign-assignment-subtitle">{selectedFormSectionObj.grade} - {selectedFormSectionObj.name}</p>
										</div>
										<div class="scheduleassign-assignment-actions">
											<button 
												type="button" 
												class="scheduleassign-delete-button"
												on:click={() => removeSchedule(schedule.id)}
												title="Remove schedule"
											>
												<span class="material-symbols-outlined">delete</span>
											</button>
										</div>
									</div>
									<div class="scheduleassign-assignment-details">
									<div class="scheduleassign-detail-item">
										<span class="material-symbols-outlined scheduleassign-detail-icon">person</span>
										<span class="scheduleassign-detail-text">{schedule.teacher}</span>
									</div>
									<div class="scheduleassign-detail-item">
										<span class="material-symbols-outlined scheduleassign-detail-icon">calendar_today</span>
										<span class="scheduleassign-detail-text">{selectedFormDayObj.name}</span>
									</div>
									<div class="scheduleassign-detail-item">
										<span class="material-symbols-outlined scheduleassign-detail-icon">schedule</span>
										<span class="scheduleassign-detail-text">{schedule.startTime} - {schedule.endTime}</span>
									</div>
								</div>
								</div>
								{/each}
							</div>
						{/if}

						<button 
							type="button"
							class="scheduleassign-add-schedule-card"
							class:cancel-mode={isAddingSchedule}
							on:click={() => isAddingSchedule ? cancelAddSchedule() : (isAddingSchedule = true)}
						>
							<div class="scheduleassign-card-content">
								<h4 class="scheduleassign-card-title">{isAddingSchedule ? 'Cancel' : 'Add Schedule'}</h4>
								<p class="scheduleassign-card-subtitle">{isAddingSchedule ? 'Close the form' : 'Create a new class schedule'}</p>
							</div>
						</button>
					</div>
				{/if}
				
				<!-- Add Schedule Form -->
				{#if isAddingSchedule && selectedFormYear && selectedFormSection && selectedFormDay}
					<div class="scheduleassign-add-form">
						<h3 class="scheduleassign-form-title">Add New Schedule</h3>
						<div class="scheduleassign-form-inputs">
							<!-- Time Input -->
							<div class="scheduleassign-input-group">
								<label class="scheduleassign-form-label">Start Time *</label>
								<input 
									type="time" 
									class="scheduleassign-time-input"
									bind:value={newSchedule.startTime}
									required
								/>
							</div>
							<div class="scheduleassign-input-group">
								<label class="scheduleassign-form-label">End Time *</label>
								<input 
									type="time" 
									class="scheduleassign-time-input"
									bind:value={newSchedule.endTime}
									required
								/>
							</div>
							
							<!-- Subject Selection -->
							<div class="scheduleassign-input-group">
								<label class="scheduleassign-form-label">Subject *</label>
								<div class="scheduleassign-custom-dropdown" class:open={isFormSubjectDropdownOpen}>
									<button 
										type="button"
										class="scheduleassign-dropdown-button" 
										class:selected={selectedFormSubject}
										on:click={toggleFormSubjectDropdown}
									>
										{#if selectedFormSubjectObj}
											<div class="scheduleassign-selected-option">
												<span class="material-symbols-outlined option-icon">{selectedFormSubjectObj.icon}</span>
												<div class="option-content">
													<span class="option-name">{selectedFormSubjectObj.name}</span>
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
												class:selected={selectedFormSubject === subject.id}
												on:click={() => selectFormSubject(subject)}
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
							
							<!-- Teacher Selection -->
							<div class="scheduleassign-input-group">
								<label class="scheduleassign-form-label">Teacher *</label>
								<div class="scheduleassign-custom-dropdown" class:open={isFormTeacherDropdownOpen}>
									<button 
										type="button"
										class="scheduleassign-dropdown-button" 
										class:selected={selectedFormTeacher}
										on:click={toggleFormTeacherDropdown}
									>
										{#if selectedFormTeacherObj}
											<div class="scheduleassign-selected-option">
												<span class="material-symbols-outlined option-icon">person</span>
												<div class="option-content">
													<span class="option-name">{selectedFormTeacherObj.name}</span>
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
												class:selected={selectedFormTeacher === teacher.id}
												on:click={() => selectFormTeacher(teacher)}
											>
												<span class="material-symbols-outlined option-icon">person</span>
												<div class="option-content">
													<span class="option-name">{teacher.name}</span>
												</div>
											</button>
										{/each}
									</div>
								</div>
							</div>
						</div>
						
						<!-- Form Actions -->
						<div class="scheduleassign-form-actions">
							<button 
								type="button" 
								class="scheduleassign-save-schedule-btn"
								on:click={handleAddSchedule}
								disabled={isAssigning}
							>
								{#if isAssigning}
									<span class="material-symbols-outlined spinning">progress_activity</span>
									Saving...
								{:else}
									<span class="material-symbols-outlined">save</span>
									Save Schedule
								{/if}
							</button>
						</div>
					</div>
				{/if}
		</form>
	</div>

	<!-- Current Schedule Assignments -->
	<div class="scheduleassign-assignments-section">
		<div class="scheduleassign-section-header">
			<h2 class="scheduleassign-section-title">Current Schedule Assignments</h2>
			<p class="scheduleassign-section-subtitle">Recently assigned schedules in the system</p>
		</div>

		<!-- Year and Section Filters -->
		<div class="scheduleassign-filter-controls">
			<!-- Year Filter -->
			<div class="scheduleassign-custom-dropdown" class:open={isFilterYearDropdownOpen}>
				<button 
					type="button" 
					class="scheduleassign-dropdown-button" 
					on:click={toggleFilterYearDropdown}
				>
					<div class="scheduleassign-dropdown-content">
						<span class="scheduleassign-option-name">
							{selectedFilterYear || 'Select a year'}
						</span>
					</div>
					<span class="material-symbols-outlined scheduleassign-dropdown-icon" class:rotated={isFilterYearDropdownOpen}>
						expand_more
					</span>
				</button>
				{#if isFilterYearDropdownOpen}
					<div class="scheduleassign-dropdown-menu">
						<button 
							type="button" 
							class="scheduleassign-dropdown-item" 
							on:click={() => selectFilterYear(null)}
						>
							<span class="scheduleassign-option-name">Select a year</span>
						</button>
						{#each years as year (year.id)}
							<button 
								type="button" 
								class="scheduleassign-dropdown-item" 
								on:click={() => selectFilterYear(year)}
							>
								<span class="scheduleassign-option-name">{year.name}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Section Filter -->
			<div class="scheduleassign-custom-dropdown" class:open={isFilterSectionDropdownOpen} class:disabled={!isYearSelected}>
				<button 
					type="button" 
					class="scheduleassign-dropdown-button" 
					on:click={toggleFilterSectionDropdown}
					disabled={!isYearSelected}
				>
					<div class="scheduleassign-dropdown-content">
						<span class="scheduleassign-option-name">
							{selectedFilterSection || (isYearSelected ? 'Select a section' : 'Select a year first')}
						</span>
					</div>
					<span class="material-symbols-outlined scheduleassign-dropdown-icon" class:rotated={isFilterSectionDropdownOpen}>
						expand_more
					</span>
				</button>
				{#if isFilterSectionDropdownOpen && isYearSelected}
					<div class="scheduleassign-dropdown-menu">
						<button 
							type="button" 
							class="scheduleassign-dropdown-item" 
							on:click={() => selectFilterSection(null)}
						>
							<span class="scheduleassign-option-name">Select a section</span>
						</button>
						{#each filteredSections as section (section.id)}
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
			{#if !isYearSelected}
				<div class="scheduleassign-no-schedule">
					<div class="scheduleassign-no-schedule-icon">
						<span class="material-symbols-outlined">calendar_month</span>
					</div>
					<div class="scheduleassign-no-schedule-text">
						<h3>Select a Year</h3>
						<p>Please select a school year from the filter above to view available sections.</p>
					</div>
				</div>
			{:else if !isSectionSelected}
				<div class="scheduleassign-no-schedule">
					<div class="scheduleassign-no-schedule-icon">
						<span class="material-symbols-outlined">school</span>
					</div>
					<div class="scheduleassign-no-schedule-text">
						<h3>Select a Section</h3>
						<p>Please select a section from the filter above to view schedule assignments.</p>
					</div>
				</div>
			{:else if filteredAssignments.length > 0}
				{#each filteredAssignments as assignment (assignment.id)}
					<div class="scheduleassign-assignment-card">
						<div class="scheduleassign-assignment-header">
							<div class="scheduleassign-assignment-info">
								<h3 class="scheduleassign-assignment-title">{assignment.subject}</h3>
								<p class="scheduleassign-assignment-subtitle">{assignment.grade} - {assignment.section}</p>
							</div>
							<div class="scheduleassign-assignment-actions">
								<button class="scheduleassign-edit-button" title="Edit Assignment">
									<span class="material-symbols-outlined">edit</span>
								</button>
								<button class="scheduleassign-delete-button" title="Delete Assignment">
									<span class="material-symbols-outlined">delete</span>
								</button>
							</div>
						</div>
						<div class="scheduleassign-assignment-details">
							<div class="scheduleassign-detail-item">
								<span class="material-symbols-outlined scheduleassign-detail-icon">person</span>
								<span class="scheduleassign-detail-text">{assignment.teacher}</span>
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
						<div class="scheduleassign-empty-state">
								<p class="scheduleassign-empty-text">There are no schedule assignments for the selected section and filters.</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>