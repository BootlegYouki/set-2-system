<script>
	import './adminStudentGradesList.css';
	import { onMount } from 'svelte';

	// State variables
	let students = [];
	let filteredStudents = [];
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

	// Section options
	const sectionOptions = [
		{ id: '', name: 'All Sections' },
		{ id: 'A', name: 'Section A' },
		{ id: 'B', name: 'Section B' },
		{ id: 'C', name: 'Section C' },
		{ id: 'D', name: 'Section D' },
		{ id: 'E', name: 'Section E' }
	];

	// Mock student data
	const mockStudents = [
		{ id: 'STU-2024-001', name: 'Juan Carlos Santos', gradeLevel: '7', section: 'A', gwa: 92.5 },
		{ id: 'STU-2024-002', name: 'Maria Elena Rodriguez', gradeLevel: '7', section: 'B', gwa: 88.3 },
		{ id: 'STU-2024-003', name: 'Jose Miguel Dela Cruz', gradeLevel: '8', section: 'A', gwa: 85.7 },
		{ id: 'STU-2024-004', name: 'Ana Sofia Reyes', gradeLevel: '8', section: 'B', gwa: 95.2 },
		{ id: 'STU-2024-005', name: 'Carlos Antonio Lopez', gradeLevel: '9', section: 'A', gwa: 79.8 },
		{ id: 'STU-2024-006', name: 'Isabella Marie Garcia', gradeLevel: '9', section: 'B', gwa: 91.4 },
		{ id: 'STU-2024-007', name: 'Miguel Angel Torres', gradeLevel: '10', section: 'A', gwa: 87.6 },
		{ id: 'STU-2024-008', name: 'Sophia Grace Mendoza', gradeLevel: '10', section: 'B', gwa: 83.9 },
		{ id: 'STU-2024-009', name: 'Rafael Luis Morales', gradeLevel: '7', section: 'C', gwa: 74.2 },
		{ id: 'STU-2024-010', name: 'Camila Rose Fernandez', gradeLevel: '8', section: 'C', gwa: 94.8 },
		{ id: 'STU-2024-011', name: 'Diego Sebastian Cruz', gradeLevel: '9', section: 'C', gwa: 82.1 },
		{ id: 'STU-2024-012', name: 'Valentina Joy Ramos', gradeLevel: '10', section: 'C', gwa: 89.7 },
		{ id: 'STU-2024-013', name: 'Alejandro James Villanueva', gradeLevel: '7', section: 'A', gwa: 78.5 },
		{ id: 'STU-2024-014', name: 'Natalia Hope Santos', gradeLevel: '8', section: 'B', gwa: 86.3 },
		{ id: 'STU-2024-015', name: 'Gabriel Faith Martinez', gradeLevel: '9', section: 'A', gwa: 93.1 }
	];

	// Computed values
	$: selectedGradeLevelObj = gradeLevelOptions.find(level => level.id === selectedGradeLevel);
	$: selectedSectionObj = sectionOptions.find(section => section.id === selectedSection);

	// Load students data
	async function loadStudents() {
		isLoading = true;
		try {
			// Simulate API call delay
			await new Promise(resolve => setTimeout(resolve, 500));
			students = mockStudents;
			filterStudents();
		} catch (error) {
			console.error('Error loading students:', error);
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
				student.id.toLowerCase().includes(searchQuery.toLowerCase());
			
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
		selectedGradeLevel = gradeLevel;
		isGradeLevelDropdownOpen = false;
		filterStudents();
	}

	function selectSection(section) {
		selectedSection = section;
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
	onMount(() => {
		loadStudents();
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
									on:click={() => selectGradeLevel(gradeLevel.id)}
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
									on:click={() => selectSection(section.id)}
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
