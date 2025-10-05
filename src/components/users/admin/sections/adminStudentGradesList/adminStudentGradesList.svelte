<script>
	import './adminStudentGradesList.css';
	import { onMount } from 'svelte';
	import { toastStore } from '../../../../common/js/toastStore.js';
	import { api } from '../../../../../routes/api/helper/api-helper.js';

	// State variables
	let students = [];
	let filteredStudents = [];
	let sections = [];
	let isLoading = true;
	let searchQuery = '';
	let selectedGradeLevel = '';
	let selectedSection = '';

	// Dropdown states
	let isGradeLevelDropdownOpen = false;
	let isSectionDropdownOpen = false;

	// Grade level options
	const gradeLevelOptions = [
		{ id: '', name: 'All Grade Levels', icon: 'school' },
		{ id: '7', name: 'Grade 7', icon: 'looks_one' },
		{ id: '8', name: 'Grade 8', icon: 'looks_two' },
		{ id: '9', name: 'Grade 9', icon: 'looks_3' },
		{ id: '10', name: 'Grade 10', icon: 'looks_4' },
	];

	// Dynamic section options - will be populated from API
	let sectionOptions = [
		{ id: '', name: 'All Sections' }
	];

	// Computed values
	$: selectedGradeLevelObj = gradeLevelOptions.find(level => level.id === selectedGradeLevel);
	$: selectedSectionObj = sectionOptions.find(section => section.id === selectedSection);

	// Load sections from API
	async function loadSections() {
		try {
			const data = await api.get('/api/sections');
			if (data.success) {
				sections = data.data;
				// Update section options with dynamic data
				sectionOptions = [
					{ id: '', name: 'All Sections' },
					...sections.map(section => ({
						id: section.name,
						name: `Section ${section.name} (Grade ${section.grade_level})`
					}))
				];
			}
		} catch (error) {
			console.error('Error loading sections:', error);
			toastStore.error('Failed to load sections');
		}
	}

	// Calculate GWA from final grades
	function calculateGWA(studentGrades) {
		if (!studentGrades || studentGrades.length === 0) return 0;
		
		const totalGrades = studentGrades.reduce((sum, grade) => sum + (grade.final_grade || 0), 0);
		return totalGrades / studentGrades.length;
	}

	// Load students data with grades
	async function loadStudents() {
		isLoading = true;
		try {
			// Load students with their section information
			const studentsData = await api.get('/api/accounts?type=student');
			if (!studentsData.success) {
				throw new Error('Failed to load students');
			}

			// Get section information for all students
			const studentsWithSections = await Promise.all(
				studentsData.accounts.map(async (account) => {
					try {
						let sectionName = 'No section';
						let hasSection = false;
						let gradeLevel = account.gradeLevel || 'Not specified';
						
						// Get student's section information using the student-profile API
						try {
							const profileData = await api.get(`/api/student-profile?studentId=${account.id}`);
							if (profileData.success && profileData.data && profileData.data.section) {
								// Student has a section assignment
								sectionName = profileData.data.section.name;
								hasSection = true;
								// Use grade level from section if available
								if (profileData.data.section.gradeLevel) {
									gradeLevel = profileData.data.section.gradeLevel.toString();
								}
							}
						} catch (profileError) {
							// Student has no section assignment or profile data
							hasSection = false;
							sectionName = 'No section';
						}

						let gwa = 0;
						if (hasSection) {
							try {
								const gradesData = await api.get(`/api/student-grades/verified?student_id=${account.id}`);
								if (gradesData.success) {
									gwa = calculateGWA(gradesData.grades);
								}
							} catch (e) {
								// Ignore grade calculation errors for students with sections
							}
						}

						return {
							id: account.number || account.id,
							name: account.name,
							gradeLevel: gradeLevel,
							section: sectionName,
							gwa: gwa,
							studentId: account.id,
							hasSection: hasSection
						};
					} catch (error) {
						// Handle any errors in processing individual students
						return {
							id: account.number || account.id,
							name: account.name,
							gradeLevel: account.gradeLevel || 'Not specified',
							section: 'No section',
							gwa: 0,
							studentId: account.id,
							hasSection: false
						};
					}
				})
			);

			// Filter out students without proper grade level information
			students = studentsWithSections.filter(student => 
				student.gradeLevel !== 'Not specified'
			);
			
			filterStudents();
		} catch (error) {
			console.error('Error loading students:', error);
			toastStore.error('Failed to load students. Please try again.');
			students = [];
		} finally {
			isLoading = false;
		}
	}

	// Filter students based on search query, grade level, and section
	function filterStudents() {
		filteredStudents = students.filter(student => {
			const matchesSearch = !searchQuery || 
				student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				student.id.toString().toLowerCase().includes(searchQuery.toLowerCase());
			
			const matchesGradeLevel = !selectedGradeLevel || 
				student.gradeLevel === selectedGradeLevel;
			
			const matchesSection = !selectedSection || 
				student.section === selectedSection;
			
			return matchesSearch && matchesGradeLevel && matchesSection;
		});
	}

	// Dropdown functions
	function toggleGradeLevelDropdown() {
		isGradeLevelDropdownOpen = !isGradeLevelDropdownOpen;
		isSectionDropdownOpen = false;
	}

	function toggleSectionDropdown() {
		isSectionDropdownOpen = !isSectionDropdownOpen;
		isGradeLevelDropdownOpen = false;
	}

	function selectGradeLevel(gradeLevel) {
		selectedGradeLevel = gradeLevel.id;
		isGradeLevelDropdownOpen = false;
		filterStudents();
	}

	function selectSection(section) {
		selectedSection = section.id;
		isSectionDropdownOpen = false;
		filterStudents();
	}

	// Search handler
	function handleSearch() {
		filterStudents();
	}

	// Clear filters
	function clearFilters() {
		searchQuery = '';
		selectedGradeLevel = '';
		selectedSection = '';
		filterStudents();
	}

	// Get GWA status class
	function getGwaStatus(gwa) {
		if (gwa >= 95) return 'excellent';
		if (gwa >= 90) return 'very-good';
		if (gwa >= 85) return 'good';
		if (gwa >= 80) return 'satisfactory';
		return 'needs-improvement';
	}

	// Get GWA status text
	function getGwaStatusText(gwa) {
		if (gwa >= 95) return 'Excellent';
		if (gwa >= 90) return 'Very Good';
		if (gwa >= 85) return 'Good';
		if (gwa >= 80) return 'Satisfactory';
		return 'Needs Improvement';
	}

	// Helper function to get grade level display name
	function getGradeLevelName(gradeLevel) {
		const gradeMap = {
			'7': 'Grade 7',
			'8': 'Grade 8', 
			'9': 'Grade 9',
			'10': 'Grade 10'
		};
		return gradeMap[gradeLevel] || gradeLevel;
	}

	// Close dropdowns when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.sgl-custom-dropdown')) {
			isGradeLevelDropdownOpen = false;
			isSectionDropdownOpen = false;
		}
	}

	// Load data on component mount
	onMount(async () => {
		await loadSections();
		await loadStudents();
		document.addEventListener('click', handleClickOutside);
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	// Reactive search
	$: if (searchQuery !== undefined) {
		handleSearch();
	}
</script>

<div class="sgl-student-grades-container">
	<!-- Header -->
	<div class="sgl-admin-student-header">
		<div class="sgl-header-content">
			<h1 class="sgl-page-title">Student Grades List</h1>
			<p class="sgl-page-subtitle">View and manage student academic performance records</p>
		</div>
	</div>

	<!-- Filters Section -->
	<div class="sgl-filters-section">
		<div class="sgl-search-filter-container">
			<!-- Search Bar -->
			<div class="sgl-search-container">
				<div class="sgl-search-input-wrapper">
					<span class="material-symbols-outlined sgl-search-icon">search</span>
					<input 
						type="text" 
						class="sgl-search-input" 
						placeholder="Search students by name, email, or ID..."
						bind:value={searchQuery}
					/>
					{#if searchQuery}
						<button 
							type="button" 
							class="sgl-clear-search-button"
							on:click={() => searchQuery = ''}
						>
							<span class="material-symbols-outlined">close</span>
						</button>
					{/if}
				</div>
			</div>

			<!-- Filter Dropdowns -->
			<div class="sgl-filter-container">
				<!-- Grade Level Filter -->
				<div class="sgl-filter-group">
					<label class="sgl-filter-label">Grade Level</label>
					<div class="sgl-custom-dropdown" class:open={isGradeLevelDropdownOpen}>
						<button 
							type="button"
							class="sgl-dropdown-trigger sgl-filter-trigger" 
							on:click={toggleGradeLevelDropdown}
						>
							{#if selectedGradeLevelObj && selectedGradeLevel}
								<div class="sgl-selected-option">
									<span class="material-symbols-outlined sgl-option-icon">{selectedGradeLevelObj.icon}</span>
									<span class="sgl-option-name">{selectedGradeLevelObj.name}</span>
								</div>
							{:else}
								<span class="sgl-placeholder">All Grade Levels</span>
							{/if}
							<span class="material-symbols-outlined sgl-dropdown-arrow">expand_more</span>
						</button>
						<div class="sgl-dropdown-menu">
							{#each gradeLevelOptions as gradeLevel (gradeLevel.id)}
								<button 
									type="button"
									class="sgl-dropdown-option" 
									class:selected={selectedGradeLevel === gradeLevel.id}
									on:click={() => selectGradeLevel(gradeLevel)}
								>
									<span class="material-symbols-outlined sgl-option-icon">{gradeLevel.icon}</span>
									<div class="sgl-option-content">
										<span class="sgl-option-name">{gradeLevel.name}</span>
									</div>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Section Filter -->
				<div class="sgl-filter-group">
					<label class="sgl-filter-label">Section</label>
					<div class="sgl-custom-dropdown" class:open={isSectionDropdownOpen}>
						<button 
							type="button"
							class="sgl-dropdown-trigger sgl-filter-trigger" 
							on:click={toggleSectionDropdown}
						>
							{#if selectedSectionObj && selectedSection}
								<div class="sgl-selected-option">
									<span class="sgl-option-name">{selectedSectionObj.name}</span>
								</div>
							{:else}
								<span class="sgl-placeholder">All Sections</span>
							{/if}
							<span class="material-symbols-outlined sgl-dropdown-arrow">expand_more</span>
						</button>
						<div class="sgl-dropdown-menu">
							{#each sectionOptions as section (section.id)}
								<button 
									type="button"
									class="sgl-dropdown-option" 
									class:selected={selectedSection === section.id}
									on:click={() => selectSection(section)}
								>
									<div class="sgl-option-content">
										<span class="sgl-option-name">{section.name}</span>
									</div>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Clear Filters Button -->
				{#if searchQuery || selectedGradeLevel || selectedSection}
					<button 
						type="button" 
						class="sgl-clear-filters-button"
						on:click={clearFilters}
					>
						<span class="material-symbols-outlined">filter_alt_off</span>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Results Section -->
	<div class="sgl-results-section">
			<!-- Loading State -->
		{#if isLoading}
			<div class="sgl-masterlist-loading-container">
				<span class="sgl-student-loader"></span>
				<p class="sgl-masterlist-loading-text">Loading student grades...</p>
			</div>
		{:else if filteredStudents.length === 0}
			<!-- Empty State -->
			<div class="sgl-empty-state">
				<span class="material-symbols-outlined sgl-empty-icon">search_off</span>
				<h3 class="sgl-empty-title">No students found</h3>
				<p class="sgl-empty-description">
					{#if searchQuery || selectedGradeLevel || selectedSection}
						Try adjusting your search criteria or filters.
					{:else}
						No student records are available at the moment.
					{/if}
				</p>
			</div>
		{:else}
			<!-- Results Header -->
			<div class="sgl-results-header">
				<p class="sgl-results-count">
					Showing {filteredStudents.length} of {students.length} students
				</p>
			</div>

			<!-- Students Table -->
			<div class="sgl-table-container">
				<table class="sgl-students-table">
					<thead>
							<tr>
								<th>Student ID</th>
								<th>Name</th>
								<th>Grade Level</th>
								<th>Section</th>
								<th>GWA</th>
							</tr>
						</thead>
					<tbody>
						{#each filteredStudents as student (student.id)}
						<tr class="sgl-student-row" class:low-gwa={student.gwa < 75}>
							<td class="sgl-student-id">{student.id}</td>
							<td class="sgl-student-name">{student.name}</td>
							<td class="sgl-year-level">{getGradeLevelName(student.gradeLevel)}</td>
							<td class="sgl-section">{student.section}</td>
							<td class="sgl-gwa">{student.gwa.toFixed(1)}%</td>
						</tr>
					{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
