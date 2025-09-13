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
	let selectedFilterYearObj = null;
	let selectedFilterSection = '';
	let selectedFilterSectionObj = null;
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

	// Grade levels for Philippines DepEd (Grades 7-10)
	const years = [
		{ id: 'grade-7', name: 'Grade 7', description: 'Junior High School - First Year' },
		{ id: 'grade-8', name: 'Grade 8', description: 'Junior High School - Second Year' },
		{ id: 'grade-9', name: 'Grade 9', description: 'Junior High School - Third Year' },
		{ id: 'grade-10', name: 'Grade 10', description: 'Junior High School - Fourth Year' }
	];

	const sections = [
		{ id: 'grade7-a', name: 'Section A', grade: 'Grade 7', year: 'grade-7' },
		{ id: 'grade7-b', name: 'Section B', grade: 'Grade 7', year: 'grade-7' },
		{ id: 'grade8-a', name: 'Section A', grade: 'Grade 8', year: 'grade-8' },
		{ id: 'grade8-b', name: 'Section B', grade: 'Grade 8', year: 'grade-8' },
		{ id: 'grade9-a', name: 'Section A', grade: 'Grade 9', year: 'grade-9' },
		{ id: 'grade9-b', name: 'Section B', grade: 'Grade 9', year: 'grade-9' },
		{ id: 'grade10-a', name: 'Section A', grade: 'Grade 10', year: 'grade-10' },
		{ id: 'grade10-b', name: 'Section B', grade: 'Grade 10', year: 'grade-10' }
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
	let newSchedule = { 
		startHour: '',
		startMinute: '',
		amPm: 'AM',
		duration: '',
		calculatedStartTime: '',
		calculatedEndTime: ''
	};
	// Array to store saved schedules for current selection
	let savedSchedules = [];
	let isFormTeacherDropdownOpen = false;
	let selectedFormTeacher = '';
	let isPeriodDropdownOpen = false;

	// Edit assignment states
	let editingAssignmentId = null;
	let editAssignmentTime = '';
	let editAssignmentSubject = '';
	let editSelectedTeacher = null;
	let isUpdating = false;

	// Edit dropdown states
	let isEditSubjectDropdownOpen = false;
	let isEditTeacherDropdownOpen = false;

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
			year: 'grade-7',
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
			year: 'grade-7',
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
			year: 'grade-8',
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
			year: 'grade-7',
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
			year: 'grade-9',
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
			year: 'grade-10',
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
		if (!event.target.closest('.scheduleassign-custom-dropdown') && !event.target.closest('.admin-mobile-dropdown') && !event.target.closest('.scheduleassign-period-dropdown')) {
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
			isFormTeacherDropdownOpen = false;
			isPeriodDropdownOpen = false;
			// Edit dropdowns
			isEditSubjectDropdownOpen = false;
			isEditTeacherDropdownOpen = false;
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
		selectedFilterYearObj = year;
		// Reset section selection when year changes
		selectedFilterSection = '';
		selectedFilterSectionObj = null;
		isFilterYearDropdownOpen = false;
	}

	function selectFilterSection(section) {
		selectedFilterSection = section ? (section.grade + ' · ' + section.name) : null;
		selectedFilterSectionObj = section;
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
		// Validate required fields first
		if (!selectedFormSubject || !selectedFormTeacher) {
			toastStore.warning('Please select both subject and teacher');
			return;
		}

		// Convert inputs to numbers for validation
		const hourInput = newSchedule.startHour;
		const minuteInput = newSchedule.startMinute;
		const durationInput = newSchedule.duration;

		// Check if inputs are provided
		if (!hourInput && hourInput !== 0 && hourInput !== '0') {
			toastStore.warning('Please enter the hour (1-12)');
			return;
		}

		if (!minuteInput && minuteInput !== 0 && minuteInput !== '0') {
			toastStore.warning('Please enter the minute (0-59)');
			return;
		}

		if (!durationInput && durationInput !== 0 && durationInput !== '0') {
			toastStore.warning('Please enter the duration in minutes');
			return;
		}

		// Parse and validate ranges
		const hour = parseInt(hourInput);
		const minute = parseInt(minuteInput);
		const duration = parseInt(durationInput);
		
		if (isNaN(hour) || hour < 1 || hour > 12) {
			toastStore.warning('Hour must be between 1 and 12');
			return;
		}
		if (isNaN(minute) || minute < 0 || minute > 59) {
			toastStore.warning('Minute must be between 0 and 59');
			return;
		}
		if (isNaN(duration) || duration <= 0) {
			toastStore.warning('Duration must be greater than 0 minutes');
			return;
		}

		// Force recalculation before checking
		calculateTimeSlot();

		// Check if time calculation was successful after forced recalculation
		if (!newSchedule.calculatedStartTime || !newSchedule.calculatedEndTime) {
			toastStore.error('Time calculation failed. Please check your inputs and try again.');
			console.log('Debug - Time calculation failed:', {
				hour: hourInput,
				minute: minuteInput,
				duration: durationInput,
				amPm: newSchedule.amPm,
				calculatedStart: newSchedule.calculatedStartTime,
				calculatedEnd: newSchedule.calculatedEndTime
			});
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
					timeSlot: `${newSchedule.calculatedStartTime} - ${newSchedule.calculatedEndTime}`,
					period: 'Custom Period'
				};

				// Add to assignments array
				scheduleAssignments = [...scheduleAssignments, newAssignment];

				// Add to saved schedules for current selection
				const savedSchedule = {
					id: Date.now(),
					startTime: newSchedule.calculatedStartTime,
					endTime: newSchedule.calculatedEndTime,
					subject: selectedFormSubjectObj.name,
					subjectIcon: selectedFormSubjectObj.icon,
					teacher: selectedFormTeacherObj.name
				};
				savedSchedules = [...savedSchedules, savedSchedule];

			// Show success toast
			toastStore.success(`Schedule assigned successfully for ${selectedFormSectionObj.grade} ${selectedFormSectionObj.name}`);

			// Reset form
			newSchedule = { 
				startHour: '',
				startMinute: '',
				amPm: 'AM',
				duration: '',
				calculatedStartTime: '',
				calculatedEndTime: ''
			};
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
		newSchedule = { 
			startHour: '',
			startMinute: '',
			amPm: 'AM',
			duration: '',
			calculatedStartTime: '',
			calculatedEndTime: ''
		};
		selectedFormSubject = '';
		selectedFormTeacher = '';
		isAddingSchedule = false;
		isFormSubjectDropdownOpen = false;
		isFormTeacherDropdownOpen = false;
		isPeriodDropdownOpen = false;
	}

	// Period dropdown functions
	function togglePeriodDropdown() {
		isPeriodDropdownOpen = !isPeriodDropdownOpen;
	}

	function selectPeriod(period) {
		newSchedule.amPm = period;
		isPeriodDropdownOpen = false;
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

	// Edit assignment functions
	function toggleEditForm(assignment) {
		if (editingAssignmentId === assignment.id) {
			// Close the form
			editingAssignmentId = null;
			editAssignmentTime = '';
			editAssignmentSubject = '';
			editSelectedTeacher = null;
			isEditSubjectDropdownOpen = false;
			isEditTeacherDropdownOpen = false;
		} else {
			// Open the form
			editingAssignmentId = assignment.id;
			editAssignmentTime = assignment.timeSlot || '';
			editAssignmentSubject = assignment.subject || '';
			editSelectedTeacher = teachers.find(teacher => teacher.name === assignment.teacher) || null;
		}
	}

	async function handleEditAssignment() {
		if (!editAssignmentTime.trim() || !editAssignmentSubject.trim() || !editSelectedTeacher) {
			toastStore.warning('Please fill in all required fields');
			return;
		}

		isUpdating = true;

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Update assignment in the array
			scheduleAssignments = scheduleAssignments.map(assignment => {
				if (assignment.id === editingAssignmentId) {
					return {
						...assignment,
						timeSlot: editAssignmentTime,
						subject: editAssignmentSubject,
						teacher: editSelectedTeacher.name
					};
				}
				return assignment;
			});

			// Show success message
			toastStore.success(`Assignment updated successfully! Time: ${editAssignmentTime}, Subject: ${editAssignmentSubject}, Teacher: ${editSelectedTeacher.name}`);

			// Close edit form
			editingAssignmentId = null;
			editAssignmentTime = '';
			editAssignmentSubject = '';
			editSelectedTeacher = null;
			isEditSubjectDropdownOpen = false;
			isEditTeacherDropdownOpen = false;

		} catch (error) {
			console.error('Error updating assignment:', error);
			toastStore.error('Failed to update assignment. Please try again.');
		} finally {
			isUpdating = false;
		}
	}

	// Edit dropdown functions
	function toggleEditSubjectDropdown() {
		isEditSubjectDropdownOpen = !isEditSubjectDropdownOpen;
		isEditTeacherDropdownOpen = false;
	}

	function selectEditSubject(subject) {
		editAssignmentSubject = subject.name;
		isEditSubjectDropdownOpen = false;
	}

	function toggleEditTeacherDropdown() {
		isEditTeacherDropdownOpen = !isEditTeacherDropdownOpen;
		isEditSubjectDropdownOpen = false;
	}

	function selectEditTeacher(teacher) {
		editSelectedTeacher = teacher;
		isEditTeacherDropdownOpen = false;
	}

	// Computed properties for edit form
	$: editSelectedSubjectObj = subjects.find(subject => subject.name === editAssignmentSubject);

	// Time calculation function
	function calculateTimeSlot() {
		// Reset calculated times first
		newSchedule.calculatedStartTime = '';
		newSchedule.calculatedEndTime = '';

		// Check if all required inputs are provided
		const hourInput = newSchedule.startHour;
		const minuteInput = newSchedule.startMinute;
		const durationInput = newSchedule.duration;

		// Check for empty/null/undefined values (but allow 0)
		if ((hourInput === '' || hourInput === null || hourInput === undefined) ||
			(minuteInput === '' || minuteInput === null || minuteInput === undefined) ||
			(durationInput === '' || durationInput === null || durationInput === undefined)) {
			return;
		}

		// Parse inputs to numbers
		const hour = parseInt(hourInput);
		const minute = parseInt(minuteInput);
		const durationMinutes = parseInt(durationInput);

		// Validate parsed numbers and ranges
		if (isNaN(hour) || isNaN(minute) || isNaN(durationMinutes)) {
			return;
		}

		if (hour < 1 || hour > 12 || minute < 0 || minute > 59 || durationMinutes <= 0) {
			return;
		}

		// Convert to 24-hour format
		let startHour24 = hour;
		if (newSchedule.amPm === 'PM' && hour !== 12) {
			startHour24 += 12;
		} else if (newSchedule.amPm === 'AM' && hour === 12) {
			startHour24 = 0;
		}

		// Create start time
		const startTime = new Date();
		startTime.setHours(startHour24, minute, 0, 0);

		// Calculate end time
		const endTime = new Date(startTime.getTime() + (durationMinutes * 60000));

		// Format times for display
		newSchedule.calculatedStartTime = formatTime(startTime);
		newSchedule.calculatedEndTime = formatTime(endTime);
	}

	function formatTime(date) {
		let hours = date.getHours();
		const minutes = date.getMinutes();
		const ampm = hours >= 12 ? 'PM' : 'AM';
		
		hours = hours % 12;
		hours = hours ? hours : 12; // 0 should be 12
		
		const minutesStr = minutes < 10 ? '0' + minutes : minutes;
		
		return `${hours}:${minutesStr} ${ampm}`;
	}

	// Reactive calculation when inputs change
	$: {
		calculateTimeSlot();
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
			<p class="scheduleassign-form-instruction">Select year level and section, then choose a day to add schedule assignments.</p>
		</div>

		<form on:submit|preventDefault={handleAssignSchedule}>
			<div class="scheduleassign-hierarchical-form">

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
									<span class="option-description">{year.description}</span>
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
									<span class="option-description">{section.grade} Section</span>
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
						<div class="scheduleassign-section-header-day">
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
							<span class="material-symbols-outlined">download</span>
							Import
						</button>
						<button 
							type="button" 
							class="scheduleassign-export-button"
							on:click={exportSchedules}
							title="Export schedules to file"
							disabled={savedSchedules.length === 0}
						>
							<span class="material-symbols-outlined">upload</span>
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
							<!-- Time Configuration Section -->
							<div class="scheduleassign-time-section">
								<div class="scheduleassign-time-row">
									<!-- Hour Input -->
									<div class="scheduleassign-input-group">
										<label class="scheduleassign-form-label" for="start-hour">Hour *</label>
										<input 
											type="number" 
											id="start-hour"
											class="scheduleassign-time-input"
											bind:value={newSchedule.startHour}
											min="1"
											max="12"
											placeholder="12"
											required
										/>
									</div>
									
									<!-- Minute Input -->
									<div class="scheduleassign-input-group">
										<label class="scheduleassign-form-label" for="start-minute">Minute *</label>
										<input 
											type="number" 
											id="start-minute"
											class="scheduleassign-time-input"
											bind:value={newSchedule.startMinute}
											min="0"
											max="59"
											placeholder="00"
											required
										/>
									</div>
									
									<!-- AM/PM Selection -->
									<div class="scheduleassign-input-group">
										<label class="scheduleassign-form-label" for="am-pm">Period *</label>
										<div class="scheduleassign-period-dropdown" class:open={isPeriodDropdownOpen}>
											<button 
												type="button"
												id="am-pm"
												class="scheduleassign-period-dropdown-button" 
												class:selected={newSchedule.amPm}
												on:click={togglePeriodDropdown}
											>
												<div class="scheduleassign-period-selected-option">
													<span class="material-symbols-outlined option-icon">schedule</span>
													<span class="option-name">{newSchedule.amPm}</span>
												</div>
												<span class="material-symbols-outlined scheduleassign-period-dropdown-arrow">expand_more</span>
											</button>
											<div class="scheduleassign-period-dropdown-menu">
												<button 
													type="button"
													class="scheduleassign-period-dropdown-item" 
													class:selected={newSchedule.amPm === 'AM'}
													on:click={() => selectPeriod('AM')}
												>
													<span class="material-symbols-outlined option-icon">wb_sunny</span>
													<span class="option-name">AM</span>
												</button>
												<button 
													type="button"
													class="scheduleassign-period-dropdown-item" 
													class:selected={newSchedule.amPm === 'PM'}
													on:click={() => selectPeriod('PM')}
												>
													<span class="material-symbols-outlined option-icon">nightlight</span>
													<span class="option-name">PM</span>
												</button>
											</div>
										</div>
									</div>
									
									<!-- Duration Input -->
									<div class="scheduleassign-input-group">
										<label class="scheduleassign-form-label" for="duration">Duration (minutes) *</label>
										<input 
											type="number" 
											id="duration"
											class="scheduleassign-time-input"
											bind:value={newSchedule.duration}
											min="15"
											max="480"
											step="15"
											placeholder="60"
											required
										/>
									</div>
								</div>
								
								<!-- Calculated Time Display -->
								{#if newSchedule.calculatedStartTime && newSchedule.calculatedEndTime}
									<div class="scheduleassign-calculated-time">
										<span class="material-symbols-outlined">schedule</span>
										<span class="time-display">
											{newSchedule.calculatedStartTime} - {newSchedule.calculatedEndTime}
										</span>
									</div>
								{/if}
							</div>
							
							<!-- Subject and Teacher Row -->
							<div class="scheduleassign-subject-teacher-row">
								<!-- Subject Selection -->
								<div class="scheduleassign-input-group">
									<label class="scheduleassign-form-label" for="subject-selection">Subject *</label>
									<div class="scheduleassign-custom-dropdown" class:open={isFormSubjectDropdownOpen}>
										<button 
											type="button"
											id="subject-selection"
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
									<label class="scheduleassign-form-label" for="teacher-selection">Teacher *</label>
									<div class="scheduleassign-custom-dropdown" class:open={isFormTeacherDropdownOpen}>
										<button 
											type="button"
											id="teacher-selection"
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
					class:selected={selectedFilterYear}
					on:click={toggleFilterYearDropdown}
				>
					{#if selectedFilterYearObj}
						<div class="scheduleassign-selected-option">
							<span class="material-symbols-outlined option-icon">school</span>
							<div class="option-content">
								<span class="option-name">{selectedFilterYearObj.name}</span>
							</div>
						</div>
					{:else}
						<span class="placeholder">Select year level</span>
					{/if}
					<span class="material-symbols-outlined scheduleassign-dropdown-arrow">expand_more</span>
				</button>
				<div class="scheduleassign-dropdown-menu">
					<button 
						type="button" 
						class="scheduleassign-dropdown-item" 
						on:click={() => selectFilterYear(null)}
					>
						<span class="placeholder">Select year level</span>
					</button>
					{#each years as year (year.id)}
						<button 
							type="button" 
							class="scheduleassign-dropdown-item" 
							class:selected={selectedFilterYear === year.id}
							on:click={() => selectFilterYear(year)}
						>
							<span class="material-symbols-outlined option-icon">school</span>
							<div class="option-content">
								<span class="option-name">{year.name}</span>
								<span class="option-description">{year.description}</span>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Section Filter -->
			<div class="scheduleassign-custom-dropdown" class:open={isFilterSectionDropdownOpen} class:disabled={!isYearSelected}>
				<button 
					type="button" 
					class="scheduleassign-dropdown-button" 
					class:selected={selectedFilterSection}
					class:disabled={!isYearSelected}
					on:click={toggleFilterSectionDropdown}
					disabled={!isYearSelected}
				>
					{#if selectedFilterSectionObj}
						<div class="scheduleassign-selected-option">
							<span class="material-symbols-outlined option-icon">class</span>
							<div class="option-content">
								<span class="option-name">{selectedFilterSectionObj.grade} · {selectedFilterSectionObj.name}</span>
							</div>
						</div>
					{:else}
						<span class="placeholder">{isYearSelected ? 'Select section' : 'Select year level first'}</span>
					{/if}
					<span class="material-symbols-outlined scheduleassign-dropdown-arrow">expand_more</span>
				</button>
				<div class="scheduleassign-dropdown-menu">
					<button 
						type="button" 
						class="scheduleassign-dropdown-item" 
						on:click={() => selectFilterSection(null)}
					>
						<span class="placeholder">Select section</span>
					</button>
					{#each filteredSections as section (section.id)}
						<button 
							type="button" 
							class="scheduleassign-dropdown-item" 
							class:selected={selectedFilterSection === section.id}
							on:click={() => selectFilterSection(section)}
						>
							<span class="material-symbols-outlined option-icon">class</span>
							<div class="option-content">
								<span class="option-name">{section.grade} · {section.name}</span>
								<span class="option-description">{section.grade} Section</span>
							</div>
						</button>
					{/each}
				</div>
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
							</div>
							<div class="scheduleassign-assignment-actions">
								<button 
									type="button" 
									class="scheduleassign-edit-button" 
									on:click={() => toggleEditForm(assignment)}
									title="{editingAssignmentId === assignment.id ? 'Cancel Edit' : 'Edit Assignment'}"
								>
									<span class="material-symbols-outlined">{editingAssignmentId === assignment.id ? 'close' : 'edit'}</span>
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

						<!-- Inline Edit Form -->
						{#if editingAssignmentId === assignment.id}
							<div class="scheduleassign-edit-form-section">
								<div class="scheduleassign-edit-form-container">
									<div class="scheduleassign-edit-form-header">
										<h2 class="scheduleassign-edit-form-title">Edit Assignment</h2>
										<p class="scheduleassign-edit-form-subtitle">Update time, subject, and teacher for this assignment</p>
									</div>
									
									<form class="scheduleassign-edit-form-content" on:submit|preventDefault={handleEditAssignment}>
										<!-- Time, Subject, and Teacher Row -->
										<div class="scheduleassign-edit-form-row">
											<!-- Time Input -->
											<div class="scheduleassign-form-group scheduleassign-form-group-third">
												<label class="scheduleassign-form-label" for="edit-assignment-time">
													Time *
												</label>
												<input 
													type="text" 
													id="edit-assignment-time"
													class="scheduleassign-form-input" 
													bind:value={editAssignmentTime}
													placeholder="e.g., 8:00 AM - 9:00 AM"
													required
												/>
											</div>

											<!-- Subject Selection -->
											<div class="scheduleassign-form-group scheduleassign-form-group-third">
												<label class="scheduleassign-form-label" for="edit-assignment-subject">
													Subject *
												</label>
												<div class="scheduleassign-custom-dropdown" class:open={isEditSubjectDropdownOpen}>
													<button 
														type="button"
														class="scheduleassign-dropdown-button" 
														class:selected={editAssignmentSubject}
														on:click={toggleEditSubjectDropdown}
														id="edit-assignment-subject"
													>
														{#if editSelectedSubjectObj}
															<div class="scheduleassign-selected-option">
																<span class="material-symbols-outlined option-icon">{editSelectedSubjectObj.icon}</span>
																<div class="option-content">
																	<span class="option-name">{editSelectedSubjectObj.name}</span>
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
																class:selected={editAssignmentSubject === subject.name}
																on:click={() => selectEditSubject(subject)}
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
											<div class="scheduleassign-form-group scheduleassign-form-group-third">
												<label class="scheduleassign-form-label" for="edit-assignment-teacher">
													Teacher *
												</label>
												<div class="scheduleassign-custom-dropdown" class:open={isEditTeacherDropdownOpen}>
													<button 
														type="button"
														class="scheduleassign-dropdown-button" 
														class:selected={editSelectedTeacher}
														on:click={toggleEditTeacherDropdown}
														id="edit-assignment-teacher"
													>
														{#if editSelectedTeacher}
															<div class="scheduleassign-selected-option">
																<span class="material-symbols-outlined option-icon">person</span>
																<div class="option-content">
																	<span class="option-name">{editSelectedTeacher.name}</span>
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
																class:selected={editSelectedTeacher?.id === teacher.id}
																on:click={() => selectEditTeacher(teacher)}
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
										<div class="scheduleassign-edit-form-actions">
											<button type="button" class="scheduleassign-cancel-button" on:click={() => toggleEditForm(assignment)}>
												Cancel
											</button>
											<button 
												type="submit" 
												class="scheduleassign-submit-button"
												disabled={isUpdating || !editAssignmentTime.trim() || !editAssignmentSubject.trim() || !editSelectedTeacher}
											>
												{#if isUpdating}
													<span class="material-symbols-outlined scheduleassign-loading-icon">hourglass_empty</span>
													Updating...
												{:else}
													<span class="material-symbols-outlined">save</span>
													Update Assignment
												{/if}
											</button>
										</div>
									</form>
								</div>
							</div>
						{/if}
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