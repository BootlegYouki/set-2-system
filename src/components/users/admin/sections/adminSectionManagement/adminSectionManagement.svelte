<script>
	import './adminSectionManagement.css';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { toastStore } from '../../../../common/js/toastStore.js';
	import { api } from '../../../../../routes/api/helper/api-helper.js';
	import { onMount } from 'svelte';

	// Section creation state
	let isCreating = false;
	let sectionName = '';
	let gradeLevel = '';
	let schoolYear = '2024-2025';
	let selectedAdviser = null;
	let selectedStudents = [];

	// Dropdown states
	let isGradeLevelDropdownOpen = false;
	let isAdviserDropdownOpen = false;
	let isStudentDropdownOpen = false;

	// Search states
	let adviserSearchTerm = '';
	let studentSearchTerm = '';

	// Edit section states
	let editingSectionId = null;
	let editSectionName = '';
	let editSelectedAdviser = null;
	let editSelectedStudents = [];
	let isUpdating = false;

	// Edit dropdown states
	let isEditAdviserDropdownOpen = false;
	let isEditStudentDropdownOpen = false;

	// Edit search states
	let editAdviserSearchTerm = '';
	let editStudentSearchTerm = '';

	// Data arrays
	let availableAdvisers = [];
	let availableStudents = [];
	let recentSections = [];
	let isLoading = false;
	let isLoadingAdvisers = false;
	let isLoadingStudents = false;

	// Load data on component mount
	onMount(async () => {
		await loadSections();
		await loadAvailableTeachers();
	});

	// API Functions
	async function loadSections() {
		try {
			isLoading = true;
			const result = await api.get(`/api/sections?action=section-details&schoolYear=${schoolYear}`);
			
			if (result.success) {
				recentSections = result.data.map(section => ({
					id: section.id,
					name: section.name,
					grade: `Grade ${section.grade_level}`,
					adviser: section.adviser_name || 'No Adviser',
					studentCount: section.student_count,
					schoolYear: section.school_year,
					createdDate: new Date(section.created_at).toLocaleDateString('en-US'),
					status: section.status,
					room: section.room_name ? `${section.room_name} - ${section.room_building}` : 'No Room Assigned',
					adviser_id: section.adviser_id,
					room_id: section.room_id,
					grade_level: section.grade_level
				}));
			}
		} catch (error) {
			console.error('Error loading sections:', error);
			toastStore.error('Failed to load sections');
		} finally {
			isLoading = false;
		}
	}

	async function loadAvailableTeachers() {
		try {
			isLoadingAdvisers = true;
			const result = await api.get(`/api/sections?action=available-teachers&schoolYear=${schoolYear}`);
			
			if (result.success) {
				availableAdvisers = result.data.map(teacher => ({
					id: teacher.id,
					name: teacher.full_name,
					employeeId: teacher.account_number,
					subject: teacher.subject_name || 'No Subject',
					hasSection: false
				}));
			}
		} catch (error) {
			console.error('Error loading teachers:', error);
			toastStore.error('Failed to load available teachers');
		} finally {
			isLoadingAdvisers = false;
		}
	}

	async function loadAvailableStudents(grade) {
		try {
			isLoadingStudents = true;
			const result = await api.get(`/api/sections?action=available-students&gradeLevel=${grade}&schoolYear=${schoolYear}`);
			
			if (result.success) {
				availableStudents = result.data.map(student => ({
					id: student.id,
					name: student.full_name,
					studentId: student.account_number,
					grade: student.grade_level,
					hasSection: false
				}));
			}
		} catch (error) {
			console.error('Error loading students:', error);
			toastStore.error('Failed to load available students');
		} finally {
			isLoadingStudents = false;
		}
	}

	async function loadSectionStudents(sectionId) {
		try {
			const result = await api.get(`/api/sections?action=section-students&sectionId=${sectionId}`);
			
			if (result.success) {
				return result.data.map(student => ({
					id: student.id,
					name: student.full_name,
					studentId: student.account_number,
					grade: student.grade_level
				}));
			}
			return [];
		} catch (error) {
			console.error('Error loading section students:', error);
			return [];
		}
	}

	// Edit student selection functions
	function toggleEditStudentDropdown() {
		isEditStudentDropdownOpen = !isEditStudentDropdownOpen;
		isEditAdviserDropdownOpen = false;
	}

	function toggleEditStudentSelection(student) {
		const index = editSelectedStudents.findIndex(s => s.id === student.id);
		if (index > -1) {
			editSelectedStudents = editSelectedStudents.filter(s => s.id !== student.id);
		} else {
			editSelectedStudents = [...editSelectedStudents, student];
		}
	}

	function removeEditSelectedStudent(student) {
		editSelectedStudents = editSelectedStudents.filter(s => s.id !== student.id);
	}

	function clearAllEditSelectedStudents() {
		editSelectedStudents = [];
	}

	function toggleSelectAllEditStudents() {
		if (editSelectedStudents.length === editFilteredStudents.length && editFilteredStudents.every(student => editSelectedStudents.some(s => s.id === student.id))) {
			// All filtered students are selected, so unselect all
			editSelectedStudents = editSelectedStudents.filter(selected => !editFilteredStudents.some(filtered => filtered.id === selected.id));
		} else {
			// Not all filtered students are selected, so select all
			const newSelections = editFilteredStudents.filter(student => !editSelectedStudents.some(s => s.id === student.id));
			editSelectedStudents = [...editSelectedStudents, ...newSelections];
		}
	}

	// Grade levels for Philippine high school (Grades 7-10)
	const gradeLevels = [
		{ id: '7', name: 'Grade 7', description: 'First Year Junior High School' },
		{ id: '8', name: 'Grade 8', description: 'Second Year Junior High School' },
		{ id: '9', name: 'Grade 9', description: 'Third Year Junior High School' },
		{ id: '10', name: 'Grade 10', description: 'Fourth Year Junior High School' }
	];

	// Close dropdowns when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.sectionmgmt-custom-dropdown')) {
			isGradeLevelDropdownOpen = false;
			isAdviserDropdownOpen = false;
			isStudentDropdownOpen = false;
		}
	}

	// Toggle dropdown functions
	function toggleGradeLevelDropdown() {
		isGradeLevelDropdownOpen = !isGradeLevelDropdownOpen;
		isAdviserDropdownOpen = false;
		isStudentDropdownOpen = false;
	}

	function toggleAdviserDropdown() {
		isAdviserDropdownOpen = !isAdviserDropdownOpen;
		isGradeLevelDropdownOpen = false;
		isStudentDropdownOpen = false;
	}

	function toggleStudentDropdown() {
		isStudentDropdownOpen = !isStudentDropdownOpen;
		isGradeLevelDropdownOpen = false;
		isAdviserDropdownOpen = false;
	}

	// Select functions
	function selectGradeLevel(grade) {
		gradeLevel = grade.id;
		isGradeLevelDropdownOpen = false;
		// Reset selected students when grade level changes
		selectedStudents = [];
		// Load available students for the selected grade
		loadAvailableStudents(grade.id);
	}

	function selectAdviser(adviser) {
		selectedAdviser = adviser;
		isAdviserDropdownOpen = false;
		adviserSearchTerm = '';
	}

	function toggleStudentSelection(student) {
		const index = selectedStudents.findIndex(s => s.id === student.id);
		if (index > -1) {
			selectedStudents = selectedStudents.filter(s => s.id !== student.id);
		} else {
			selectedStudents = [...selectedStudents, student];
		}
	}

	function removeStudent(studentId) {
		selectedStudents = selectedStudents.filter(s => s.id !== studentId);
	}

	function toggleSelectAllStudents() {
		if (selectedStudents.length === filteredStudents.length && filteredStudents.every(student => selectedStudents.some(s => s.id === student.id))) {
			// All filtered students are selected, so unselect all
			selectedStudents = selectedStudents.filter(selected => !filteredStudents.some(filtered => filtered.id === selected.id));
		} else {
			// Not all filtered students are selected, so select all
			const newSelections = filteredStudents.filter(student => !selectedStudents.some(s => s.id === student.id));
			selectedStudents = [...selectedStudents, ...newSelections];
		}
	}

	// Computed values
	$: selectedGradeObj = gradeLevels.find(g => g.id === gradeLevel);
	$: filteredAdvisers = availableAdvisers.filter(adviser => 
		!adviser.hasSection && 
		adviser.name.toLowerCase().includes(adviserSearchTerm.toLowerCase())
	);
	$: filteredStudents = availableStudents.filter(student => 
		!student.hasSection && 
		student.grade === gradeLevel &&
		student.name.toLowerCase().includes(studentSearchTerm.toLowerCase())
	);

	// Form submission
	async function handleCreateSection() {
		if (!sectionName || !gradeLevel || !selectedAdviser || selectedStudents.length === 0) {
			toastStore.error('Please fill in all required fields and select at least one student.');
			return;
		}

		isCreating = true;

		try {
			const result = await api.post('/api/sections', {
				sectionName,
				gradeLevel: parseInt(gradeLevel),
				schoolYear,
				adviserId: selectedAdviser.id,
				studentIds: selectedStudents.map(s => s.id),
				roomId: null // Room assignment can be added later
			});

			if (result.success) {
				// Show success toast
				toastStore.success(result.message);

				// Reset form
				sectionName = '';
				gradeLevel = '';
				selectedAdviser = null;
				selectedStudents = [];
				adviserSearchTerm = '';
				studentSearchTerm = '';
				availableStudents = [];

				// Reload data
				await loadSections();
				await loadAvailableTeachers();
			} else {
				toastStore.error(result.error || 'Failed to create section');
			}

		} catch (error) {
			console.error('Error creating section:', error);
			toastStore.error('Failed to create section. Please try again.');
		} finally {
			isCreating = false;
		}
	}

	// Edit section functions
	async function toggleEditForm(section) {
		if (editingSectionId === section.id) {
			// Close the form
			editingSectionId = null;
			editSectionName = '';
			editSelectedAdviser = null;
			editSelectedStudents = [];
			editAdviserSearchTerm = '';
			editStudentSearchTerm = '';
			isEditAdviserDropdownOpen = false;
			isEditStudentDropdownOpen = false;
		} else {
			// Open the form
			editingSectionId = section.id;
			editSectionName = section.name;
			editSelectedAdviser = availableAdvisers.find(adviser => adviser.id === section.adviser_id) || 
							   { id: section.adviser_id, name: section.adviser, employeeId: '', subject: '', hasSection: true };
			
			// Load students for this section
			editSelectedStudents = await loadSectionStudents(section.id);
			originalSectionStudents = [...editSelectedStudents]; // Store original students
			editStudentSearchTerm = '';
			
			// Load available students for the grade level (for adding new students)
			await loadAvailableStudents(section.grade_level);
		}
	}

	async function handleEditSection() {
		if (!editSectionName || !editSelectedAdviser) {
			toastStore.error('Please fill in all required fields.');
			return;
		}

		isUpdating = true;

		try {
			const result = await api.put('/api/sections', {
				sectionId: editingSectionId,
				sectionName: editSectionName,
				adviserId: editSelectedAdviser.id,
				studentIds: editSelectedStudents.map(s => s.id),
				roomId: null // Room assignment can be added later
			});

			if (result.success) {
				// Show success toast
				toastStore.success(result.message);

				// Close edit form
				editingSectionId = null;
				editSectionName = '';
				editSelectedAdviser = null;
				editSelectedStudents = [];
				editAdviserSearchTerm = '';
				editStudentSearchTerm = '';
				isEditAdviserDropdownOpen = false;
				isEditStudentDropdownOpen = false;

				// Reload data
				await loadSections();
				await loadAvailableTeachers();
			} else {
				toastStore.error(result.error || 'Failed to update section');
			}

		} catch (error) {
			console.error('Error updating section:', error);
			toastStore.error('Failed to update section. Please try again.');
		} finally {
			isUpdating = false;
		}
	}

	// Edit dropdown functions
	function toggleEditAdviserDropdown() {
		isEditAdviserDropdownOpen = !isEditAdviserDropdownOpen;
		isEditStudentDropdownOpen = false;
	}

	function selectEditAdviser(adviser) {
		editSelectedAdviser = adviser;
		isEditAdviserDropdownOpen = false;
		editAdviserSearchTerm = '';
	}

	// Handle section removal with modal confirmation
	// Open remove modal
	function openRemoveModal(section) {
		modalStore.confirm(
			'Delete Section',
			`<p>Are you sure you want to permanently delete section <strong>"${section.name}"</strong> (${section.grade})?</p>
			<p class="sectionmgmt-warning">This action will:</p>
			<ul class="sectionmgmt-warning-list">
				<li>Permanently delete the section and all its data</li>
				<li>Remove all students from this section</li>
				<li>Free up the advisory teacher for other sections</li>
				<li>This action cannot be undone</li>
			</ul>`,
			() => handleRemoveSection(section),
			null,
			{ size: 'medium' }
		);
	}

	// Handle section removal
	async function handleRemoveSection(section) {
		try {
			const result = await api.delete('/api/sections', { id: section.id });

			if (result.success) {
				toastStore.success('Section deleted successfully');
				await loadSections();
			} else {
				toastStore.error(result.error || 'Failed to delete section');
			}
		} catch (error) {
			console.error('Error deleting section:', error);
			toastStore.error('An error occurred while deleting the section');
		}
	}

	// Edit filtered data
	$: editFilteredAdvisers = availableAdvisers.filter(adviser => 
		!adviser.hasSection && 
		adviser.name.toLowerCase().includes(editAdviserSearchTerm.toLowerCase())
	);
	// Store original section students when editing starts
	let originalSectionStudents = [];

	$: editFilteredStudents = (() => {
		// Combine available students with original section students
		const allPossibleStudents = [...availableStudents];
		
		// Add original section students if they're not already in availableStudents
		originalSectionStudents.forEach(student => {
			if (!allPossibleStudents.some(s => s.id === student.id)) {
				allPossibleStudents.push({...student, hasSection: true});
			}
		});
		
		return allPossibleStudents.filter(student => {
			// Show students that don't have a section OR are currently selected OR are from original section
			const isAvailable = !student.hasSection || 
						   editSelectedStudents.some(s => s.id === student.id) ||
						   originalSectionStudents.some(s => s.id === student.id);
			const matchesSearch = student.name.toLowerCase().includes(editStudentSearchTerm.toLowerCase());
			return isAvailable && matchesSearch;
		});
	})();
