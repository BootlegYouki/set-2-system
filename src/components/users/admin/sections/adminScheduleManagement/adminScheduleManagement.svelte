<script>
	import './adminScheduleManagement.css';
	import { toastStore } from '../../../../common/js/toastStore.js';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { onMount } from 'svelte';

	// Schedule assignment state
	let isAssigning = false;
	let selectedFormYear = '';
	let selectedFormSection = '';
	let selectedFormDay = 'monday'; // Auto-select Monday by default
	let selectedFormSubject = '';



	// Form dropdown states
	let isFormYearDropdownOpen = false;
	let isFormSectionDropdownOpen = false;
	let isFormDayDropdownOpen = false;
	let isScheduleTypeDropdownOpen = false;
	let isFormSubjectDropdownOpen = false;


	// Search states for dropdowns
	let sectionSearchTerm = '';
	let subjectSearchTerm = '';
	let teacherSearchTerm = '';



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

	// Dynamic sections loaded from API
	let sections = [];

	// Load sections from API
	async function loadSections() {
		try {
			const response = await fetch('/api/sections?action=available-sections');
			const result = await response.json();
			
			if (result.success) {
				sections = result.data.map(section => ({
					id: section.id,
					name: section.name,
					grade: `Grade ${section.grade_level}`,
					year: `grade-${section.grade_level}`,
					grade_level: section.grade_level,
					school_year: section.school_year,
					status: section.status
				}));
			}
		} catch (error) {
			console.error('Error loading sections:', error);
		}
	}
	// Dynamic teachers loaded from API
	let teachers = [];
	let allTeachers = []; // Store all teachers for filtering

	// Load teachers from API
	async function loadTeachers() {
		try {
			const response = await fetch('/api/departments?action=teachers');
			const result = await response.json();
			
			if (result.success) {
				allTeachers = result.data.map(teacher => ({
					id: teacher.id,
					name: teacher.full_name,
					email: teacher.email,
					departments: teacher.departments || []
				}));
				teachers = [...allTeachers]; // Initially show all teachers
			}
		} catch (error) {
			console.error('Error loading teachers:', error);
		}
	}



	// Dynamic subjects loaded from API
	let subjects = [];
	let allSubjects = []; // Store all subjects for filtering

	// Load subjects from API with optional grade level filtering
	async function loadSubjects(gradeLevel = null) {
		try {
			let url = '/api/subjects';
			if (gradeLevel) {
				// Extract numeric grade level from format like 'grade-7' -> 7
				const numericGrade = gradeLevel.replace('grade-', '');
				url += `?grade_level=${numericGrade}`;
			}
			
			const response = await fetch(url);
			const result = await response.json();
			
			if (result.success) {
				const mappedSubjects = result.data.map(subject => ({
					id: subject.id,
					name: subject.name,
					code: subject.code,
					grade_level: subject.grade_level,
					department_id: subject.department_id,
					department_name: subject.department_name,
					icon: getSubjectIcon(subject.name) // Helper function to get icon
				}));
				
				if (gradeLevel) {
					// If filtering by grade level, update subjects array
					subjects = mappedSubjects;
				} else {
					// If loading all subjects, store in both arrays
					allSubjects = mappedSubjects;
					subjects = [...allSubjects];
				}
			}
		} catch (error) {
			console.error('Error loading subjects:', error);
		}
	}

	// Helper function to get subject icon based on name
	function getSubjectIcon(subjectName) {
		const name = subjectName.toLowerCase();
		if (name.includes('math')) return 'calculate';
		if (name.includes('science')) return 'science';
		if (name.includes('english')) return 'menu_book';
		if (name.includes('filipino')) return 'translate';
		if (name.includes('social')) return 'public';
		if (name.includes('physical') || name.includes('pe')) return 'sports';
		if (name.includes('art')) return 'palette';
		if (name.includes('technology') || name.includes('tle')) return 'engineering';
		return 'book'; // Default icon
	}

	// Activity types for non-subject schedule entries
	let activityTypes = [];

	// Load activity types from API
	async function loadActivityTypes() {
		try {
			const response = await fetch('/api/activity-types');
			const result = await response.json();
			
			if (result.success) {
				activityTypes = result.data.map(activity => ({
					id: activity.id,
					name: activity.name,
					icon: activity.icon || 'event'
				}));
			}
		} catch (error) {
			console.error('Error loading activity types:', error);
		}
	}
	
	// Add Schedule State
	let isAddingSchedule = false;
	let newSchedule = { 
		scheduleType: 'subject', // 'subject' or 'activity'
		startTime: '',
		startAmPm: 'AM',
		endTime: '',
		endAmPm: 'AM',
		calculatedDuration: '',
		calculatedStartTime: '',
		calculatedEndTime: ''
	};
	// Array to store saved schedules for current selection
	let savedSchedules = [];
	let isFormTeacherDropdownOpen = false;
	let selectedFormTeacher = '';
	let isStartPeriodDropdownOpen = false;
	let isEndPeriodDropdownOpen = false;

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

	let scheduleAssignments = [];

	// Filter sections based on selected year
	$: filteredSections = selectedFilterYear ? sections.filter(section => section.year === selectedFilterYear) : [];

	// Filter form sections based on selected form year
	$: filteredFormSections = selectedFormYear ? sections.filter(section => section.year === selectedFormYear) : [];

	// Filtered arrays for search functionality
	$: filteredSectionsWithSearch = filteredFormSections.filter(section => 
		section.name.toLowerCase().includes(sectionSearchTerm.toLowerCase()) ||
		section.grade.toLowerCase().includes(sectionSearchTerm.toLowerCase())
	);

	$: filteredSubjectsWithSearch = (newSchedule.scheduleType === 'subject' ? subjects : activityTypes).filter(item =>
		item.name.toLowerCase().includes(subjectSearchTerm.toLowerCase())
	);

	$: filteredTeachersWithSearch = teachers.filter(teacher =>
		teacher.name.toLowerCase().includes(teacherSearchTerm.toLowerCase())
	);

	// Get selected objects for form display
	$: selectedFormYearObj = years.find(y => y.id === selectedFormYear);
	$: selectedFormSectionObj = sections.find(s => s.id === selectedFormSection);
	$: selectedFormDayObj = days.find(d => d.id === selectedFormDay);
	$: selectedFormSubjectObj = newSchedule.scheduleType === 'subject' 
		? subjects.find(s => s.id === selectedFormSubject)
		: activityTypes.find(a => a.id === selectedFormSubject);

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

	function handleClickOutside(event) {
		if (!event.target.closest('.scheduleassign-custom-dropdown') && !event.target.closest('.admin-mobile-dropdown') && !event.target.closest('.scheduleassign-period-dropdown')) {
			// Filter dropdowns
			isFilterYearDropdownOpen = false;
			isFilterSectionDropdownOpen = false;
			isAdminDayDropdownOpen = false;
			// New form dropdowns
			isFormYearDropdownOpen = false;
			isFormSectionDropdownOpen = false;
			isFormDayDropdownOpen = false;
			isScheduleTypeDropdownOpen = false;
			isFormSubjectDropdownOpen = false;
			isFormTeacherDropdownOpen = false;
			isStartPeriodDropdownOpen = false;
			isEndPeriodDropdownOpen = false;
			// Edit dropdowns
			isEditSubjectDropdownOpen = false;
			isEditTeacherDropdownOpen = false;
		}
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

	function toggleScheduleTypeDropdown() {
		if (!selectedFormDay) return; // Disabled if no day selected
		isScheduleTypeDropdownOpen = !isScheduleTypeDropdownOpen;
	}

	function toggleFormSubjectDropdown() {
		if (!newSchedule.scheduleType) return; // Disabled if no schedule type selected
		isFormSubjectDropdownOpen = !isFormSubjectDropdownOpen;
	}



	// New form selection functions with cascading reset
	function selectFormYear(year) {
		selectedFormYear = year ? year.id : '';
		// Reset all subsequent selections except day (keep Monday selected)
		selectedFormSection = '';
		selectedFormSubject = '';
		
		// Filter subjects based on selected grade level
		if (year && year.id) {
			loadSubjects(year.id);
		} else {
			// If no year selected, show all subjects
			subjects = [...allSubjects];
		}
		
		isFormYearDropdownOpen = false;
	}

	function selectFormSection(section) {
		selectedFormSection = section ? section.id : '';
		// Reset all subsequent selections except day (keep Monday selected)
		selectedFormSubject = '';
		isFormSectionDropdownOpen = false;
	}

	function selectFormDay(day) {
		selectedFormDay = day ? day.id : '';
		// Reset all subsequent selections
		newSchedule.scheduleType = 'subject'; // Reset to default
		selectedFormSubject = '';
		isFormDayDropdownOpen = false;
	}

	function selectScheduleType(type) {
		newSchedule.scheduleType = type;
		// Reset subsequent selections
		selectedFormSubject = '';
		selectedFormTeacher = '';
		isScheduleTypeDropdownOpen = false;
	}

	function selectFormSubject(subject) {
		selectedFormSubject = subject ? subject.id : '';
		
		// Filter teachers based on selected subject's department
		if (subject && subject.department_id) {
			teachers = allTeachers.filter(teacher => 
				teacher.departments.some(dept => dept.id === subject.department_id)
			);
		} else {
			// If no subject selected or subject has no department, show all teachers
			teachers = [...allTeachers];
		}
		
		// Reset teacher selection since the list has changed
		selectedFormTeacher = '';
		
		// Reset subsequent selections
		isFormSubjectDropdownOpen = false;
	}

	// Handle form submission for new card-based approach
	async function handleAssignSchedule() {
		if (!selectedFormYear || !selectedFormSection || !selectedFormDay || !selectedFormSubject) {
			toastStore.warning('Please select year level, section, day, and subject');
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
				timeSlot: 'TBD' // Will be set based on manual time input
			};

			// Add to assignments array
			scheduleAssignments = [...scheduleAssignments, newAssignment];

			// Show success toast
			toastStore.success(`Schedule assigned successfully for ${selectedFormSectionObj.grade} ${selectedFormSectionObj.name}`);

			// Reset only subject selection to allow adding more subjects
			selectedFormSubject = '';
			
			// Close any open dropdowns
			isFormSubjectDropdownOpen = false;

		} catch (error) {
			console.error('Error assigning schedule:', error);
			toastStore.error('Failed to assign schedule. Please try again.');
		} finally {
			isAssigning = false;
		}
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
	async function handleAddSchedule() {
		// Validate required fields based on schedule type
		if (newSchedule.scheduleType === 'subject') {
			if (!selectedFormSubject || !selectedFormTeacher) {
				toastStore.warning('Please select both subject and teacher');
				return;
			}
		} else if (newSchedule.scheduleType === 'activity') {
			if (!selectedFormSubject) {
				toastStore.warning('Please select an activity');
				return;
			}
		} else {
			toastStore.warning('Please select a schedule type');
			return;
		}

		// Check if all time inputs are provided
		if (!newSchedule.startTime || !newSchedule.endTime) {
			toastStore.warning('Please enter both start time and end time');
			return;
		}

		// Validate time format (HH:MM)
		const timePattern = /^(0?[1-9]|1[0-2]):[0-5][0-9]$/;
		if (!timePattern.test(newSchedule.startTime) || !timePattern.test(newSchedule.endTime)) {
			toastStore.warning('Please enter time in HH:MM format (e.g., 9:30, 12:15)');
			return;
		}
		
		// Force recalculation before checking
		calculateDuration();

		// Check if time calculation was successful and duration is positive
		if (!newSchedule.calculatedStartTime || !newSchedule.calculatedEndTime || !newSchedule.calculatedDuration || parseInt(newSchedule.calculatedDuration) <= 0) {
			toastStore.error('Invalid time range. End time must be after start time.');
			return;
		}

		// Check for schedule conflicts
		const hasConflict = checkScheduleConflict(newSchedule.calculatedStartTime, newSchedule.calculatedEndTime);
		if (hasConflict) {
			toastStore.error('Schedule conflict detected! There is already a schedule during this time period.');
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
					teacher: newSchedule.scheduleType === 'subject' ? selectedFormTeacherObj.name : 'N/A',
					subject: selectedFormSubjectObj.name,
					day: selectedFormDayObj.name,
					timeSlot: `${newSchedule.calculatedStartTime} - ${newSchedule.calculatedEndTime}`
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
					teacher: newSchedule.scheduleType === 'subject' ? selectedFormTeacherObj?.name : 'N/A'
				};
				savedSchedules = [...savedSchedules, savedSchedule];

			// Show success toast
			toastStore.success(`Schedule assigned successfully for ${selectedFormSectionObj.grade} ${selectedFormSectionObj.name}`);

			// Reset form
			newSchedule = { 
				scheduleType: 'subject', // Reset to default
				startHour: '',
				startMinute: '',
				startAmPm: 'AM',
				endHour: '',
				endMinute: '',
				endAmPm: 'AM',
				calculatedDuration: '',
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
			scheduleType: 'subject', // Reset to default
			startHour: '',
			startMinute: '',
			startAmPm: 'AM',
			endHour: '',
			endMinute: '',
			endAmPm: 'AM',
			calculatedDuration: '',
			calculatedStartTime: '',
			calculatedEndTime: ''
		};
		selectedFormSubject = '';
		selectedFormTeacher = '';
		isAddingSchedule = false;
		isFormSubjectDropdownOpen = false;
		isFormTeacherDropdownOpen = false;
		isScheduleTypeDropdownOpen = false; // Reset schedule type dropdown state
		isStartPeriodDropdownOpen = false;
		isEndPeriodDropdownOpen = false;
	}

	// Period dropdown functions
	function toggleStartPeriodDropdown() {
		isStartPeriodDropdownOpen = !isStartPeriodDropdownOpen;
	}

	function selectStartPeriod(period) {
		newSchedule.startAmPm = period;
		isStartPeriodDropdownOpen = false;
		calculateDuration();
	}

	function toggleEndPeriodDropdown() {
		isEndPeriodDropdownOpen = !isEndPeriodDropdownOpen;
	}

	function selectEndPeriod(period) {
		newSchedule.endAmPm = period;
		isEndPeriodDropdownOpen = false;
		calculateDuration();
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

	// Delete assignment function
	function handleDeleteAssignment(assignment) {
		modalStore.confirm(
			'Delete Assignment',
			`<p>Are you sure you want to delete this schedule assignment?</p>`,
			() => {
				// Remove assignment from the array
				scheduleAssignments = scheduleAssignments.filter(a => a.id !== assignment.id);
				
				// Show success message
				toastStore.success(`Assignment for ${assignment.subject} has been deleted successfully`);
				
				// Close edit form if it was open for this assignment
				if (editingAssignmentId === assignment.id) {
					editingAssignmentId = null;
					editAssignmentTime = '';
					editAssignmentSubject = '';
					editSelectedTeacher = null;
					isEditSubjectDropdownOpen = false;
					isEditTeacherDropdownOpen = false;
				}
			},
			() => {
				// Cancel callback (optional)
				console.log('Delete cancelled');
			}
		);
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

	// Schedule conflict checker function
	function checkScheduleConflict(startTime, endTime) {
		// Convert time strings to minutes for easier comparison
		function timeToMinutes(timeStr) {
			const [time, ampm] = timeStr.split(' ');
			const [hours, minutes] = time.split(':').map(Number);
			let totalMinutes = minutes;
			
			if (ampm === 'PM' && hours !== 12) {
				totalMinutes += (hours + 12) * 60;
			} else if (ampm === 'AM' && hours === 12) {
				totalMinutes += 0 * 60;
			} else {
				totalMinutes += hours * 60;
			}
			
			return totalMinutes;
		}

		const newStartMinutes = timeToMinutes(startTime);
		const newEndMinutes = timeToMinutes(endTime);

		// Check against existing saved schedules for the current selection
		for (const schedule of savedSchedules) {
			const existingStartMinutes = timeToMinutes(schedule.startTime);
			const existingEndMinutes = timeToMinutes(schedule.endTime);

			// Check for overlap: new schedule starts before existing ends AND new schedule ends after existing starts
			if (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) {
				return true; // Conflict found
			}
		}

		return false; // No conflict
	}

	// Time calculation function
	function calculateDuration() {
		// Reset calculated values first
		newSchedule.calculatedStartTime = '';
		newSchedule.calculatedEndTime = '';
		newSchedule.calculatedDuration = '';

		// Check if all required inputs are provided
		const startTimeInput = newSchedule.startTime;
		const endTimeInput = newSchedule.endTime;

		// Check for empty/null/undefined values
		if (!startTimeInput || !endTimeInput) {
			return;
		}

		// Parse HH:MM format
		const startTimeParts = startTimeInput.split(':');
		const endTimeParts = endTimeInput.split(':');

		// Validate format
		if (startTimeParts.length !== 2 || endTimeParts.length !== 2) {
			return;
		}

		// Parse inputs to numbers
		const startHour = parseInt(startTimeParts[0]);
		const startMinute = parseInt(startTimeParts[1]);
		const endHour = parseInt(endTimeParts[0]);
		const endMinute = parseInt(endTimeParts[1]);

		// Validate parsed numbers and ranges
		if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
			return;
		}

		if (startHour < 1 || startHour > 12 || startMinute < 0 || startMinute > 59 ||
			endHour < 1 || endHour > 12 || endMinute < 0 || endMinute > 59) {
			return;
		}

		// Convert to 24-hour format
		let startHour24 = startHour;
		if (newSchedule.startAmPm === 'PM' && startHour !== 12) {
			startHour24 += 12;
		} else if (newSchedule.startAmPm === 'AM' && startHour === 12) {
			startHour24 = 0;
		}

		let endHour24 = endHour;
		if (newSchedule.endAmPm === 'PM' && endHour !== 12) {
			endHour24 += 12;
		} else if (newSchedule.endAmPm === 'AM' && endHour === 12) {
			endHour24 = 0;
		}

		// Create start and end time objects
		const startTime = new Date();
		startTime.setHours(startHour24, startMinute, 0, 0);

		const endTime = new Date();
		endTime.setHours(endHour24, endMinute, 0, 0);

		// Validate that end time is after start time (same day scheduling)
		if (endTime <= startTime) {
			// Reset calculated values to indicate invalid time range
			newSchedule.calculatedStartTime = '';
			newSchedule.calculatedEndTime = '';
			newSchedule.calculatedDuration = '';
			return;
		}

		// Calculate duration in minutes
		const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

		// Only proceed if duration is positive
		if (durationMinutes > 0) {
			// Format times for display
			newSchedule.calculatedStartTime = formatTime(startTime);
			newSchedule.calculatedEndTime = formatTime(endTime);
			newSchedule.calculatedDuration = durationMinutes.toString();
		}
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
	$: if (newSchedule.startTime || newSchedule.startAmPm || 
		   newSchedule.endTime || newSchedule.endAmPm) {
		calculateDuration();
	}

	// Load data on component mount
	onMount(() => {
		loadActivityTypes();
		loadSections();
		loadTeachers();
		loadSubjects();
	});
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
			<h1 class="scheduleassign-page-title">Schedule Management</h1>
			<p class="scheduleassign-page-subtitle">Assign subjects and teachers to sections with specific time slots</p>
		</div>
	</div>



	<!-- Schedule Assignment Form -->
	<div class="scheduleassign-form-section">
		<div class="scheduleassign-section-header">
			<h2 class="admin-section-title">Add Schedule Assignment</h2>
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
								<!-- Search Container -->
								<div class="scheduleassign-search-container">
									<input 
										type="text" 
										class="scheduleassign-search-input"
										placeholder="Search sections..."
										bind:value={sectionSearchTerm}
									/>
									<span class="material-icons scheduleassign-search-icon">search</span>
								</div>
								{#if filteredSectionsWithSearch.length > 0}
									{#each filteredSectionsWithSearch as section (section.id)}
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
								{:else}
									<div class="scheduleassign-empty-state">
										<span class="material-symbols-outlined empty-icon">inbox</span>
										<span class="empty-text">No sections available</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Day Selection Grid -->
				<div class="scheduleassign-day-selection">
					<span class="scheduleassign-form-label">Select Day *</span>
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
			</div>

				<!-- Add Schedule Section -->
				{#if selectedFormDay}
					<div class="scheduleassign-add-section">
						<div class="scheduleassign-section-header-day">
					<h3 class="admin-section-title" style="opacity: {selectedFormSectionObj ? 1 : 0};">
						Schedule for {selectedFormSectionObj ? `${selectedFormSectionObj.grade} ${selectedFormSectionObj.name}` : 'Selected Section'} - {selectedFormDayObj.name}
					</h3>
					<div class="scheduleassign-import-export-actions">
						<button 
							type="button" 
							class="scheduleassign-import-button"
							on:click={importSchedules}
							title="Import schedules from file"
							disabled={!selectedFormSectionObj}
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
							disabled={!selectedFormSectionObj && !isAddingSchedule}
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
									<!-- Start Time Input -->
									<div class="scheduleassign-input-group">
										<label class="scheduleassign-form-label" for="start-time">Start Time *</label>
										<input 
											type="text" 
											id="start-time"
											class="scheduleassign-time-input"
											bind:value={newSchedule.startTime}
											placeholder="HH:MM"
											pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]$"
											on:input={calculateDuration}
											required
										/>
									</div>
									
									<!-- Start AM/PM Dropdown -->
									<div class="scheduleassign-input-group">
										<label class="scheduleassign-form-label" for="start-am-pm">Period *</label>
										<div class="scheduleassign-period-dropdown" class:open={isStartPeriodDropdownOpen}>
											<button 
												type="button"
												id="start-am-pm"
												class="scheduleassign-period-dropdown-button" 
												class:selected={newSchedule.startAmPm}
												on:click={toggleStartPeriodDropdown}
											>
												<div class="scheduleassign-period-selected-option">
													<span class="material-symbols-outlined option-icon">schedule</span>
													<span class="option-name">{newSchedule.startAmPm}</span>
												</div>
												<span class="material-symbols-outlined scheduleassign-period-dropdown-arrow">expand_more</span>
											</button>
											<div class="scheduleassign-period-dropdown-menu">
												<button 
													type="button"
													class="scheduleassign-period-dropdown-item" 
													class:selected={newSchedule.startAmPm === 'AM'}
													on:click={() => selectStartPeriod('AM')}
												>
													<span class="material-symbols-outlined option-icon">wb_sunny</span>
													<span class="option-name">AM</span>
												</button>
												<button 
													type="button"
													class="scheduleassign-period-dropdown-item" 
													class:selected={newSchedule.startAmPm === 'PM'}
													on:click={() => selectStartPeriod('PM')}
												>
													<span class="material-symbols-outlined option-icon">nightlight</span>
													<span class="option-name">PM</span>
												</button>
											</div>
										</div>
									</div>
									
									<!-- End Time Input -->
									<div class="scheduleassign-input-group">
										<label class="scheduleassign-form-label" for="end-time">End Time *</label>
										<input 
											type="text" 
											id="end-time"
											class="scheduleassign-time-input"
											bind:value={newSchedule.endTime}
											placeholder="HH:MM"
											pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]$"
											on:input={calculateDuration}
											required
										/>
									</div>
									
									<!-- End AM/PM Dropdown -->
									<div class="scheduleassign-input-group">
										<label class="scheduleassign-form-label" for="end-am-pm">Period *</label>
										<div class="scheduleassign-period-dropdown" class:open={isEndPeriodDropdownOpen}>
											<button 
												type="button"
												id="end-am-pm"
												class="scheduleassign-period-dropdown-button" 
												class:selected={newSchedule.endAmPm}
												on:click={toggleEndPeriodDropdown}
											>
												<div class="scheduleassign-period-selected-option">
													<span class="material-symbols-outlined option-icon">schedule</span>
													<span class="option-name">{newSchedule.endAmPm}</span>
												</div>
												<span class="material-symbols-outlined scheduleassign-period-dropdown-arrow">expand_more</span>
											</button>
											<div class="scheduleassign-period-dropdown-menu">
												<button 
													type="button"
													class="scheduleassign-period-dropdown-item" 
													class:selected={newSchedule.endAmPm === 'AM'}
													on:click={() => selectEndPeriod('AM')}
												>
													<span class="material-symbols-outlined option-icon">wb_sunny</span>
													<span class="option-name">AM</span>
												</button>
												<button 
													type="button"
													class="scheduleassign-period-dropdown-item" 
													class:selected={newSchedule.endAmPm === 'PM'}
													on:click={() => selectEndPeriod('PM')}
												>
													<span class="material-symbols-outlined option-icon">nightlight</span>
													<span class="option-name">PM</span>
												</button>
											</div>
										</div>
									</div>
								</div>
								
								<!-- Calculated Duration Display -->
								{#if newSchedule.calculatedDuration && newSchedule.calculatedStartTime && newSchedule.calculatedEndTime}
									<div class="scheduleassign-calculated-time">
										<span class="material-symbols-outlined">schedule</span>
										<span class="time-display">
											{newSchedule.calculatedStartTime} - {newSchedule.calculatedEndTime} ({newSchedule.calculatedDuration} minutes)
										</span>
									</div>
								{:else if newSchedule.startTime && newSchedule.endTime}
									<div class="scheduleassign-calculated-time error">
										<i class="material-icons">error</i>
										<span>Invalid input</span>
									</div>
								{/if}
							</div>
							
							<!-- Schedule Type and Subject/Activity Row -->
							<div class="scheduleassign-subject-teacher-row">
								<!-- Schedule Type Selection -->
								<div class="scheduleassign-input-group">
									<label class="scheduleassign-form-label" for="schedule-type-selection">Schedule Type *</label>
									<div class="scheduleassign-custom-dropdown" class:open={isScheduleTypeDropdownOpen}>
										<button 
											type="button"
											id="schedule-type-selection"
											class="scheduleassign-dropdown-button" 
											class:selected={newSchedule.scheduleType}
											on:click={toggleScheduleTypeDropdown}
										>
											<div class="scheduleassign-selected-option">
												<span class="material-symbols-outlined option-icon">
													{newSchedule.scheduleType === 'subject' ? 'school' : 'event'}
												</span>
												<div class="option-content">
													<span class="option-name">
														{newSchedule.scheduleType === 'subject' ? 'Subject' : 'Activity'}
													</span>
												</div>
											</div>
											<span class="material-symbols-outlined scheduleassign-dropdown-arrow">expand_more</span>
										</button>
										<div class="scheduleassign-dropdown-menu">
											<button 
												type="button"
												class="scheduleassign-dropdown-item" 
												class:selected={newSchedule.scheduleType === 'subject'}
												on:click={() => selectScheduleType('subject')}
											>
												<span class="material-symbols-outlined option-icon">school</span>
												<div class="option-content">
													<span class="option-name">Subject</span>
													<span class="option-description">Academic subjects like Math, Science, etc.</span>
												</div>
											</button>
											<button 
												type="button"
												class="scheduleassign-dropdown-item" 
												class:selected={newSchedule.scheduleType === 'activity'}
												on:click={() => selectScheduleType('activity')}
											>
												<span class="material-symbols-outlined option-icon">event</span>
												<div class="option-content">
													<span class="option-name">Activity</span>
													<span class="option-description">Non-academic activities like lunch, break, etc.</span>
												</div>
											</button>
										</div>
									</div>
								</div>
								
								<!-- Subject/Activity Selection -->
								<div class="scheduleassign-input-group">
									<label class="scheduleassign-form-label" for="subject-selection">
										{newSchedule.scheduleType === 'subject' ? 'Subject' : 'Activity'} *
									</label>
									<div class="scheduleassign-custom-dropdown" class:open={isFormSubjectDropdownOpen}>
										<button 
											type="button"
											id="subject-selection"
											class="scheduleassign-dropdown-button" 
											class:selected={selectedFormSubject}
											class:disabled={!newSchedule.scheduleType}
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
												<span class="placeholder">
													Select {newSchedule.scheduleType === 'subject' ? 'subject' : 'activity'}
												</span>
											{/if}
											<span class="material-symbols-outlined scheduleassign-dropdown-arrow">expand_more</span>
										</button>
										<div class="scheduleassign-dropdown-menu">
											<!-- Search Container -->
											<div class="scheduleassign-search-container">
												<input 
													type="text" 
													class="scheduleassign-search-input"
													placeholder="Search {newSchedule.scheduleType === 'subject' ? 'subjects' : 'activities'}..."
													bind:value={subjectSearchTerm}
												/>
												<span class="material-icons scheduleassign-search-icon">search</span>
											</div>
											{#if newSchedule.scheduleType === 'subject'}
												{#if filteredSubjectsWithSearch.length > 0}
													{#each filteredSubjectsWithSearch as subject (subject.id)}
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
												{:else}
													<div class="scheduleassign-empty-state">
														<span class="material-symbols-outlined empty-icon">school</span>
														<span class="empty-text">No subjects available</span>
													</div>
												{/if}
											{:else if newSchedule.scheduleType === 'activity'}
												{#if filteredSubjectsWithSearch.length > 0}
													{#each filteredSubjectsWithSearch as activity (activity.id)}
														<button 
															type="button"
															class="scheduleassign-dropdown-item" 
															class:selected={selectedFormSubject === activity.id}
															on:click={() => selectFormSubject(activity)}
														>
															<span class="material-symbols-outlined option-icon">{activity.icon}</span>
															<div class="option-content">
																<span class="option-name">{activity.name}</span>
															</div>
														</button>
													{/each}
												{:else}
													<div class="scheduleassign-empty-state">
														<span class="material-symbols-outlined empty-icon">event</span>
														<span class="empty-text">No activities available</span>
													</div>
												{/if}
											{/if}
										</div>
									</div>
								</div>
							</div>
							
							<!-- Teacher Selection Row (only for subjects) -->
							<div class="scheduleassign-input-group" style="opacity: {newSchedule.scheduleType === 'subject' ? '1' : '0'}; pointer-events: {newSchedule.scheduleType === 'subject' ? 'auto' : 'none'};">
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
											<!-- Search Container -->
											<div class="scheduleassign-search-container">
												<input 
													type="text" 
													class="scheduleassign-search-input"
													placeholder="Search teachers..."
													bind:value={teacherSearchTerm}
												/>
												<span class="material-icons scheduleassign-search-icon">search</span>
											</div>
											{#if filteredTeachersWithSearch.length > 0}
												{#each filteredTeachersWithSearch as teacher (teacher.id)}
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
											{:else}
												<div class="scheduleassign-empty-state">
													<span class="material-symbols-outlined empty-icon">person_off</span>
													<span class="empty-text">No teachers available</span>
												</div>
											{/if}
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
								disabled={isAssigning || !selectedFormSectionObj}
							>
								{#if isAssigning}
									Adding...
								{:else}
									<span class="material-symbols-outlined">save</span>
									Add Schedule
								{/if}
							</button>
						</div>
					</div>
				{/if}
		</form>
	</div>
</div>