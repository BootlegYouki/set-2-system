<script>
	import './adminSubjectCreation.css';

	// Subject creation state
	let isCreating = false;
	let selectedGradeLevel = '';
	let subjectName = '';
	let subjectCode = '';

	let showSuccessMessage = false;
	let successMessage = '';

	// Dropdown states
	let isGradeDropdownOpen = false;
	let isGradeFilterDropdownOpen = false;

	// Search and filter state
	let searchTerm = '';
	let selectedGradeFilter = ''; // All grade levels

	// Grade levels for Philippines DepEd (Grades 7-10)
	const gradeLevels = [
		{ value: 7, label: 'Grade 7', description: 'Junior High School - First Year' },
		{ value: 8, label: 'Grade 8', description: 'Junior High School - Second Year' },
		{ value: 9, label: 'Grade 9', description: 'Junior High School - Third Year' },
		{ value: 10, label: 'Grade 10', description: 'Junior High School - Fourth Year' }
	];

	// Computed properties
	$: selectedGradeLevelObj = gradeLevels.find(grade => grade.value === selectedGradeLevel);
	$: selectedGradeFilterObj = gradeLevels.find(grade => grade.value === selectedGradeFilter);
	$: filteredSubjects = recentSubjects.filter(subject => {
		const matchesSearchTerm =
			(subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				subject.code.toLowerCase().includes(searchTerm.toLowerCase()));

		const matchesGrade = selectedGradeFilter ? subject.gradeLevel === `Grade ${selectedGradeFilter}` : true;

		return matchesSearchTerm && matchesGrade;
	});

	// Recent subject creations (mock data)
	let recentSubjects = [
		{
			id: 1,
			name: 'Mathematics',
			code: 'MATH-7',
			gradeLevel: 'Grade 7',
			createdDate: '01/15/2024',
			status: 'active'
		},
		{
			id: 2,
			name: 'English',
			code: 'ENG-8',
			gradeLevel: 'Grade 8',
			createdDate: '01/14/2024',
			status: 'active'
		},
		{
			id: 3,
			name: 'Science',
			code: 'SCI-9',
			gradeLevel: 'Grade 9',
			createdDate: '01/13/2024',
			status: 'active'
		},
		{
			id: 4,
			name: 'Filipino',
			code: 'FIL-10',
			gradeLevel: 'Grade 10',
			createdDate: '01/12/2024',
			status: 'active'
		}
	];

	// Handle form submission
	async function handleCreateSubject() {
		if (!selectedGradeLevel || !subjectName.trim() || !subjectCode.trim()) {
			alert('Please fill in all required fields');
			return;
		}

		isCreating = true;

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1500));

			// Add to recent subjects
			const newSubject = {
				id: recentSubjects.length + 1,
				name: subjectName,
				code: subjectCode,
				gradeLevel: `Grade ${selectedGradeLevel}`,
				createdDate: new Date().toLocaleDateString('en-US'),
				status: 'active'
			};

			recentSubjects = [newSubject, ...recentSubjects];

			// Reset form
			selectedGradeLevel = '';
			subjectName = '';
			subjectCode = '';

			// Show success message
			successMessage = `Subject "${newSubject.name}" created successfully with code ${newSubject.code}`;
			showSuccessMessage = true;

			// Hide success message after 5 seconds
			setTimeout(() => {
				showSuccessMessage = false;
			}, 5000);

		} catch (error) {
			console.error('Error creating subject:', error);
			alert('Failed to create subject. Please try again.');
		} finally {
			isCreating = false;
		}
	}

	// Functions
	function toggleGradeDropdown() {
		isGradeDropdownOpen = !isGradeDropdownOpen;
	}

	function selectGradeLevel(grade) {
		selectedGradeLevel = grade.value;
		isGradeDropdownOpen = false;
	}

	function toggleGradeFilterDropdown() {
		isGradeFilterDropdownOpen = !isGradeFilterDropdownOpen;
	}

	function selectGradeFilter(grade) {
		if (grade) {
			selectedGradeFilter = grade.value;
		} else {
			selectedGradeFilter = '';
		}
		isGradeFilterDropdownOpen = false;
	}

	// Handle click outside to close dropdowns
	function handleClickOutside(event) {
		if (!event.target.closest('.adminsubject-custom-dropdown')) {
			isGradeDropdownOpen = false;
		}
		if (!event.target.closest('.adminsubject-grade-filter')) {
			isGradeFilterDropdownOpen = false;
		}
	}

	// Remove auto-generation of subject code
