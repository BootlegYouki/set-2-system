<script>
	import './adminArchivedStudents.css';
	import { onMount } from 'svelte';
	import { toastStore } from '../../../../common/js/toastStore.js';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { api } from '../../../../../routes/api/helper/api-helper.js';

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

	// Section options - will be populated from database
	let sectionOptions = [
		{ id: '', name: 'All Sections' }
	];

	// Computed values
	$: selectedGradeLevelObj = gradeLevelOptions.find(level => level.id === selectedGradeLevel);
	$: selectedSectionObj = sectionOptions.find(section => section.id === selectedSection);

	// Load archived students data
	async function loadArchivedStudents() {
		isLoading = true;
		try {
			const data = await api.get('/api/archived-students');
			
			// Check if we have students data (API returns { students: [...] })
			if (!data.students) {
				throw new Error('No students data received');
			}
			
			// Transform API data to match our component structure
			students = data.students.map(student => ({
				id: student.id,
				name: student.name,
				number: student.number,
				email: student.email,
				gradeLevel: student.gradeLevel || 'Not specified',
				section: student.section || 'Not specified',
				birthdate: student.birthdate || 'Not specified',
				address: student.address || 'Not specified',
				guardian: student.guardian || 'Not specified',
				contactNumber: student.contactNumber || 'Not specified',
				archivedDate: student.archivedDate || 'Not specified'
			}));
			filterStudents();
		} catch (error) {
			console.error('Error loading archived students:', error);
			toastStore.error('Failed to load archived students. Please try again.');
			// Fallback to empty array on error
			students = [];
		} finally {
			isLoading = false;
		}
	}

	// Load sections data
	async function loadSections() {
		try {
			const data = await api.get('/api/sections');
			if (data.success && data.data) {
				// Transform sections data and add to dropdown options
				const sectionsFromDB = data.data.map(section => ({
					id: section.name, // Use section name as ID for filtering
					name: section.name
				}));
				
				// Combine "All Sections" with actual sections
				sectionOptions = [
					{ id: '', name: 'All Sections' },
					...sectionsFromDB
				];
			}
		} catch (error) {
			console.error('Error loading sections:', error);
			// Keep default "All Sections" option if loading fails
		}
	}

	// Filter students based on search query, grade level, and section
	function filterStudents() {
		filteredStudents = students.filter(student => {
			const matchesSearch = !searchQuery || 
				student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(student.number && student.number.toLowerCase().includes(searchQuery.toLowerCase()));
        
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

	// Format archived date for display
	function formatArchivedDate(archivedAt) {
		if (!archivedAt) return 'N/A';
		const date = new Date(archivedAt);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Restore student from archive with confirmation
	async function restoreStudent(studentId, studentName) {
		modalStore.confirm(
			'Restore Student',
			`Are you sure you want to restore ${studentName}? This action will move the student back to the active list.`,
			async () => {
				try {
					const result = await api.put('/api/archived-students', { id: studentId });
					
					// Show success toast
					toastStore.success(result.message || 'Student restored successfully');
					
					// Reload the archived students list
					await loadArchivedStudents();
				} catch (error) {
					console.error('Error restoring student:', error);
					toastStore.error(error.message || 'Failed to restore student. Please try again.');
				}
			},
			() => {
				// User cancelled - do nothing
			}
		);
	}

	// Clear all filters
	function clearFilters() {
		searchQuery = '';
		selectedGradeLevel = '';
		selectedSection = '';
		filterStudents();
	}

	// Reactive statements
	$: if (searchQuery !== undefined) filterStudents();

	// Close dropdowns when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.aas-custom-dropdown')) {
			isGradeLevelDropdownOpen = false;
			isSectionDropdownOpen = false;
		}
	}

	onMount(() => {
		loadSections(); // Load sections first
		loadArchivedStudents();
		document.addEventListener('click', handleClickOutside);
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="aas-archived-students-container">
	<!-- Header -->
	<div class="aas-admin-student-header">
		<div class="aas-header-content">
			<h1 class="aas-page-title">Archived Students</h1>
			<p class="aas-page-subtitle">View and manage archived student records</p>
		</div>
	</div>

	<!-- Filters Section -->

	<div class="filters-section">
		<div class="studmaster-search-filter-container">
			<!-- Search Bar -->
			<div class="search-container">
				<div class="search-input-wrapper">
					<span class="material-symbols-outlined search-icon">search</span>
					<input 
						type="text" 
						class="search-input" 
						placeholder="Search archived students by name, email, or ID..."
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
			<div class="studmaster-filter-container">
				<!-- Grade Level Filter -->
				<div class="filter-group">
					<label class="filter-label">Grade Level</label>
					<div class="aas-custom-dropdown" class:open={isGradeLevelDropdownOpen}>
						<button 
							type="button"
							class="aas-dropdown-trigger aas-filter-trigger" 
							on:click={toggleGradeLevelDropdown}
						>
							{#if selectedGradeLevelObj && selectedGradeLevel}
								<div class="aas-selected-option">
									<span class="material-symbols-outlined aas-option-icon">{selectedGradeLevelObj.icon}</span>
									<span class="aas-option-name">{selectedGradeLevelObj.name}</span>
								</div>
							{:else}
								<span class="aas-placeholder">All Grade Levels</span>
							{/if}
							<span class="material-symbols-outlined aas-dropdown-arrow">expand_more</span>
						</button>
						<div class="aas-dropdown-menu">
							{#each gradeLevelOptions as gradeLevel (gradeLevel.id)}
								<button 
									type="button"
									class="aas-dropdown-option" 
									class:selected={selectedGradeLevel === gradeLevel.id}
									on:click={() => selectGradeLevel(gradeLevel)}
								>
									<span class="material-symbols-outlined aas-option-icon">{gradeLevel.icon}</span>
									<div class="aas-option-content">
										<span class="aas-option-name">{gradeLevel.name}</span>
									</div>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Section Filter -->
				<div class="filter-group">
					<label class="filter-label">Section</label>
					<div class="aas-custom-dropdown" class:open={isSectionDropdownOpen}>
						<button 
							type="button"
							class="aas-dropdown-trigger aas-filter-trigger" 
							on:click={toggleSectionDropdown}
						>
							{#if selectedSectionObj && selectedSection}
								<div class="aas-selected-option">
									<span class="aas-option-name">{selectedSectionObj.name}</span>
								</div>
							{:else}
								<span class="aas-placeholder">All Sections</span>
							{/if}
							<span class="material-symbols-outlined aas-dropdown-arrow">expand_more</span>
						</button>
						<div class="aas-dropdown-menu">
							{#each sectionOptions as section (section.id)}
								<button 
									type="button"
									class="aas-dropdown-option" 
									class:selected={selectedSection === section.id}
									on:click={() => selectSection(section)}
								>
									<div class="aas-option-content">
										<span class="aas-option-name">{section.name}</span>
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
						class="clear-filters-button"
						on:click={clearFilters}
					>
						<span class="material-symbols-outlined">filter_alt_off</span>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Students List -->
	<div class="aas-students-list-section">
		{#if isLoading}
			<div class="aas-loading-container">
				<span class="aas-student-loader"></span>
				<p class="aas-loading-text">Loading archived students...</p>
			</div>
		{:else if filteredStudents.length > 0}
			<div class="aas-students-grid">
				{#each filteredStudents as student (student.id)}
					<div class="aas-account-card">
						<div class="aas-account-card-header">
							<div class="aas-account-title">
								<h3 class="aas-account-name">{#if student.number}{student.number}{/if} · {student.name}</h3>
								<div class="aas-archived-badge">
									<span class="material-symbols-outlined">archive</span>
									<span>Archived {formatArchivedDate(student.archivedDate)}</span>
								</div>
							</div>
							<div class="aas-action-buttons">
								<button 
									type="button"
									class="aas-restore-button"
									title="Restore Student"
									on:click={() => restoreStudent(student.id, student.name)}
								>
									<span class="material-symbols-outlined">unarchive</span>
								</button>
							</div>
						</div>
						
						<div class="aas-account-details">
							{#if student.email}
								<div class="aas-account-detail-item">
									<span class="material-symbols-outlined">email</span>
									<span>{student.email}</span>
								</div>
							{/if}
							{#if student.gradeLevel && student.gradeLevel !== 'Not specified'}
								<div class="aas-account-detail-item">
									<span class="material-symbols-outlined">school</span>
									<span>{gradeLevelOptions.find(level => level.id === student.gradeLevel)?.name || student.gradeLevel}</span>
								</div>
							{/if}
							{#if student.section && student.section !== 'Not specified'}
								<div class="aas-account-detail-item">
									<span class="material-symbols-outlined">class</span>
									<span>Section: {sectionOptions.find(section => section.id === student.section)?.name || student.section}</span>
								</div>
							{/if}
							{#if student.birthdate && student.birthdate !== 'Not specified'}
								<div class="aas-account-detail-item">
									<span class="material-symbols-outlined">cake</span>
									<span>Age: {calculateAge(student.birthdate)} years old</span>
								</div>
							{/if}
							{#if student.guardian && student.guardian !== 'Not specified'}
								<div class="aas-account-detail-item">
									<span class="material-symbols-outlined">family_restroom</span>
									<span>Guardian: {student.guardian}</span>
								</div>
							{/if}
							{#if student.contactNumber && student.contactNumber !== 'Not specified'}
								<div class="aas-account-detail-item">
									<span class="material-symbols-outlined">phone</span>
									<span>Contact: {student.contactNumber}</span>
								</div>
							{/if}
							{#if student.address && student.address !== 'Not specified'}
								<div class="aas-account-detail-item">
									<span class="material-symbols-outlined">home</span>
									<span>Address: {student.address}</span>
								</div>
							{/if}
							{#if student.birthdate && student.birthdate !== 'Not specified'}
								<div class="aas-account-detail-item">
									<span class="material-symbols-outlined">calendar_today</span>
									<span>Birthdate: {formatBirthdate(student.birthdate)}</span>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="aas-no-results">
				<span class="material-symbols-outlined aas-no-results-icon">
					{searchQuery || selectedGradeLevel || selectedSection ? 'search_off' : 'archive'}
				</span>
				<p>
					{#if searchQuery || selectedGradeLevel || selectedSection}
						No archived students found matching your search criteria.
					{:else}
						No archived students found in the system.
					{/if}
				</p>
				{#if searchQuery || selectedGradeLevel || selectedSection}
					<button 
						type="button" 
						class="aas-clear-search-button-inline"
						on:click={clearFilters}
					>Clear
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>