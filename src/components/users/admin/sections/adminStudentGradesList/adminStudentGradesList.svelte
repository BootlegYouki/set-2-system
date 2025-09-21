<script>
	import './adminStudentGradesList.css';
	import { onMount } from 'svelte';

	// State variables
	let students = [];
	let filteredStudents = [];
	let isLoading = true;
	let searchQuery = '';
	let selectedYearLevel = '';
	let selectedSection = '';

	// Dropdown states
	let isYearLevelDropdownOpen = false;
	let isSectionDropdownOpen = false;

	// Year level options
	const yearLevelOptions = [
		{ id: '', name: 'All Year Levels', icon: 'school' },
		{ id: '1', name: '1st Year', icon: 'looks_one' },
		{ id: '2', name: '2nd Year', icon: 'looks_two' },
		{ id: '3', name: '3rd Year', icon: 'looks_3' },
		{ id: '4', name: '4th Year', icon: 'looks_4' },
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
		{ id: 'STU-2024-001', name: 'Juan Carlos Santos', yearLevel: '1', section: 'A', gwa: 92.5 },
		{ id: 'STU-2024-002', name: 'Maria Elena Rodriguez', yearLevel: '1', section: 'B', gwa: 88.3 },
		{ id: 'STU-2024-003', name: 'Jose Miguel Dela Cruz', yearLevel: '2', section: 'A', gwa: 85.7 },
		{ id: 'STU-2024-004', name: 'Ana Sofia Reyes', yearLevel: '2', section: 'B', gwa: 95.2 },
		{ id: 'STU-2024-005', name: 'Carlos Antonio Lopez', yearLevel: '3', section: 'A', gwa: 79.8 },
		{ id: 'STU-2024-006', name: 'Isabella Marie Garcia', yearLevel: '3', section: 'B', gwa: 91.4 },
		{ id: 'STU-2024-007', name: 'Miguel Angel Torres', yearLevel: '4', section: 'A', gwa: 87.6 },
		{ id: 'STU-2024-008', name: 'Sophia Grace Mendoza', yearLevel: '4', section: 'B', gwa: 83.9 },
		{ id: 'STU-2024-009', name: 'Rafael Luis Morales', yearLevel: '1', section: 'C', gwa: 76.2 },
		{ id: 'STU-2024-010', name: 'Camila Rose Fernandez', yearLevel: '2', section: 'C', gwa: 94.8 },
		{ id: 'STU-2024-011', name: 'Diego Sebastian Cruz', yearLevel: '3', section: 'C', gwa: 82.1 },
		{ id: 'STU-2024-012', name: 'Valentina Joy Ramos', yearLevel: '4', section: 'C', gwa: 89.7 },
		{ id: 'STU-2024-013', name: 'Alejandro James Villanueva', yearLevel: '1', section: 'A', gwa: 78.5 },
		{ id: 'STU-2024-014', name: 'Natalia Hope Santos', yearLevel: '2', section: 'B', gwa: 86.3 },
		{ id: 'STU-2024-015', name: 'Gabriel Faith Martinez', yearLevel: '3', section: 'A', gwa: 93.1 }
	];

	// Computed values
	$: selectedYearLevelObj = yearLevelOptions.find(level => level.id === selectedYearLevel);
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

	// Filter students based on search query, year level, and section
	function filterStudents() {
		filteredStudents = students.filter(student => {
			const matchesSearch = !searchQuery || 
				student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				student.id.toLowerCase().includes(searchQuery.toLowerCase());
			
			const matchesYearLevel = !selectedYearLevel || 
				student.yearLevel === selectedYearLevel;
			
			const matchesSection = !selectedSection || 
				student.section === selectedSection;
			
			return matchesSearch && matchesYearLevel && matchesSection;
		});
	}

	// Dropdown functions
	function toggleYearLevelDropdown() {
		isYearLevelDropdownOpen = !isYearLevelDropdownOpen;
		isSectionDropdownOpen = false;
	}

	function toggleSectionDropdown() {
		isSectionDropdownOpen = !isSectionDropdownOpen;
		isYearLevelDropdownOpen = false;
	}

	function selectYearLevel(yearLevel) {
		selectedYearLevel = yearLevel;
		isYearLevelDropdownOpen = false;
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
		selectedYearLevel = '';
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

	// Helper function to get year level display name
	function getYearLevelName(yearLevel) {
		const yearMap = {
			'1': '1st Year',
			'2': '2nd Year', 
			'3': '3rd Year',
			'4': '4th Year'
		};
		return yearMap[yearLevel] || yearLevel;
	}

	// Close dropdowns when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.sgl-custom-dropdown')) {
			isYearLevelDropdownOpen = false;
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
				<!-- Year Level Filter -->
				<div class="sgl-filter-group">
					<label class="sgl-filter-label">Year Level</label>
					<div class="sgl-custom-dropdown" class:open={isYearLevelDropdownOpen}>
						<button 
							type="button"
							class="sgl-dropdown-trigger sgl-filter-trigger" 
							on:click={toggleYearLevelDropdown}
						>
							{#if selectedYearLevelObj && selectedYearLevel}
								<div class="sgl-selected-option">
									<span class="material-symbols-outlined sgl-option-icon">{selectedYearLevelObj.icon}</span>
									<span class="sgl-option-name">{selectedYearLevelObj.name}</span>
								</div>
							{:else}
								<span class="sgl-placeholder">All Year Levels</span>
							{/if}
							<span class="material-symbols-outlined sgl-dropdown-arrow">expand_more</span>
						</button>
						<div class="sgl-dropdown-menu">
							{#each yearLevelOptions as yearLevel (yearLevel.id)}
								<button 
									type="button"
									class="sgl-dropdown-option" 
									class:selected={selectedYearLevel === yearLevel.id}
									on:click={() => selectYearLevel(yearLevel.id)}
								>
									<span class="material-symbols-outlined sgl-option-icon">{yearLevel.icon}</span>
									<div class="sgl-option-content">
										<span class="sgl-option-name">{yearLevel.name}</span>
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
				{#if searchQuery || selectedYearLevel || selectedSection}
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
					{#if searchQuery || selectedYearLevel || selectedSection}
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
								<th>Year Level</th>
								<th>Section</th>
								<th>GWA</th>
							</tr>
						</thead>
					<tbody>
						{#each filteredStudents as student (student.id)}
						<tr>
							<td class="sgl-student-id">{student.id}</td>
							<td class="sgl-student-name">{student.name}</td>
							<td class="sgl-year-level">{getYearLevelName(student.yearLevel)}</td>
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
