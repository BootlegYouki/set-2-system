<script>
	import './adminScheduleManagement.css';
	import { toastStore } from '../../../../common/js/toastStore.js';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { api } from '../../../../../routes/api/helper/api-helper.js';
	import { authStore } from '../../../../login/js/auth.js';
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
	
	// Loading states
	let isLoadingSections = false;
	
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
		isLoadingSections = true;
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
		} finally {
			isLoadingSections = false;
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
					// If filtering by grade level, update subjects array only
					subjects = mappedSubjects;
				} else {
					// If loading all subjects (initial load), store in both arrays
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

	const days = [
		{ id: 'monday', name: 'Monday' },
		{ id: 'tuesday', name: 'Tuesday' },
		{ id: 'wednesday', name: 'Wednesday' },
		{ id: 'thursday', name: 'Thursday' },
		{ id: 'friday', name: 'Friday' }
	];

	let scheduleAssignments = [];
	
	// Export schedule storage - stores the current day's schedule for export
	let exportSchedule = [];

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

	// Function to convert time string to minutes for comparison
	function timeToMinutes(timeString) {
		if (!timeString) return 0;
		
		const [time, period] = timeString.split(' ');
		const [hours, minutes] = time.split(':').map(Number);
		
		let totalMinutes = minutes;
		if (period === 'PM' && hours !== 12) {
			totalMinutes += (hours + 12) * 60;
		} else if (period === 'AM' && hours === 12) {
			totalMinutes += 0; // 12 AM is 0 hours
		} else {
			totalMinutes += hours * 60;
		}
		
		return totalMinutes;
	}

	// Get current day assignments for the add schedule form, sorted by start time
	$: currentDayAssignments = scheduleAssignments.filter(assignment => {
		if (!selectedFormYear || !selectedFormSection || !selectedFormDay) return false;
		
		const yearMatch = assignment.year === selectedFormYear;
		const sectionMatch = assignment.section === selectedFormSectionObj?.name;
		const dayMatch = assignment.day === selectedFormDayObj?.name;
		
		return yearMatch && sectionMatch && dayMatch;
	}).sort((a, b) => {
		// Sort by start time in ascending order
		const aStartTime = timeToMinutes(a.startTime);
		const bStartTime = timeToMinutes(b.startTime);
		return aStartTime - bStartTime;
	});

	// Update export schedule when day selection changes
	$: exportSchedule = filteredAssignments.length > 0 ? [...filteredAssignments] : [];

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
		selectedFormTeacher = '';
		
		// Filter subjects based on selected grade level
		if (year && year.id) {
			// Extract numeric grade level from format like 'grade-7' -> 7
			const numericGrade = parseInt(year.id.replace('grade-', ''));
			
			// Filter subjects to only show those matching the selected grade level
			if (allSubjects.length > 0) {
				subjects = allSubjects.filter(subject => subject.grade_level === numericGrade);
			} else {
				// If allSubjects is empty, load subjects with grade level filter
				loadSubjects(year.id);
			}
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
				day: selectedFormDayObj.name
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
			
			// Check for specific error types and show appropriate toast messages
			const errorMessage = error.message || 'Unknown error';
			
			if (errorMessage.toLowerCase().includes('time conflict') || 
				errorMessage.toLowerCase().includes('conflict') ||
				errorMessage.toLowerCase().includes('overlapping') ||
				errorMessage.toLowerCase().includes('already exists')) {
				toastStore.error('Time conflict detected with existing schedule. Please choose a different time slot.');
			} else if (errorMessage.toLowerCase().includes('invalid time') ||
					   errorMessage.toLowerCase().includes('time format')) {
				toastStore.error('Invalid time format. Please check your time inputs.');
			} else if (errorMessage.toLowerCase().includes('section') ||
					   errorMessage.toLowerCase().includes('not found')) {
				toastStore.error('Selected section or resource not found. Please refresh and try again.');
			} else if (errorMessage.toLowerCase().includes('permission') ||
					   errorMessage.toLowerCase().includes('unauthorized')) {
				toastStore.error('You do not have permission to create schedules.');
			} else {
				toastStore.error(`Failed to assign schedule: ${errorMessage}`);
			}
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

		// Check for duplicate subject/activity on the same day
		const hasDuplicate = checkDuplicateSubjectActivity();
		if (hasDuplicate) {
			return; // Error toast is already shown in the function
		}

		isAssigning = true;

		try {
			// Prepare API request data
			const scheduleData = {
				sectionId: parseInt(selectedFormSection),
				dayOfWeek: selectedFormDayObj.name.toLowerCase(),
				startTime: newSchedule.calculatedStartTime,
				endTime: newSchedule.calculatedEndTime,
				scheduleType: newSchedule.scheduleType,
				subjectId: newSchedule.scheduleType === 'subject' ? parseInt(selectedFormSubject) : null,
				activityTypeId: newSchedule.scheduleType === 'activity' ? parseInt(selectedFormSubject) : null,
				teacherId: newSchedule.scheduleType === 'subject' && selectedFormTeacher ? parseInt(selectedFormTeacher) : null,
				schoolYear: selectedFormSectionObj.school_year || '2024-2025'
			};

			// Make API call to create schedule
			const response = await fetch('/api/schedules', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-user-id': $authStore.userData?.id?.toString() || '',
					'x-user-account-number': $authStore.userData?.accountNumber || '',
					'x-user-name': encodeURIComponent($authStore.userData?.name || '')
				},
				body: JSON.stringify(scheduleData)
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Failed to create schedule');
			}

			// Create new assignment for local display
			const newAssignment = {
				id: result.data.id,
				year: selectedFormYear,
				grade: selectedFormSectionObj.grade,
				section: selectedFormSectionObj.name,
				teacher: newSchedule.scheduleType === 'subject' ? selectedFormTeacherObj?.name : 'N/A',
				subject: selectedFormSubjectObj.name,
				day: selectedFormDayObj.name,
				startTime: newSchedule.calculatedStartTime,
				endTime: newSchedule.calculatedEndTime
			};

			// Add to assignments array
			scheduleAssignments = [...scheduleAssignments, newAssignment];

			// Add to saved schedules for current selection
			const savedSchedule = {
				id: result.data.id,
				startTime: newSchedule.calculatedStartTime,
				endTime: newSchedule.calculatedEndTime,
				subject: selectedFormSubjectObj.name,
				subjectIcon: selectedFormSubjectObj.icon,
				teacher: newSchedule.scheduleType === 'subject' ? selectedFormTeacherObj?.name : 'N/A'
			};
			savedSchedules = [...savedSchedules, savedSchedule];

			// Show success toast
			toastStore.success(`Schedule created successfully for ${selectedFormSectionObj.grade} ${selectedFormSectionObj.name}`);

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
			
			// Check for specific error types and show appropriate toast messages
			const errorMessage = error.message || 'Unknown error';
			
			if (errorMessage.toLowerCase().includes('time conflict') || 
				errorMessage.toLowerCase().includes('conflict') ||
				errorMessage.toLowerCase().includes('overlapping') ||
				errorMessage.toLowerCase().includes('already exists')) {
				toastStore.error('Time conflict detected with existing schedule. Please choose a different time slot.');
			} else if (errorMessage.toLowerCase().includes('invalid time') ||
					   errorMessage.toLowerCase().includes('time format')) {
				toastStore.error('Invalid time format. Please check your time inputs.');
			} else if (errorMessage.toLowerCase().includes('section') ||
					   errorMessage.toLowerCase().includes('not found')) {
				toastStore.error('Selected section or resource not found. Please refresh and try again.');
			} else if (errorMessage.toLowerCase().includes('permission') ||
					   errorMessage.toLowerCase().includes('unauthorized')) {
				toastStore.error('You do not have permission to create schedules.');
			} else {
				toastStore.error(`Failed to assign schedule: ${errorMessage}`);
			}
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
		if (scheduleAssignments.length === 0) return;
		
		const exportData = {
			version: '1.0',
			exportDate: new Date().toISOString(),
			grade: selectedFormSectionObj?.grade || 'All Grades',
			section: selectedFormSectionObj?.name || 'All Sections',
			day: selectedFormDayObj?.name || 'All Days',
			schedules: scheduleAssignments
		};
		
		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		
		const link = document.createElement('a');
		link.href = url;
		link.download = `schedule_${exportData.grade.replace(' ', '')}_${exportData.section}_${exportData.day}_${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		
		URL.revokeObjectURL(url);
		
		// Show success toast
		toastStore.success(`Successfully exported ${scheduleAssignments.length} schedule(s)`);
	}

	// Export current day's schedule
	function exportCurrentDaySchedule() {
		if (exportSchedule.length === 0) {
			toastStore.error('No schedule data available for export. Please select a year, section, and day.');
			return;
		}
		
		const exportData = {
			version: '1.0',
			exportDate: new Date().toISOString(),
			grade: selectedFilterYearObj?.name || 'Unknown Grade',
			section: selectedFilterSectionObj?.name || 'Unknown Section',
			day: dayNameMap[selectedAdminDay] || 'Unknown Day',
			schedules: exportSchedule
		};
		
		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		
		const link = document.createElement('a');
		link.href = url;
		const fileName = `current_schedule_${exportData.grade.replace(' ', '')}_${exportData.section}_${exportData.day}_${new Date().toISOString().split('T')[0]}.json`;
		link.download = fileName;
		link.click();
		
		URL.revokeObjectURL(url);
		
		// Show success toast
		toastStore.success(`Successfully exported ${exportSchedule.length} schedule(s) for ${exportData.day}`);
	}

	function importSchedules() {
		fileInput.click();
	}

	async function handleFileImport(event) {
		const file = event.target.files[0];
		if (!file) return;
		
		const reader = new FileReader();
		reader.onload = async (e) => {
			try {
				const importData = JSON.parse(e.target.result);
				
				// Validate import data structure
				if (!importData.schedules || !Array.isArray(importData.schedules)) {
					toastStore.error('Invalid file format. Please select a valid schedule export file.');
					return;
				}
				
				// Validate each schedule has required fields
				const validSchedules = importData.schedules.filter(schedule => 
					schedule.subject && schedule.teacher && 
					schedule.startTime && schedule.endTime
				);
				
				if (validSchedules.length === 0) {
					toastStore.error('No valid schedules found in the imported file.');
					return;
				}
				
				// Check if section is selected
				if (!selectedFormSectionObj) {
					toastStore.error('Please select a section before importing schedules.');
					return;
				}
				
				// Check if day is selected
				if (!selectedFormDayObj) {
					toastStore.error('Please select a day before importing schedules.');
					return;
				}
				
				let successCount = 0;
				let errorCount = 0;
				
				// Import each schedule to the database
				for (const schedule of validSchedules) {
					try {
						// Prepare schedule data for API
						const scheduleData = {
							sectionId: selectedFormSectionObj.id,
							dayOfWeek: selectedFormDayObj.name.toLowerCase(),
							startTime: schedule.startTime,
							endTime: schedule.endTime,
							scheduleType: schedule.type || 'subject',
							subjectId: schedule.subjectId || null,
							activityTypeId: schedule.activityTypeId || null,
							teacherId: schedule.teacherId || null,
							schoolYear: selectedFormSectionObj.school_year || '2024-2025'
						};
						
						// Make API call to create schedule
						const response = await fetch('/api/schedules', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'x-user-id': $authStore.userData?.id?.toString() || '',
								'x-user-account-number': $authStore.userData?.accountNumber || '',
								'x-user-name': encodeURIComponent($authStore.userData?.name || '')
							},
							body: JSON.stringify(scheduleData)
						});
						
						const result = await response.json();
						
						if (result.success) {
							successCount++;
							
							// Add to local scheduleAssignments array for immediate display
							const newAssignment = {
								id: result.data.id,
								year: `grade-${selectedFormSectionObj.grade_level}`,
								grade: `Grade ${selectedFormSectionObj.grade_level}`,
								section: selectedFormSectionObj.name,
								teacher: schedule.teacher,
								subject: schedule.subject,
								day: selectedFormDayObj.name,
								time: `${schedule.startTime} - ${schedule.endTime}`,
								type: schedule.type || 'subject',
								startTime: schedule.startTime,
								endTime: schedule.endTime,
								subjectId: schedule.subjectId,
								activityTypeId: schedule.activityTypeId,
								teacherId: schedule.teacherId,
								sectionId: selectedFormSectionObj.id,
								schoolYear: selectedFormSectionObj.school_year || '2024-2025'
							};
							
							scheduleAssignments = [...scheduleAssignments, newAssignment];
						} else {
							errorCount++;
							console.error('Failed to import schedule:', result.error);
						}
					} catch (error) {
						errorCount++;
						console.error('Error importing schedule:', error);
					}
				}
				
				// Show result toast
				if (successCount > 0) {
					toastStore.success(`Successfully imported ${successCount} schedule(s)${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
				} else {
					toastStore.error('Failed to import any schedules. Please check the file format.');
				}
				
			} catch (error) {
				toastStore.error('Error reading file. Please make sure it\'s a valid JSON file.');
			}
		};
		reader.readAsText(file);
		
		// Reset file input
		event.target.value = '';
	}

	// Delete assignment function
	async function handleDeleteAssignment(assignment) {
		modalStore.confirm(
			'Delete Assignment',
			`<p>Are you sure you want to delete this schedule assignment?</p>`,
			async () => {
				try {
					// Make API call to delete the schedule
					const result = await api.delete(`/api/schedules?id=${assignment.id}`);

					if (result.success) {
						// Remove assignment from the local array only after successful API call
						scheduleAssignments = scheduleAssignments.filter(a => a.id !== assignment.id);
						
						// Show success message
						toastStore.success(`Assignment for ${assignment.subject} has been deleted successfully`);
					} else {
						// Show error message
						toastStore.error(result.error || 'Failed to delete assignment');
					}
				} catch (error) {
					console.error('Error deleting assignment:', error);
					toastStore.error('Failed to delete assignment. Please try again.');
				}
			},
			() => {
			}
		);
	}



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

	// Check for duplicate subject/activity on the same day
	function checkDuplicateSubjectActivity() {
		if (!selectedFormSubject || !selectedFormSubjectObj) {
			return false;
		}

		// Get the subject/activity name and type
		const newSubjectName = selectedFormSubjectObj.name;
		const newScheduleType = newSchedule.scheduleType;

		// Check against existing schedules for the current day and section
		for (const assignment of currentDayAssignments) {
			// Compare subject/activity names and types
			if (assignment.subject === newSubjectName && assignment.type === newScheduleType) {
				// Show appropriate error message based on schedule type
				if (newScheduleType === 'subject') {
					toastStore.error(`Duplicate subject detected! "${newSubjectName}" is already scheduled for this day. Please choose a different subject.`);
				} else {
					toastStore.error(`Duplicate activity detected! "${newSubjectName}" is already scheduled for this day. Please choose a different activity.`);
				}
				return true; // Duplicate found
			}
		}

		return false; // No duplicate
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

	// Format time string from 24-hour format to 12-hour format with AM/PM
	function formatTimeString(timeString) {
		if (!timeString) return '';
		
		// Handle both HH:MM:SS and HH:MM formats
		const timeParts = timeString.split(':');
		let hours = parseInt(timeParts[0]);
		const minutes = timeParts[1];
		
		const ampm = hours >= 12 ? 'PM' : 'AM';
		hours = hours % 12;
		hours = hours ? hours : 12; // 0 should be 12
		
		// Remove leading zero from minutes if present
		const formattedMinutes = minutes.startsWith('0') && minutes !== '00' ? minutes.substring(1) : minutes;
		
		// Only show minutes if they're not 00
		if (formattedMinutes === '00') {
			return `${hours}:00 ${ampm}`;
		} else {
			return `${hours}:${formattedMinutes} ${ampm}`;
		}
	}

	// Load existing schedules from API
	async function loadSchedules() {
		try {
			const response = await fetch('/api/schedules');
			const result = await response.json();
			
			if (result.success) {
				// Transform API data to match the component's expected format
				scheduleAssignments = result.data.map(schedule => ({
					id: schedule.id,
					year: `grade-${schedule.grade_level}`,
					grade: `Grade ${schedule.grade_level}`,
					section: schedule.section_name,
					day: schedule.day_of_week.charAt(0).toUpperCase() + schedule.day_of_week.slice(1), // Capitalize first letter
					time: `${formatTimeString(schedule.start_time)} - ${formatTimeString(schedule.end_time)}`,
					subject: schedule.subject_name || schedule.activity_type_name,
					teacher: schedule.teacher_name,
					type: schedule.schedule_type,
					startTime: formatTimeString(schedule.start_time),
					endTime: formatTimeString(schedule.end_time),
					subjectId: schedule.subject_id,
					activityTypeId: schedule.activity_type_id,
					teacherId: schedule.teacher_id,
					sectionId: schedule.section_id,
					schoolYear: schedule.school_year,
					roomId: schedule.room_id,
					roomName: schedule.room_name,
					roomBuilding: schedule.room_building,
					roomFloor: schedule.room_floor
				}));
			} else {
				console.error('Failed to load schedules:', result.error);
			}
		} catch (error) {
			console.error('Error loading schedules:', error);
		}
	}

	// Load data on component mount
	onMount(() => {
		loadActivityTypes();
		loadSections();
		loadTeachers();
		loadSubjects();
		loadSchedules(); // Add this to load existing schedules
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
			<p class="scheduleassign-page-subtitle">Assign subjects and teachers to sections with specific time periods</p>
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
								{#if isLoadingSections}
									<div class="admin-section-loading">
										<span class="section-loader"></span>
										<span>Loading sections...</span>
									</div>
								{:else if filteredSectionsWithSearch.length > 0}
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
							disabled={!selectedFormSectionObj || scheduleAssignments.length === 0}
						>
							<span class="material-symbols-outlined">upload</span>
							Export
						</button>
					</div>
				</div>
						<!-- Existing Schedules from Database -->
						{#if currentDayAssignments.length > 0}
							<div class="scheduleassign-existing-schedules">
								{#each currentDayAssignments as assignment (assignment.id)}
								<div class="scheduleassign-assignment-card">
									<div class="scheduleassign-assignment-header">
										<div class="scheduleassign-assignment-info">
											<h3 class="scheduleassign-assignment-title">{assignment.subject}</h3>
											<p class="scheduleassign-assignment-subtitle">{assignment.grade} - {assignment.section}</p>
										</div>
										<div class="scheduleassign-assignment-actions">
											<button 
												type="button" 
												class="scheduleassign-delete-button"
												on:click={() => handleDeleteAssignment(assignment)}
												title="Delete assignment"
											>
												<span class="material-symbols-outlined">delete</span>
											</button>
										</div>
									</div>
									<div class="scheduleassign-assignment-details">
										{#if assignment.teacher}
											<div class="scheduleassign-detail-item">
												<span class="material-symbols-outlined scheduleassign-detail-icon">person</span>
												<span class="scheduleassign-detail-text">{assignment.teacher}</span>
											</div>
										{/if}
										{#if assignment.startTime && assignment.endTime}
											<div class="scheduleassign-detail-item">
												<span class="material-symbols-outlined scheduleassign-detail-icon">schedule</span>
												<span class="scheduleassign-detail-text">{assignment.startTime} - {assignment.endTime}</span>
											</div>
										{/if}
										{#if assignment.type === 'subject' && assignment.roomName}
											<div class="scheduleassign-detail-item">
												<span class="material-symbols-outlined scheduleassign-detail-icon">location_on</span>
												<span class="scheduleassign-detail-text">
													{assignment.roomName}
													{#if assignment.roomBuilding || assignment.roomFloor}
														<span class="scheduleassign-room-details">
															({assignment.roomBuilding}{assignment.roomFloor ? `, Floor ${assignment.roomFloor}` : ''})
														</span>
													{/if}
												</span>
											</div>
										{/if}
									</div>
								</div>
								{/each}
							</div>
						{/if}
						
						<a href="#add-schedule-container">
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
						</a>
					</div>
				{/if}
				
				<!-- Add Schedule Form -->
				{#if isAddingSchedule && selectedFormYear && selectedFormSection && selectedFormDay}
					<div class="scheduleassign-add-form" id="add-schedule-container">
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
