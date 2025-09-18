<script>
	import './adminStudentMasterlist.css';
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
		{ id: '1st', name: '1st Year', icon: 'looks_one' },
		{ id: '2nd', name: '2nd Year', icon: 'looks_two' },
		{ id: '3rd', name: '3rd Year', icon: 'looks_3' },
		{ id: '4th', name: '4th Year', icon: 'looks_4' },
	];

	// Section options
	const sectionOptions = [
		{ id: '', name: 'All Sections' },
		{ id: 'section-a', name: 'Section A' },
		{ id: 'section-b', name: 'Section B' },
		{ id: 'section-c', name: 'Section C' },
		{ id: 'section-d', name: 'Section D' },
		{ id: 'section-e', name: 'Section E' }
	];

	// Computed values
	$: selectedYearLevelObj = yearLevelOptions.find(level => level.id === selectedYearLevel);
	$: selectedSectionObj = sectionOptions.find(section => section.id === selectedSection);

	// Load students data
	async function loadStudents() {
		isLoading = true;
		try {
			const response = await fetch('/api/accounts?type=student');
			if (!response.ok) {
				throw new Error('Failed to load students');
			}
			const data = await response.json();
			
			// Transform API data to match our component structure
			students = data.accounts.map(account => ({
				id: account.id,
				name: account.name,
				number: account.number, // Add the student ID number
				email: account.email,
				yearLevel: account.yearLevel || 'Not specified',
				section: account.section || 'Not specified',
				birthdate: account.birthdate || 'Not specified',
				address: account.address || 'Not specified',
				guardian: account.guardian || 'Not specified',
				contactNumber: account.contactNumber || 'Not specified',
				status: account.status || 'active'
			}));
			filterStudents();
		} catch (error) {
			console.error('Error loading students:', error);
			// Fallback to empty array on error
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
				student.email.toLowerCase().includes(searchQuery.toLowerCase());
			
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
		selectedYearLevel = yearLevel.id;
		isYearLevelDropdownOpen = false;
		filterStudents();
	}

	function selectSection(section) {
		selectedSection = section.id;
		isSectionDropdownOpen = false;
		filterStudents();
	}

	// Calculate age from birthdate
	function calculateAge(birthdate) {
		if (!birthdate) return 'N/A';
		const today = new Date();
		const birth = new Date(birthdate);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	}

	// Format birthdate for display
	function formatBirthdate(birthdate) {
		if (!birthdate) return 'N/A';
		const date = new Date(birthdate);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Clear all filters
	function clearFilters() {
		searchQuery = '';
		selectedYearLevel = '';
		selectedSection = '';
		filterStudents();
	}

	// Reactive statements
	$: if (searchQuery !== undefined) filterStudents();

	// Close dropdowns when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.custom-dropdown')) {
			isYearLevelDropdownOpen = false;
			isSectionDropdownOpen = false;
		}
	}

	onMount(() => {
		loadStudents();
		document.addEventListener('click', handleClickOutside);
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="student-masterlist-container">
	<!-- Header -->
	<div class="student-header">
		<div class="header-content">
			<h1 class="page-title">Student Masterlist</h1>
			<p class="page-subtitle">View and manage all student records in the system</p>
		</div>
	</div>

	<!-- Filters Section -->
	<div class="filters-section">
		<div class="student-section-header">
			<h2 class="section-title">Student Records</h2>
			<p class="section-subtitle">Search and filter students by year level and section</p>
		</div>

		<div class="search-filter-container">
			<!-- Search Bar -->
			<div class="search-container">
				<div class="search-input-wrapper">
					<span class="material-symbols-outlined search-icon">search</span>
					<input 
						type="text" 
						class="search-input" 
						placeholder="Search students by name or email..."
						bind:value={searchQuery}
					/>
					{#if searchQuery}
						<button 
							type="button" 
							class="clear-search-button"
							on:click={() => searchQuery = ''}
						>
							<span class="material-symbols-outlined">close</span>
						</button>
					{/if}
				</div>
			</div>

			<!-- Filter Dropdowns -->
			<div class="filter-container">
				<!-- Year Level Filter -->
				<div class="filter-group">
					<label class="filter-label">Year Level</label>
					<div class="custom-dropdown" class:open={isYearLevelDropdownOpen}>
						<button 
							type="button"
							class="dropdown-trigger filter-trigger" 
							on:click={toggleYearLevelDropdown}
						>
							{#if selectedYearLevelObj && selectedYearLevel}
								<div class="selected-option">
									<span class="material-symbols-outlined option-icon">{selectedYearLevelObj.icon}</span>
									<span class="option-name">{selectedYearLevelObj.name}</span>
								</div>
							{:else}
								<span class="placeholder">All Year Levels</span>
							{/if}
							<span class="material-symbols-outlined dropdown-arrow">expand_more</span>
						</button>
						<div class="dropdown-menu">
							{#each yearLevelOptions as yearLevel (yearLevel.id)}
								<button 
									type="button"
									class="dropdown-option" 
									class:selected={selectedYearLevel === yearLevel.id}
									on:click={() => selectYearLevel(yearLevel)}
								>
									<span class="material-symbols-outlined option-icon">{yearLevel.icon}</span>
									<div class="option-content">
										<span class="option-name">{yearLevel.name}</span>
									</div>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Section Filter -->
				<div class="filter-group">
					<label class="filter-label">Section</label>
					<div class="custom-dropdown" class:open={isSectionDropdownOpen}>
						<button 
							type="button"
							class="dropdown-trigger filter-trigger" 
							on:click={toggleSectionDropdown}
						>
							{#if selectedSectionObj && selectedSection}
								<div class="selected-option">
									<span class="option-name">{selectedSectionObj.name}</span>
								</div>
							{:else}
								<span class="placeholder">All Sections</span>
							{/if}
							<span class="material-symbols-outlined dropdown-arrow">expand_more</span>
						</button>
						<div class="dropdown-menu">
							{#each sectionOptions as section (section.id)}
								<button 
									type="button"
									class="dropdown-option" 
									class:selected={selectedSection === section.id}
									on:click={() => selectSection(section)}
								>
									<div class="option-content">
										<span class="option-name">{section.name}</span>
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
						class="clear-filters-button"
						on:click={clearFilters}
					>
						<span class="material-symbols-outlined">filter_list_off</span>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Students List -->
	<div class="students-list-section">
		{#if isLoading}
			<div class="loading-container">
				<div class="loading-spinner"></div>
				<p class="loading-text">Loading students...</p>
			</div>
		{:else if filteredStudents.length > 0}
			<div class="students-grid">
				{#each filteredStudents as student (student.id)}
					<div class="account-card">
						<div class="account-card-header">
							<div class="account-title">
								<h3 class="account-name">{student.name} · {student.yearLevel || 'Not specified'} Year</h3>
							</div>
							{#if student.number}
								<div class="account-id">
									<span class="student-id">ID: {student.number}</span>
								</div>
							{/if}
						</div>
						
						<div class="master-account-details">
							{#if student.email}
								<div class="account-detail-item">
									<span class="material-symbols-outlined">email</span>
									<span>{student.email}</span>
								</div>
							{/if}
							{#if student.yearLevel && student.yearLevel !== 'Not specified'}
								<div class="account-detail-item">
									<span class="material-symbols-outlined">school</span>
									<span>{yearLevelOptions.find(level => level.id === student.yearLevel)?.name || student.yearLevel} Year</span>
								</div>
							{/if}
							{#if student.section && student.section !== 'Not specified'}
								<div class="account-detail-item">
									<span class="material-symbols-outlined">class</span>
									<span>Section: {sectionOptions.find(section => section.id === student.section)?.name || student.section}</span>
								</div>
							{/if}
							{#if student.birthdate && student.birthdate !== 'Not specified'}
								<div class="account-detail-item">
									<span class="material-symbols-outlined">cake</span>
									<span>Age: {calculateAge(student.birthdate)} years old</span>
								</div>
							{/if}
							{#if student.guardian && student.guardian !== 'Not specified'}
								<div class="account-detail-item">
									<span class="material-symbols-outlined">family_restroom</span>
									<span>Guardian: {student.guardian}</span>
								</div>
							{/if}
							{#if student.contactNumber && student.contactNumber !== 'Not specified'}
								<div class="account-detail-item">
									<span class="material-symbols-outlined">phone</span>
									<span>Contact: {student.contactNumber}</span>
								</div>
							{/if}
							{#if student.address && student.address !== 'Not specified'}
								<div class="account-detail-item">
									<span class="material-symbols-outlined">home</span>
									<span>Address: {student.address}</span>
								</div>
							{/if}
							{#if student.birthdate && student.birthdate !== 'Not specified'}
								<div class="account-detail-item">
									<span class="material-symbols-outlined">calendar_today</span>
									<span>Birthdate: {formatBirthdate(student.birthdate)}</span>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="no-results">
				<span class="material-symbols-outlined no-results-icon">
					{searchQuery || selectedYearLevel || selectedSection ? 'search_off' : 'school'}
				</span>
				<p>
					{#if searchQuery || selectedYearLevel || selectedSection}
						No students found matching your search criteria.
					{:else}
						No students found in the system.
					{/if}
				</p>
				{#if searchQuery || selectedYearLevel || selectedSection}
					<button 
						type="button" 
						class="clear-search-button-inline"
						on:click={clearFilters}
					>
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>