</script>

<svelte:window on:click={handleClickOutside} />

<div class="sectionmgmt-container">
	<!-- Header -->
	<div class="sectionmgmt-header">
		<div class="sectionmgmt-header-content">
			<h1 class="sectionmgmt-page-title">Section Management</h1>
			<p class="sectionmgmt-page-subtitle">Create and manage class sections, assign students and advisory teachers</p>
		</div>
	</div>

	<!-- Section Creation Form -->
	<div class="sectionmgmt-creation-form-section">
		<div class="sectionmgmt-section-header">
			<h2 class="sectionmgmt-section-title">Create New Section</h2>
			<p class="sectionmgmt-section-subtitle">Fill in the details below to create a new class section</p>
		</div>

		<div class="sectionmgmt-form-container">
			<form on:submit|preventDefault={handleCreateSection}>
				<!-- Basic Section Info -->
				<div class="sectionmgmt-basic-info-row">
					<div class="sectionmgmt-form-group">
						<label class="sectionmgmt-form-label" for="section-name">Section Name *</label>
						<input 
							type="text" 
							id="section-name"
							class="sectionmgmt-form-input" 
							bind:value={sectionName}
							placeholder="Enter section name (e.g., Mabini, Rizal, Bonifacio)"
							required
						/>
					</div>

					<div class="sectionmgmt-form-group">
						<label class="sectionmgmt-form-label" for="school-year">School Year</label>
						<input 
							type="text" 
							id="school-year"
							class="sectionmgmt-form-input" 
							bind:value={schoolYear}
							readonly
						/>
					</div>
				</div>

				<!-- Grade Level and Adviser Row -->
				<div class="sectionmgmt-create-info-row">
					<!-- Grade Level Selection -->
					<div class="sectionmgmt-form-group">
						<label class="sectionmgmt-form-label" for="grade-level">Grade Level *</label>
						<div class="sectionmgmt-custom-dropdown" class:open={isGradeLevelDropdownOpen}>
							<button 
								type="button"
								class="sectionmgmt-dropdown-trigger" 
								class:selected={gradeLevel}
								on:click={toggleGradeLevelDropdown}
								id="grade-level"
							>
								{#if selectedGradeObj}
									<div class="sectionmgmt-selected-option">
										<span class="material-symbols-outlined sectionmgmt-option-icon">school</span>
										<div class="sectionmgmt-option-content">
											<span class="sectionmgmt-option-name">{selectedGradeObj.name}</span>
										</div>
									</div>
								{:else}
									<span class="sectionmgmt-placeholder">Select grade level</span>
								{/if}
								<span class="material-symbols-outlined sectionmgmt-dropdown-arrow">expand_more</span>
							</button>
							<div class="sectionmgmt-dropdown-menu">
								{#each gradeLevels as grade (grade.id)}
									<button 
										type="button"
										class="sectionmgmt-dropdown-option" 
										class:selected={gradeLevel === grade.id}
										on:click={() => selectGradeLevel(grade)}
									>
										<span class="material-symbols-outlined sectionmgmt-option-icon">school</span>
										<div class="sectionmgmt-option-content">
											<span class="sectionmgmt-option-name">{grade.name}</span>
											<span class="sectionmgmt-option-description">{grade.description}</span>
										</div>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Adviser Selection -->
					<div class="sectionmgmt-form-group">
					<label class="sectionmgmt-form-label" for="adviser">Advisory Teacher *</label>
					<div class="sectionmgmt-custom-dropdown" class:open={isAdviserDropdownOpen}>
						<button 
							type="button"
							class="sectionmgmt-dropdown-trigger" 
							class:selected={selectedAdviser}
							on:click={toggleAdviserDropdown}
							id="adviser"
						>
							{#if selectedAdviser}
							<div class="sectionmgmt-selected-option">
								<span class="material-symbols-outlined sectionmgmt-option-icon">person</span>
								<div class="sectionmgmt-option-content">
									<span class="sectionmgmt-option-name">{selectedAdviser.name}</span>
								</div>
							</div>
							{:else}
								<span class="sectionmgmt-placeholder">Select advisory teacher</span>
							{/if}
							<span class="material-symbols-outlined sectionmgmt-dropdown-arrow">expand_more</span>
						</button>
						<div class="sectionmgmt-dropdown-menu">
							<div class="sectionmgmt-search-container">
								<input 
									type="text" 
									class="sectionmgmt-search-input"
									placeholder="Search teachers..."
									bind:value={adviserSearchTerm}
								/>
								<span class="material-symbols-outlined sectionmgmt-search-icon">search</span>
							</div>
							{#if isLoadingAdvisers}
								<div class="admin-section-loading">
									<span class="section-loader"></span>
									<p>Loading teachers...</p>
								</div>
							{:else}
								{#each filteredAdvisers as adviser (adviser.id)}
									<button 
										type="button"
										class="sectionmgmt-dropdown-option" 
										class:selected={selectedAdviser?.id === adviser.id}
										on:click={() => selectAdviser(adviser)}
									>
										<span class="material-symbols-outlined sectionmgmt-option-icon">person</span>
										<div class="sectionmgmt-option-content">
											<span class="sectionmgmt-option-name">{adviser.name}</span>
											<span class="sectionmgmt-option-description">{adviser.employeeId} • {adviser.subject}</span>
										</div>
									</button>
								{/each}
							{/if}
							{#if filteredAdvisers.length === 0}
								<div class="sectionmgmt-no-results">
									<span class="material-symbols-outlined">person_off</span>
									<span>No available teachers found</span>
								</div>
							{/if}
						</div>
					</div>
						<p class="sectionmgmt-form-help">Only teachers without assigned sections are shown. Each teacher can only advise one section.</p>
					</div>
				</div>

				<!-- Student Selection -->
				<div class="sectionmgmt-form-group">
					<label class="sectionmgmt-form-label" for="students">Students *</label>
					


					<!-- Student Selection Dropdown -->
					<div class="sectionmgmt-custom-dropdown" class:open={isStudentDropdownOpen}>
						<button 
							type="button"
							class="sectionmgmt-dropdown-trigger" 
							class:selected={selectedStudents.length > 0}
							on:click={toggleStudentDropdown}
							id="students"
							disabled={!gradeLevel}
						>
							{#if gradeLevel}
								<span class="sectionmgmt-placeholder">Add students to section</span>
							{:else}
								<span class="sectionmgmt-placeholder">Select grade level first</span>
							{/if}
							<span class="material-symbols-outlined sectionmgmt-dropdown-arrow">expand_more</span>
						</button>
						<div class="sectionmgmt-dropdown-menu">
						<div class="sectionmgmt-search-container">
							{#if filteredStudents.length > 0}
								{@const allFilteredSelected = filteredStudents.every(student => selectedStudents.some(s => s.id === student.id))}
								<button 
									type="button"
									class="sectionmgmt-select-all-btn"
									on:click={toggleSelectAllStudents}
									title="{allFilteredSelected ? 'Unselect All' : 'Select All'} ({filteredStudents.length})"
								>
									<span class="material-symbols-outlined">{allFilteredSelected ? 'deselect' : 'select_all'}</span>
								</button>
							{/if}
							<input 
								type="text" 
								class="sectionmgmt-search-input"
								placeholder="Search students..."
								bind:value={studentSearchTerm}
							/>
							<span class="material-symbols-outlined" 
								class:sectionmgmt-search-icon-create={filteredStudents.length > 0}
								class:sectionmgmt-search-icon={filteredStudents.length === 0}>search</span>
						</div>
							{#if isLoadingStudents}
								<div class="admin-section-loading">
									<span class="section-loader"></span>
									<p>Loading students...</p>
								</div>
							{:else}
								{#each filteredStudents as student (student.id)}
									<button 
										type="button"
										class="sectionmgmt-dropdown-option sectionmgmt-student-option" 
										class:selected={selectedStudents.some(s => s.id === student.id)}
										on:click={() => toggleStudentSelection(student)}
									>
										<div class="sectionmgmt-student-checkbox">
											<span class="material-symbols-outlined">
												{selectedStudents.some(s => s.id === student.id) ? 'check_box' : 'check_box_outline_blank'}
											</span>
										</div>
										<span class="material-symbols-outlined sectionmgmt-option-icon">school</span>
										<div class="sectionmgmt-option-content">
											<span class="sectionmgmt-option-name">{student.name}</span>
											<span class="sectionmgmt-option-description">Grade {student.grade} • {student.studentId}</span>
										</div>
									</button>
								{/each}
								{#if filteredStudents.length === 0}
									<div class="sectionmgmt-no-results">
										<span class="material-symbols-outlined">person_off</span>
										<span>No available students found for this grade level</span>
									</div>
								{/if}
							{/if}
						</div>
					</div>
					<p class="sectionmgmt-form-help">Only students without assigned sections are shown. Select students for the chosen grade level.</p>
					<!-- Selected Students Display -->
					{#if selectedStudents.length > 0}
						<div class="sectionmgmt-selected-students">
							<div class="sectionmgmt-selected-students-header">
								<span class="sectionmgmt-selected-count">{selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected</span>
							</div>
							<div class="sectionmgmt-selected-students-list">
								{#each selectedStudents as student (student.id)}
									<div class="sectionmgmt-selected-student-chip">
										<span class="sectionmgmt-student-name">{student.name}</span>
										<span class="sectionmgmt-student-id">{student.studentId}</span>
										<button 
											type="button" 
											class="sectionmgmt-remove-student"
											on:click={() => removeStudent(student.id)}
											aria-label="Remove {student.name}"
										>
											<span class="material-symbols-outlined">close</span>
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Submit Button -->
				<div class="sectionmgmt-form-actions">
					<button 
						type="submit" 
						class="sectionmgmt-create-button"
						class:loading={isCreating}
						disabled={isCreating || !sectionName || !gradeLevel || !selectedAdviser || selectedStudents.length === 0}
					>
						{#if isCreating}
						Creating...
					{:else}
						<span class="material-symbols-outlined">groups</span>
						Create Section
					{/if}
					</button>
				</div>
			</form>
		</div>
	</div>

	<!-- Recent Sections -->
	<div class="sectionmgmt-recent-sections-section">
		<div class="sectionmgmt-section-header">
			<h2 class="sectionmgmt-section-title">Recent Sections</h2>
			<p class="sectionmgmt-section-subtitle">Recently created sections in the system</p>
		</div>

		<div class="sectionmgmt-sections-grid">
			{#if isLoading}
				<div class="admin-section-loading">
					<span class="section-loader"></span>
					<p>Loading sections...</p>
				</div>
			{:else}
				{#each recentSections as section (section.id)}
			<div class="sectionmgmt-section-card" class:editing={editingSectionId === section.id}>
				<div class="sectionmgmt-section-header-card">
					<div class="sectionmgmt-section-title">
						<h3 class="sectionmgmt-section-name">{section.name} · {section.grade}</h3>
					</div>
					<div class="sectionmgmt-action-buttons">
						<button 
							type="button"
							class="sectionmgmt-edit-button"
							on:click={() => toggleEditForm(section)}
							title="{editingSectionId === section.id ? 'Cancel Edit' : 'Edit Section'}"
						>
							<span class="material-symbols-outlined">{editingSectionId === section.id ? 'close' : 'edit'}</span>
						</button>
						<button 
						type="button"
						class="sectionmgmt-remove-button"
						title="Remove Section"
						on:click={() => openRemoveModal(section)}
					>
						<span class="material-symbols-outlined">delete</span>
					</button>
					</div>
				</div>
				
				<div class="sectionmgmt-section-details">
						<div class="sectionmgmt-section-adviser">
							<span class="material-symbols-outlined">person_book</span>
							<span>{section.adviser}</span>
						</div>
						<div class="sectionmgmt-section-students">
							<span class="material-symbols-outlined">group</span>
							<span>{section.studentCount} students</span>
						</div>
						<div class="sectionmgmt-section-room">
							<span class="material-symbols-outlined">location_on</span>
							<span>{section.room}</span>
						</div>
						<div class="sectionmgmt-section-created">
						<span class="material-symbols-outlined">calendar_today</span>
						<span>Created: {section.createdDate}</span>
					</div>
				</div>
				
				<!-- Inline Edit Form -->
				{#if editingSectionId === section.id}
					<div class="sectionmgmt-edit-form-section">
						<div class="sectionmgmt-edit-form-container">
							<div class="sectionmgmt-edit-form-header">
								<h2 class="sectionmgmt-edit-form-title">Edit Section</h2>
								<p class="sectionmgmt-edit-form-subtitle">Update section information and manage students</p>
							</div>
							
							<form class="sectionmgmt-edit-form-content" on:submit|preventDefault={handleEditSection}>
								<!-- Section Name and Adviser Row -->
								<div class="sectionmgmt-edit-info-row">
									<!-- Section Name -->
									<div class="sectionmgmt-form-group">
										<label class="sectionmgmt-form-label" for="edit-section-name">
											Section Name
										</label>
										<input 
											type="text" 
											id="edit-section-name"
											class="sectionmgmt-form-input" 
											bind:value={editSectionName}
											placeholder="Enter section name (e.g., Mabini, Rizal, Bonifacio)"
											required
										/>
									</div>

									<!-- Section Adviser -->
									<div class="sectionmgmt-form-group">
									<label class="sectionmgmt-form-label" for="edit-section-adviser">
										Section Adviser
									</label>
									<div class="sectionmgmt-custom-dropdown" class:open={isEditAdviserDropdownOpen}>
										<button 
											type="button"
											class="sectionmgmt-dropdown-trigger" 
											class:selected={editSelectedAdviser}
											on:click={toggleEditAdviserDropdown}
											id="edit-section-adviser"
										>
											{#if editSelectedAdviser}
										<div class="sectionmgmt-selected-option">
											<span class="material-symbols-outlined sectionmgmt-option-icon">person</span>
											<div class="sectionmgmt-option-content">
												<span class="sectionmgmt-option-name">{editSelectedAdviser.name}</span>
											</div>
										</div>
											{:else}
												<span class="sectionmgmt-placeholder">Select section adviser</span>
											{/if}
											<span class="material-symbols-outlined sectionmgmt-dropdown-arrow">expand_more</span>
										</button>
										<div class="sectionmgmt-dropdown-menu">
											<div class="sectionmgmt-search-container">
												<input 
													type="text" 
													class="sectionmgmt-search-input"
													placeholder="Search advisers..."
													bind:value={editAdviserSearchTerm}
												/>
												<span class="material-symbols-outlined sectionmgmt-search-icon">search</span>
											</div>
											{#each editFilteredAdvisers as adviser (adviser.id)}
												<button 
													type="button"
													class="sectionmgmt-dropdown-option" 
													class:selected={editSelectedAdviser?.id === adviser.id}
													on:click={() => selectEditAdviser(adviser)}
												>
													<span class="material-symbols-outlined sectionmgmt-option-icon">person</span>
													<div class="sectionmgmt-option-content">
														<span class="sectionmgmt-option-name">{adviser.name}</span>
														<span class="sectionmgmt-option-description">{adviser.subject} • {adviser.employeeId}</span>
													</div>
												</button>
											{/each}
											{#if editFilteredAdvisers.length === 0}
												<div class="sectionmgmt-no-results">
													<span class="material-symbols-outlined">person_off</span>
													<span>No available advisers found</span>
												</div>
											{/if}
										</div>
									</div>
									</div>
								</div>

								<!-- Student Selection -->
								<div class="sectionmgmt-form-group">
									<label class="sectionmgmt-form-label" for="edit-students">
										Students ({editSelectedStudents.length} selected)
									</label>
									<div class="sectionmgmt-custom-dropdown" class:open={isEditStudentDropdownOpen}>
										<button 
											type="button"
											class="sectionmgmt-dropdown-trigger" 
											class:selected={editSelectedStudents.length > 0}
											on:click={toggleEditStudentDropdown}
											id="edit-students"
										>
											<span class="sectionmgmt-placeholder">
												{editSelectedStudents.length > 0 ? `${editSelectedStudents.length} students selected` : 'Select students'}
											</span>
											<span class="material-symbols-outlined sectionmgmt-dropdown-arrow">expand_more</span>
										</button>
										<div class="sectionmgmt-dropdown-menu">
											<div class="sectionmgmt-search-container">
										{#if editFilteredStudents.length > 0}
											{@const allEditFilteredSelected = editFilteredStudents.every(student => editSelectedStudents.some(s => s.id === student.id))}
											<button 
												type="button"
												class="sectionmgmt-select-all-btn"
												on:click={toggleSelectAllEditStudents}
												title="{allEditFilteredSelected ? 'Unselect All' : 'Select All'} ({editFilteredStudents.length})"
											>
												<span class="material-symbols-outlined">{allEditFilteredSelected ? 'deselect' : 'select_all'}</span>
											</button>
										{/if}
										<input 
											type="text" 
											class="sectionmgmt-search-input"
											placeholder="Search students..."
											bind:value={editStudentSearchTerm}
										/>
										<span class="material-symbols-outlined" 
											class:sectionmgmt-search-icon-edit={editFilteredStudents.length > 0}
											class:sectionmgmt-search-icon={editFilteredStudents.length === 0}>search</span>
									</div>
											{#each editFilteredStudents as student (student.id)}
												<button 
													type="button"
													class="sectionmgmt-dropdown-option" 
													class:selected={editSelectedStudents.some(s => s.id === student.id)}
													on:click={() => toggleEditStudentSelection(student)}
												>
													<span class="material-symbols-outlined sectionmgmt-option-icon">
														{editSelectedStudents.some(s => s.id === student.id) ? 'check_box' : 'check_box_outline_blank'}
													</span>
													<div class="sectionmgmt-option-content">
														<span class="sectionmgmt-option-name">{student.name}</span>
														<span class="sectionmgmt-option-description">{student.studentId} • Grade {student.grade}</span>
													</div>
												</button>
											{/each}
											{#if editFilteredStudents.length === 0}
												<div class="sectionmgmt-no-results">
													<span class="material-symbols-outlined">person_off</span>
													<span>No available students found</span>
												</div>
											{/if}
										</div>
									</div>

									<!-- Selected Students Display -->
									{#if editSelectedStudents.length > 0}
										<div class="sectionmgmt-selected-students">
											<div class="sectionmgmt-selected-students-header">
												<span class="sectionmgmt-selected-count">{editSelectedStudents.length} student{editSelectedStudents.length !== 1 ? 's' : ''} selected</span>
											</div>
											<div class="sectionmgmt-selected-students-list">
												{#each editSelectedStudents as student (student.id)}
													<div class="sectionmgmt-selected-student-chip">
														<span class="sectionmgmt-student-name">{student.name}</span>
														<span class="sectionmgmt-student-id">{student.studentId}</span>
														<button 
															type="button" 
															class="sectionmgmt-remove-student"
															on:click={() => removeEditSelectedStudent(student)}
															aria-label="Remove {student.name}"
														>
															<span class="material-symbols-outlined">close</span>
														</button>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>

								<!-- Form Actions -->
								<div class="sectionmgmt-edit-form-actions">
									<button type="button" class="sectionmgmt-cancel-button" on:click={() => toggleEditForm(section)}>
										Cancel
									</button>
									<button 
						type="submit" 
						class="sectionmgmt-submit-button"
						disabled={isUpdating || !editSectionName || !editSelectedAdviser}
					>
						{#if isUpdating}
							Updating
						{:else}
							Update
						{/if}
					</button>
								</div>
							</form>
						</div>
					</div>
				{/if}
		</div>
	{/each}
	{#if recentSections.length === 0}
		<div class="sectionmgmt-sections-empty">
			<span class="material-symbols-outlined">school</span>
			<p>No sections found</p>
		</div>
	{/if}
			{/if}
		</div>
	</div>
</div>