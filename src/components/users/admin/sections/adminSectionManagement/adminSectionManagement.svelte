<script>
	import './adminSectionManagement.css';

	// Section creation state
	let isCreating = false;
	let sectionName = '';
	let gradeLevel = '';
	let schoolYear = '2024-2025';
	let selectedAdviser = null;
	let selectedStudents = [];
	let showSuccessMessage = false;
	let successMessage = '';
	let errorMessage = '';

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

	// Mock data for advisers (teachers without assigned sections)
	let availableAdvisers = [
		{ id: 1, name: 'Ms. Maria Santos', employeeId: 'TCH-2024-001', subject: 'Mathematics', hasSection: false },
		{ id: 2, name: 'Mr. Juan Dela Cruz', employeeId: 'TCH-2024-002', subject: 'English', hasSection: false },
		{ id: 3, name: 'Mrs. Ana Reyes', employeeId: 'TCH-2024-003', subject: 'Science', hasSection: false },
		{ id: 4, name: 'Mr. Carlos Garcia', employeeId: 'TCH-2024-004', subject: 'Filipino', hasSection: false },
		{ id: 5, name: 'Ms. Rosa Mendoza', employeeId: 'TCH-2024-005', subject: 'Social Studies', hasSection: false },
		{ id: 6, name: 'Mr. Pedro Villanueva', employeeId: 'TCH-2024-006', subject: 'Mathematics', hasSection: true }, // Already has section
		{ id: 7, name: 'Mrs. Carmen Lopez', employeeId: 'TCH-2024-007', subject: 'English', hasSection: true } // Already has section
	];

	// Mock data for students (unassigned to sections)
	let availableStudents = [
		{ id: 1, name: 'John Michael Santos', studentId: 'STU-2024-001', grade: '7', hasSection: false },
		{ id: 2, name: 'Maria Clara Reyes', studentId: 'STU-2024-002', grade: '7', hasSection: false },
		{ id: 3, name: 'Jose Rizal Garcia', studentId: 'STU-2024-003', grade: '7', hasSection: false },
		{ id: 4, name: 'Anna Luna Mendoza', studentId: 'STU-2024-004', grade: '8', hasSection: false },
		{ id: 5, name: 'Carlos Aguinaldo Cruz', studentId: 'STU-2024-005', grade: '8', hasSection: false },
		{ id: 6, name: 'Sofia Bonifacio Torres', studentId: 'STU-2024-006', grade: '9', hasSection: false },
		{ id: 7, name: 'Miguel Mabini Flores', studentId: 'STU-2024-007', grade: '9', hasSection: false },
		{ id: 8, name: 'Isabella Del Pilar Ramos', studentId: 'STU-2024-008', grade: '10', hasSection: false },
		{ id: 9, name: 'Gabriel Jacinto Morales', studentId: 'STU-2024-009', grade: '10', hasSection: false },
		{ id: 10, name: 'Sophia Malvar Castillo', studentId: 'STU-2024-010', grade: '7', hasSection: true } // Already has section
	];

	// Recent sections (mock data)
	let recentSections = [
		{
			id: 1,
			name: 'Mabini',
			grade: 'Grade 7',
			adviser: 'Ms. Elena Rodriguez',
			studentCount: 35,
			schoolYear: '2024-2025',
			createdDate: '01/15/2024',
			status: 'active',
			room: 'Room 101 - Academic Building A'
		},
		{
			id: 2,
			name: 'Rizal',
			grade: 'Grade 8',
			adviser: 'Mr. Roberto Fernandez',
			studentCount: 32,
			schoolYear: '2024-2025',
			createdDate: '01/14/2024',
			status: 'active',
			room: 'Room 205 - Academic Building B'
		},
		{
			id: 3,
			name: 'Bonifacio',
			grade: 'Grade 9',
			adviser: 'Mr. Jose Mercado',
			studentCount: 28,
			schoolYear: '2024-2025',
			createdDate: '01/13/2024',
			status: 'active',
			room: 'Computer Laboratory - Academic Building B'
		},
		{
			id: 4,
			name: 'Aguinaldo',
			grade: 'Grade 10',
			adviser: 'Mrs. Carmen Santos',
			studentCount: 30,
			schoolYear: '2024-2025',
			createdDate: '01/12/2024',
			status: 'active',
			room: 'Audio Visual Room - Main Building'
		}
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
			errorMessage = 'Please fill in all required fields and select at least one student.';
			setTimeout(() => errorMessage = '', 5000);
			return;
		}

		isCreating = true;
		errorMessage = '';

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Create new section
			const newSection = {
				id: recentSections.length + 1,
				name: sectionName,
				grade: selectedGradeObj.name,
				adviser: selectedAdviser.name,
				studentCount: selectedStudents.length,
				schoolYear: schoolYear,
				createdDate: new Date().toLocaleDateString('en-US'),
				status: 'active'
			};

			// Update data
			recentSections = [newSection, ...recentSections];
			
			// Mark adviser as having a section
			availableAdvisers = availableAdvisers.map(adviser => 
				adviser.id === selectedAdviser.id ? { ...adviser, hasSection: true } : adviser
			);
			
			// Mark students as having a section
			availableStudents = availableStudents.map(student => 
				selectedStudents.some(s => s.id === student.id) ? { ...student, hasSection: true } : student
			);

			// Show success message
			successMessage = `Section ${sectionName} (${selectedGradeObj.name}) created successfully with ${selectedStudents.length} students and ${selectedAdviser.name} as adviser!`;
			showSuccessMessage = true;

			// Reset form
			sectionName = '';
			gradeLevel = '';
			selectedAdviser = null;
			selectedStudents = [];
			adviserSearchTerm = '';
			studentSearchTerm = '';

			// Hide success message after 5 seconds
			setTimeout(() => {
				showSuccessMessage = false;
			}, 5000);

		} catch (error) {
			console.error('Error creating section:', error);
			errorMessage = 'Failed to create section. Please try again.';
			setTimeout(() => errorMessage = '', 5000);
		} finally {
			isCreating = false;
		}
	}

	// Edit section functions
	function toggleEditForm(section) {
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
			editSelectedAdviser = availableAdvisers.find(adviser => adviser.name === section.adviser) || null;
			// Populate selected students from the section
			editSelectedStudents = section.students || [];
			editStudentSearchTerm = '';
		}
	}



	async function handleEditSection() {
		if (!editSectionName || !editSelectedAdviser) {
			errorMessage = 'Please fill in all required fields.';
			setTimeout(() => errorMessage = '', 5000);
			return;
		}

		isUpdating = true;
		errorMessage = '';

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Update section in the array
			recentSections = recentSections.map(section => {
					if (section.id === editingSectionId) {
						return {
							...section,
							name: editSectionName,
							adviser: editSelectedAdviser.name,
							students: editSelectedStudents,
							studentCount: editSelectedStudents.length
						};
					}
					return section;
				});

			// Show success message
			successMessage = `Section ${editSectionName} updated successfully!`;
			showSuccessMessage = true;

			// Close edit form
			editingSectionId = null;
			editSectionName = '';
			editSelectedAdviser = null;
			editSelectedStudents = [];
			editAdviserSearchTerm = '';
			editStudentSearchTerm = '';
			isEditAdviserDropdownOpen = false;
			isEditStudentDropdownOpen = false;

			// Hide success message after 5 seconds
			setTimeout(() => {
				showSuccessMessage = false;
			}, 5000);

		} catch (error) {
			console.error('Error updating section:', error);
			errorMessage = 'Failed to update section. Please try again.';
			setTimeout(() => errorMessage = '', 5000);
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

	// Edit filtered data
	$: editFilteredAdvisers = availableAdvisers.filter(adviser => 
		!adviser.hasSection && 
		adviser.name.toLowerCase().includes(editAdviserSearchTerm.toLowerCase())
	);
	$: editFilteredStudents = availableStudents.filter(student => 
		!student.hasSection && 
		student.name.toLowerCase().includes(editStudentSearchTerm.toLowerCase())
	);
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

	<!-- Success Message -->
	{#if showSuccessMessage}
		<div class="sectionmgmt-success-message">
			<span class="material-symbols-outlined sectionmgmt-success-icon">check_circle</span>
			<span class="sectionmgmt-success-text">{successMessage}</span>
		</div>
	{/if}

	<!-- Error Message -->
	{#if errorMessage}
		<div class="sectionmgmt-error-message">
			<span class="material-symbols-outlined sectionmgmt-error-icon">error</span>
			<span class="sectionmgmt-error-text">{errorMessage}</span>
		</div>
	{/if}

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
										<span class="sectionmgmt-option-description">{adviser.subject} • {adviser.employeeId}</span>
									</div>
								</button>
							{/each}
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
							<span class="material-symbols-outlined sectionmgmt-search-icon-create">search</span>
						</div>
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
						Creating
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
			{#each recentSections as section (section.id)}
			<div class="sectionmgmt-section-card">
				<div class="sectionmgmt-section-header">
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
										<span class="material-symbols-outlined sectionmgmt-search-icon-edit">search</span>
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
		</div>
	</div>


</div>