</script>

<svelte:window on:click={handleClickOutside} />

<div class="admin-subject-creation-container">
	<!-- Header -->
	<div class="admin-subject-header">
		<div class="admin-header-content">
			<h1 class="admin-page-title">Subject Creation</h1>
			<p class="admin-page-subtitle">Create and manage subjects for the curriculum</p>
		</div>
	</div>

	<!-- Success Message -->
	{#if showSuccessMessage}
		<div class="admin-success-message">
			<span class="material-symbols-outlined admin-success-icon">check_circle</span>
			<span class="admin-success-text">{successMessage}</span>
		</div>
	{/if}

	<div class="admin-creation-layout">
		<!-- Left Column: Creation Form -->
		<div class="admin-creation-form-section">
			<div class="admin-section-header">
				<h2 class="admin-section-title">Create New Subject</h2>
				<p class="admin-section-subtitle">Fill in the details below to create a new subject</p>
			</div>

			<div class="admin-form-container">
				<form on:submit|preventDefault={handleCreateSubject}>
					<!-- Grade Level, Subject Name, and Subject Code Row -->
					<div class="admin-form-row">
						<!-- Grade Level Selection -->
						<div class="admin-form-group admin-form-group-third">
							<label class="admin-form-label" for="grade-level">Grade Level *</label>
							<div class="adminsubject-custom-dropdown" class:open={isGradeDropdownOpen}>
								<button
									type="button"
									class="adminsubject-dropdown-trigger"
									class:selected={selectedGradeLevel}
									on:click={toggleGradeDropdown}
									id="grade-level"
								>
									{#if selectedGradeLevelObj}
										<div class="adminsubject-selected-option">
											<span class="material-symbols-outlined adminsubject-option-icon">school</span>
											<div class="adminsubject-option-content">
												<span class="adminsubject-option-name">{selectedGradeLevelObj.label}</span>
												<span class="adminsubject-option-description"
													>{selectedGradeLevelObj.description}</span
												>
											</div>
										</div>
									{:else}
										<span class="adminsubject-placeholder">Select grade level</span>
									{/if}
									<span class="material-symbols-outlined adminsubject-dropdown-arrow">expand_more</span>
								</button>
								<div class="adminsubject-dropdown-menu">
									{#each gradeLevels as grade (grade.value)}
										<button
											type="button"
											class="adminsubject-dropdown-option"
											class:selected={selectedGradeLevel === grade.value}
											on:click={() => selectGradeLevel(grade)}
										>
											<span class="material-symbols-outlined adminsubject-option-icon">school</span>
											<div class="adminsubject-option-content">
												<span class="adminsubject-option-name">{grade.label}</span>
												<span class="adminsubject-option-description">{grade.description}</span>
											</div>
										</button>
									{/each}
								</div>
							</div>
						</div>

						<!-- Subject Name -->
						<div class="admin-form-group admin-form-group-third">
							<label for="subjectName" class="admin-form-label">Subject Name *</label>
							<input
								id="subjectName"
								type="text"
								class="admin-form-input"
								bind:value={subjectName}
								placeholder="e.g., Mathematics, English"
								disabled={!selectedGradeLevel}
								required
							/>
						</div>

						<!-- Subject Code -->
						<div class="admin-form-group admin-form-group-third">
							<label for="subjectCode" class="admin-form-label">Subject Code *</label>
							<input
								id="subjectCode"
								type="text"
								class="admin-form-input"
								bind:value={subjectCode}
								placeholder="e.g., MATH-7, ENG-8"
								required
							/>
						</div>
					</div>

					<!-- Submit Button -->
					<div class="admin-form-actions">
						<button
							type="submit"
							class="admin-create-button"
							class:loading={isCreating}
							disabled={isCreating || !selectedGradeLevel || !subjectName.trim()}
						>
							{#if isCreating}
								<span class="material-symbols-outlined admin-loading-icon">hourglass_empty</span>
								Creating...
							{:else}
								<span class="material-symbols-outlined">add_circle</span>
								Create Subject
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>

		<!-- Right Column: Recent Subjects -->
		<div class="admin-recent-subjects-section">
			<div class="admin-section-header">
				<h2 class="admin-section-title">Recent Subjects</h2>
				<p class="admin-section-subtitle">Subjects created recently</p>
			</div>

			<div class="adminsubject-filters-container">
				<!-- Search Input -->
				<div class="adminsubject-search-container">
					<input
						type="text"
						placeholder="Search by subject name or code..."
						class="adminsubject-search-input"
						bind:value={searchTerm}
					/>
					<span class="material-symbols-outlined adminsubject-search-icon">search</span>
				</div>

				<!-- Grade Level Filter -->
				<div class="adminsubject-grade-filter adminsubject-custom-dropdown" class:open={isGradeFilterDropdownOpen}>
					<button
						type="button"
						class="adminsubject-dropdown-trigger"
						class:selected={selectedGradeFilter}
						on:click={toggleGradeFilterDropdown}
					>
						{#if selectedGradeFilterObj}
						<div class="adminsubject-selected-option">
							<span class="material-symbols-outlined adminsubject-option-icon">school</span>
							<div class="adminsubject-option-content">
								<span class="adminsubject-option-name">{selectedGradeFilterObj.label}</span>
								<span class="adminsubject-option-description">{selectedGradeFilterObj.description}</span>
							</div>
						</div>
						{:else}
							<span class="adminsubject-placeholder">All Grades</span>
						{/if}
						<span class="material-symbols-outlined adminsubject-dropdown-arrow">expand_more</span>
					</button>
					<div class="adminsubject-dropdown-menu">
						<button
							type="button"
							class="adminsubject-dropdown-option"
						class:selected={selectedGradeFilter === ''}
						on:click={() => selectGradeFilter(null)}
					>
						<span class="material-symbols-outlined adminsubject-option-icon">clear_all</span>
						<div class="adminsubject-option-content">
							<span class="adminsubject-option-name">All Grades</span>
							</div>
						</button>
						{#each gradeLevels as grade (grade.value)}
							<button
								type="button"
								class="adminsubject-dropdown-option"
							class:selected={selectedGradeFilter === grade.value}
							on:click={() => selectGradeFilter(grade)}
						>
							<span class="material-symbols-outlined adminsubject-option-icon">school</span>
							<div class="adminsubject-option-content">
								<span class="adminsubject-option-name">{grade.label}</span>
								<span class="adminsubject-option-description">{grade.description}</span>
								</div>
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="adminsubject-subjects-grid">
				{#each filteredSubjects as subject (subject.id)}
					<div class="adminsubject-subject-card">
						<div class="adminsubject-subject-header">
							<div class="adminsubject-subject-title">
								<h3 class="adminsubject-subject-name">{subject.name} · {subject.gradeLevel}</h3>
							</div>
							<div class="adminsubject-action-buttons">
								<button type="button" class="adminsubject-edit-button" title="Edit Subject">
									<span class="material-symbols-outlined">edit</span>
								</button>
								<button type="button" class="adminsubject-remove-button" title="Remove Subject">
									<span class="material-symbols-outlined">delete</span>
								</button>
							</div>
						</div>

						<div class="adminsubject-subject-details">
							<div class="adminsubject-subject-item-detail">
								<span class="material-symbols-outlined">qr_code_2</span>
								<span>{subject.code}</span>
							</div>
							<div class="adminsubject-subject-item-detail">
								<span class="material-symbols-outlined">calendar_today</span>
								<span>Created: {subject.createdDate}</span>
							</div>
						</div>
					</div>
				{:else}
					<div class="adminsubject-no-results">
						<span class="material-symbols-outlined adminsubject-no-results-icon">search_off</span>
						<p>No subjects found matching your search.</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>